import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Resume version history with ATS-score trend (feature 11). */
export const getResumeHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: resumes } = await supabase
      .from("resumes")
      .select("id,file_name,label,target_domain,is_active,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    const { data: scores } = await supabase
      .from("resume_scores")
      .select("resume_id,overall_score,ats_score,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    const scoreByResume = new Map<string, { overall: number | null; ats: number | null }>();
    for (const s of scores ?? []) {
      if (s.resume_id)
        scoreByResume.set(s.resume_id, { overall: s.overall_score, ats: s.ats_score });
    }

    const history = (resumes ?? []).map((r, i) => ({
      id: r.id,
      label: r.label ?? r.file_name,
      file_name: r.file_name,
      target_domain: r.target_domain,
      is_active: r.is_active,
      created_at: r.created_at,
      version: i + 1,
      overall: scoreByResume.get(r.id)?.overall ?? null,
      ats: scoreByResume.get(r.id)?.ats ?? null,
    }));

    const trend = (scores ?? []).map((s, i) => ({
      index: i + 1,
      date: s.created_at,
      overall: s.overall_score ?? 0,
      ats: s.ats_score ?? 0,
    }));

    return { history, trend };
  });

/** Set one resume as the active/primary version (feature 14). */
export const setActiveResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("resumes").update({ is_active: false }).eq("user_id", userId);
    const { error } = await supabase
      .from("resumes")
      .update({ is_active: true })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Label a resume and tag its target domain (feature 14). */
export const updateResumeMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; label?: string | null; target_domain?: string | null }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("resumes")
      .update({
        label: data.label?.trim() || null,
        target_domain: data.target_domain?.trim() || null,
      })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Inline AI rewrite of weak resume bullet points with quantified impact (feature 12). */
export const rewriteBullets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { text: string; role?: string }) => {
    if (!d?.text || d.text.trim().length < 10) {
      throw new Error("Paste a bullet point or two to rewrite.");
    }
    return { text: d.text.slice(0, 4000), role: d.role ?? "" };
  })
  .handler(async ({ data }) => {
    const { geminiJson } = await import("@/lib/gemini.server");
    const result = await geminiJson<{
      rewrites: { original: string; improved: string; note: string }[];
    }>({
      system:
        "You are an expert resume writer. Rewrite weak resume bullets using strong action verbs, the XYZ formula (accomplished X by doing Y measured by Z), and quantified impact. If numbers are missing, add realistic placeholders in [brackets] the candidate can fill in. Return valid JSON only.",
      prompt: `Rewrite each of the following resume bullet points${
        data.role ? ` for a ${data.role} role` : ""
      }. For each, return the original, an improved version, and a one-line note on what changed.
Return JSON: { "rewrites": [{ "original", "improved", "note" }] }

BULLETS:
${data.text}`,
      temperature: 0.6,
    });
    return { rewrites: result.rewrites ?? [] };
  });
