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

export type SearchFilters = {
  search?: string;
  domain?: string;
  workModel?: string;
};

async function countForFilters(f: SearchFilters): Promise<number> {
  const supabase = publicClient();
  let q = supabase.from("internships").select("id", { count: "exact", head: true });
  if (f.search) q = q.or(`title.ilike.%${f.search}%,company.ilike.%${f.search}%`);
  if (f.domain && f.domain !== "all") q = q.eq("domain", f.domain);
  if (f.workModel && f.workModel !== "all") q = q.eq("work_model", f.workModel);
  const { count } = await q;
  return count ?? 0;
}

export const listSavedSearches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("saved_searches")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    // Recompute current counts to surface "new since last seen" alerts.
    const enriched = await Promise.all(
      (rows ?? []).map(async (r) => {
        const filters = (r.filters ?? {}) as SearchFilters;
        const currentCount = await countForFilters(filters);
        return {
          ...r,
          filters,
          currentCount,
          newCount: Math.max(0, currentCount - r.last_seen_count),
        };
      }),
    );
    return { searches: enriched };
  });

export const saveSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { name: string; filters: SearchFilters }) => {
    if (!d?.name?.trim()) throw new Error("Please name this search.");
    return { name: d.name.trim().slice(0, 80), filters: d.filters ?? {} };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const currentCount = await countForFilters(data.filters);
    const { data: created, error } = await supabase
      .from("saved_searches")
      .insert({
        user_id: userId,
        name: data.name,
        filters: data.filters,
        last_seen_count: currentCount,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return created;
  });

export const markSearchSeen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; count: number }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("saved_searches")
      .update({ last_seen_count: data.count })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setSearchNotify = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; notify: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("saved_searches")
      .update({ notify: data.notify })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSavedSearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("saved_searches")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
