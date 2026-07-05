import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type RoadmapStep = {
  skill: string;
  why: string;
  steps: string[];
  resources: { title: string; url: string; type: string }[];
  estimated_time: string;
  project_idea: string;
};

function asArr(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => String(x)) : [];
}

/** Turn detected skill gaps (or recommended projects) into a sequenced learning plan with free resources. */
export const generateLearningRoadmap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { skills?: string[]; domain?: string; mode?: "skills" | "projects" }) => {
    const mode = d?.mode === "projects" ? "projects" : "skills";
    return {
      skills: d?.skills ?? [],
      domain: d?.domain ?? null,
      mode,
    };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { geminiJson } = await import("@/lib/gemini.server");

    let skills = (data.skills ?? []).filter(Boolean);
    let domain = data.domain ?? null;
    const mode = data.mode;

    // Always pull the latest career_analysis row so we can fall back to
    // whatever is in the DB — the page should never have to ask the user
    // to re-analyze their CV just to build a roadmap.
    const { data: career } = await supabase
      .from("career_analysis")
      .select("missing_skills,career_domain,recommended_projects")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    domain = domain ?? career?.career_domain ?? null;
    let finalRoadmap: RoadmapStep[] = [];

    if (mode === "projects") {
      // Use AI-recommended projects as the basis for the roadmap.
      const projects = Array.isArray(career?.recommended_projects)
        ? (career!.recommended_projects as Array<{ title?: string }>)
            .map((p) => (p?.title ?? "").toString().trim())
            .filter(Boolean)
        : [];
      skills = projects.length ? projects.slice(0, 6) : skills;

      if (skills.length === 0) {
        throw new Error("No recommended projects found yet. Analyze your resume first.");
      }

      const result = await geminiJson<{ roadmap: RoadmapStep[] }>({
        system:
          "You are a senior engineering mentor for Bangladeshi students. Recommend only real, free, well-known learning resources (freeCodeCamp, MDN, official docs, YouTube, Coursera audit, Kaggle). Return valid JSON only.",
        prompt: `Build a sequenced learning roadmap for a student targeting ${domain ?? "a tech internship"}.
For EACH of the following recommended projects, produce one roadmap entry. Treat the project title as the "skill" to learn, and break the project into 3-4 concrete build steps the student should follow in order, plus a smaller sub-project they can build to practice.

Projects (in priority order): ${skills.join(", ")}.

For each project return: why this project matters for the role (1 sentence), 3-4 concrete build steps (in the order they should be tackled), 2-3 free resources for the underlying skills (real titles + working URLs + type like "Course"/"Docs"/"Video"/"Practice"), an estimated_time (e.g. "2-3 weeks"), and a smaller practice project_idea.

Return JSON: { "roadmap": [{ "skill", "why", "steps": string[], "resources": [{"title","url","type"}], "estimated_time", "project_idea" }] }`,
        temperature: 0.5,
      });

      finalRoadmap = result.roadmap ?? [];
    } else {
      // Default mode: build around missing skill gaps.
      if (skills.length === 0) {
        skills = asArr(career?.missing_skills);
      }

      if (skills.length === 0) {
        throw new Error("No skill gaps found yet. Analyze your resume first.");
      }

      const result = await geminiJson<{ roadmap: RoadmapStep[] }>({
        system:
          "You are a senior engineering mentor for Bangladeshi students. Recommend only real, free, well-known learning resources (freeCodeCamp, MDN, official docs, YouTube, Coursera audit, Kaggle). Return valid JSON only.",
        prompt: `Build a sequenced learning roadmap for a student targeting ${domain ?? "a tech internship"}.
Skills to learn (in priority order): ${skills.slice(0, 8).join(", ")}.
For each skill return: why it matters for the role (1 sentence), 3-4 concrete learning steps, 2-3 free resources (real titles + working URLs + type like "Course"/"Docs"/"Video"/"Practice"), an estimated_time (e.g. "1-2 weeks"), and one hands-on project_idea.
Return JSON: { "roadmap": [{ "skill", "why", "steps": string[], "resources": [{"title","url","type"}], "estimated_time", "project_idea" }] }`,
        temperature: 0.5,
      });

      finalRoadmap = result.roadmap ?? [];
    }

    const roadmapData = { roadmap: finalRoadmap, domain, skills, mode };

    // Save to database (ai_memory)
    await supabase
      .from("ai_memory")
      .delete()
      .eq("user_id", userId)
      .eq("memory_type", "learning_roadmap");

    await supabase
      .from("ai_memory")
      .insert({
        user_id: userId,
        memory_type: "learning_roadmap",
        content: roadmapData as any,
      });

    return roadmapData;
  });

/** Fetch saved learning roadmap from ai_memory. */
export const getSavedRoadmap = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("ai_memory")
      .select("content")
      .eq("user_id", userId)
      .eq("memory_type", "learning_roadmap")
      .limit(1)
      .maybeSingle();

    if (!data?.content) return null;

    const content = data.content as any;
    return {
      roadmap: Array.isArray(content?.roadmap) ? (content.roadmap as RoadmapStep[]) : [],
      domain: content?.domain as string | null,
      skills: Array.isArray(content?.skills) ? (content.skills as string[]) : [],
      mode: content?.mode as "skills" | "projects" | undefined,
    };
  });
