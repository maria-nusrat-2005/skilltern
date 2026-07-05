import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const INTERNSHIP_FIELDS =
  "id,title,company,company_type,company_domain,location,salary,duration,domain,work_model,tech_stack";

export const listBookmarks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("bookmarks")
      .select("id,internship_id,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const ids = (rows ?? []).map((r) => r.internship_id);
    if (ids.length === 0) return { bookmarks: [], ids: [] as string[] };

    const { data: internships } = await supabase
      .from("internships")
      .select(INTERNSHIP_FIELDS)
      .in("id", ids);
    const byId = new Map((internships ?? []).map((i) => [i.id, i]));

    return {
      bookmarks: (rows ?? [])
        .map((r) => ({ ...r, internship: byId.get(r.internship_id) ?? null }))
        .filter((r) => r.internship),
      ids,
    };
  });

export const toggleBookmark = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { internshipId: string }) => {
    if (!d?.internshipId) throw new Error("internshipId is required");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", userId)
      .eq("internship_id", data.internshipId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from("bookmarks").delete().eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { bookmarked: false };
    }
    const { error } = await supabase
      .from("bookmarks")
      .insert({ user_id: userId, internship_id: data.internshipId });
    if (error) throw new Error(error.message);
    return { bookmarked: true };
  });
