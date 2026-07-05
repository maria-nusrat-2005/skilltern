import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Briefcase,
  MapPin,
  Trash2,
  CalendarClock,
  CalendarDays,
  AlertTriangle,
  LayoutGrid,
  Rows3,
} from "lucide-react";
import {
  listApplications,
  updateApplicationStatus,
  updateApplicationDetails,
  deleteApplication,
} from "@/lib/applications.functions";
import { PageHeader } from "@/components/dashboard-bits";
import { CompanyLogo } from "@/components/company-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/applications")({
  head: () => ({ meta: [{ title: "Applications — Skilltern" }] }),
  component: ApplicationsPage,
});

const STATUSES = ["saved", "applied", "interviewing", "offer", "rejected"] as const;
type Status = (typeof STATUSES)[number];
const STATUS_LABEL: Record<Status, string> = {
  saved: "Saved",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
};
const STATUS_ACCENT: Record<Status, string> = {
  saved: "border-t-muted-foreground/40",
  applied: "border-t-primary",
  interviewing: "border-t-accent",
  offer: "border-t-emerald-500",
  rejected: "border-t-destructive/60",
};

type AppRow = {
  id: string;
  status: string;
  internship_id: string;
  deadline?: string | null;
  interview_at?: string | null;
  internship?: {
    title?: string;
    company?: string;
    company_domain?: string | null;
    location?: string | null;
  } | null;
};

function dueMeta(dateStr?: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const days = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
  const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  let tone = "text-muted-foreground";
  if (days < 0) tone = "text-destructive";
  else if (days <= 3) tone = "text-accent-foreground";
  return { label, days, tone };
}

function ApplicationsPage() {
  const qc = useQueryClient();
  const [view, setView] = useState<"board" | "list">("board");
  const [dragId, setDragId] = useState<string | null>(null);
  const q = useQuery({ queryKey: ["applications"], queryFn: () => listApplications() });

  const statusM = useMutation({
    mutationFn: (v: { id: string; status: string }) => updateApplicationStatus({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applications"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to update"),
  });

  const detailsM = useMutation({
    mutationFn: (v: { id: string; deadline?: string | null; interview_at?: string | null }) =>
      updateApplicationDetails({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Saved.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to update"),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteApplication({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Removed.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to remove"),
  });

  const apps = (q.data?.applications ?? []) as AppRow[];

  const setDate = (id: string, field: "deadline" | "interview_at", current?: string | null) => {
    const input = window.prompt(
      field === "deadline" ? "Application deadline (YYYY-MM-DD):" : "Interview date (YYYY-MM-DD):",
      current ? current.slice(0, 10) : "",
    );
    if (input === null) return;
    detailsM.mutate({ id, [field]: input.trim() || null });
  };

  const onDrop = (status: Status) => {
    if (dragId) {
      const app = apps.find((a) => a.id === dragId);
      if (app && app.status !== status) statusM.mutate({ id: dragId, status });
    }
    setDragId(null);
  };

  const upcoming = apps
    .map((a) => ({ a, d: dueMeta(a.deadline) }))
    .filter((x) => x.d && x.d.days >= 0 && x.d.days <= 7)
    .sort((x, y) => (x.d!.days ?? 0) - (y.d!.days ?? 0));

  const Empty = (
    <Card className="flex flex-col items-center p-12 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Briefcase className="h-6 w-6" />
      </span>
      <h2 className="mt-4 font-display text-lg font-semibold">No applications yet</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Save internships you're interested in to track them here.
      </p>
      <Button asChild className="mt-5">
        <Link to="/internships">Browse internships</Link>
      </Button>
    </Card>
  );

  return (
    <div>
      <PageHeader
        title="Applications"
        description="Track every internship across your pipeline."
        action={
          <div className="flex rounded-lg border border-border p-0.5">
            <button
              type="button"
              onClick={() => setView("board")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm",
                view === "board" ? "bg-secondary font-medium" : "text-muted-foreground",
              )}
            >
              <LayoutGrid className="h-4 w-4" /> Board
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm",
                view === "list" ? "bg-secondary font-medium" : "text-muted-foreground",
              )}
            >
              <Rows3 className="h-4 w-4" /> List
            </button>
          </div>
        }
      />

      {q.isLoading ? (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {STATUSES.map((s) => (
            <Skeleton key={s} className="h-64 w-full" />
          ))}
        </div>
      ) : apps.length === 0 ? (
        Empty
      ) : (
        <>
          {upcoming.length > 0 && (
            <Card className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-accent/40 bg-accent/10 p-4">
              <span className="flex items-center gap-2 text-sm font-medium">
                <CalendarClock className="h-4 w-4 text-accent-foreground" />
                Upcoming deadlines
              </span>
              {upcoming.map(({ a, d }) => (
                <span key={a.id} className="text-sm text-muted-foreground">
                  {a.internship?.company ?? "Role"} ·{" "}
                  <span className="font-medium text-foreground">
                    {d!.days === 0 ? "today" : `${d!.days}d`}
                  </span>
                </span>
              ))}
            </Card>
          )}

          {view === "board" ? (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
              {STATUSES.map((status) => {
                const col = apps.filter((a) => a.status === status);
                return (
                  <div
                    key={status}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDrop(status)}
                    className="flex min-h-32 flex-col rounded-xl bg-sidebar/40 p-2"
                  >
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <span className="text-sm font-semibold">{STATUS_LABEL[status]}</span>
                      <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                        {col.length}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-2">
                      {col.map((a) => (
                        <KanbanCard
                          key={a.id}
                          a={a}
                          status={status}
                          onDragStart={() => setDragId(a.id)}
                          onSetDate={setDate}
                          onDelete={() => deleteM.mutate(a.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {apps.map((a) => (
                <KanbanCard
                  key={a.id}
                  a={a}
                  status={a.status as Status}
                  list
                  onDragStart={() => setDragId(a.id)}
                  onSetDate={setDate}
                  onDelete={() => deleteM.mutate(a.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function KanbanCard({
  a,
  status,
  list,
  onDragStart,
  onSetDate,
  onDelete,
}: {
  a: AppRow;
  status: Status;
  list?: boolean;
  onDragStart: () => void;
  onSetDate: (id: string, field: "deadline" | "interview_at", current?: string | null) => void;
  onDelete: () => void;
}) {
  const deadline = dueMeta(a.deadline);
  const interview = dueMeta(a.interview_at);
  return (
    <Card
      draggable
      onDragStart={onDragStart}
      className={cn(
        "cursor-grab gap-0 border-t-2 p-3 active:cursor-grabbing",
        STATUS_ACCENT[status],
        list && "flex flex-row items-center justify-between",
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <CompanyLogo domain={a.internship?.company_domain} name={a.internship?.company} size={36} />
        <div className="min-w-0">
          {a.internship ? (
            <Link
              to="/internships/$id"
              params={{ id: a.internship_id }}
              className="block truncate font-display text-sm font-semibold hover:text-primary"
            >
              {a.internship.title}
            </Link>
          ) : (
            <span className="font-display text-sm font-semibold">Internship</span>
          )}
          <p className="truncate text-xs text-muted-foreground">{a.internship?.company}</p>
          {!list && a.internship?.location && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {a.internship.location}
            </p>
          )}
        </div>
      </div>

      <div className={cn("flex flex-wrap items-center gap-1.5", list ? "" : "mt-3")}>
        <button
          type="button"
          onClick={() => onSetDate(a.id, "deadline", a.deadline)}
          className={cn(
            "flex items-center gap-1 rounded-md border border-border px-1.5 py-1 text-xs transition-colors hover:border-primary/40",
            deadline?.tone,
          )}
        >
          {deadline && deadline.days < 0 ? (
            <AlertTriangle className="h-3 w-3" />
          ) : (
            <CalendarDays className="h-3 w-3" />
          )}
          {deadline ? deadline.label : "Deadline"}
        </button>
        {(status === "interviewing" || a.interview_at) && (
          <button
            type="button"
            onClick={() => onSetDate(a.id, "interview_at", a.interview_at)}
            className={cn(
              "flex items-center gap-1 rounded-md border border-border px-1.5 py-1 text-xs transition-colors hover:border-primary/40",
              interview?.tone,
            )}
          >
            <CalendarClock className="h-3 w-3" />
            {interview ? interview.label : "Interview"}
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          aria-label="Remove"
          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </Card>
  );
}
