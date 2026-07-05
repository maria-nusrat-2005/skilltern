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
};

function completion(p: ProfileInput): number {
  const fields = [p.full_name, p.location, p.phone, p.linkedin_url, p.github_url, p.portfolio_url];
  const filled = fields.filter((f) => f && String(f).trim().length > 0).length;
  return Math.round((filled / fields.length) * 100);
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
