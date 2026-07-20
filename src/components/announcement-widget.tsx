import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Megaphone,
  Pin,
  Clock,
  Eye,
  CheckCircle2,
  Paperclip,
  Download,
  Calendar,
  User,
  Sparkles,
  ExternalLink,
  Tag,
  AlertCircle,
} from "lucide-react";
import {
  getAnnouncementsPublic,
  markAnnouncementRead,
  type FullAnnouncement,
  type AnnouncementPriority,
} from "@/lib/announcements.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export function AnnouncementWidget({ userRole = "student" }: { userRole?: "student" | "company" | "admin" }) {
  const qc = useQueryClient();
  const [selectedAnn, setSelectedAnn] = useState<FullAnnouncement | null>(null);

  const announcementsQ = useQuery({
    queryKey: ["public-announcements", userRole],
    queryFn: () => getAnnouncementsPublic(),
    refetchInterval: 15000,
  });

  const markReadMutation = useMutation({
    mutationFn: (announcementId: string) => markAnnouncementRead({ data: { announcementId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["public-announcements"] });
    },
  });

  const handleOpenDetail = (ann: FullAnnouncement) => {
    setSelectedAnn(ann);
    if (!ann.is_read) {
      markReadMutation.mutate(ann.id);
    }
  };

  const list = announcementsQ.data ?? [];
  if (announcementsQ.isLoading) {
    return null;
  }

  if (list.length === 0) return null;

  const getPriorityBadge = (priority: AnnouncementPriority) => {
    switch (priority) {
      case "High":
        return <Badge className="bg-rose-500 text-white gap-1 text-[10px]"><AlertCircle className="h-3 w-3" /> High Priority</Badge>;
      case "Medium":
        return <Badge className="bg-amber-500 text-white gap-1 text-[10px]">Medium Priority</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">Low Priority</Badge>;
    }
  };

  return (
    <>
      <Card className="p-5 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Megaphone className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base flex items-center gap-2">
                Platform Announcements
                {list.some((a) => !a.is_read) && (
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </h3>
              <p className="text-xs text-muted-foreground">Official news, events, and platform updates from Admin</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {list.length} {list.length === 1 ? "Notice" : "Notices"}
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.slice(0, 3).map((ann) => (
            <div
              key={ann.id}
              onClick={() => handleOpenDetail(ann)}
              className="group relative cursor-pointer rounded-xl border border-border p-4 transition-all hover:border-primary/50 hover:shadow-md bg-card flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {ann.is_pinned && (
                      <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] gap-1 px-1.5 py-0">
                        <Pin className="h-3 w-3 fill-amber-500" /> Pinned
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-[10px] px-2">
                      {ann.category}
                    </Badge>
                  </div>
                  {!ann.is_read && (
                    <span className="h-2 w-2 rounded-full bg-rose-500" title="Unread Notice" />
                  )}
                </div>

                <h4 className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {ann.title}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2 font-normal">
                  {ann.content}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(ann.created_at).toLocaleDateString()}
                </span>
                <span className="text-primary font-semibold group-hover:underline flex items-center gap-1">
                  Read More <Eye className="h-3 w-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Detail Dialog Modal */}
      <Dialog open={!!selectedAnn} onOpenChange={(open) => !open && setSelectedAnn(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedAnn && (
            <div className="space-y-5 py-2">
              {/* Banner Image */}
              {selectedAnn.banner_image && (
                <div className="overflow-hidden rounded-xl h-48 w-full border border-border relative">
                  <img
                    src={selectedAnn.banner_image}
                    alt={selectedAnn.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    {getPriorityBadge(selectedAnn.priority)}
                  </div>
                </div>
              )}

              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {selectedAnn.is_pinned && (
                    <Badge className="bg-amber-500 text-white gap-1 text-[10px]">
                      <Pin className="h-3 w-3 fill-white" /> Pinned Announcement
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px]">
                    <Tag className="h-3 w-3 mr-1" /> {selectedAnn.category}
                  </Badge>
                  {!selectedAnn.banner_image && getPriorityBadge(selectedAnn.priority)}
                </div>

                <DialogTitle className="text-xl font-bold font-display leading-tight">
                  {selectedAnn.title}
                </DialogTitle>

                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-b border-border pb-3">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-primary" /> {selectedAnn.created_by || "System Admin"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-primary" /> {new Date(selectedAnn.created_at).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Read
                  </span>
                </div>
              </DialogHeader>

              {/* Rich Body Content */}
              <div className="text-sm leading-relaxed text-foreground whitespace-pre-line space-y-3">
                {selectedAnn.content}
              </div>

              {/* Attachments Section */}
              {selectedAnn.attachments && selectedAnn.attachments.length > 0 && (
                <div className="p-4 bg-muted/40 rounded-xl border border-border space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5 text-primary" /> Downloads & Attachments ({selectedAnn.attachments.length})
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {selectedAnn.attachments.map((att, idx) => (
                      <a
                        key={idx}
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card hover:border-primary/40 transition-colors text-xs"
                      >
                        <span className="truncate font-semibold flex items-center gap-2">
                          <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {att.name}
                        </span>
                        <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0">
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedAnn(null)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
