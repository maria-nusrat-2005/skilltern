import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GitCompareArrows, X, MapPin, Wallet, Clock } from "lucide-react";
import { compareInternships } from "@/lib/discovery.functions";
import { useCompare } from "@/hooks/use-compare";
import { PageHeader } from "@/components/dashboard-bits";
import { CompanyLogo } from "@/components/company-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/compare")({
  head: () => ({ meta: [{ title: "Compare — Skilltern" }] }),
  validateSearch: (s: Record<string, unknown>): { ids: string } => ({
    ids: typeof s.ids === "string" ? s.ids : "",
  }),
  component: ComparePage,
});

function asArr(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : [];
}

const ROWS: { label: string; render: (job: Record<string, unknown>) => React.ReactNode }[] = [
  { label: "Work model", render: (j) => (j.work_model as string) ?? "—" },
  {
    label: "Location",
    render: (j) => (
      <span className="flex items-center gap-1">
        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
        {(j.location as string) ?? "—"}
      </span>
    ),
  },
  {
    label: "Stipend",
    render: (j) => (
      <span className="flex items-center gap-1">
        <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
        {(j.salary as string) ?? "—"}
      </span>
    ),
  },
  {
    label: "Duration",
    render: (j) => (
      <span className="flex items-center gap-1">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        {(j.duration as string) ?? "—"}
      </span>
    ),
  },
  { label: "Domain", render: (j) => (j.domain as string) ?? "—" },
  { label: "Experience", render: (j) => (j.experience_level as string) ?? "—" },
  {
    label: "Tech stack",
    render: (j) => (
      <div className="flex flex-wrap gap-1">
        {asArr(j.tech_stack).slice(0, 8).map((t) => (
          <Badge key={t} variant="outline" className="font-normal">
            {t}
          </Badge>
        ))}
      </div>
    ),
  },
  {
    label: "Requirements",
    render: (j) => (
      <ul className="space-y-1 text-sm text-muted-foreground">
        {asArr(j.requirements).slice(0, 5).map((r, i) => (
          <li key={i}>• {r}</li>
        ))}
      </ul>
    ),
  },
];

function ComparePage() {
  const { ids } = Route.useSearch();
  const { remove } = useCompare();
  const idList = ids.split(",").filter(Boolean);

  const q = useQuery({
    queryKey: ["compare", ids],
    queryFn: () => compareInternships({ data: { ids: idList } }),
    enabled: idList.length > 0,
  });

  const items = (q.data?.items ?? []) as Record<string, unknown>[];

  return (
    <div>
      <PageHeader title="Compare internships" description="See requirements, stipend, and fit side by side." />

      {idList.length < 2 ? (
        <Card className="flex flex-col items-center p-12 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <GitCompareArrows className="h-6 w-6" />
          </span>
          <h2 className="mt-4 font-display text-lg font-semibold">Pick at least 2 internships</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Use the compare icon on internship cards to add up to 3, then come back here.
          </p>
          <Button asChild className="mt-5">
            <Link to="/internships">Browse internships</Link>
          </Button>
        </Card>
      ) : q.isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr>
                <th className="w-32 p-3" />
                {items.map((job) => (
                  <th key={job.id as string} className="p-3 text-left align-top">
                    <Card className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <CompanyLogo
                          domain={job.company_domain as string | null}
                          name={job.company as string}
                          size={40}
                        />
                        <button
                          type="button"
                          onClick={() => remove(job.id as string)}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="Remove"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <Link
                        to="/internships/$id"
                        params={{ id: job.id as string }}
                        className="mt-2 block font-display text-sm font-semibold hover:text-primary"
                      >
                        {job.title as string}
                      </Link>
                      <p className="text-xs text-muted-foreground">{job.company as string}</p>
                    </Card>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-t border-border">
                  <td className="p-3 align-top text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {row.label}
                  </td>
                  {items.map((job) => (
                    <td key={job.id as string} className="p-3 align-top text-sm">
                      {row.render(job)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
