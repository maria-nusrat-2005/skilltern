import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { User, Settings, Github, CheckCircle2, Circle, Star, Loader2, Sparkles, FileText, Copy, ExternalLink, Upload } from "lucide-react";
import { getProfileData, updateProfile, savePreferences, getStudentProfileCv, uploadProfileCv } from "@/lib/profile.functions";
import { importGitHub } from "@/lib/github.functions";
import { PageHeader } from "@/components/dashboard-bits";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      const comma = res.indexOf(",");
      resolve(comma === -1 ? res : res.slice(comma + 1));
    };
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Skilltern" }] }),
  component: ProfilePage,
});

function asArr(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : [];
}

function ProfilePage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["profile"], queryFn: () => getProfileData() });
  const profileCvQ = useQuery({ queryKey: ["student-profile-cv"], queryFn: () => getStudentProfileCv() });
  const profileCv = profileCvQ.data;

  const uploadCvM = useMutation({
    mutationFn: async (file: File) => {
      const fileBase64 = await fileToBase64(file);
      return uploadProfileCv({
        data: { fileName: file.name, fileBase64, mimeType: file.type || "application/pdf" },
      });
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["student-profile-cv"] });
      qc.invalidateQueries({ queryKey: ["resume-history"] });
      toast.success(`Profile CV updated (${data.fileName})`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to upload CV"),
  });

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
  const [ghUrl, setGhUrl] = useState("");

  useEffect(() => {
    if (!q.data) return;
    const p = q.data.profile;
    const pr = q.data.preferences;
    if (p) {
      setProfile({
        full_name: p.full_name ?? "",
        location: p.location ?? "",
        phone: p.phone ?? "",
        linkedin_url: p.linkedin_url ?? "",
        github_url: p.github_url ?? "",
        portfolio_url: p.portfolio_url ?? "",
      });
    }
    if (pr) {
      setPrefs({
        preferred_roles: asArr(pr.preferred_roles).join(", "),
        preferred_technologies: asArr(pr.preferred_technologies).join(", "),
        preferred_locations: asArr(pr.preferred_locations).join(", "),
        work_model: pr.work_model ?? "any",
        career_goals: pr.career_goals ?? "",
      });
    }
  }, [q.data]);

  const saveProfileM = useMutation({
    mutationFn: () => updateProfile({ data: profile }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile saved.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  const splitTags = (s: string) =>
    s.split(",").map((t) => t.trim()).filter(Boolean);

  const savePrefsM = useMutation({
    mutationFn: () =>
      savePreferences({
        data: {
          preferred_roles: splitTags(prefs.preferred_roles),
          preferred_technologies: splitTags(prefs.preferred_technologies),
          preferred_locations: splitTags(prefs.preferred_locations),
          work_model: prefs.work_model === "any" ? null : prefs.work_model,
          career_goals: prefs.career_goals || null,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["matches"] });
      toast.success("Preferences saved.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  const githubM = useMutation({
    mutationFn: () => importGitHub({ data: { url: ghUrl || profile.github_url || undefined } }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["matches"] });
      setPrefs((p) => ({
        ...p,
        preferred_technologies: Array.from(
          new Set([...splitTags(p.preferred_technologies), ...res.inferredSkills]),
        ).join(", "),
      }));
      toast.success(`Imported ${res.publicRepos} repos and ${res.inferredSkills.length} skills.`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "GitHub import failed"),
  });

  const ghResult = githubM.data;

  // Profile strength meter (feature 13): weighted checklist beyond raw completion.
  const strength = useMemo(() => {
    const items = [
      { label: "Name added", done: !!profile.full_name.trim(), weight: 10 },
      { label: "Location set", done: !!profile.location.trim(), weight: 10 },
      { label: "Phone added", done: !!profile.phone.trim(), weight: 5 },
      { label: "LinkedIn linked", done: !!profile.linkedin_url.trim(), weight: 10 },
      { label: "GitHub linked", done: !!profile.github_url.trim(), weight: 10 },
      { label: "Portfolio linked", done: !!profile.portfolio_url.trim(), weight: 10 },
      { label: "Preferred roles", done: splitTags(prefs.preferred_roles).length > 0, weight: 15 },
      {
        label: "Skills listed",
        done: splitTags(prefs.preferred_technologies).length > 0,
        weight: 15,
      },
      { label: "Career goals written", done: !!prefs.career_goals.trim(), weight: 15 },
    ];
    const score = items.reduce((sum, i) => sum + (i.done ? i.weight : 0), 0);
    return { items, score };
  }, [profile, prefs]);

  const strengthLabel =
    strength.score >= 85 ? "Excellent" : strength.score >= 60 ? "Strong" : strength.score >= 35 ? "Getting there" : "Needs work";

  return (
    <div>
      <PageHeader title="Profile" description="Keep your details current to improve matching." />

      <Card className="mb-6 p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 font-medium">
            <Star className="h-4 w-4 text-primary" /> Profile strength
          </span>
          <span className="text-muted-foreground">
            {strength.score}% · <span className="font-medium text-foreground">{strengthLabel}</span>
          </span>
        </div>
        <Progress value={strength.score} className="mt-3" />
        <div className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          {strength.items.map((i) => (
            <span
              key={i.label}
              className={`flex items-center gap-2 text-sm ${i.done ? "text-foreground" : "text-muted-foreground"}`}
            >
              {i.done ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
              {i.label}
            </span>
          ))}
        </div>
      </Card>

      <Card className="mb-6 p-6">
        <h2 className="flex items-center gap-2 font-display font-semibold">
          <FileText className="h-4.5 w-4.5 text-primary" /> Profile CV / Resume
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your saved CV is automatically attached when applying for internships — no need to re-upload every time.
        </p>

        {profileCv ? (
          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2.5 bg-primary/10 text-primary rounded-lg shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{profileCv.fileName}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">Active Profile CV</Badge>
                    {profileCv.updatedAt && `Uploaded ${new Date(profileCv.updatedAt).toLocaleDateString()}`}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText(profileCv.cvUrl);
                    toast.success("CV link copied to clipboard!");
                  }}
                >
                  <Copy className="h-3.5 w-3.5" /> Copy CV Link
                </Button>
                <Button size="sm" variant="outline" asChild className="gap-1.5 text-xs">
                  <a href={profileCv.cvUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" /> View PDF
                  </a>
                </Button>
                <Label
                  htmlFor="profile-cv-replace"
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-input transition-colors"
                >
                  {uploadCvM.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  Replace CV
                </Label>
                <input
                  id="profile-cv-replace"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadCvM.mutate(f);
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center space-y-3">
            <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">No Profile CV uploaded yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">Upload a PDF to apply to internships seamlessly.</p>
            </div>
            <div className="flex justify-center">
              <Label
                htmlFor="profile-cv-upload"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-colors"
              >
                {uploadCvM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload Profile CV (PDF)
              </Label>
              <input
                id="profile-cv-upload"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadCvM.mutate(f);
                }}
              />
            </div>
          </div>
        )}
      </Card>

      <Card className="mb-6 p-6">
        <h2 className="flex items-center gap-2 font-display font-semibold">
          <Github className="h-4.5 w-4.5 text-primary" /> Import from GitHub
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We'll scan your public repos to infer skills and add them to your preferences.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Input
            value={ghUrl}
            onChange={(e) => setGhUrl(e.target.value)}
            placeholder={profile.github_url || "github.com/yourusername"}
          />
          <Button onClick={() => githubM.mutate()} disabled={githubM.isPending} className="gap-2">
            {githubM.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {githubM.isPending ? "Importing…" : "Import"}
          </Button>
        </div>
        {ghResult && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">@{ghResult.username}</span> ·{" "}
              {ghResult.publicRepos} public repos
            </p>
            {ghResult.inferredSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {ghResult.inferredSkills.map((s) => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
            {ghResult.topRepos.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {ghResult.topRepos.map((r) => (
                  <a
                    key={r.name}
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border p-3 text-sm transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-center justify-between font-medium">
                      <span className="truncate">{r.name}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3 w-3" />
                        {r.stars}
                      </span>
                    </div>
                    {r.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {r.description}
                      </p>
                    )}
                  </a>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Skills added below — remember to save your preferences.
            </p>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="flex items-center gap-2 font-display font-semibold">
            <User className="h-4.5 w-4.5 text-primary" /> Personal details
          </h2>
          <div className="mt-5 space-y-4">
            <Field label="Full name" value={profile.full_name} onChange={(v) => setProfile({ ...profile, full_name: v })} />
            <Field label="Location" value={profile.location} onChange={(v) => setProfile({ ...profile, location: v })} placeholder="e.g. Dhaka, Bangladesh" />
            <Field label="Phone" value={profile.phone} onChange={(v) => setProfile({ ...profile, phone: v })} />
            <Field label="LinkedIn URL" value={profile.linkedin_url} onChange={(v) => setProfile({ ...profile, linkedin_url: v })} />
            <Field label="GitHub URL" value={profile.github_url} onChange={(v) => setProfile({ ...profile, github_url: v })} />
            <Field label="Portfolio URL" value={profile.portfolio_url} onChange={(v) => setProfile({ ...profile, portfolio_url: v })} />
          </div>
          <Button onClick={() => saveProfileM.mutate()} disabled={saveProfileM.isPending} className="mt-5">
            {saveProfileM.isPending ? "Saving…" : "Save details"}
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="flex items-center gap-2 font-display font-semibold">
            <Settings className="h-4.5 w-4.5 text-primary" /> Preferences
          </h2>
          <div className="mt-5 space-y-4">
            <Field
              label="Preferred roles"
              value={prefs.preferred_roles}
              onChange={(v) => setPrefs({ ...prefs, preferred_roles: v })}
              placeholder="Frontend Developer, Data Analyst"
              hint="Comma-separated"
            />
            <Field
              label="Preferred technologies"
              value={prefs.preferred_technologies}
              onChange={(v) => setPrefs({ ...prefs, preferred_technologies: v })}
              placeholder="React, Python, SQL"
              hint="Comma-separated"
            />
            <Field
              label="Preferred locations"
              value={prefs.preferred_locations}
              onChange={(v) => setPrefs({ ...prefs, preferred_locations: v })}
              placeholder="Dhaka, Remote"
              hint="Comma-separated"
            />
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
                placeholder="What do you want to achieve in your career?"
                className="min-h-24"
              />
            </div>
          </div>
          <Button onClick={() => savePrefsM.mutate()} disabled={savePrefsM.isPending} className="mt-5">
            {savePrefsM.isPending ? "Saving…" : "Save preferences"}
          </Button>
        </Card>
      </div>
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
