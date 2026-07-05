import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

function asArr(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => String(x)) : [];
}



/** Content-based "more like this": same domain + shared tech stack overlap. */
export const getSimilarInternships = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string; limit?: number }) => d)
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: target } = await supabase
      .from("internships")
      .select("id,domain,tech_stack,requirements,title")
      .eq("id", data.id)
      .maybeSingle();
    if (!target) return { items: [] };

    const targetTech = new Set(
      [...asArr(target.tech_stack), ...asArr(target.requirements)].map((s) => s.toLowerCase()),
    );

    const { data: rows } = await supabase
      .from("internships")
      .select(
        "id,title,company,company_type,company_domain,location,salary,duration,domain,work_model,tech_stack,requirements",
      )
      .neq("id", data.id);

    const scored = (rows ?? [])
      .map((r) => {
        const tech = [...asArr(r.tech_stack), ...asArr(r.requirements)];
        let hits = 0;
        for (const t of tech) if (targetTech.has(t.toLowerCase())) hits++;
        const domainBonus = r.domain === target.domain ? 3 : 0;
        return { r, score: hits + domainBonus };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, data.limit ?? 4)
      .map((s) => s.r);

    return { items: scored };
  });

/** Fetch full records for side-by-side comparison. */
export const compareInternships = createServerFn({ method: "GET" })
  .inputValidator((d: { ids: string[] }) => ({ ids: (d?.ids ?? []).slice(0, 3) }))
  .handler(async ({ data }) => {
    if (data.ids.length === 0) return { items: [] };
    const supabase = publicClient();
    const { data: rows, error } = await supabase
      .from("internships")
      .select("*")
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    // Preserve requested order
    const byId = new Map((rows ?? []).map((r) => [r.id, r]));
    return { items: data.ids.map((id) => byId.get(id)).filter(Boolean) };
  });
