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
  company_type?: string | null;
  company_size?: string | null;
  founded_year?: number | null;
  company_bio?: string | null;
  logo_url?: string | null;
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
    p.company_type,
    p.company_size,
    p.founded_year,
    p.company_bio,
    p.logo_url,
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

export function parseCompanyBio(bioText: string | null) {
  const defaultMeta = {
    industry: "Technology",
    hr_contact_info: "",
    twitter_url: "",
    facebook_url: "",
  };
  if (!bioText) return { cleanBio: "", ...defaultMeta };

  const parts = bioText.split("---METADATA---");
  if (parts.length < 2) {
    return { cleanBio: bioText, ...defaultMeta };
  }

  try {
    const meta = JSON.parse(parts[1].trim());
    return {
      cleanBio: parts[0].trim(),
      industry: meta.industry || "Technology",
      hr_contact_info: meta.hr_contact_info || "",
      twitter_url: meta.twitter_url || "",
      facebook_url: meta.facebook_url || "",
    };
  } catch (e) {
    return { cleanBio: parts[0].trim(), ...defaultMeta };
  }
}

export function serializeCompanyBio(
  cleanBio: string,
  meta: {
    industry: string;
    hr_contact_info?: string;
    twitter_url?: string;
    facebook_url?: string;
  }
) {
  return `${cleanBio.trim()}\n\n---METADATA---\n${JSON.stringify(meta)}`;
}

export const getStudentProfileCv = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // 1. Check resumes table for active or recent resume uploads
    const { data: resumes } = await supabase
      .from("resumes")
      .select("id, file_name, file_path, is_active, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (resumes && resumes.length > 0) {
      const active =
        resumes.find((r) => r.is_active && r.file_path && !r.file_path.startsWith("paste/")) ||
        resumes.find((r) => r.file_path && !r.file_path.startsWith("paste/"));

      if (active) {
        let cvUrl = active.file_path;
        if (!cvUrl.startsWith("http://") && !cvUrl.startsWith("https://")) {
          const { data } = supabase.storage.from("resumes").getPublicUrl(active.file_path);
          cvUrl = data.publicUrl;
        }
        return {
          cvUrl,
          fileName: active.file_name || "Profile_CV.pdf",
          source: "profile_resume" as const,
          updatedAt: active.created_at,
        };
      }
    }

    // 2. Fallback check from previous applications
    const { data: app } = await supabase
      .from("applications")
      .select("cv_url, updated_at")
      .eq("user_id", userId)
      .not("cv_url", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (app?.cv_url) {
      return {
        cvUrl: app.cv_url,
        fileName: "Profile_CV.pdf",
        source: "previous_application" as const,
        updatedAt: app.updated_at,
      };
    }

    return null;
  });

export const uploadProfileCv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { fileName: string; fileBase64: string; mimeType: string }) => {
    if (!d?.fileBase64 || !d?.fileName) {
      throw new Error("CV file data is required.");
    }
    return d;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const bin = Uint8Array.from(atob(data.fileBase64), (c) => c.charCodeAt(0));
    const cleanExt = data.fileName.split(".").pop() || "pdf";
    const filePath = `${userId}/${Date.now()}-profile-cv.${cleanExt}`;

    const { error: uploadErr } = await supabase.storage.from("resumes").upload(filePath, bin, {
      contentType: data.mimeType || "application/pdf",
      upsert: true,
    });
    if (uploadErr) throw new Error(uploadErr.message);

    const { data: pubUrlData } = supabase.storage.from("resumes").getPublicUrl(filePath);
    const cvUrl = pubUrlData.publicUrl;

    // Deactivate previous active resumes
    await supabase.from("resumes").update({ is_active: false }).eq("user_id", userId);

    // Insert new active resume record
    const { data: inserted, error: rErr } = await supabase
      .from("resumes")
      .insert({
        user_id: userId,
        file_name: data.fileName,
        file_path: filePath,
        is_active: true,
        parsed: false,
        analysis_status: "pending",
      })
      .select("*")
      .single();

    if (rErr) throw new Error(rErr.message);

    return { cvUrl, fileName: data.fileName, resumeId: inserted.id };
  });

