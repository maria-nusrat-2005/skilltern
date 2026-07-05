import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bookmark } from "lucide-react";
import { listBookmarks, toggleBookmark } from "@/lib/bookmarks.functions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BookmarkButton({
  internshipId,
  variant = "icon",
  className,
}: {
  internshipId: string;
  variant?: "icon" | "full";
  className?: string;
}) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["bookmarks"], queryFn: () => listBookmarks() });
  const bookmarked = (q.data?.ids ?? []).includes(internshipId);

  const m = useMutation({
    mutationFn: () => toggleBookmark({ data: { internshipId } }),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ["bookmarks"] });
      toast.success(d.bookmarked ? "Saved to shortlist." : "Removed from shortlist.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    m.mutate();
  };

  if (variant === "full") {
    return (
      <Button
        type="button"
        variant={bookmarked ? "default" : "outline"}
        className={cn("w-full gap-2", className)}
        disabled={m.isPending}
        onClick={onClick}
      >
        <Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} />
        {bookmarked ? "Shortlisted" : "Add to shortlist"}
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={m.isPending}
      aria-label={bookmarked ? "Remove from shortlist" : "Add to shortlist"}
      className={cn(
        "grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition-colors",
        bookmarked
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      <Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} />
    </button>
  );
}
