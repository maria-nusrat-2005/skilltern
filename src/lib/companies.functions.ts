import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseStipend } from "@/lib/insights.functions";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export type CompanySummary = {
  company: string;
  companyDomain: string | null;
  companyType: string | null;
  roleCount: number;
  domains: string[];
  locations: string[];
  stipendMin: number;
  stipendMax: number;
  avgRating: number | null;
  reviewCount: number;
};

/** Feature 7: List companies with aggregated role + review stats. */
export const listCompanies = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const [{ data: jobs, error }, { data: reviews }] = await Promise.all([
    supabase
      .from("internships")
      .select("company,company_domain,company_type,domain,location,salary"),
    supabase.from("company_reviews").select("company,rating"),
  ]);
  if (error) throw new Error(error.message);

  const ratingMap = new Map<string, number[]>();
  for (const r of reviews ?? []) {
    const arr = ratingMap.get(r.company) ?? [];
    arr.push(r.rating);
    ratingMap.set(r.company, arr);
  }

  const map = new Map<string, CompanySummary>();
  for (const j of jobs ?? []) {
    const key = j.company;
    const existing = map.get(key);
    const stipend = parseStipend(j.salary);
    if (!existing) {
      const ratings = ratingMap.get(key) ?? [];
      map.set(key, {
        company: key,
        companyDomain: j.company_domain,
        companyType: j.company_type,
        roleCount: 1,
        domains: j.domain ? [j.domain] : [],
        locations: j.location ? [j.location] : [],
        stipendMin: stipend && stipend > 0 ? stipend : Infinity,
        stipendMax: stipend && stipend > 0 ? stipend : 0,
        avgRating: ratings.length
          ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
          : null,
        reviewCount: ratings.length,
      });
    } else {
      existing.roleCount++;
      if (j.domain && !existing.domains.includes(j.domain)) existing.domains.push(j.domain);
      if (j.location && !existing.locations.includes(j.location)) existing.locations.push(j.location);
      if (stipend && stipend > 0) {
        existing.stipendMin = Math.min(existing.stipendMin, stipend);
        existing.stipendMax = Math.max(existing.stipendMax, stipend);
      }
    }
  }

  const companies = [...map.values()]
    .map((c) => ({ ...c, stipendMin: c.stipendMin === Infinity ? 0 : c.stipendMin }))
    .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0) || b.roleCount - a.roleCount);

  return { companies };
});

/** Feature 7: Company detail — open roles + reviews. */
export const getCompany = createServerFn({ method: "GET" })
  .inputValidator((d: { company: string }) => {
    if (!d?.company) throw new Error("company is required");
    return d;
  })
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const [{ data: jobs }, { data: reviews }] = await Promise.all([
      supabase
        .from("internships")
        .select("id,title,domain,location,work_model,salary,company_domain,company_type,duration")
        .eq("company", data.company)
        .order("created_at", { ascending: false }),
      supabase
        .from("company_reviews")
        .select("*")
        .eq("company", data.company)
        .order("created_at", { ascending: false }),
    ]);

    const ratings = (reviews ?? []).map((r) => r.rating);
    const avgRating = ratings.length
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : null;
    const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: ratings.filter((r) => r === star).length,
    }));

    return {
      company: data.company,
      companyDomain: jobs?.[0]?.company_domain ?? null,
      companyType: jobs?.[0]?.company_type ?? null,
      internships: jobs ?? [],
      reviews: reviews ?? [],
      avgRating,
      reviewCount: ratings.length,
      ratingBreakdown,
    };
  });

export const addCompanyReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      company: string;
      rating: number;
      role?: string;
      title?: string;
      body?: string;
      pros?: string;
      cons?: string;
    }) => {
      if (!d?.company) throw new Error("company is required");
      if (!d.rating || d.rating < 1 || d.rating > 5) throw new Error("Pick a rating from 1 to 5.");
      return d;
    },
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: created, error } = await supabase
      .from("company_reviews")
      .insert({
        user_id: userId,
        company: data.company,
        rating: data.rating,
        role: data.role?.slice(0, 120) ?? null,
        title: data.title?.slice(0, 140) ?? null,
        body: data.body?.slice(0, 2000) ?? null,
        pros: data.pros?.slice(0, 500) ?? null,
        cons: data.cons?.slice(0, 500) ?? null,
        author_label: profile?.full_name ?? "Skilltern student",
        is_seed: false,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return created;
  });

export const deleteCompanyReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("company_reviews")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
