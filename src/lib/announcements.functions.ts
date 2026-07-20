import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AnnouncementItem = {
  id: string;
  target: "all" | "students" | "companies";
  title: string;
  body: string;
  created_at: string;
  is_active: boolean;
};

// In-memory persistent fallback cache for active announcements if table isn't created yet
let memoryAnnouncements: AnnouncementItem[] = [
  {
    id: "system-init-1",
    target: "all",
    title: "📢 Platform Update & New Features Released",
    body: "Welcome to Skilltern! You can now use your saved Profile CV for quick internship applications.",
    created_at: new Date().toISOString(),
    is_active: true,
  },
];

export const sendBroadcastAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { target: "all" | "students" | "companies"; title: string; body: string }) => {
    if (!d?.title || !d?.body) {
      throw new Error("Title and message content are required.");
    }
    return d;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile?.role !== "admin") {
      throw new Error("Unauthorized: Admin privileges required to send broadcast announcements.");
    }

    const newAnnouncement: AnnouncementItem = {
      id: `ann-${Date.now()}`,
      target: data.target || "all",
      title: data.title.trim(),
      body: data.body.trim(),
      created_at: new Date().toISOString(),
      is_active: true,
    };

    // Try inserting into Supabase table if present
    try {
      const { data: dbData, error } = await supabase
        .from("announcements" as any)
        .insert({
          target: newAnnouncement.target,
          title: newAnnouncement.title,
          body: newAnnouncement.body,
          created_at: newAnnouncement.created_at,
          is_active: true,
          created_by: userId,
        })
        .select("*")
        .single();

      if (!error && dbData) {
        return dbData as unknown as AnnouncementItem;
      }
    } catch (e) {
      // Table doesn't exist yet, fallback to memory storage
    }

    // Add to memory list
    memoryAnnouncements.unshift(newAnnouncement);
    return newAnnouncement;
  });

export const getActiveAnnouncements = createServerFn({ method: "GET" })
  .handler(async ({ context }) => {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });

        const { data: dbItems, error } = await supabase
          .from("announcements" as any)
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (!error && dbItems && dbItems.length > 0) {
          return dbItems as unknown as AnnouncementItem[];
        }
      }
    } catch (e) {
      // Fallback to memory
    }

    return memoryAnnouncements.filter((a) => a.is_active);
  });

export const deleteAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => {
    if (!d?.id) throw new Error("Announcement ID is required.");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile?.role !== "admin") {
      throw new Error("Unauthorized: Admin privileges required.");
    }

    try {
      await supabase
        .from("announcements" as any)
        .update({ is_active: false })
        .eq("id", data.id);
    } catch (e) {}

    memoryAnnouncements = memoryAnnouncements.filter((a) => a.id !== data.id);
    return { success: true };
  });
