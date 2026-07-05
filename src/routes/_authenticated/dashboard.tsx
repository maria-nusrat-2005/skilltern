import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Briefcase, FileText, Target, ArrowRight, Building2, Users } from "lucide-react";
import { getProfileData } from "@/lib/profile.functions";
import { getCareerOverview } from "@/lib/career.functions";
import { getMatches } from "@/lib/matching.functions";
import { listApplications } from "@/lib/applications.functions";
import { getPeerBenchmark } from "@/lib/insights.functions";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader, StatCard, ScoreRing } from "@/components/dashboard-bits";
import { CompanyLogo } from "@/components/company-logo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Skilltern" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => getProfileData() });
  const careerQ = useQuery({ queryKey: ["career"], queryFn: () => getCareerOverview() });
  const matchesQ = useQuery({ queryKey: ["matches"], queryFn: () => getMatches() });
  const appsQ = useQuery({ queryKey: ["applications"], queryFn: () => listApplications() });
  const peerQ = useQuery({ queryKey: ["peer-benchmark"], queryFn: () => getPeerBenchmark() });
  const peer = peerQ.data;

  const firstName =
    ((user?.user_metadata?.full_name as string | undefined) ?? profileQ.data?.profile?.full_name ?? "there")
      .split(" ")[0];
  const completion = profileQ.data?.profile?.profile_completion ?? 0;
  const readiness = careerQ.data?.career?.internship_readiness ?? null;
  const topMatches = matchesQ.data?.matches?.slice(0, 3) ?? [];
  const apps = appsQ.data?.applications ?? [];

  return (
    <div>
      <PageHeader title={`Welcome back, ${firstName}`} description="Here's your internship readiness at a glance." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Profile complete" value={`${completion}%`} icon={<Target className="h-4 w-4" />} />
        <StatCard
          label="Resume readiness"
          value={readiness !== null ? `${readiness}%` : "—"}
          icon={<FileText className="h-4 w-4" />}
          hint={readiness === null ? "Analyze your resume" : undefined}
        />
        <StatCard label="AI matches" value={matchesQ.data?.matches?.length ?? 0} icon={<Sparkles className="h-4 w-4" />} />
        <StatCard label="Applications" value={apps.length} icon={<Briefcase className="h-4 w-4" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Your top matches</h2>
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link to="/matches">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {matchesQ.isLoading ? (
            <div className="mt-4 space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : topMatches.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">No matches yet. Analyze your resume to generate AI matches.</p>
              <Button asChild className="mt-4">
                <Link to="/matches">Generate matches</Link>
              </Button>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {topMatches.map((m) => (
                <Link
                  key={m.id}
                  to="/internships/$id"
                  params={{ id: m.internship_id }}
                  className="flex items-center gap-4 rounded-lg border border-border p-3 transition-colors hover:border-primary/40"
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 font-display text-sm font-bold text-primary">
                    {m.overall_score}
                  </div>
                  <CompanyLogo domain={m.internship?.company_domain} name={m.internship?.company} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.internship?.title ?? "Internship"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.internship?.company} · {m.internship?.location}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="flex flex-col items-center p-6">
          <h2 className="self-start font-display text-lg font-semibold">Readiness</h2>
          <div className="mt-4">
            <ScoreRing value={readiness ?? careerQ.data?.score?.overall_score ?? 0} size={120} />
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {readiness !== null
              ? "Based on your latest resume analysis."
              : "Analyze your resume to see your readiness score."}
          </p>
          <Button asChild variant="outline" className="mt-4 w-full">
            <Link to="/resume">Analyze resume</Link>
          </Button>
        </Card>
      </div>

      {peer?.hasData && (
        <Card className="mt-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-semibold">How you compare</h2>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link to="/insights">
                Details <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            You're ahead of{" "}
            <span className="font-display font-bold text-primary">{peer.percentile}%</span> of{" "}
            {peer.peerCount} peers in {peer.domain}.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <CompareStat label="Readiness" you={peer.you.readiness} peers={peer.peers.avgReadiness} />
            <CompareStat label="ATS score" you={peer.you.ats} peers={peer.peers.avgAts} />
            <CompareStat label="Applications" you={peer.you.applications} peers={peer.peers.avgApplications} />
          </div>
        </Card>
      )}

      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Profile completion</h2>
          <Badge variant={completion >= 80 ? "default" : "secondary"}>{completion}%</Badge>
        </div>
        <Progress value={completion} className="mt-4" />
        <p className="mt-3 text-sm text-muted-foreground">
          A complete profile improves your matches.{" "}
          <Link to="/profile" className="font-medium text-primary hover:underline">
            Complete your profile →
          </Link>
        </p>
      </Card>

      <Card className="mt-6 flex flex-col items-start gap-4 bg-sidebar/50 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display font-semibold">Explore live internships</h3>
            <p className="text-sm text-muted-foreground">200+ roles from companies across Bangladesh.</p>
          </div>
        </div>
        <Button asChild>
          <Link to="/internships">Browse internships</Link>
        </Button>
      </Card>
    </div>
  );
}

function CompareStat({ label, you, peers }: { label: string; you: number; peers: number }) {
  const diff = you - peers;
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-display text-xl font-bold">{you}</span>
        <span className="text-xs text-muted-foreground">vs {peers} avg</span>
      </div>
      <p className={`mt-1 text-xs font-medium ${diff >= 0 ? "text-primary" : "text-destructive"}`}>
        {diff >= 0 ? `+${diff} ahead` : `${diff} behind`}
      </p>
    </div>
  );
}
