import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function asArr(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => String(x)) : [];
}

function uniqLower(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of arr) {
    const k = s.trim().toLowerCase();
    if (k && !seen.has(k)) {
      seen.add(k);
      out.push(s.trim());
    }
  }
  return out;
}

/** Feature 2: Compare the user's latest resume skills against a specific internship. */
export const compareResumeToJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { internshipId: string }) => {
    if (!d?.internshipId) throw new Error("internshipId is required");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: parsed } = await supabase
      .from("parsed_resumes")
      .select("data")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const extracted = (parsed?.data as { extracted?: { skills?: string[] } } | null)?.extracted;
    const resumeSkills = uniqLower(asArr(extracted?.skills));

    const { data: job, error } = await supabase
      .from("internships")
      .select("title,company,requirements,preferred_skills,tech_stack")
      .eq("id", data.internshipId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!job) throw new Error("Internship not found");

    if (resumeSkills.length === 0) {
      return { hasResume: false as const };
    }

    const required = uniqLower([...asArr(job.requirements), ...asArr(job.tech_stack)]);
    const niceToHave = uniqLower(asArr(job.preferred_skills));
    const have = new Set(resumeSkills.map((s) => s.toLowerCase()));

    const matched = required.filter((s) => have.has(s.toLowerCase()));
    const missing = required.filter((s) => !have.has(s.toLowerCase()));
    const niceMatched = niceToHave.filter((s) => have.has(s.toLowerCase()));
    const niceMissing = niceToHave.filter((s) => !have.has(s.toLowerCase()));
    const coverage = required.length
      ? Math.round((matched.length / required.length) * 100)
      : 100;

    let summary: string | null = null;
    let tips: string[] = [];
    try {
      const { geminiJson } = await import("@/lib/gemini.server");
      const result = await geminiJson<{ summary: string; tips: string[] }>({
        system:
          "You are an ATS expert helping a Bangladeshi student tailor their resume to a specific internship. Be concise and concrete. Return JSON only.",
        prompt: `Role: ${job.title} @ ${job.company}.
Skills the student already has: ${resumeSkills.slice(0, 25).join(", ")}.
Required skills missing from resume: ${missing.join(", ") || "none"}.
Write a 1-2 sentence "summary" of how ready the student is for this role, and 3 specific "tips" (each one short actionable sentence) to close the gap and pass the ATS keyword scan.
Return JSON: { "summary": string, "tips": string[] }`,
        temperature: 0.5,
      });
      summary = result.summary ?? null;
      tips = (result.tips ?? []).slice(0, 4);
    } catch {
      // AI is best-effort; the keyword diff is the core value.
    }

    return {
      hasResume: true as const,
      coverage,
      matched,
      missing,
      niceMatched,
      niceMissing,
      summary,
      tips,
    };
  });

/** Feature 9: Generate a tailored application kit (cover letter + screening answers). */
export const generateApplicationKit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { internshipId: string }) => {
    if (!d?.internshipId) throw new Error("internshipId is required");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { geminiJson } = await import("@/lib/gemini.server");

    const [{ data: profile }, { data: parsed }, { data: job }] = await Promise.all([
      supabase.from("profiles").select("full_name,location").eq("user_id", userId).maybeSingle(),
      supabase
        .from("parsed_resumes")
        .select("data")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("internships")
        .select("title,company,requirements,preferred_skills,tech_stack,description")
        .eq("id", data.internshipId)
        .maybeSingle(),
    ]);

    if (!job) throw new Error("Internship not found");

    const extracted = (parsed?.data as {
      extracted?: { summary?: string; skills?: string[]; projects?: { name: string }[] };
    } | null)?.extracted;

    if (!extracted?.skills?.length && !extracted?.summary) {
      throw new Error("Analyze your resume first so we can tailor your application.");
    }

    const result = await geminiJson<{
      cover_letter: string;
      email_subject: string;
      screening_answers: { question: string; answer: string }[];
    }>({
      system:
        "You are a career writing assistant for Bangladeshi students applying to internships. Write warm, specific, honest, professional copy. No clichés or fabrication. Return valid JSON only.",
      prompt: `Write an application kit for this internship.

CANDIDATE
- Name: ${profile?.full_name ?? "the candidate"}
- Location: ${profile?.location ?? "Bangladesh"}
- Summary: ${extracted?.summary ?? "n/a"}
- Skills: ${(extracted?.skills ?? []).slice(0, 20).join(", ")}
- Projects: ${(extracted?.projects ?? []).map((p) => p.name).slice(0, 5).join(", ") || "n/a"}

ROLE
- ${job.title} @ ${job.company}
- Requirements: ${asArr(job.requirements).join(", ") || "n/a"}
- Tech: ${asArr(job.tech_stack).join(", ") || "n/a"}

Return JSON:
{
  "email_subject": one concise subject line,
  "cover_letter": a 150-220 word cover letter using \\n line breaks, addressed generically ("Dear Hiring Team,"),
  "screening_answers": 3 items, each a likely screening "question" with a strong 2-4 sentence "answer" in first person
}`,
      temperature: 0.6,
    });

    return {
      cover_letter: result.cover_letter ?? "",
      email_subject: result.email_subject ?? "",
      screening_answers: result.screening_answers ?? [],
    };
  });
