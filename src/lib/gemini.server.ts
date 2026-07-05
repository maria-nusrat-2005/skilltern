// Server-only helper for Google Gemini via the user's AI Studio key.
// Never import this from client/route module scope — use inside server fn handlers.
//
// Fallback: when a Gemini Flash text call fails (rate limit, error, or outage)
// and an NVIDIA NIM key is configured, requests are retried against NVIDIA NIM's
// OpenAI-compatible API. Embeddings stay on Gemini (DB vectors are 768-dim).

const BASE = "https://generativelanguage.googleapis.com/v1beta";
const NIM_BASE = "https://integrate.api.nvidia.com/v1";
// Default NVIDIA NIM text model used for fallback generations.
const NIM_MODEL = "meta/llama-3.3-70b-instruct";

function getKey(): string {
  const key = process.env.GOOGLE_AI_STUDIO_API_KEY;
  if (!key) throw new Error("Missing GOOGLE_AI_STUDIO_API_KEY");
  return key;
}

/** NVIDIA NIM fallback for text generation (OpenAI-compatible chat completions). */
async function nimGenerate(opts: {
  system?: string;
  prompt: string;
  json?: boolean;
  temperature?: number;
}): Promise<string> {
  const key = process.env.NVIDIA_API_KEY;
  if (!key) throw new Error("Missing NVIDIA_API_KEY (no fallback available)");

  const messages: { role: string; content: string }[] = [];
  if (opts.system) messages.push({ role: "system", content: opts.system });
  messages.push({
    role: "user",
    content: opts.json
      ? `${opts.prompt}\n\nRespond with valid JSON only, no markdown fences.`
      : opts.prompt,
  });

  const body: Record<string, unknown> = {
    model: NIM_MODEL,
    messages,
    temperature: opts.temperature ?? 0.6,
    max_tokens: 4096,
  };
  if (opts.json) body.response_format = { type: "json_object" };

  const res = await fetch(`${NIM_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`NVIDIA NIM error ${res.status}: ${txt.slice(0, 500)}`);
  }
  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? "";
  return text;
}

/** Whether an NVIDIA NIM fallback key is configured. */
function hasNimFallback(): boolean {
  return Boolean(process.env.NVIDIA_API_KEY);
}

/** Generate text (optionally JSON) from Gemini 2.5 Flash, falling back to NVIDIA NIM. */
export async function geminiGenerate(opts: {
  system?: string;
  prompt: string;
  json?: boolean;
  temperature?: number;
}): Promise<string> {
  const key = getKey();
  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.6,
      ...(opts.json ? { responseMimeType: "application/json" } : {}),
    },
  };
  if (opts.system) {
    body.systemInstruction = { parts: [{ text: opts.system }] };
  }

  try {
    const res = await fetch(
      `${BASE}/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Gemini error ${res.status}: ${txt.slice(0, 500)}`);
    }
    const data = await res.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
    if (!text) throw new Error("Empty Gemini response");
    return text;
  } catch (err) {
    if (!hasNimFallback()) throw err;
    console.warn("Gemini text call failed, falling back to NVIDIA NIM:", err);
    return nimGenerate(opts);
  }
}

/** Generate text from Gemini with an attached document/file (base64 inline data). */
export async function geminiGenerateWithFile(opts: {
  system?: string;
  prompt: string;
  fileBase64: string;
  mimeType: string;
  json?: boolean;
  temperature?: number;
}): Promise<string> {
  const key = getKey();
  const body: Record<string, unknown> = {
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: opts.mimeType, data: opts.fileBase64 } },
          { text: opts.prompt },
        ],
      },
    ],
    generationConfig: {
      temperature: opts.temperature ?? 0.4,
      ...(opts.json ? { responseMimeType: "application/json" } : {}),
    },
  };
  if (opts.system) {
    body.systemInstruction = { parts: [{ text: opts.system }] };
  }

  const res = await fetch(
    `${BASE}/models/gemini-2.5-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Gemini error ${res.status}: ${txt.slice(0, 500)}`);
  }
  const data = await res.json();
  const text: string =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  return text;
}


function parseJsonLoose<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
    throw new Error("Failed to parse Gemini JSON response");
  }
}

/** Generate and parse a JSON object from a document/file attachment. */
export async function geminiJsonFromFile<T = unknown>(opts: {
  system?: string;
  prompt: string;
  fileBase64: string;
  mimeType: string;
  temperature?: number;
}): Promise<T> {
  const raw = await geminiGenerateWithFile({ ...opts, json: true });
  return parseJsonLoose<T>(raw);
}

/** Generate and parse a JSON object response, tolerant of code fences. */
export async function geminiJson<T = unknown>(opts: {
  system?: string;
  prompt: string;
  temperature?: number;
}): Promise<T> {
  const raw = await geminiGenerate({ ...opts, json: true });
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
    throw new Error("Failed to parse Gemini JSON response");
  }
}

/** Create a 768-dim embedding with text-embedding-004. */
export async function geminiEmbed(text: string): Promise<number[]> {
  const key = getKey();
  const res = await fetch(
    `${BASE}/models/text-embedding-004:embedContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text: text.slice(0, 8000) }] },
      }),
    },
  );
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Gemini embed error ${res.status}: ${txt.slice(0, 300)}`);
  }
  const data = await res.json();
  const values: number[] = data?.embedding?.values ?? [];
  if (!values.length) throw new Error("Empty embedding from Gemini");
  return values;
}
