import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function publicClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

/** Parse a BDT stipend string like "BDT 25,000/mo" into a monthly number; 0 for unpaid. */
export function parseStipend(salary: string | null | undefined): number | null {
  if (!salary) return null;
  if (/unpaid|certificate|none/i.test(salary)) return 0;
  const m = salary.replace(/,/g, "").match(/(\d{3,8})/);
  return m ? parseInt(m[1], 10) : null;
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

export type DomainStipend = {
  domain: string;
  count: number;
  paidCount: number;
  unpaidCount: number;
  min: number;
  max: number;
  median: number;
  avg: number;
};

/** Feature 6: Stipend insights aggregated per domain (BDT/month). */
export const getStipendInsights = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase.from("internships").select("domain,salary");
  if (error) throw new Error(error.message);

  const byDomain = new Map<string, number[]>();
  const unpaid = new Map<string, number>();
  const totalCount = new Map<string, number>();

  for (const row of data ?? []) {
    const dom = row.domain ?? "Other";
    totalCount.set(dom, (totalCount.get(dom) ?? 0) + 1);
    const amt = parseStipend(row.salary);
    if (amt === null) continue;
    if (amt === 0) {
      unpaid.set(dom, (unpaid.get(dom) ?? 0) + 1);
    } else {
      const arr = byDomain.get(dom) ?? [];
      arr.push(amt);
      byDomain.set(dom, arr);
    }
  }

  const domains: DomainStipend[] = [...totalCount.keys()].map((domain) => {
    const paid = byDomain.get(domain) ?? [];
    return {
      domain,
      count: totalCount.get(domain) ?? 0,
      paidCount: paid.length,
      unpaidCount: unpaid.get(domain) ?? 0,
      min: paid.length ? Math.min(...paid) : 0,
      max: paid.length ? Math.max(...paid) : 0,
      median: median(paid),
      avg: paid.length ? Math.round(paid.reduce((a, b) => a + b, 0) / paid.length) : 0,
    };
  });
  domains.sort((a, b) => b.median - a.median);

  const allPaid = [...byDomain.values()].flat();
  return {
    domains,
    overall: {
      median: median(allPaid),
      min: allPaid.length ? Math.min(...allPaid) : 0,
      max: allPaid.length ? Math.max(...allPaid) : 0,
      paidCount: allPaid.length,
    },
  };
});

/** Stipend stats for a single domain, used for "fair offer" indicator on a job. */
export const getDomainStipend = createServerFn({ method: "GET" })
  .inputValidator((d: { domain: string }) => d)
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: rows, error } = await supabase
      .from("internships")
      .select("salary")
      .eq("domain", data.domain);
    if (error) throw new Error(error.message);
    const paid = (rows ?? [])
      .map((r) => parseStipend(r.salary))
      .filter((n): n is number => n !== null && n > 0);
    return {
      domain: data.domain,
      count: paid.length,
      min: paid.length ? Math.min(...paid) : 0,
      max: paid.length ? Math.max(...paid) : 0,
      median: median(paid),
    };
  });

/** Feature 17: Peer comparison — how the user compares to anonymized peers in their domain. */
export const getPeerBenchmark = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: career } = await supabase
      .from("career_analysis")
      .select("career_domain,internship_readiness,ats_score,project_quality")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { count: appsCount } = await supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    // Only treat this as "no data" when there is genuinely no career_analysis
    // row yet (i.e., the user has never uploaded a CV). If a row exists but
    // `internship_readiness` is null, still surface what we have — the page
    // shouldn't keep prompting the user to re-analyze.
    try {
      const fs = await import("fs");
      fs.writeFileSync("f:\\AIProjects\\skilltern-v2\\debug-data-insights.json", JSON.stringify({ userId, career, appsCount }, null, 2), "utf8");
    } catch (e) {
      // ignore
    }

    if (!career?.career_domain) {
      return { hasData: false as const };
    }

    const domain = career.career_domain;
    let { data: peers } = await supabase
      .from("peer_benchmarks")
      .select("readiness,ats_score,project_quality,applications_count")
      .eq("domain", domain);

    // Fall back to all peers if no exact-domain match (custom domains from AI).
    let matchedDomain = domain;
    if (!peers || peers.length === 0) {
      const all = await supabase
        .from("peer_benchmarks")
        .select("readiness,ats_score,project_quality,applications_count");
      peers = all.data ?? [];
      matchedDomain = "all domains";
    }

    const list = peers ?? [];
    const n = list.length || 1;
    const avg = (key: "readiness" | "ats_score" | "project_quality" | "applications_count") =>
      Math.round(list.reduce((s, p) => s + (p[key] ?? 0), 0) / n);

    const youReadiness =
      typeof career.internship_readiness === "number" ? career.internship_readiness : 0;
    const hasReadiness = typeof career.internship_readiness === "number";
    const better = list.filter((p) => (p.readiness ?? 0) < youReadiness).length;
    const percentile = list.length ? Math.round((better / list.length) * 100) : 0;

    // Distribution histogram (5 buckets).
    const buckets = [0, 0, 0, 0, 0];
    for (const p of list) {
      const idx = Math.min(4, Math.floor((p.readiness ?? 0) / 20));
      buckets[idx]++;
    }
    const distribution = buckets.map((cnt, i) => ({
      label: `${i * 20}-${i * 20 + 20}`,
      count: cnt,
      youHere: Math.min(4, Math.floor(youReadiness / 20)) === i,
    }));

    return {
      hasData: true as const,
      hasReadiness,
      domain: matchedDomain,
      peerCount: list.length,
      you: {
        readiness: youReadiness,
        ats: career.ats_score ?? 0,
        projectQuality: career.project_quality ?? 0,
        applications: appsCount ?? 0,
      },
      peers: {
        avgReadiness: avg("readiness"),
        avgAts: avg("ats_score"),
        avgProjectQuality: avg("project_quality"),
        avgApplications: avg("applications_count"),
      },
      percentile,
      distribution,
    };
  });
