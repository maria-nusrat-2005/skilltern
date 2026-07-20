import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AnnouncementCategory =
  | "Platform Update"
  | "New Feature"
  | "Internship Fair"
  | "Maintenance"
  | "System Notice"
  | "Career Tips"
  | "Event"
  | "General";

export type AnnouncementPriority = "High" | "Medium" | "Low";
export type AnnouncementTarget = "Everyone" | "Students Only" | "Companies Only" | "Admin Only";
export type AnnouncementStatus = "Draft" | "Published" | "Scheduled" | "Expired" | "Archived";

export type AttachmentItem = {
  name: string;
  url: string;
  type?: string;
  size?: string;
};

export type FullAnnouncement = {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  target_audience: AnnouncementTarget;
  banner_image?: string;
  attachments?: AttachmentItem[];
  publish_date: string;
  expiry_date?: string;
  is_pinned: boolean;
  status: AnnouncementStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
  is_read?: boolean;
  read_at?: string;
  read_count?: number;
};

export type AnnouncementItem = FullAnnouncement;

// In-memory fallback initial seed storage
let memoryAnnouncementsList: FullAnnouncement[] = [
  {
    id: "ann-fair-2026",
    title: "🎓 National Internship Fair 2026 Announced!",
    content: "Join over 50 top tech companies, design studios, and corporate enterprises at the annual Skilltern Virtual Internship Fair. Prepare your resume, complete your skill benchmarks, and connect with recruiters live.",
    category: "Internship Fair",
    priority: "High",
    target_audience: "Everyone",
    banner_image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80",
    attachments: [
      { name: "Fair_Schedule_2026.pdf", url: "#", type: "pdf", size: "1.2 MB" },
      { name: "Recruiter_Preparation_Guide.pdf", url: "#", type: "pdf", size: "850 KB" }
    ],
    publish_date: new Date().toISOString(),
    expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    is_pinned: true,
    status: "Published",
    created_by: "System Admin",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    read_count: 142,
  },
  {
    id: "ann-cv-feature",
    title: "⚡ Feature Release: One-Click Profile CV Upload & Copy",
    content: "You can now directly attach your verified Profile CV to any internship application without needing to re-upload PDF files every time. Update your resume anytime in Profile settings.",
    category: "New Feature",
    priority: "Medium",
    target_audience: "Students Only",
    banner_image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1200&auto=format&fit=crop&q=80",
    attachments: [],
    publish_date: new Date().toISOString(),
    is_pinned: false,
    status: "Published",
    created_by: "Product Team",
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    read_count: 98,
  },
  {
    id: "ann-recruiter-portal",
    title: "🏢 Employer Verification & Applicant Matching AI",
    content: "Recruiters and hiring managers can now view real-time AI match percentages and candidate skill gap analysis directly inside their Recruiter Dashboard.",
    category: "Platform Update",
    priority: "Medium",
    target_audience: "Companies Only",
    banner_image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80",
    attachments: [],
    publish_date: new Date().toISOString(),
    is_pinned: false,
    status: "Published",
    created_by: "Platform Governance",
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    read_count: 45,
  }
];

// In-memory read tracking
const memoryReadMap = new Set<string>(); // "userId:announcementId"

// Helper to compute automated status (Expired / Scheduled / Published)
function evaluateStatus(item: FullAnnouncement): AnnouncementStatus {
  if (item.status === "Draft" || item.status === "Archived") return item.status;
  const now = new Date().getTime();
  const pubTime = new Date(item.publish_date).getTime();
  const expTime = item.expiry_date ? new Date(item.expiry_date).getTime() : null;

  if (expTime && now > expTime) return "Expired";
  if (now < pubTime) return "Scheduled";
  return "Published";
}

// Admin: Get all announcements with filter/search
export const getAnnouncementsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (profile?.role === "admin") {
        const { data: dbItems, error } = await supabase
          .from("announcements" as any)
          .select("*")
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false });

        if (!error && dbItems && dbItems.length > 0) {
          return (dbItems as unknown as FullAnnouncement[]).map((a) => ({
            ...a,
            status: evaluateStatus(a),
          }));
        }
      }
    } catch (e) {}

    return memoryAnnouncementsList.map((a) => ({
      ...a,
      status: evaluateStatus(a),
    }));
  });

// Public: Get announcements for current user (Student or Company)
export const getAnnouncementsPublic = createServerFn({ method: "GET" })
  .handler(async ({ context }) => {
    let currentUserId: string | null = null;
    let currentUserRole = "student";

    try {
      const req = (context as any)?.request;
      const authHeader = req?.headers?.get("Authorization") || req?.headers?.get("authorization");
      if (authHeader) {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (supabaseUrl && supabaseKey) {
          const client = createClient<Database>(supabaseUrl, supabaseKey, {
            auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
          });
          const token = authHeader.replace(/^Bearer\s+/i, "");
          const { data: { user } } = await client.auth.getUser(token);
          if (user) {
            currentUserId = user.id;
            const { data: prof } = await client.from("profiles").select("role").eq("user_id", user.id).maybeSingle();
            if (prof?.role) currentUserRole = prof.role;
          }
        }
      }
    } catch (e) {}

    let list: FullAnnouncement[] = [];

    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
      if (supabaseUrl && supabaseKey) {
        const client = createClient<Database>(supabaseUrl, supabaseKey, {
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });

        const { data: dbItems, error } = await client
          .from("announcements" as any)
          .select("*")
          .eq("status", "Published")
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false });

        if (!error && dbItems && dbItems.length > 0) {
          list = dbItems as unknown as FullAnnouncement[];
        }
      }
    } catch (e) {}

    if (list.length === 0) {
      list = memoryAnnouncementsList;
    }

    // Filter by role and expiration
    const filtered = list.filter((item) => {
      const computed = evaluateStatus(item);
      if (computed !== "Published") return false;
      if (item.target_audience === "Everyone") return true;
      if (item.target_audience === "Students Only" && currentUserRole === "student") return true;
      if (item.target_audience === "Companies Only" && currentUserRole === "company") return true;
      if (currentUserRole === "admin") return true;
      return false;
    });

    // Attach read status
    return filtered.map((a) => {
      const isRead = currentUserId ? memoryReadMap.has(`${currentUserId}:${a.id}`) : false;
      return {
        ...a,
        is_read: isRead,
      };
    });
  });

// Admin: Create Announcement
export const createAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    title: string;
    content: string;
    category?: AnnouncementCategory;
    priority?: AnnouncementPriority;
    target_audience?: AnnouncementTarget;
    banner_image?: string;
    attachments?: AttachmentItem[];
    publish_date?: string;
    expiry_date?: string;
    is_pinned?: boolean;
    status?: AnnouncementStatus;
  }) => {
    if (!d?.title || !d?.content) throw new Error("Title and content are required.");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile?.role !== "admin") {
      throw new Error("Unauthorized: Admin privileges required.");
    }

    // Check pinned count limit (Max 3)
    if (data.is_pinned) {
      const pinnedCount = memoryAnnouncementsList.filter((a) => a.is_pinned).length;
      if (pinnedCount >= 3) {
        throw new Error("Maximum limit of 3 pinned announcements reached. Please unpin an announcement first.");
      }
    }

    const publishDate = data.publish_date || new Date().toISOString();
    const initialStatus = data.status || (new Date(publishDate).getTime() > Date.now() ? "Scheduled" : "Published");

    const newAnnouncement: FullAnnouncement = {
      id: `ann-${Date.now()}`,
      title: data.title.trim(),
      content: data.content.trim(),
      category: data.category || "General",
      priority: data.priority || "Medium",
      target_audience: data.target_audience || "Everyone",
      banner_image: data.banner_image,
      attachments: data.attachments || [],
      publish_date: publishDate,
      expiry_date: data.expiry_date,
      is_pinned: !!data.is_pinned,
      status: initialStatus,
      created_by: profile?.full_name || "Platform Admin",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      read_count: 0,
    };

    try {
      const { data: dbItem, error } = await supabase
        .from("announcements" as any)
        .insert({
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          category: newAnnouncement.category,
          priority: newAnnouncement.priority,
          target_audience: newAnnouncement.target_audience,
          banner_image: newAnnouncement.banner_image,
          attachments: newAnnouncement.attachments,
          publish_date: newAnnouncement.publish_date,
          expiry_date: newAnnouncement.expiry_date,
          is_pinned: newAnnouncement.is_pinned,
          status: newAnnouncement.status,
          created_by: userId,
        })
        .select("*")
        .single();

      if (!error && dbItem) {
        return dbItem as unknown as FullAnnouncement;
      }
    } catch (e) {}

    memoryAnnouncementsList.unshift(newAnnouncement);
    return newAnnouncement;
  });

// Admin: Update Announcement
export const updateAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string } & Partial<FullAnnouncement>) => {
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
      const { data: dbItem, error } = await supabase
        .from("announcements" as any)
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id)
        .select("*")
        .single();

      if (!error && dbItem) {
        return dbItem as unknown as FullAnnouncement;
      }
    } catch (e) {}

    memoryAnnouncementsList = memoryAnnouncementsList.map((a) =>
      a.id === data.id ? { ...a, ...data, updated_at: new Date().toISOString() } : a
    );

    return memoryAnnouncementsList.find((a) => a.id === data.id)!;
  });

// Admin: Toggle Pin Status
export const togglePinAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => {
    if (!d?.id) throw new Error("ID required");
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

    const item = memoryAnnouncementsList.find((a) => a.id === data.id);
    if (item && !item.is_pinned) {
      const pinnedCount = memoryAnnouncementsList.filter((a) => a.is_pinned).length;
      if (pinnedCount >= 3) {
        throw new Error("Maximum 3 announcements can be pinned at the same time.");
      }
    }

    memoryAnnouncementsList = memoryAnnouncementsList.map((a) =>
      a.id === data.id ? { ...a, is_pinned: !a.is_pinned, updated_at: new Date().toISOString() } : a
    );

    try {
      await supabase
        .from("announcements" as any)
        .update({ is_pinned: item ? !item.is_pinned : true })
        .eq("id", data.id);
    } catch (e) {}

    return { success: true };
  });

// Admin: Toggle Publish Status
export const togglePublishAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: AnnouncementStatus }) => {
    if (!d?.id || !d?.status) throw new Error("ID and status required");
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

    memoryAnnouncementsList = memoryAnnouncementsList.map((a) =>
      a.id === data.id ? { ...a, status: data.status, updated_at: new Date().toISOString() } : a
    );

    try {
      await supabase
        .from("announcements" as any)
        .update({ status: data.status })
        .eq("id", data.id);
    } catch (e) {}

    return { success: true };
  });

// Admin: Delete Announcement
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

    memoryAnnouncementsList = memoryAnnouncementsList.filter((a) => a.id !== data.id);

    try {
      await supabase.from("announcements" as any).delete().eq("id", data.id);
    } catch (e) {}

    return { success: true };
  });

// Public: Mark Announcement as Read
export const markAnnouncementRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { announcementId: string }) => {
    if (!d?.announcementId) throw new Error("announcementId is required");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { userId } = context;
    memoryReadMap.add(`${userId}:${data.announcementId}`);
    return { success: true, readAt: new Date().toISOString() };
  });

// Deprecated alias for backwards compatibility
export const sendBroadcastAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { target: "all" | "students" | "companies"; title: string; body: string }) => d)
  .handler(async ({ data, context }) => {
    const mapTarget: Record<string, AnnouncementTarget> = {
      all: "Everyone",
      students: "Students Only",
      companies: "Companies Only",
    };
    return createAnnouncement({
      data: {
        title: data.title,
        content: data.body,
        target_audience: mapTarget[data.target] || "Everyone",
        priority: "High",
        category: "System Notice",
        status: "Published",
      },
    });
  });

export const getActiveAnnouncements = createServerFn({ method: "GET" })
  .handler(async () => {
    const list = memoryAnnouncementsList.filter((a) => a.status === "Published");
    return list.map((a) => ({
      id: a.id,
      target: (a.target_audience === "Students Only" ? "students" : a.target_audience === "Companies Only" ? "companies" : "all") as any,
      title: a.title,
      body: a.content,
      created_at: a.created_at,
      is_active: true,
    }));
  });
