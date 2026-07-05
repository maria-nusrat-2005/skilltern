import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles, RefreshCw, ArrowRight, BookOpen, Clock, Loader2, CheckCircle2 } from "lucide-react";
import { getMatches, generateMatches } from "@/lib/matching.functions";
import { PageHeader } from "@/components/dashboard-bits";
import { CompanyLogo } from "@/components/company-logo";
import { MatchRadar } from "@/components/match-radar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/matches")({
  head: () => ({ meta: [{ title: "My Matches — Skilltern" }] }),
  component: MatchesPage,
});

const MATCH_STEPS = [
  "Reading your profile & skills",
  "Scanning open internships",
  "Scoring technical & domain fit",
  "Identifying skill gaps",
  "Writing AI fit explanations",
];

function asArr(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : [];
}

function MatchesPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["matches"], queryFn: () => getMatches() });
  const [step, setStep] = useState(0);

  const gen = useMutation({
    mutationFn: () => generateMatches(),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ["matches"] });
      toast.success(`Generated ${d.count} matches!`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to generate matches"),
  });

  useEffect(() => {
    if (!gen.isPending) {
      setStep(0);
      return;
    }
    setStep(0);
    const id = setInterval(() => {
      setStep((s) => (s < MATCH_STEPS.length - 1 ? s + 1 : s));
    }, 1400);
    return () => clearInterval(id);
  }, [gen.isPending]);

  const matches = q.data?.matches ?? [];
  const progressPct = Math.round(((step + 1) / MATCH_STEPS.length) * 100);

  return (
    <div>
      <PageHeader
        title="My Matches"
        description="AI-ranked internships based on your skills and goals."
        action={
          <Button onClick={() => gen.mutate()} disabled={gen.isPending} className="gap-2">
            {gen.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {gen.isPending ? "Matching…" : "Generate matches"}
          </Button>
        }
      />

      {gen.isPending && (
        <Card className="mb-6 p-6">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Analyzing your fit…
            </p>
            <span className="text-sm font-semibold text-primary">{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="mt-3 h-2" />
          <ul className="mt-4 space-y-2">
            {MATCH_STEPS.map((label, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <li key={label} className="flex items-center gap-2 text-sm">
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : active ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <span className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                  )}
                  <span className={done || active ? "text-foreground" : "text-muted-foreground"}>
                    {label}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}


      {q.isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <Card className="flex flex-col items-center p-12 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </span>
          <h2 className="mt-4 font-display text-lg font-semibold">No matches yet</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Analyze your resume or set your preferences, then generate AI matches tailored to you.
          </p>
          <div className="mt-5 flex gap-2">
            <Button onClick={() => gen.mutate()} disabled={gen.isPending} className="gap-2">
              <Sparkles className="h-4 w-4" /> Generate matches
            </Button>
            <Button asChild variant="outline">
              <Link to="/resume">Analyze resume</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {matches.map((m) => {
            const learning = asArr(m.learning_path);
            const missing = asArr(m.missing_skills);
            return (
              <Card key={m.id} className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary/10 font-display text-lg font-bold text-primary">
                      {m.overall_score}
                    </div>
                    <div className="flex items-start gap-3">
                      <CompanyLogo
                        domain={m.internship?.company_domain}
                        name={m.internship?.company}
                        size={44}
                      />
                      <div>
                        <Link
                          to="/internships/$id"
                          params={{ id: m.internship_id }}
                          className="font-display text-lg font-semibold hover:text-primary"
                        >
                          {m.internship?.title ?? "Internship"}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {m.internship?.company} · {m.internship?.location}
                        </p>
                      </div>
                    </div>
                  </div>
                  {m.estimated_effort && (
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" /> {m.estimated_effort}
                    </Badge>
                  )}
                </div>

                {m.explanation && <p className="mt-4 text-sm text-muted-foreground">{m.explanation}</p>}

                <div className="mt-5 grid items-center gap-4 sm:grid-cols-[200px_1fr]">
                  <MatchRadar
                    scores={[
                      { label: "Technical", value: m.technical_score },
                      { label: "Projects", value: m.project_score },
                      { label: "Industry", value: m.industry_score },
                      { label: "Experience", value: m.experience_score },
                    ]}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ScoreLine label="Technical" value={m.technical_score} />
                    <ScoreLine label="Projects" value={m.project_score} />
                    <ScoreLine label="Industry" value={m.industry_score} />
                    <ScoreLine label="Experience" value={m.experience_score} />
                  </div>
                </div>

                {missing.length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Skills to build</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {missing.map((s) => (
                        <Badge key={s} variant="outline" className="font-normal">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {learning.length > 0 && (
                  <div className="mt-5 rounded-lg bg-sidebar/60 p-4">
                    <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <BookOpen className="h-3.5 w-3.5" /> Learning path
                    </p>
                    <ol className="mt-2 space-y-1.5">
                      {learning.map((step, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span className="font-semibold text-primary">{i + 1}.</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <Button asChild variant="ghost" size="sm" className="mt-4 gap-1">
                  <Link to="/internships/$id" params={{ id: m.internship_id }}>
                    View internship <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ScoreLine({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <Progress value={value} className="mt-1.5 h-1.5" />
    </div>
  );
}
