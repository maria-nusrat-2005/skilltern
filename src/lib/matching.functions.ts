import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Candidate = {
  id: string;
  title: string;
  company: string;
  domain: string | null;
  requirements: string[];
  preferred_skills: string[];
  tech_stack: string[];
};

function asArr(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x));
  return [];
}

function overlap(a: Set<string>, b: string[]): number {
  if (b.length === 0) return 0;
  let hits = 0;
  for (const item of b) if (a.has(item.toLowerCase())) hits++;
  return hits / b.length;
}

export const generateMatches = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: parsed } = await supabase
      .from("parsed_resumes")
      .select("data")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const extracted = (parsed?.data as { extracted?: { skills?: string[] } } | null)?.extracted;
    const userSkills = new Set<string>(
      [
        ...asArr(extracted?.skills),
        ...asArr(prefs?.preferred_technologies),
        ...asArr(prefs?.preferred_roles),
      ].map((s) => s.toLowerCase()),
    );

    if (userSkills.size === 0) {
      throw new Error("Add your skills via resume analysis or preferences first to generate matches.");
    }

    const { data: rows, error } = await supabase
      .from("internships")
      .select("id,title,company,domain,requirements,preferred_skills,tech_stack");
    if (error) throw new Error(error.message);

    const preferredDomains = new Set(asArr(prefs?.preferred_roles).map((s) => s.toLowerCase()));

    const scored = (rows ?? []).map((r) => {
      const c: Candidate = {
        id: r.id,
        title: r.title,
        company: r.company,
        domain: r.domain,
        requirements: asArr(r.requirements),
        preferred_skills: asArr(r.preferred_skills),
        tech_stack: asArr(r.tech_stack),
      };
      const reqAll = [...c.requirements, ...c.tech_stack];
      const technical_score = Math.round(overlap(userSkills, reqAll) * 100);
      const project_score = Math.round(overlap(userSkills, c.preferred_skills) * 100);
      const domainHit = c.domain && preferredDomains.size
        ? [...preferredDomains].some((d) => (c.domain ?? "").toLowerCase().includes(d) || d.includes((c.title ?? "").toLowerCase()))
        : false;
      const industry_score = domainHit ? 85 : 55;
      const experience_score = 70;
      const overall_score = Math.round(
        technical_score * 0.5 + project_score * 0.2 + industry_score * 0.2 + experience_score * 0.1,
      );
      const missing = reqAll.filter((s) => !userSkills.has(s.toLowerCase())).slice(0, 6);
      return { c, technical_score, project_score, industry_score, experience_score, overall_score, missing };
    });

    scored.sort((a, b) => b.overall_score - a.overall_score);
    const top = scored.slice(0, 12);

    // AI explanations for the top matches in a single call.
    let enriched: Record<string, { explanation: string; learning_path: string[]; recommendations: string[]; estimated_effort: string }> = {};
    try {
      const { geminiJson } = await import("@/lib/gemini.server");
      const result = await geminiJson<{
        matches: {
          id: string;
          explanation: string;
          learning_path: string[];
          recommendations: string[];
          estimated_effort: string;
        }[];
      }>({
        system:
          "You are a career coach for Bangladeshi students. Explain internship fit concisely and motivate. Return JSON only.",
        prompt: `Student skills: ${[...userSkills].join(", ")}.
Career goal: ${prefs?.career_goals ?? "not specified"}.
For each internship below, write a 1-2 sentence explanation of why it fits (or what to improve), a learning_path of 2-3 concrete steps, 2 recommendations, and an estimated_effort (e.g. "2-4 weeks"). Return JSON: { "matches": [{ "id", "explanation", "learning_path": string[], "recommendations": string[], "estimated_effort" }] }.

Internships:
${top.map((t) => `- id:${t.c.id} | ${t.c.title} @ ${t.c.company} | needs: ${t.c.requirements.join(", ")} | missing for student: ${t.missing.join(", ") || "none"}`).join("\n")}`,
        temperature: 0.6,
      });
      enriched = Object.fromEntries((result.matches ?? []).map((m) => [m.id, m]));
    } catch (e) {
      console.error("AI enrichment failed", e);
    }

    await supabase.from("internship_matches").delete().eq("user_id", userId);

    const toInsert = top.map((t) => ({
      user_id: userId,
      internship_id: t.c.id,
      overall_score: t.overall_score,
      technical_score: t.technical_score,
      project_score: t.project_score,
      industry_score: t.industry_score,
      experience_score: t.experience_score,
      missing_skills: t.missing,
      strengths: [],
      weaknesses: [],
      explanation: enriched[t.c.id]?.explanation ?? null,
      learning_path: enriched[t.c.id]?.learning_path ?? [],
      recommendations: enriched[t.c.id]?.recommendations ?? [],
      estimated_effort: enriched[t.c.id]?.estimated_effort ?? null,
    }));

    const { error: insErr } = await supabase.from("internship_matches").insert(toInsert);
    if (insErr) throw new Error(insErr.message);

    return { count: toInsert.length };
  });

export const getMatches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: matches, error } = await supabase
      .from("internship_matches")
      .select("*")
      .eq("user_id", userId)
      .order("overall_score", { ascending: false });
    if (error) throw new Error(error.message);

    const ids = (matches ?? []).map((m) => m.internship_id);
    if (ids.length === 0) return { matches: [] };

    const { data: internships } = await supabase
      .from("internships")
      .select("id,title,company,company_type,company_domain,location,salary,work_model,domain")
      .in("id", ids);
    const byId = new Map((internships ?? []).map((i) => [i.id, i]));

    return {
      matches: (matches ?? []).map((m) => ({ ...m, internship: byId.get(m.internship_id) ?? null })),
    };
  });
