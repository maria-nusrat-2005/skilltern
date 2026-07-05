import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: apps, error } = await supabase
      .from("applications")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);

    const ids = (apps ?? []).map((a) => a.internship_id);
    if (ids.length === 0) return { applications: [] };

    const { data: internships } = await supabase
      .from("internships")
      .select("id,title,company,company_domain,location,salary,work_model,domain")
      .in("id", ids);
    const byId = new Map((internships ?? []).map((i) => [i.id, i]));
    return {
      applications: (apps ?? []).map((a) => ({ ...a, internship: byId.get(a.internship_id) ?? null })),
    };
  });

export const saveApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { internshipId: string; status?: string; notes?: string }) => {
    if (!d?.internshipId) throw new Error("internshipId is required");
    return { internshipId: d.internshipId, status: d.status ?? "saved", notes: d.notes ?? null };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("applications")
      .select("id,status")
      .eq("user_id", userId)
      .eq("internship_id", data.internshipId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("applications")
        .update({ status: data.status, notes: data.notes, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      if (existing.status !== data.status) {
        await supabase.from("application_status_history").insert({
          application_id: existing.id,
          user_id: userId,
          status: data.status,
        });
      }
      return { id: existing.id, status: data.status };
    }

    const { data: created, error } = await supabase
      .from("applications")
      .insert({ user_id: userId, internship_id: data.internshipId, status: data.status, notes: data.notes })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await supabase.from("application_status_history").insert({
      application_id: created.id,
      user_id: userId,
      status: data.status,
    });
    return { id: created.id, status: data.status };
  });

export const updateApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: string }) => {
    if (!d?.id || !d?.status) throw new Error("id and status are required");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("applications")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    await supabase.from("application_status_history").insert({
      application_id: data.id,
      user_id: userId,
      status: data.status,
    });
    return { ok: true };
  });

export const updateApplicationDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id: string;
      deadline?: string | null;
      interview_at?: string | null;
      notes?: string | null;
      board_position?: number;
    }) => {
      if (!d?.id) throw new Error("id is required");
      return d;
    },
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const patch: {
      updated_at: string;
      deadline?: string | null;
      interview_at?: string | null;
      notes?: string | null;
      board_position?: number;
    } = { updated_at: new Date().toISOString() };
    if (data.deadline !== undefined) patch.deadline = data.deadline || null;
    if (data.interview_at !== undefined) patch.interview_at = data.interview_at || null;
    if (data.notes !== undefined) patch.notes = data.notes;
    if (data.board_position !== undefined) patch.board_position = data.board_position;
    const { error } = await supabase
      .from("applications")
      .update(patch)
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteApplication = createServerFn({ method: "POST" })

  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => {
    if (!d?.id) throw new Error("id is required");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
