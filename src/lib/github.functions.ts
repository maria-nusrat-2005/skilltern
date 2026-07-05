import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function parseUsername(input: string): string | null {
  const s = (input ?? "").trim();
  if (!s) return null;
  const m = s.match(/github\.com\/([A-Za-z0-9-]+)/i);
  if (m) return m[1];
  if (/^[A-Za-z0-9-]+$/.test(s)) return s;
  return null;
}

type Repo = {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  topics?: string[];
  fork: boolean;
  html_url: string;
};

/** Import public GitHub repos, infer skills, and merge into preferences (feature 15). */
export const importGitHub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { url?: string }) => d ?? {})
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    let url = data.url?.trim();
    if (!url) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("github_url")
        .eq("user_id", userId)
        .maybeSingle();
      url = profile?.github_url ?? undefined;
    }
    const username = parseUsername(url ?? "");
    if (!username) throw new Error("Add your GitHub URL in your profile, or paste it here.");

    const res = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`,
      { headers: { Accept: "application/vnd.github.mercy-preview+json" } },
    );
    if (res.status === 404) throw new Error(`GitHub user "${username}" not found.`);
    if (!res.ok) throw new Error("Couldn't reach GitHub right now. Try again shortly.");

    const repos = (await res.json()) as Repo[];
    const own = repos.filter((r) => !r.fork);

    const langCount = new Map<string, number>();
    const topicCount = new Map<string, number>();
    for (const r of own) {
      if (r.language) langCount.set(r.language, (langCount.get(r.language) ?? 0) + 1);
      for (const t of r.topics ?? []) topicCount.set(t, (topicCount.get(t) ?? 0) + 1);
    }

    const languages = [...langCount.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
    const topics = [...topicCount.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k).slice(0, 12);
    const inferredSkills = Array.from(new Set([...languages, ...topics])).slice(0, 20);

    const topRepos = [...own]
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 6)
      .map((r) => ({
        name: r.name,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count,
        url: r.html_url,
      }));

    // Merge inferred skills into preferred_technologies (no duplicates).
    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const existingTech: string[] = Array.isArray(prefs?.preferred_technologies)
      ? (prefs!.preferred_technologies as string[])
      : [];
    const mergedTech = Array.from(
      new Set([...existingTech.map(String), ...inferredSkills]),
    ).slice(0, 40);

    await supabase.from("user_preferences").upsert(
      {
        user_id: userId,
        preferred_technologies: mergedTech,
        preferred_roles: prefs?.preferred_roles ?? [],
        preferred_locations: prefs?.preferred_locations ?? [],
        work_model: prefs?.work_model ?? null,
        company_type: prefs?.company_type ?? null,
        min_salary: prefs?.min_salary ?? null,
        career_goals: prefs?.career_goals ?? null,
      },
      { onConflict: "user_id" },
    );

    return {
      username,
      publicRepos: own.length,
      languages,
      topics,
      inferredSkills,
      topRepos,
    };
  });
