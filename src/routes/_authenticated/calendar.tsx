import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, CalendarClock, AlarmClock, Briefcase } from "lucide-react";
import { listApplications } from "@/lib/applications.functions";
import { PageHeader } from "@/components/dashboard-bits";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({ meta: [{ title: "Calendar — Skilltern" }] }),
  component: CalendarPage,
});

type Ev = {
  date: string; // yyyy-mm-dd
  kind: "deadline" | "interview";
  title: string;
  company: string | null;
  appId: string;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function CalendarPage() {
  const appsQ = useQuery({ queryKey: ["applications"], queryFn: () => listApplications() });
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  const events = useMemo<Ev[]>(() => {
    const out: Ev[] = [];
    for (const a of appsQ.data?.applications ?? []) {
      const title = a.internship?.title ?? "Internship";
      const company = a.internship?.company ?? null;
      if (a.deadline) out.push({ date: a.deadline.slice(0, 10), kind: "deadline", title, company, appId: a.id });
      if (a.interview_at) out.push({ date: a.interview_at.slice(0, 10), kind: "interview", title, company, appId: a.id });
    }
    return out;
  }, [appsQ.data]);

  const byDay = useMemo(() => {
    const m = new Map<string, Ev[]>();
    for (const e of events) {
      const arr = m.get(e.date) ?? [];
      arr.push(e);
      m.set(e.date, arr);
    }
    return m;
  }, [events]);

  const todayKey = dayKey(new Date());
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const upcoming = useMemo(
    () =>
      [...events]
        .filter((e) => e.date >= todayKey)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 8),
    [events, todayKey],
  );

  return (
    <div>
      <PageHeader
        title="Deadline Calendar"
        description="Application deadlines and interviews at a glance."
        action={
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link to="/applications">
              <Briefcase className="h-4 w-4" /> Applications
            </Link>
          </Button>
        }
      />

      {appsQ.isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">
                {MONTHS[month]} {year}
              </h2>
              <div className="flex gap-1">
                <Button size="icon" variant="outline" onClick={() => setCursor(new Date(year, month - 1, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { const n = new Date(); setCursor(new Date(n.getFullYear(), n.getMonth(), 1)); }}>
                  Today
                </Button>
                <Button size="icon" variant="outline" onClick={() => setCursor(new Date(year, month + 1, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
              {DOW.map((d) => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                if (!d) return <div key={i} className="min-h-16 rounded-lg" />;
                const k = dayKey(d);
                const evs = byDay.get(k) ?? [];
                const isToday = k === todayKey;
                return (
                  <div
                    key={i}
                    className={cn(
                      "min-h-16 rounded-lg border p-1.5 text-left",
                      isToday ? "border-primary bg-primary/5" : "border-border",
                    )}
                  >
                    <span className={cn("text-xs", isToday ? "font-bold text-primary" : "text-muted-foreground")}>
                      {d.getDate()}
                    </span>
                    <div className="mt-1 space-y-1">
                      {evs.slice(0, 2).map((e, j) => (
                        <Link
                          key={j}
                          to="/internships/$id"
                          params={{ id: e.appId }}
                          className={cn(
                            "block truncate rounded px-1 py-0.5 text-[10px] font-medium",
                            e.kind === "deadline"
                              ? "bg-destructive/15 text-destructive"
                              : "bg-primary/15 text-primary",
                          )}
                          title={`${e.kind === "deadline" ? "Deadline" : "Interview"}: ${e.title}`}
                        >
                          {e.company ?? e.title}
                        </Link>
                      ))}
                      {evs.length > 2 && (
                        <span className="px-1 text-[10px] text-muted-foreground">+{evs.length - 2} more</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-destructive/40" /> Deadline
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-primary/40" /> Interview
              </span>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-lg font-semibold">Upcoming</h2>
            {upcoming.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No upcoming deadlines or interviews. Add dates from your{" "}
                <Link to="/applications" className="font-medium text-primary hover:underline">
                  applications
                </Link>
                .
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {upcoming.map((e, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-3">
                    <span
                      className={cn(
                        "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                        e.kind === "deadline" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
                      )}
                    >
                      {e.kind === "deadline" ? <AlarmClock className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{e.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{e.company}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
