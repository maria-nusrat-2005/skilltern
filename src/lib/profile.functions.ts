import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getProfileData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    let { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profile) {
      const { data: inserted, error } = await supabase
        .from("profiles")
        .insert({ user_id: userId, email: context.claims?.email ?? null })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      profile = inserted;
    }

    const { data: preferences } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    return { profile, preferences };
  });

type ProfileInput = {
  full_name?: string | null;
  location?: string | null;
  phone?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  company_name?: string | null;
  company_domain?: string | null;
};

function completion(p: ProfileInput): number {
  const fields = [
    p.full_name,
    p.location,
    p.phone,
    p.linkedin_url,
    p.github_url,
    p.portfolio_url,
    p.company_name,
    p.company_domain,
  ].filter((f) => f !== undefined);
  const filled = fields.filter((f) => f && String(f).trim().length > 0).length;
  return fields.length > 0 ? Math.round((filled / fields.length) * 100) : 0;
}

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: ProfileInput) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: updated, error } = await supabase
      .from("profiles")
      .update({ ...data, profile_completion: completion(data) })
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return updated;
  });

type PreferencesInput = {
  preferred_roles?: string[];
  preferred_technologies?: string[];
  preferred_locations?: string[];
  work_model?: string | null;
  company_type?: string | null;
  min_salary?: number | null;
  career_goals?: string | null;
};

export const savePreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: PreferencesInput) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const payload = {
      user_id: userId,
      preferred_roles: data.preferred_roles ?? [],
      preferred_technologies: data.preferred_technologies ?? [],
      preferred_locations: data.preferred_locations ?? [],
      work_model: data.work_model ?? null,
      company_type: data.company_type ?? null,
      min_salary: data.min_salary ?? null,
      career_goals: data.career_goals ?? null,
    };
    const { data: saved, error } = await supabase
      .from("user_preferences")
      .upsert(payload, { onConflict: "user_id" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("user_id", userId);

    return saved;
  });

type RoleInput = {
  role: "student" | "company";
  company_name?: string | null;
  company_domain?: string | null;
};

export const updateUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: RoleInput) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const updatePayload: any = { role: data.role };
    if (data.role === "company") {
      updatePayload.company_name = data.company_name ?? null;
      updatePayload.company_domain = data.company_domain ?? null;
      updatePayload.onboarding_completed = true; // Skip CV onboarding for company recruiters
    }
    const { data: updated, error } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return updated;
  });

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Check if requester is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile?.role !== "admin") {
      throw new Error("Unauthorized: Admin privileges required");
    }

    const { data: users, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return users;
  });

export const adminUpdateUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { targetUserId: string; role: "student" | "company" | "admin" }) => {
    console.log("adminUpdateUserRole validation received:", d);
    if (!d?.targetUserId || !d?.role) throw new Error("targetUserId and role are required");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Check if requester is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile?.role !== "admin") {
      throw new Error("Unauthorized: Admin privileges required");
    }

    const { data: updated, error } = await supabase
      .from("profiles")
      .update({ role: data.role })
      .eq("user_id", data.targetUserId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return updated;
  });

export const adminGetStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Check admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile?.role !== "admin") {
      throw new Error("Unauthorized: Admin privileges required");
    }

    const { count: usersCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: internshipsCount } = await supabase
      .from("internships")
      .select("*", { count: "exact", head: true });

    const { count: applicationsCount } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true });

    return {
      users: usersCount ?? 0,
      internships: internshipsCount ?? 0,
      applications: applicationsCount ?? 0,
    };
  });
