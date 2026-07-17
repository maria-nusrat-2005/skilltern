import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  MapPin,
  Wallet,
  Clock,
  Building2,
  ArrowLeft,
  CheckCircle2,
  Bookmark,
  Briefcase,
  GitCompareArrows,
  Scale,
  Sparkles,
  Loader2,
  FileDiff,
  Copy,
  X,
  Upload,
  FileText,
  Award,
  Mail,
} from "lucide-react";
import { useCompare } from "@/hooks/use-compare";
import { getInternship, parseInternshipMetadata, incrementInternshipViews } from "@/lib/internships.functions";
import { getSimilarInternships } from "@/lib/discovery.functions";
import { saveApplication } from "@/lib/applications.functions";
import { compareResumeToJob, generateApplicationKit } from "@/lib/job-match.functions";
import { getDomainStipend, parseStipend } from "@/lib/insights.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CompanyLogo } from "@/components/company-logo";
import { BookmarkButton } from "@/components/bookmark-button";
import { CompareToggle } from "@/components/compare-bits";
import { InternshipCard, type InternshipListItem } from "@/components/internship-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/internships/$id")({
  head: () => ({ meta: [{ title: "Internship — Skilltern" }] }),
  component: InternshipDetail,
});

function asArr(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : [];
}


function InternshipDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const compare = useCompare();
  const { user } = useAuth();

  useEffect(() => {
    incrementInternshipViews({ data: { id } }).catch(() => {});
  }, [id]);
  
  // States for uploads
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [sscFile, setSscFile] = useState<File | null>(null);
  const [hscFile, setHscFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const q = useQuery({ queryKey: ["internship", id], queryFn: () => getInternship({ data: { id } }) });
  const similarQ = useQuery({
    queryKey: ["similar", id],
    queryFn: () => getSimilarInternships({ data: { id, limit: 4 } }),
  });

  const save = useMutation({
    mutationFn: (variables: { 
      status: string; 
      cvUrl?: string | null; 
      sscCertificateUrl?: string | null; 
      hscCertificateUrl?: string | null; 
    }) => saveApplication({ 
      data: { 
        internshipId: id, 
        status: variables.status, 
        cvUrl: variables.cvUrl, 
        sscCertificateUrl: variables.sscCertificateUrl, 
        hscCertificateUrl: variables.hscCertificateUrl 
      } 
    }),
    onSuccess: (_d, variables) => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      toast.success(variables.status === "applied" ? "Application submitted successfully!" : "Saved to your applications.");
      setIsApplyModalOpen(false);
      // Reset files
      setCvFile(null);
      setSscFile(null);
      setHscFile(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Something went wrong"),
  });

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in first.");
      return;
    }
    if (!cvFile) {
      toast.error("Please select a CV/Resume to upload.");
      return;
    }

    setUploading(true);
    try {
      //  Upload CV
      const cvPath = `${user.id}/${Date.now()}-cv-${cvFile.name}`;
      const { error: cvErr } = await supabase.storage.from("resumes").upload(cvPath, cvFile);
      if (cvErr) throw cvErr;
      const cvUrl = supabase.storage.from("resumes").getPublicUrl(cvPath).data.publicUrl;

      let sscUrl: string | null = null;
      if (sscFile) {
        const sscPath = `${user.id}/${Date.now()}-ssc-${sscFile.name}`;
        const { error: sscErr } = await supabase.storage.from("resumes").upload(sscPath, sscFile);
        if (sscErr) throw sscErr;
        sscUrl = supabase.storage.from("resumes").getPublicUrl(sscPath).data.publicUrl;
      }

      let hscUrl: string | null = null;
      if (hscFile) {
        const hscPath = `${user.id}/${Date.now()}-hsc-${hscFile.name}`;
        const { error: hscErr } = await supabase.storage.from("resumes").upload(hscPath, hscFile);
        if (hscErr) throw hscErr;
        hscUrl = supabase.storage.from("resumes").getPublicUrl(hscPath).data.publicUrl;
      }

      // 4. Save application
      await save.mutateAsync({
        status: "applied",
        cvUrl,
        sscCertificateUrl: sscUrl,
        hscCertificateUrl: hscUrl,
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to upload documents.");
    } finally {
      setUploading(false);
    }
  };

  const stipendQ = useQuery({
    queryKey: ["domain-stipend", q.data?.domain],
    queryFn: () => getDomainStipend({ data: { domain: q.data!.domain as string } }),
    enabled: !!q.data?.domain,
  });

  const diffM = useMutation({
    mutationFn: () => compareResumeToJob({ data: { internshipId: id } }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't compare"),
  });

  const [kitOpen, setKitOpen] = useState(false);
  const kitM = useMutation({
    mutationFn: () => generateApplicationKit({ data: { internshipId: id } }),
    onSuccess: () => setKitOpen(true),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't generate kit"),
  });

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (q.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const job = q.data;
  if (!job) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-muted-foreground">Internship not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/internships">Back to internships</Link>
        </Button>
      </div>
    );
  }

  const { cleanDescription, status, required_cgpa, deadline, views } = parseInternshipMetadata(job.description);
  const tech = asArr(job.tech_stack);
  const requirements = asArr(job.requirements);
  const responsibilities = asArr(job.responsibilities);
  const preferred = asArr(job.preferred_skills);

  const stipendAmt = parseStipend(job.salary);
  const domMedian = stipendQ.data?.median ?? 0;
  const fairness: "above" | "fair" | "below" | null =
    stipendAmt && stipendAmt > 0 && domMedian > 0
      ? stipendAmt >= domMedian * 1.1
        ? "above"
        : stipendAmt <= domMedian * 0.9
          ? "below"
          : "fair"
      : null;
  const diff = diffM.data;

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-4 gap-1">
        <Link to="/internships">
          <ArrowLeft className="h-4 w-4" /> All internships
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-4">
                <CompanyLogo domain={job.company_domain} name={job.company} size={56} />
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight">{job.title}</h1>
                  <Link
                    to="/companies/$company"
                    params={{ company: job.company }}
                    className="mt-1 flex items-center gap-1.5 text-muted-foreground hover:text-primary"
                  >
                    <Building2 className="h-4 w-4" />
                    {job.company}
                    {job.company_type && <span className="text-xs">· {job.company_type}</span>}
                  </Link>
                </div>
              </div>
              {job.work_model && <Badge variant="secondary">{job.work_model}</Badge>}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {job.location}
              </span>
              {job.salary && (
                <span className="flex items-center gap-1.5">
                  <Wallet className="h-4 w-4" />
                  {job.salary}
                </span>
              )}
              {fairness && (
                <Badge
                  variant="outline"
                  className={
                    fairness === "above"
                      ? "border-primary/40 text-primary"
                      : fairness === "below"
                        ? "border-destructive/40 text-destructive"
                        : "border-border"
                  }
                >
                  <Scale className="mr-1 h-3 w-3" />
                  {fairness === "above"
                    ? "Above market"
                    : fairness === "below"
                      ? "Below market"
                      : "Fair for market"}
                  {domMedian > 0 && ` · med ৳${domMedian.toLocaleString("en-US")}`}
                </Badge>
              )}
              {job.duration && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {job.duration}
                </span>
              )}
              {required_cgpa && (
                <Badge variant="outline" className="border-indigo-500/30 text-indigo-600 bg-indigo-500/5 dark:text-indigo-400">
                  Min. CGPA: {required_cgpa}
                </Badge>
              )}
              {deadline && (
                <Badge variant="outline" className="border-rose-500/30 text-rose-600 bg-rose-500/5 dark:text-rose-400">
                  Deadline: {new Date(deadline).toLocaleDateString()}
                </Badge>
              )}
            </div>


            {cleanDescription && (
              <div className="mt-6">
                <h2 className="font-display font-semibold">About the role</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {cleanDescription}
                </p>
              </div>
            )}

            {responsibilities.length > 0 && (
              <Section title="Responsibilities" items={responsibilities} />
            )}
            {requirements.length > 0 && <Section title="Requirements" items={requirements} />}
            {preferred.length > 0 && <Section title="Nice to have" items={preferred} />}
          </Card>

          <Card className="mt-6 p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileDiff className="h-5 w-5 text-primary" />
                <h2 className="font-display font-semibold">Resume vs. this role</h2>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                disabled={diffM.isPending}
                onClick={() => diffM.mutate()}
              >
                {diffM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {diff ? "Re-check" : "Check my fit"}
              </Button>
            </div>

            {!diff && !diffM.isPending && (
              <p className="mt-2 text-sm text-muted-foreground">
                See which required skills your resume already covers and what's missing.
              </p>
            )}

            {diff && diff.hasResume === false && (
              <p className="mt-3 text-sm text-muted-foreground">
                We couldn't find an analyzed resume.{" "}
                <Link to="/resume" className="font-medium text-primary hover:underline">
                  Analyze your resume
                </Link>{" "}
                first.
              </p>
            )}

            {diff && diff.hasResume && (
              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Skill coverage</span>
                    <span className="font-display font-bold text-primary">{diff.coverage}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${diff.coverage}%` }} />
                  </div>
                </div>

                {diff.summary && <p className="text-sm text-muted-foreground">{diff.summary}</p>}

                {diff.matched.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      You have
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {diff.matched.map((s) => (
                        <Badge key={s} className="gap-1 bg-primary/10 text-primary hover:bg-primary/10">
                          <CheckCircle2 className="h-3 w-3" /> {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {diff.missing.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Missing
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {diff.missing.map((s) => (
                        <Badge key={s} variant="outline" className="gap-1 border-destructive/40 text-destructive">
                          <X className="h-3 w-3" /> {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {diff.tips.length > 0 && (
                  <div className="rounded-lg bg-sidebar/60 p-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      How to close the gap
                    </p>
                    <ul className="space-y-1.5">
                      {diff.tips.map((t, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>


        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-display font-semibold">Apply</h2>
            <p className="mt-1 text-sm text-muted-foreground">Track this internship in Skilltern.</p>
            {job.contact_email && (
              <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-primary" /> Application contact: {job.contact_email}
              </p>
            )}
            <div className="mt-4 space-y-2">
              <Button
                className="w-full gap-2"
                disabled={save.isPending}
                onClick={() => setIsApplyModalOpen(true)}
              >
                <CheckCircle2 className="h-4 w-4" /> Apply Now
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                disabled={save.isPending}
                onClick={() => save.mutate({ status: "saved" })}
              >
                <Bookmark className="h-4 w-4" /> Save for later
              </Button>
            </div>
            <div className="mt-3 flex gap-2">
              <BookmarkButton internshipId={id} variant="full" />
              <Button
                variant="outline"
                className="shrink-0 gap-2"
                onClick={() => compare.toggle(id)}
              >
                <GitCompareArrows className="h-4 w-4" />
                {compare.has(id) ? "Added" : "Compare"}
              </Button>
            </div>
            <Button
              className="mt-3 w-full gap-2"
              variant="secondary"
              disabled={kitM.isPending}
              onClick={() => kitM.mutate()}
            >
              {kitM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              One-click apply prep
            </Button>
            <Button asChild variant="ghost" className="mt-2 w-full gap-2">
              <Link to="/applications">
                <Briefcase className="h-4 w-4" /> View applications
              </Link>
            </Button>
          </Card>



          {tech.length > 0 && (
            <Card className="p-6">
              <h2 className="font-display font-semibold">Tech stack</h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tech.map((t) => (
                  <Badge key={t} variant="outline" className="font-normal">
                    {t}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {job.domain && (
            <Card className="p-6">
              <h2 className="font-display font-semibold">Domain</h2>
              <p className="mt-2 text-sm text-primary">{job.domain}</p>
              {job.industry && <p className="text-sm text-muted-foreground">{job.industry}</p>}
            </Card>
          )}
        </div>
      </div>

      {(similarQ.data?.items ?? []).length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-lg font-semibold">Similar internships</h2>
          <p className="text-sm text-muted-foreground">Based on domain and overlapping tech stack.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(similarQ.data?.items ?? []).map((item) => (
              <div key={(item as InternshipListItem).id} className="relative">
                <div className="absolute bottom-3 right-3 z-10 flex gap-1.5">
                  <CompareToggle id={(item as InternshipListItem).id} />
                  <BookmarkButton internshipId={(item as InternshipListItem).id} />
                </div>
                <InternshipCard item={item as InternshipListItem} />
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={kitOpen} onOpenChange={setKitOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Application kit · {job.title}
            </DialogTitle>
          </DialogHeader>
          {kitM.data && (
            <div className="space-y-5">
              {kitM.data.email_subject && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Email subject
                    </p>
                    <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={() => copy(kitM.data!.email_subject)}>
                      <Copy className="h-3 w-3" /> Copy
                    </Button>
                  </div>
                  <p className="rounded-lg border border-border bg-card p-3 text-sm">{kitM.data.email_subject}</p>
                </div>
              )}

              {kitM.data.cover_letter && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Cover letter
                    </p>
                    <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={() => copy(kitM.data!.cover_letter)}>
                      <Copy className="h-3 w-3" /> Copy
                    </Button>
                  </div>
                  <p className="whitespace-pre-line rounded-lg border border-border bg-card p-3 text-sm leading-relaxed">
                    {kitM.data.cover_letter}
                  </p>
                </div>
              )}

              {kitM.data.screening_answers.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Screening answers
                  </p>
                  <div className="space-y-3">
                    {kitM.data.screening_answers.map((qa, i) => (
                      <div key={i} className="rounded-lg border border-border bg-card p-3">
                        <p className="text-sm font-medium">{qa.question}</p>
                        <p className="mt-1.5 whitespace-pre-line text-sm text-muted-foreground">{qa.answer}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-2 h-7 gap-1"
                          onClick={() => copy(qa.answer)}
                        >
                          <Copy className="h-3 w-3" /> Copy answer
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Submit Application Dialog with Document Uploads */}
      <Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleApplySubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" /> Apply for {job.title}
              </DialogTitle>
              <DialogDescription>
                Please upload the required documents to submit your application. Only PDF format is accepted.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="cv-upload" className="text-sm font-semibold flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-primary" /> CV / Resume (Required)
                </Label>
                <Input
                  id="cv-upload"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
                  required
                  disabled={uploading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ssc-upload" className="text-sm font-semibold flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-amber-500" /> SSC Certificate (Optional)
                </Label>
                <Input
                  id="ssc-upload"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setSscFile(e.target.files?.[0] ?? null)}
                  disabled={uploading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hsc-upload" className="text-sm font-semibold flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-emerald-500" /> HSC Certificate (Optional)
                </Label>
                <Input
                  id="hsc-upload"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setHscFile(e.target.files?.[0] ?? null)}
                  disabled={uploading}
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsApplyModalOpen(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-6">
      <h2 className="font-display font-semibold">{title}</h2>
      <ul className="mt-2 space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
