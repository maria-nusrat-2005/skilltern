import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  User,
  Target,
  Github,
  Rocket,
  FileText,
  Upload,
  X,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { updateProfile, savePreferences } from "@/lib/profile.functions";
import { analyzeResume, analyzeResumeFile, type AnalysisResult } from "@/lib/career.functions";
import { importGitHub } from "@/lib/github.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — Skilltern" }] }),
  component: OnboardingPage,
});

const STEPS = ["Upload your CV", "About you", "Preferences", "GitHub", "Finish"] as const;

const ACCEPT = ".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

const CV_STEPS = [
  "Uploading your CV",
  "Reading and extracting content",
  "Filling in your profile",
  "Building your skill graph",
] as const;

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

function OnboardingPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);

  // CV step state
  const [cvMode, setCvMode] = useState<"upload" | "paste">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [dragging, setDragging] = useState(false);
  const [parsed, setParsed] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile + preferences form state. Populated by CV parse, edited by user.
  const [profile, setProfile] = useState({
    full_name: "",
    location: "",
    phone: "",
    linkedin_url: "",
    github_url: "",
    portfolio_url: "",
  });
  const [prefs, setPrefs] = useState({
    preferred_roles: "",
    preferred_technologies: "",
    preferred_locations: "",
    work_model: "any",
    career_goals: "",
  });

  const splitTags = (s: string) => s.split(",").map((t) => t.trim()).filter(Boolean);

  // Pre-fill profile + preferences from the parsed CV. Uses "only if empty"
  // semantics so manual edits aren't overwritten on re-parse.
  useEffect(() => {
    if (!parsed) return;
    const c = parsed.extracted.contact ?? {};
    setProfile((p) => ({
      ...p,
      full_name: p.full_name || c.full_name || "",
      location: p.location || c.location || "",
      phone: p.phone || c.phone || "",
      linkedin_url: p.linkedin_url || c.linkedin_url || "",
      github_url: p.github_url || c.github_url || "",
      portfolio_url: p.portfolio_url || c.portfolio_url || "",
    }));
    const roles = (parsed.career?.recommended_roles ?? []).filter(Boolean);
    const techs = (parsed.extracted?.skills ?? []).filter(Boolean);
    setPrefs((p) => ({
      ...p,
      preferred_roles: p.preferred_roles || roles.join(", "),
      preferred_technologies: p.preferred_technologies || techs.join(", "),
    }));
  }, [parsed]);

  const cvFileM = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Please choose a file first.");
      const fileBase64 = await fileToBase64(file);
      return analyzeResumeFile({
        data: { fileName: file.name, mimeType: file.type, fileBase64 },
      });
    },
    onSuccess: (res) => {
      setParsed(res);
      toast.success("CV parsed — your profile is pre-filled.");
      setStep(1);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "CV parse failed"),
  });

  const cvTextM = useMutation({
    mutationFn: () => analyzeResume({ data: { resumeText: text } }),
    onSuccess: (res) => {
      setParsed(res);
      toast.success("CV parsed — your profile is pre-filled.");
      setStep(1);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "CV parse failed"),
  });

  const cvPending = cvFileM.isPending || cvTextM.isPending;
  const cvError = cvFileM.error ?? cvTextM.error;

  // Animated progress while parsing. Resets whenever a new parse starts.
  const [progressStep, setProgressStep] = useState(0);
  useEffect(() => {
    if (!cvPending) {
      setProgressStep(0);
      return;
    }
    setProgressStep(0);
    const id = setInterval(() => {
      setProgressStep((s) => Math.min(s + 1, CV_STEPS.length - 2));
    }, 1500);
    return () => clearInterval(id);
  }, [cvPending]);
  const progressPct = cvPending
    ? Math.round(((progressStep + 1) / CV_STEPS.length) * 100)
    : 0;

  const pickFile = (f: File | null) => {
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File is too large. Please upload a file under 10MB.");
      return;
    }
    setFile(f);
  };

  const githubM = useMutation({
    mutationFn: () => importGitHub({ data: { url: profile.github_url || undefined } }),
    onSuccess: (res) => {
      setPrefs((p) => ({
        ...p,
        preferred_technologies: Array.from(
          new Set([...splitTags(p.preferred_technologies), ...res.inferredSkills]),
        ).join(", "),
      }));
      toast.success(`Imported ${res.inferredSkills.length} skills from GitHub.`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "GitHub import failed"),
  });

  const finishM = useMutation({
    mutationFn: async () => {
      await updateProfile({ data: profile });
      await savePreferences({
        data: {
          preferred_roles: splitTags(prefs.preferred_roles),
          preferred_technologies: splitTags(prefs.preferred_technologies),
          preferred_locations: splitTags(prefs.preferred_locations),
          work_model: prefs.work_model === "any" ? null : prefs.work_model,
          career_goals: prefs.career_goals || null,
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("You're all set!");
      navigate({ to: "/dashboard" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const skipAll = () => navigate({ to: "/dashboard" });

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </span>
          <button onClick={skipAll} className="text-muted-foreground hover:text-foreground">
            Skip for now
          </button>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="mt-3" />
      </div>

      <Card className="p-7">
        {step === 0 && (
          <div>
            <div className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Rocket className="h-7 w-7" />
              </span>
              <h1 className="mt-5 font-display text-2xl font-semibold">Welcome to Skilltern</h1>
              <p className="mx-auto mt-2 max-w-md text-muted-foreground">
                Start by uploading your CV. We'll read it and pre-fill the next steps for you.
              </p>
            </div>

            <div className="mt-6 flex justify-center">
              <div className="flex rounded-lg border p-0.5 text-sm">
                <button
                  type="button"
                  onClick={() => setCvMode("upload")}
                  className={`rounded-md px-3 py-1 transition-colors ${cvMode === "upload" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => setCvMode("paste")}
                  className={`rounded-md px-3 py-1 transition-colors ${cvMode === "paste" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Paste text
                </button>
              </div>
            </div>

            {cvMode === "upload" ? (
              <>
                <p className="mt-4 text-sm text-muted-foreground">
                  PDF, DOC, DOCX or TXT · up to 10MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT}
                  className="hidden"
                  onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                />
                {file ? (
                  <div className="mt-3 flex items-center justify-between rounded-xl border bg-muted/30 p-4">
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
                    onClick={() => fileInputRef.current?.click()}
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
                    className={`mt-3 flex min-h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}`}
                  >
                    <Upload className="h-7 w-7 text-muted-foreground" />
                    <span className="text-sm font-medium">Click to upload or drag &amp; drop</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <p className="mt-4 text-sm text-muted-foreground">
                  Paste the full text of your CV. At least a few lines works best.
                </p>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste your CV here…"
                  className="mt-3 min-h-48 font-mono text-sm"
                />
                <p className="mt-1 text-xs text-muted-foreground">{text.trim().length} characters</p>
              </>
            )}

            {cvPending && (
              <div className="mt-5 rounded-xl border bg-muted/30 p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Reading your CV…
                  </span>
                  <span className="text-muted-foreground">{progressPct}%</span>
                </div>
                <Progress value={progressPct} className="mt-3" />
                <ul className="mt-4 space-y-2">
                  {CV_STEPS.map((label, i) => {
                    const state = i < progressStep ? "done" : i === progressStep ? "active" : "todo";
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

            {cvError && !cvPending && (
              <p className="mt-3 text-sm text-destructive">
                {cvError instanceof Error ? cvError.message : "CV parse failed"}
              </p>
            )}
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <User className="h-5 w-5 text-primary" /> About you
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {parsed ? "We filled these in from your CV — feel free to edit anything." : "Tell us who you are."}
            </p>
            <div className="mt-5 space-y-4">
              <Field label="Full name" value={profile.full_name} onChange={(v) => setProfile({ ...profile, full_name: v })} />
              <Field label="Location" value={profile.location} onChange={(v) => setProfile({ ...profile, location: v })} placeholder="e.g. Dhaka, Bangladesh" />
              <Field label="Phone" value={profile.phone} onChange={(v) => setProfile({ ...profile, phone: v })} placeholder="Optional" />
              <Field label="LinkedIn URL" value={profile.linkedin_url} onChange={(v) => setProfile({ ...profile, linkedin_url: v })} />
              <Field label="Portfolio URL" value={profile.portfolio_url} onChange={(v) => setProfile({ ...profile, portfolio_url: v })} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <Target className="h-5 w-5 text-primary" /> What are you looking for?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {parsed ? "Pulled from your CV — adjust to match what you actually want." : "Help us match you to the right roles."}
            </p>
            <div className="mt-5 space-y-4">
              <Field label="Preferred roles" value={prefs.preferred_roles} onChange={(v) => setPrefs({ ...prefs, preferred_roles: v })} placeholder="Frontend Developer, Data Analyst" hint="Comma-separated" />
              <Field label="Skills & technologies" value={prefs.preferred_technologies} onChange={(v) => setPrefs({ ...prefs, preferred_technologies: v })} placeholder="React, Python, SQL" hint="Comma-separated" />
              <Field label="Preferred locations" value={prefs.preferred_locations} onChange={(v) => setPrefs({ ...prefs, preferred_locations: v })} placeholder="Dhaka, Remote" hint="Comma-separated" />
              <div>
                <Label className="mb-1.5 block">Work model</Label>
                <Select value={prefs.work_model} onValueChange={(v) => setPrefs({ ...prefs, work_model: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="Onsite">Onsite</SelectItem>
                    <SelectItem value="Remote">Remote</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">Career goals</Label>
                <Textarea
                  value={prefs.career_goals}
                  onChange={(e) => setPrefs({ ...prefs, career_goals: e.target.value })}
                  placeholder="What do you want to achieve?"
                  className="min-h-20"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <Github className="h-5 w-5 text-primary" /> Import your skills from GitHub
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Optional — we'll scan your public repos and add the languages and topics you use.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Input
                value={profile.github_url}
                onChange={(e) => setProfile({ ...profile, github_url: e.target.value })}
                placeholder="github.com/yourusername"
              />
              <Button variant="secondary" onClick={() => githubM.mutate()} disabled={githubM.isPending} className="gap-2">
                <Sparkles className="h-4 w-4" />
                {githubM.isPending ? "Importing…" : "Import"}
              </Button>
            </div>
            {githubM.data && (
              <p className="mt-3 text-sm text-primary">
                Added {githubM.data.inferredSkills.length} skills from @{githubM.data.username}.
              </p>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Check className="h-7 w-7" />
            </span>
            <h2 className="mt-5 font-display text-xl font-semibold">You're ready</h2>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">
              {parsed
                ? "We'll find your best matches on the dashboard. You can re-analyze or refine your CV anytime from the Resume page."
                : "Next, upload your resume to unlock AI scoring and personalized matches. Let's go to your dashboard."}
            </p>
          </div>
        )}

        <div className="mt-7 flex items-center justify-between">
          <Button variant="ghost" onClick={back} disabled={step === 0} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          {step === 0 ? (
            <div className="flex items-center gap-2">
              <Button onClick={skipAll} variant="ghost" size="sm">
                Skip — I'll fill this in manually
              </Button>
              {cvMode === "upload" ? (
                <Button
                  onClick={() => cvFileM.mutate()}
                  disabled={cvPending || !file}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {cvFileM.isPending ? "Reading…" : "Read my CV"}
                </Button>
              ) : (
                <Button
                  onClick={() => cvTextM.mutate()}
                  disabled={cvPending || text.trim().length < 80}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {cvTextM.isPending ? "Reading…" : "Read my CV"}
                </Button>
              )}
            </div>
          ) : step < STEPS.length - 1 ? (
            <Button onClick={next} className="gap-1">
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => finishM.mutate()} disabled={finishM.isPending} className="gap-1">
              {finishM.isPending ? "Saving…" : "Go to dashboard"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}