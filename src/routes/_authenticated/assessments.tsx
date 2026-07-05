import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Brain,
  Loader2,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  Sparkles,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import {
  generateQuiz,
  saveAssessment,
  listAssessments,
  listSkillNames,
  type QuizQuestion,
} from "@/lib/assessments.functions";
import { PageHeader } from "@/components/dashboard-bits";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/assessments")({
  head: () => ({ meta: [{ title: "Skill Assessments — Skilltern" }] }),
  component: AssessmentsPage,
});

type Phase = "idle" | "quiz" | "result";

function levelTone(score: number) {
  if (score >= 85) return "text-primary";
  if (score >= 60) return "text-accent";
  return "text-muted-foreground";
}

function AssessmentsPage() {
  const qc = useQueryClient();
  const histQ = useQuery({ queryKey: ["assessments"], queryFn: () => listAssessments() });

  const [skill, setSkill] = useState("");
  const [skillOpen, setSkillOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [activeSkill, setActiveSkill] = useState("");

  const skillsQ = useQuery({
    queryKey: ["skill-names"],
    queryFn: () => listSkillNames(),
    staleTime: 10 * 60 * 1000,
  });
  const allSkills = skillsQ.data?.skills ?? [];

  const genM = useMutation({
    mutationFn: (s: string) => generateQuiz({ data: { skill: s } }),
    onSuccess: (d) => {
      setQuestions(d.questions);
      setActiveSkill(d.skill);
      setAnswers([]);
      setCurrent(0);
      setPhase("quiz");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to build quiz"),
  });

  const saveM = useMutation({
    mutationFn: (v: { correct: number; details: { question: string; correct: boolean }[] }) =>
      saveAssessment({ data: { skill: activeSkill, correct: v.correct, total: questions.length, details: v.details } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assessments"] }),
  });

  const start = (s: string) => {
    if (!s.trim()) return;
    genM.mutate(s.trim());
  };

  const choose = (optionIdx: number) => {
    const next = [...answers];
    next[current] = optionIdx;
    setAnswers(next);
  };

  const correctCount = questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0),
    0,
  );
  const scorePct = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;

  const finish = () => {
    const details = questions.map((q, i) => ({ question: q.question, correct: answers[i] === q.answer }));
    saveM.mutate({ correct: correctCount, details });
    setPhase("result");
  };

  const reset = () => {
    setPhase("idle");
    setQuestions([]);
    setAnswers([]);
    setCurrent(0);
    setSkill("");
    setSkillOpen(false);
  };

  const suggested = histQ.data?.suggested ?? [];
  const best = histQ.data?.best ?? [];

  return (
    <div>
      <PageHeader
        title="Skill Assessments"
        description="Take a quick AI quiz to gauge your level and prove your skills."
      />

      {phase === "idle" && (
        <>
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-semibold">Start an assessment</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick any skill and we'll generate 5 questions to test your proficiency.
            </p>
            <form
              className="mt-4 flex flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                start(skill);
              }}
            >
              <Popover open={skillOpen} onOpenChange={setSkillOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={skillOpen}
                    disabled={skillsQ.isLoading || genM.isPending}
                    className="flex-1 justify-between font-normal"
                  >
                    <span className={cn("truncate", !skill && "text-muted-foreground")}>
                      {skill || "Pick a skill…"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search skills…" />
                    <CommandList>
                      <CommandEmpty>No skill matches.</CommandEmpty>
                      <CommandGroup>
                        {(allSkills).map((s) => (
                          <CommandItem
                            key={s}
                            value={s}
                            onSelect={(value) => {
                              setSkill(value);
                              setSkillOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                skill === s ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {s}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button type="submit" disabled={genM.isPending || !skill.trim()}>
                {genM.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {genM.isPending ? "Building quiz…" : "Start quiz"}
              </Button>
            </form>

            {suggested.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Suggested from your skill gaps
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {suggested.map((s) => {
                    const seeded = allSkills.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={genM.isPending || (skillsQ.isSuccess && !seeded)}
                        onClick={() => {
                          setSkill(s);
                          start(s);
                        }}
                        className="rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

          <h2 className="mt-8 font-display text-lg font-semibold">Your skill badges</h2>
          {histQ.isLoading ? (
            <Skeleton className="mt-3 h-24 w-full" />
          ) : best.length === 0 ? (
            <Card className="mt-3 p-8 text-center text-sm text-muted-foreground">
              No assessments yet. Take your first quiz above to earn a badge.
            </Card>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {best.map((b) => (
                <Card key={b.skill} className="flex items-center gap-3 p-4">
                  <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10", levelTone(b.score))}>
                    <Trophy className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{b.skill}</p>
                    <p className="text-xs text-muted-foreground">{b.level}</p>
                  </div>
                  <span className={cn("font-display text-xl font-bold", levelTone(b.score))}>{b.score}%</span>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {phase === "quiz" && questions.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <Badge variant="secondary">{activeSkill}</Badge>
            <span className="text-sm text-muted-foreground">
              Question {current + 1} of {questions.length}
            </span>
          </div>
          <Progress value={((current + 1) / questions.length) * 100} className="mt-3 h-2" />

          <h3 className="mt-5 font-display text-lg font-semibold">{questions[current].question}</h3>
          <div className="mt-4 space-y-2">
            {questions[current].options.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => choose(i)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors",
                  answers[current] === i
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40",
                )}
              >
                <span
                  className={cn(
                    "grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                    answers[current] === i ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30",
                  )}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            ))}
          </div>

          <div className="mt-6 flex justify-between">
            <Button variant="ghost" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>
              Back
            </Button>
            {current < questions.length - 1 ? (
              <Button disabled={answers[current] === undefined} onClick={() => setCurrent((c) => c + 1)}>
                Next
              </Button>
            ) : (
              <Button disabled={answers[current] === undefined} onClick={finish}>
                Finish
              </Button>
            )}
          </div>
        </Card>
      )}

      {phase === "result" && (
        <Card className="p-6">
          <div className="text-center">
            <span className={cn("font-display text-5xl font-bold", levelTone(scorePct))}>{scorePct}%</span>
            <p className="mt-2 text-sm text-muted-foreground">
              You got {correctCount} of {questions.length} correct on{" "}
              <span className="font-medium text-foreground">{activeSkill}</span>.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {questions.map((q, i) => {
              const ok = answers[i] === q.answer;
              return (
                <div key={i} className="rounded-lg border border-border p-4">
                  <div className="flex items-start gap-2">
                    {ok ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{q.question}</p>
                      <p className="mt-1 text-xs text-primary">
                        Correct: {q.options[q.answer]}
                      </p>
                      {!ok && answers[i] !== undefined && (
                        <p className="text-xs text-destructive">Your answer: {q.options[answers[i]]}</p>
                      )}
                      {q.explanation && (
                        <p className="mt-1 text-xs text-muted-foreground">{q.explanation}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex gap-3">
            <Button onClick={reset} variant="outline" className="gap-2">
              <RotateCcw className="h-4 w-4" /> Assess another skill
            </Button>
            <Button asChild className="gap-2">
              <Link to="/learn">
                <Sparkles className="h-4 w-4" /> Build a learning plan
              </Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
