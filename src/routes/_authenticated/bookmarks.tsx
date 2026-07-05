import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { listBookmarks } from "@/lib/bookmarks.functions";
import { PageHeader } from "@/components/dashboard-bits";
import { InternshipCard, type InternshipListItem } from "@/components/internship-card";
import { BookmarkButton } from "@/components/bookmark-button";
import { CompareToggle } from "@/components/compare-bits";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/bookmarks")({
  head: () => ({ meta: [{ title: "Shortlist — Skilltern" }] }),
  component: BookmarksPage,
});

function BookmarksPage() {
  const q = useQuery({ queryKey: ["bookmarks"], queryFn: () => listBookmarks() });
  const bookmarks = q.data?.bookmarks ?? [];

  return (
    <div>
      <PageHeader title="Shortlist" description="Internships you've saved to review and apply to later." />

      {q.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : bookmarks.length === 0 ? (
        <Card className="flex flex-col items-center p-12 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Bookmark className="h-6 w-6" />
          </span>
          <h2 className="mt-4 font-display text-lg font-semibold">No shortlisted internships</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Tap the bookmark icon on any internship to add it here.
          </p>
          <Button asChild className="mt-5">
            <Link to="/internships">Browse internships</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((b) => (
            <div key={b.id} className="relative">
              <div className="absolute bottom-3 right-3 z-10 flex gap-1.5">
                <CompareToggle id={b.internship_id} />
                <BookmarkButton internshipId={b.internship_id} />
              </div>
              <InternshipCard item={b.internship as InternshipListItem} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
