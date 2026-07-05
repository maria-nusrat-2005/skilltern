import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Wallet, Users, TrendingUp, Info } from "lucide-react";
import { getStipendInsights, getPeerBenchmark } from "@/lib/insights.functions";
import { PageHeader, StatCard } from "@/components/dashboard-bits";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/insights")({
  head: () => ({ meta: [{ title: "Insights — Skilltern" }] }),
  component: InsightsPage,
});

function bdt(n: number) {
  return n > 0 ? `৳${n.toLocaleString("en-US")}` : "—";
}

function InsightsPage() {
  const stipendQ = useQuery({
    queryKey: ["stipend-insights"],
    queryFn: () => getStipendInsights(),
  });
  const peerQ = useQuery({ queryKey: ["peer-benchmark"], queryFn: () => getPeerBenchmark() });

  const domains = stipendQ.data?.domains ?? [];
  const maxMedian = Math.max(1, ...domains.map((d) => d.median));
  const peer = peerQ.data;

  return (
    <div>
      <PageHeader
        title="Insights"
        description="Stipend benchmarks across domains and how you compare to peers."
      />

      {/* Peer benchmark */}
      <Card className="mb-8 p-6">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold">How you compare</h2>
        </div>

        {peerQ.isLoading ? (
          <Skeleton className="mt-4 h-40 w-full" />
        ) : !peer?.hasData ? (
          <div className="mt-4 rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Analyze your resume to unlock peer comparison.
            </p>
            <Button asChild className="mt-4">
              <Link to="/resume">Analyze resume</Link>
            </Button>
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              Compared with {peer.peerCount} anonymized students in{" "}
              <span className="font-medium text-foreground">{peer.domain}</span>.
            </p>

            <div className="mt-5 rounded-xl bg-sidebar/60 p-5 text-center">
              {peer.hasReadiness ? (
                <>
                  <p className="font-display text-4xl font-bold text-primary">
                    {peer.percentile}th
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    percentile on internship readiness — you're ahead of {peer.percentile}% of
                    peers.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-display text-2xl font-bold text-primary">
                    No readiness score yet
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your CV is in <span className="font-medium text-foreground">{peer.domain}</span>
                    , but we couldn't compute a readiness score for it.
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-3">
                    <Link to="/resume">Re-analyze resume</Link>
                  </Button>
                </>
              )}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <CompareStat
                label="Readiness"
                you={peer.you.readiness}
                peer={peer.peers.avgReadiness}
                suffix="%"
              />
              <CompareStat
                label="ATS score"
                you={peer.you.ats}
                peer={peer.peers.avgAts}
                suffix="%"
              />
              <CompareStat
                label="Project quality"
                you={peer.you.projectQuality}
                peer={peer.peers.avgProjectQuality}
                suffix="%"
              />
            </div>

            <div className="mt-6">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Readiness distribution
              </p>
              <div className="flex items-end gap-2">
                {peer.distribution.map((b) => {
                  const max = Math.max(1, ...peer.distribution.map((x) => x.count));
                  return (
                    <div key={b.label} className="flex flex-1 flex-col items-center gap-1">
                      <div className="flex h-28 w-full items-end">
                        <div
                          className={`w-full rounded-t-md ${b.youHere ? "bg-primary" : "bg-muted"}`}
                          style={{ height: `${(b.count / max) * 100}%` }}
                          title={`${b.count} peers`}
                        />
                      </div>
                      <span
                        className={`text-[10px] ${b.youHere ? "font-bold text-primary" : "text-muted-foreground"}`}
                      >
                        {b.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Info className="h-3 w-3" /> The highlighted bar is where you sit.
              </p>
            </div>
          </>
        )}
      </Card>

      {/* Stipend insights */}
      <div className="flex items-center gap-2">
        <Wallet className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-semibold">Stipend benchmarks</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Monthly stipend ranges (BDT) from {stipendQ.data?.overall.paidCount ?? 0} paid roles.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Market median"
          value={bdt(stipendQ.data?.overall.median ?? 0)}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard label="Lowest paid" value={bdt(stipendQ.data?.overall.min ?? 0)} />
        <StatCard label="Highest paid" value={bdt(stipendQ.data?.overall.max ?? 0)} />
      </div>

      {stipendQ.isLoading ? (
        <Skeleton className="mt-6 h-64 w-full" />
      ) : (
        <Card className="mt-6 divide-y divide-border p-0">
          {domains.map((d) => (
            <div key={d.domain} className="flex items-center gap-4 p-4">
              <div className="w-40 shrink-0">
                <p className="text-sm font-medium">{d.domain}</p>
                <p className="text-xs text-muted-foreground">
                  {d.paidCount} paid
                  {d.unpaidCount > 0 && <span> · {d.unpaidCount} unpaid</span>}
                </p>
              </div>
              <div className="flex-1">
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(d.median / maxMedian) * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {bdt(d.min)} – {bdt(d.max)}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                med {bdt(d.median)}
              </Badge>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function CompareStat({
  label,
  you,
  peer,
  suffix = "",
}: {
  label: string;
  you: number;
  peer: number;
  suffix?: string;
}) {
  const delta = you - peer;
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-display text-2xl font-bold">
          {you}
          {suffix}
        </span>
        <span className={`text-xs font-medium ${delta >= 0 ? "text-primary" : "text-destructive"}`}>
          {delta >= 0 ? "+" : ""}
          {delta} vs peers
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Peer avg {peer}
        {suffix}
      </p>
    </div>
  );
}
