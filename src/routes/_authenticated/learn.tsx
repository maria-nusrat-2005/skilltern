import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  GraduationCap,
  Sparkles,
  ExternalLink,
  Clock,
  Lightbulb,
  Loader2,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import { generateLearningRoadmap, getSavedRoadmap, type RoadmapStep } from "@/lib/learning.functions";
import { getCareerOverview } from "@/lib/career.functions";
import { CURATED_RESOURCES } from "@/lib/curated-resources";
import { PageHeader } from "@/components/dashboard-bits";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/learn")({
  head: () => ({ meta: [{ title: "Learning Roadmap — Skilltern" }] }),
  component: LearnPage,
});

function asArr(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : [];
}

const STEPS = [
  "Reading your skill gaps",
  "Sequencing your roadmap",
  "Finding free resources",
  "Adding project ideas",
];

function LearnPage() {
  const qc = useQueryClient();
  const overviewQ = useQuery({ queryKey: ["career"], queryFn: () => getCareerOverview() });
  const savedRoadmapQ = useQuery({
    queryKey: ["saved-roadmap"],
    queryFn: () => getSavedRoadmap(),
  });
  const [step, setStep] = useState(0);

  const missing = asArr(overviewQ.data?.career?.missing_skills);
  const domain = overviewQ.data?.career?.career_domain ?? null;
  const hasCareer = !!overviewQ.data?.career?.career_domain;
  const useProjectsMode = missing.length === 0 && domain;

  const gen = useMutation({
    mutationFn: () =>
      generateLearningRoadmap({
        data: {
          domain: domain ?? undefined,
          mode: useProjectsMode ? "projects" : "skills",
        },
      }),
    onMutate: () => {
      setStep(0);
      const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1400);
      return { id };
    },
    onSuccess: (d, _v, ctx) => {
      clearInterval((ctx as { id: ReturnType<typeof setInterval> }).id);
      qc.invalidateQueries({ queryKey: ["saved-roadmap"] });
      toast.success("Your learning roadmap is ready!");
    },
    onError: (e, _v, ctx) => {
      if (ctx) clearInterval((ctx as { id: ReturnType<typeof setInterval> }).id);
      toast.error(e instanceof Error ? e.message : "Couldn't build roadmap");
    },
  });

  const roadmap = savedRoadmapQ.data?.roadmap ?? [];

  if (overviewQ.isLoading || savedRoadmapQ.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Learning Roadmap"
          description="Turn your skill gaps into a sequenced plan with free resources."
        />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const progressPct = Math.round(((step + 1) / STEPS.length) * 100);

  const curated = (() => {
    if (!domain) return CURATED_RESOURCES.slice(0, 3);
    const d = domain.toLowerCase();
    const exact = CURATED_RESOURCES.find((g) => g.domain.toLowerCase() === d);
    if (exact) return [exact];
    const partial = CURATED_RESOURCES.filter(
      (g) => d.includes(g.domain.toLowerCase()) || g.domain.toLowerCase().includes(d),
    );
    return partial.length ? partial : CURATED_RESOURCES.slice(0, 3);
  })();

  return (
    <div>
      <PageHeader
        title="Learning Roadmap"
        description="Turn your skill gaps into a sequenced plan with free resources."
        action={
          <Button
            onClick={() => gen.mutate()}
            disabled={gen.isPending || !hasCareer}
            className="gap-2"
          >
            {gen.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {gen.isPending
              ? "Building…"
              : roadmap.length
                ? "Regenerate"
                : useProjectsMode
                  ? "Build from recommended projects"
                  : "Build my roadmap"}
          </Button>
        }
      />


      {missing.length > 0 && (
        <Card className="mb-6 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Skill gaps detected{domain ? ` · ${domain}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {missing.map((s) => (
              <Badge key={s} variant="outline" className="font-normal">
                {s}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {gen.isPending && (
        <Card className="mb-6 p-6">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Loader2 className="h-4 w-4 animate-spin text-primary" /> Building your roadmap…
            </p>
            <span className="text-sm font-semibold text-primary">{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="mt-3 h-2" />
          <ul className="mt-4 space-y-2">
            {STEPS.map((label, i) => (
              <li key={label} className="flex items-center gap-2 text-sm">
                {i < step ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : i === step ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <span className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                )}
                <span className={i <= step ? "" : "text-muted-foreground"}>{label}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {roadmap.length === 0 && !gen.isPending ? (
        <Card className="flex flex-col items-center p-12 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <GraduationCap className="h-6 w-6" />
          </span>
          <h2 className="mt-4 font-display text-lg font-semibold">No roadmap yet</h2>
          {!hasCareer ? (
            <>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Analyze your resume first so we know which skills to plan around.
              </p>
              <Button asChild variant="outline" className="mt-5">
                <Link to="/resume">Analyze resume</Link>
              </Button>
            </>
          ) : useProjectsMode ? (
            <>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Your resume didn't surface skill gaps, so we'll build a roadmap from the projects
                our AI recommended for {domain}.
              </p>
              <Button onClick={() => gen.mutate()} disabled={gen.isPending} className="mt-5 gap-2">
                <Sparkles className="h-4 w-4" />
                Build from recommended projects
              </Button>
            </>
          ) : (
            <>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Generate a personalized, step-by-step plan to close your skill gaps.
              </p>
              <Button onClick={() => gen.mutate()} disabled={gen.isPending} className="mt-5 gap-2">
                <Sparkles className="h-4 w-4" />
                Build my roadmap
              </Button>
            </>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {roadmap.map((r, i) => (
            <Card key={i} className="p-6">
              <div className="flex items-start gap-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 font-display text-sm font-bold text-primary">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-lg font-semibold">{r.skill}</h3>
                    {r.estimated_time && (
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" /> {r.estimated_time}
                      </Badge>
                    )}
                  </div>
                  {r.why && <p className="mt-1 text-sm text-muted-foreground">{r.why}</p>}

                  {asArr(r.steps).length > 0 && (
                    <ol className="mt-4 space-y-1.5">
                      {r.steps.map((s, j) => (
                        <li key={j} className="flex gap-2 text-sm">
                          <span className="font-semibold text-primary">{j + 1}.</span>
                          {s}
                        </li>
                      ))}
                    </ol>
                  )}

                  {(r.resources ?? []).length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {r.resources.map((res, j) => (
                        <a
                          key={j}
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/40 hover:text-primary"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {res.title}
                          <span className="text-muted-foreground">· {res.type}</span>
                        </a>
                      ))}
                    </div>
                  )}

                  {r.project_idea && (
                    <div className="mt-4 flex items-start gap-2 rounded-lg bg-sidebar/60 p-3 text-sm">
                      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span>
                        <span className="font-medium">Project: </span>
                        {r.project_idea}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-10">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold">Recommended materials</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Hand-picked, mostly free resources{domain ? ` for ${domain}` : ""}.
        </p>
        <div className="mt-4 space-y-6">
          {curated.map((group) => (
            <div key={group.domain}>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {group.domain}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.resources.map((res) => (
                  <a
                    key={res.url}
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/40"
                  >
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <BookOpen className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium group-hover:text-primary">
                        {res.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{res.provider}</p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px]">
                          {res.type}
                        </Badge>
                        {res.free && (
                          <Badge
                            variant="outline"
                            className="border-primary/40 text-[10px] text-primary"
                          >
                            Free
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
