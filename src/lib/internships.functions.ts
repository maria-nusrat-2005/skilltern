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

export type InternshipFilters = {
  search?: string;
  domain?: string;
  workModel?: string;
  experienceLevel?: string;
  page?: number;
  pageSize?: number;
};

export const listInternships = createServerFn({ method: "GET" })
  .inputValidator((d: InternshipFilters) => d ?? {})
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const page = data.page ?? 1;
    const pageSize = Math.min(data.pageSize ?? 12, 50);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let q = supabase
      .from("internships")
      .select(
        "id,title,company,company_type,company_domain,location,salary,duration,domain,industry,experience_level,work_model,tech_stack,description",
        { count: "exact" },
      )
      .order("created_at", { ascending: false });

    if (data.search) q = q.or(`title.ilike.%${data.search}%,company.ilike.%${data.search}%`);
    if (data.domain && data.domain !== "all") q = q.eq("domain", data.domain);
    if (data.workModel && data.workModel !== "all") q = q.eq("work_model", data.workModel);
    if (data.experienceLevel && data.experienceLevel !== "all")
      q = q.eq("experience_level", data.experienceLevel);

    const { data: rows, count, error } = await q.range(from, to);
    if (error) throw new Error(error.message);
    return { items: rows ?? [], total: count ?? 0, page, pageSize };
  });

export const getInternship = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: row, error } = await supabase
      .from("internships")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const getInternshipFacets = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase.from("internships").select("domain");
  if (error) throw new Error(error.message);
  const domains = Array.from(new Set((data ?? []).map((r) => r.domain).filter(Boolean))).sort();
  return { domains: domains as string[] };
});
