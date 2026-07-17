import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

export const listCompanyInternships = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("internships")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createInternship = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      title: string;
      domain: string;
      location: string;
      company: string;
      company_domain?: string | null;
      company_type: string;
      contact_email?: string | null;
      salary?: string | null;
      duration?: string | null;
      work_model?: string | null;
      experience_level?: string | null;
      description?: string | null;
      requirements?: string[] | null;
      responsibilities?: string[] | null;
      tech_stack?: string[] | null;
      preferred_skills?: string[] | null;
    }) => {
      if (!d.title || !d.domain || !d.location || !d.company) {
        throw new Error("Missing required fields (title, domain, location, company)");
      }
      return d;
    },
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("internships")
      .insert({
        title: data.title,
        domain: data.domain,
        location: data.location,
        company: data.company,
        company_domain: data.company_domain ?? null,
        company_type: data.company_type || "Startup",
        contact_email: data.contact_email ?? null,
        salary: data.salary ?? null,
        duration: data.duration ?? null,
        work_model: data.work_model ?? null,
        experience_level: data.experience_level ?? null,
        description: data.description ?? null,
        requirements: data.requirements ?? [],
        responsibilities: data.responsibilities ?? [],
        tech_stack: data.tech_stack ?? [],
        preferred_skills: data.preferred_skills ?? [],
        user_id: userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateInternship = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id: string;
      title: string;
      domain: string;
      location: string;
      company: string;
      company_domain?: string | null;
      company_type: string;
      contact_email?: string | null;
      salary?: string | null;
      duration?: string | null;
      work_model?: string | null;
      experience_level?: string | null;
      description?: string | null;
      requirements?: string[] | null;
      responsibilities?: string[] | null;
      tech_stack?: string[] | null;
      preferred_skills?: string[] | null;
    }) => {
      if (!d.id || !d.title || !d.domain || !d.location || !d.company) {
        throw new Error("Missing required fields (id, title, domain, location, company)");
      }
      return d;
    },
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("internships")
      .update({
        title: data.title,
        domain: data.domain,
        location: data.location,
        company: data.company,
        company_domain: data.company_domain ?? null,
        company_type: data.company_type || "Startup",
        contact_email: data.contact_email ?? null,
        salary: data.salary ?? null,
        duration: data.duration ?? null,
        work_model: data.work_model ?? null,
        experience_level: data.experience_level ?? null,
        description: data.description ?? null,
        requirements: data.requirements ?? [],
        responsibilities: data.responsibilities ?? [],
        tech_stack: data.tech_stack ?? [],
        preferred_skills: data.preferred_skills ?? [],
      })
      .eq("id", data.id)
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const incrementInternshipViews = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: job, error } = await supabase
      .from("internships")
      .select("description")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !job) return { ok: false };

    const { cleanDescription, status, required_cgpa, deadline, views } = parseInternshipMetadata(job.description);
    const newViews = views + 1;
    const newDesc = serializeInternshipDescription(cleanDescription, {
      status,
      required_cgpa,
      deadline,
      views: newViews,
    });

    await supabase
      .from("internships")
      .update({ description: newDesc })
      .eq("id", data.id);
    return { ok: true, views: newViews };
  });

export const deleteInternship = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => {
    if (!d?.id) throw new Error("id is required");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("internships")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export function parseInternshipMetadata(descriptionText: string | null) {
  const defaultMeta = {
    status: "published",
    required_cgpa: null as number | null,
    deadline: null as string | null,
    views: 0,
  };
  if (!descriptionText) return { cleanDescription: "", ...defaultMeta };

  const parts = descriptionText.split("---METADATA---");
  if (parts.length < 2) {
    return { cleanDescription: descriptionText, ...defaultMeta };
  }

  try {
    const meta = JSON.parse(parts[1].trim());
    return {
      cleanDescription: parts[0].trim(),
      status: meta.status || "published",
      required_cgpa: meta.required_cgpa !== undefined ? meta.required_cgpa : null,
      deadline: meta.deadline || null,
      views: meta.views || 0,
    };
  } catch (e) {
    return { cleanDescription: parts[0].trim(), ...defaultMeta };
  }
}

export function serializeInternshipDescription(
  cleanDescription: string,
  meta: {
    status: string;
    required_cgpa?: number | null;
    deadline?: string | null;
    views?: number;
  }
) {
  return `${cleanDescription.trim()}\n\n---METADATA---\n${JSON.stringify(meta)}`;
}
