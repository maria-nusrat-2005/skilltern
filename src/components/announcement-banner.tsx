import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Megaphone, X, ChevronRight } from "lucide-react";
import { getActiveAnnouncements, type AnnouncementItem } from "@/lib/announcements.functions";
import { useAuth } from "@/hooks/use-auth";
import { getProfileData } from "@/lib/profile.functions";
import { Button } from "@/components/ui/button";

export function AnnouncementBanner() {
  const { user } = useAuth();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const profileQ = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfileData(),
    enabled: !!user?.id,
  });

  const role = profileQ.data?.profile?.role ?? "student";

  const announcementsQ = useQuery({
    queryKey: ["active-announcements"],
    queryFn: () => getActiveAnnouncements(),
    refetchInterval: 10000, // Live poll every 10 seconds for new admin broadcasts
  });

  const announcements = announcementsQ.data ?? [];

  // Filter announcements for current user's role
  const activeForUser = announcements.filter((item) => {
    if (dismissedIds.includes(item.id)) return false;
    if (item.target === "all") return true;
    if (item.target === "students" && role === "student") return true;
    if (item.target === "companies" && role === "company") return true;
    if (role === "admin") return true;
    return false;
  });

  if (activeForUser.length === 0) return null;

  const current = activeForUser[0];

  return (
    <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-primary text-white shadow-sm border-b border-white/10 transition-all">
      <div className="mx-auto max-w-6xl px-4 py-2.5 sm:px-6 lg:px-10 flex items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="p-1.5 bg-white/15 rounded-lg shrink-0">
            <Megaphone className="h-4 w-4 text-amber-300 animate-pulse" />
          </span>
          <div className="min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-bold tracking-tight text-amber-200 shrink-0">
              {current.title}
            </span>
            <span className="opacity-90 truncate font-medium text-xs sm:text-sm">
              {current.body}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/15 rounded-md"
            onClick={() => setDismissedIds((prev) => [...prev, current.id])}
            aria-label="Dismiss announcement"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
