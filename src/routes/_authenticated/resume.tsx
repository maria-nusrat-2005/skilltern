import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, Sparkles, CheckCircle2, AlertTriangle, Lightbulb, ArrowRight, Upload, X, Loader2, History, Wand2, Star, Copy } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { analyzeResume, analyzeResumeFile, getCareerOverview, reanalyzeResumeVersion } from "@/lib/career.functions";
import { getResumeHistory, setActiveResume, updateResumeMeta, rewriteBullets } from "@/lib/resume-tools.functions";
import { PageHeader, ScoreRing } from "@/components/dashboard-bits";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/resume")({
  head: () => ({ meta: [{ title: "Resume & Career — Skilltern" }] }),
  component: ResumePage,
});

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      const comma = res.indexOf(",");
      resolve(comma === -1 ? res : res.slice(comma + 1));
    };
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

function asArr(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : [];
}

const ANALYSIS_STEPS = [
  "Uploading your resume",
  "Reading and extracting content",
  "Scoring ATS & formatting",
  "Identifying strengths & gaps",
  "Building your career roadmap",
] as const;

function ResumePage() {
  const qc = useQueryClient();
  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const overviewQ = useQuery({ queryKey: ["career"], queryFn: () => getCareerOverview() });

  const onSuccess = () => {
    qc.invalidateQueries({ queryKey: ["career"] });
    qc.invalidateQueries({ queryKey: ["matches"] });
    qc.invalidateQueries({ queryKey: ["profile"] });
    qc.invalidateQueries({ queryKey: ["resume-history"] });
    toast.success("Resume analyzed — your profile was updated automatically.");
  };
  const onError = (e: unknown) =>
    toast.error(e instanceof Error ? e.message : "Analysis failed");

  const analyze = useMutation({
    mutationFn: () => analyzeResume({ data: { resumeText: text } }),
    onSuccess,
    onError,
  });

  const analyzeFile = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Please choose a file first.");
      const fileBase64 = await fileToBase64(file);
      return analyzeResumeFile({
        data: { fileName: file.name, mimeType: file.type, fileBase64 },
      });
    },
    onSuccess,
    onError,
  });

  const ACCEPT = ".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

  const pickFile = (f: File | null) => {
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File is too large. Please upload a file under 10MB.");
      return;
    }
    setFile(f);
  };

  const career = overviewQ.data?.career;
  const score = overviewQ.data?.score;
  const result = analyzeFile.data ?? analyze.data;
  const pending = analyze.isPending || analyzeFile.isPending;

  const historyQ = useQuery({ queryKey: ["resume-history"], queryFn: () => getResumeHistory() });
  const history = historyQ.data?.history ?? [];
  const trend = historyQ.data?.trend ?? [];

  const activeM = useMutation({
    mutationFn: (id: string) => setActiveResume({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resume-history"] });
      toast.success("Set as active resume.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to update"),
  });
  const metaM = useMutation({
    mutationFn: (v: { id: string; label?: string | null; target_domain?: string | null }) =>
      updateResumeMeta({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resume-history"] });
      toast.success("Saved.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to update"),
  });

  const reanalyze = useMutation({
    mutationFn: (id: string) => reanalyzeResumeVersion({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["career"] });
      qc.invalidateQueries({ queryKey: ["resume-history"] });
      toast.success("Resume analyzed successfully!");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Analysis failed"),
  });

  const [bullets, setBullets] = useState("");
  const rewriteM = useMutation({
    mutationFn: () => rewriteBullets({ data: { text: bullets, role: domain ?? undefined } }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Rewrite failed"),
  });

  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!pending) {
      setStep(0);
      return;
    }
    setStep(0);
    const id = setInterval(() => {
      setStep((s) => Math.min(s + 1, ANALYSIS_STEPS.length - 2));
    }, 1500);
    return () => clearInterval(id);
  }, [pending]);
  const progressPct = pending
    ? Math.round(((step + 1) / ANALYSIS_STEPS.length) * 100)
    : 0;


  const overall = result?.scores.overall_score ?? score?.overall_score ?? null;
  const ats = result?.scores.ats_score ?? score?.ats_score ?? null;
  const strengths = result?.strengths ?? asArr(score?.strengths);
  const weaknesses = result?.weaknesses ?? asArr(score?.weaknesses);
  const recommendations = result?.recommendations ?? asArr(score?.recommendations);
  const missing = result?.career.missing_skills ?? asArr(career?.missing_skills);
  const recRoles = result?.career.recommended_roles ?? asArr(career?.recommended_roles);
  const domain = result?.career.career_domain ?? career?.career_domain ?? null;
  const stage = result?.career.career_stage ?? career?.career_stage ?? null;

  return (
    <div>
      <PageHeader title="Resume & Career" description="Get an AI score, strengths, gaps, and a path to hireable." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-display font-semibold">
              <FileText className="h-4.5 w-4.5 text-primary" /> Add your resume
            </h2>
            <div className="flex rounded-lg border p-0.5 text-sm">
              <button
                type="button"
                onClick={() => setMode("upload")}
                className={`rounded-md px-3 py-1 transition-colors ${mode === "upload" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Upload
              </button>
              <button
                type="button"
                onClick={() => setMode("paste")}
                className={`rounded-md px-3 py-1 transition-colors ${mode === "paste" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Paste
              </button>
            </div>
          </div>

          {mode === "upload" ? (
            <>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload your CV as a PDF, Word document, or text file. We read it and score it instantly.
              </p>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <div className="mt-4 flex items-center justify-between rounded-xl border bg-muted/30 p-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText className="h-5 w-5 shrink-0 text-primary" />
                    <div className="overflow-hidden">
                      <p className="truncate text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    pickFile(e.dataTransfer.files?.[0] ?? null);
                  }}
                  className={`mt-4 flex min-h-44 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}`}
                >
                  <Upload className="h-7 w-7 text-muted-foreground" />
                  <span className="text-sm font-medium">Click to upload or drag & drop</span>
                  <span className="text-xs text-muted-foreground">PDF, DOC, DOCX or TXT · up to 10MB</span>
                </button>
              )}
              <div className="mt-3 flex justify-end">
                <Button
                  onClick={() => analyzeFile.mutate()}
                  disabled={pending || !file}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {analyzeFile.isPending ? "Analyzing…" : "Analyze resume"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted-foreground">
                Copy the full text of your resume below. The more complete, the better the analysis.
              </p>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your resume text here…"
                className="mt-4 min-h-64 font-mono text-sm"
              />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{text.trim().length} characters</span>
                <Button
                  onClick={() => analyze.mutate()}
                  disabled={pending || text.trim().length < 80}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {analyze.isPending ? "Analyzing…" : "Analyze resume"}
                </Button>
              </div>
            </>
          )}

          {pending && (
            <div className="mt-5 rounded-xl border bg-muted/30 p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Analyzing your resume…
                </span>
                <span className="text-muted-foreground">{progressPct}%</span>
              </div>
              <Progress value={progressPct} className="mt-3" />
              <ul className="mt-4 space-y-2">
                {ANALYSIS_STEPS.map((label, i) => {
                  const state = i < step ? "done" : i === step ? "active" : "todo";
                  return (
                    <li key={label} className="flex items-center gap-2.5 text-sm">
                      {state === "done" ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      ) : state === "active" ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                      ) : (
                        <span className="h-4 w-4 shrink-0 rounded-full border border-muted-foreground/30" />
                      )}
                      <span className={state === "todo" ? "text-muted-foreground" : ""}>{label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </Card>



        <Card className="flex flex-col items-center p-6">
          <h2 className="self-start font-display font-semibold">Overall score</h2>
          <div className="mt-4">
            <ScoreRing value={overall ?? 0} size={120} />
          </div>
          {ats !== null && (
            <div className="mt-5 w-full">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">ATS score</span>
                <span className="font-medium">{ats}</span>
              </div>
              <Progress value={ats} className="mt-1.5" />
            </div>
          )}
          {(domain || stage) && (
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {domain && <Badge variant="secondary">{domain}</Badge>}
              {stage && <Badge variant="outline">{stage}</Badge>}
            </div>
          )}
        </Card>
      </div>

      {(strengths.length > 0 || weaknesses.length > 0 || recommendations.length > 0) && (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <ListCard
            title="Strengths"
            items={strengths}
            icon={<CheckCircle2 className="h-4 w-4 text-primary" />}
            tone="text-primary"
          />
          <ListCard
            title="Weaknesses"
            items={weaknesses}
            icon={<AlertTriangle className="h-4 w-4 text-accent" />}
            tone="text-accent"
          />
          <ListCard
            title="Recommendations"
            items={recommendations}
            icon={<Lightbulb className="h-4 w-4 text-primary" />}
            tone="text-primary"
          />
        </div>
      )}

      {(missing.length > 0 || recRoles.length > 0) && (
        <Card className="mt-6 p-6">
          <h2 className="font-display font-semibold">Career roadmap</h2>
          {recRoles.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recommended roles</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {recRoles.map((r) => (
                  <Badge key={r} variant="secondary">
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {missing.length > 0 && (
            <div className="mt-4">
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
          <Button asChild variant="ghost" size="sm" className="mt-5 gap-1">
            <Link to="/matches">
              See matching internships <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </Card>
      )}

      <Card className="mt-6 p-6">
        <h2 className="flex items-center gap-2 font-display font-semibold">
          <Wand2 className="h-4.5 w-4.5 text-primary" /> Rewrite bullet points
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste weak resume bullets and get stronger, quantified versions instantly.
        </p>
        <Textarea
          value={bullets}
          onChange={(e) => setBullets(e.target.value)}
          placeholder={"e.g. Worked on the frontend team and helped fix bugs\nResponsible for the company database"}
          className="mt-4 min-h-28 text-sm"
        />
        <div className="mt-3 flex justify-end">
          <Button
            onClick={() => rewriteM.mutate()}
            disabled={rewriteM.isPending || bullets.trim().length < 10}
            className="gap-2"
          >
            {rewriteM.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {rewriteM.isPending ? "Rewriting…" : "Rewrite"}
          </Button>
        </div>
        {rewriteM.data?.rewrites && rewriteM.data.rewrites.length > 0 && (
          <div className="mt-4 space-y-3">
            {rewriteM.data.rewrites.map((rw, i) => (
              <div key={i} className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground line-through">{rw.original}</p>
                <div className="mt-2 flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">{rw.improved}</p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(rw.improved);
                      toast.success("Copied.");
                    }}
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Copy"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                {rw.note && (
                  <p className="mt-1.5 text-xs text-primary">{rw.note}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {history.length > 0 && (
        <Card className="mt-6 p-6">
          <h2 className="flex items-center gap-2 font-display font-semibold">
            <History className="h-4.5 w-4.5 text-primary" /> Resume versions
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your resumes over time and pick which one drives your matches.
          </p>
          {trend.length > 1 && (
            <div className="mt-4 h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="index" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Line type="monotone" dataKey="overall" stroke="var(--primary)" strokeWidth={2} dot name="Overall" />
                  <Line type="monotone" dataKey="ats" stroke="var(--accent)" strokeWidth={2} dot name="ATS" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-4 space-y-2">
            {history.map((h) => (
              <div
                key={h.id}
                className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Badge variant="outline" className="shrink-0">
                    v{h.version}
                  </Badge>
                  <div className="min-w-0">
                    <Input
                      defaultValue={h.label ?? ""}
                      placeholder="Label this version"
                      className="h-8 max-w-56"
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v !== (h.label ?? "")) metaM.mutate({ id: h.id, label: v });
                      }}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(h.created_at).toLocaleDateString()}
                      {h.overall != null && ` · Overall ${h.overall}`}
                      {h.ats != null && ` · ATS ${h.ats}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {h.is_active ? (
                    <Badge className="gap-1">
                      <Star className="h-3 w-3" /> Active
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => activeM.mutate(h.id)}
                      disabled={activeM.isPending}
                    >
                      Set active
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => reanalyze.mutate(h.id)}
                    disabled={reanalyze.isPending}
                    className="gap-1.5"
                  >
                    {reanalyze.isPending && reanalyze.variables === h.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="h-3.5 w-3.5" />
                    )}
                    Analyze
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function ListCard({
  title,
  items,
  icon,
}: {
  title: string;
  items: string[];
  icon: React.ReactNode;
  tone?: string;
}) {
  if (items.length === 0) return null;
  return (
    <Card className="p-6">
      <h3 className="flex items-center gap-2 font-display font-semibold">
        {icon} {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {items.map((it, i) => (
          <li key={i} className="text-sm text-muted-foreground">
            {it}
          </li>
        ))}
      </ul>
    </Card>
  );
}
