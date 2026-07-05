import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Star,
  Building2,
  MapPin,
  Wallet,
  Trash2,
  PenLine,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import {
  getCompany,
  addCompanyReview,
  deleteCompanyReview,
} from "@/lib/companies.functions";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/dashboard-bits";
import { CompanyLogo } from "@/components/company-logo";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/companies/$company")({
  head: () => ({ meta: [{ title: "Company — Skilltern" }] }),
  component: CompanyDetail,
});

function StarRow({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={i <= value ? "fill-accent text-accent" : "text-muted-foreground/30"}
        />
      ))}
    </span>
  );
}

function CompanyDetail() {
  const { company } = Route.useParams();
  const qc = useQueryClient();
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["company", company],
    queryFn: () => getCompany({ data: { company } }),
  });

  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [role, setRole] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");

  const addM = useMutation({
    mutationFn: () =>
      addCompanyReview({ data: { company, rating, role, title, body, pros, cons } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company", company] });
      qc.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Thanks! Your review is live.");
      setOpen(false);
      setRole("");
      setTitle("");
      setBody("");
      setPros("");
      setCons("");
      setRating(5);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const delM = useMutation({
    mutationFn: (id: string) => deleteCompanyReview({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company", company] });
      toast.success("Review removed.");
    },
  });

  if (q.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const data = q.data;
  if (!data) return null;
  const maxBreakdown = Math.max(1, ...data.ratingBreakdown.map((b) => b.count));

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-4 gap-1">
        <Link to="/companies">
          <ArrowLeft className="h-4 w-4" /> All companies
        </Link>
      </Button>

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <CompanyLogo domain={data.companyDomain} name={data.company} size={56} />
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">{data.company}</h1>
              {data.companyType && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  {data.companyType}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <span className="font-display text-3xl font-bold">
                {data.avgRating?.toFixed(1) ?? "—"}
              </span>
              {data.avgRating !== null && <StarRow value={Math.round(data.avgRating)} size={16} />}
            </div>
            <p className="text-xs text-muted-foreground">{data.reviewCount} reviews</p>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Intern reviews</h2>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <PenLine className="h-4 w-4" /> Write a review
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Review {data.company}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <p className="mb-1.5 text-sm font-medium">Your rating</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <button key={i} type="button" onClick={() => setRating(i)}>
                          <Star
                            className={
                              i <= rating
                                ? "h-7 w-7 fill-accent text-accent"
                                : "h-7 w-7 text-muted-foreground/30"
                            }
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input placeholder="Your role (e.g. SQA Intern)" value={role} onChange={(e) => setRole(e.target.value)} />
                  <Input placeholder="Headline (e.g. Great learning experience)" value={title} onChange={(e) => setTitle(e.target.value)} />
                  <Textarea placeholder="Share your experience…" value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input placeholder="Pros" value={pros} onChange={(e) => setPros(e.target.value)} />
                    <Input placeholder="Cons" value={cons} onChange={(e) => setCons(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => addM.mutate()} disabled={addM.isPending}>
                    {addM.isPending ? "Posting…" : "Post review"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {data.reviews.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              No reviews yet. Be the first to share your experience.
            </Card>
          ) : (
            <div className="space-y-4">
              {data.reviews.map((r) => (
                <Card key={r.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <StarRow value={r.rating} />
                      {r.title && <h3 className="mt-1.5 font-display font-semibold">{r.title}</h3>}
                      <p className="text-xs text-muted-foreground">
                        {r.role ? `${r.role} · ` : ""}
                        {r.author_label ?? "Anonymous"}
                      </p>
                    </div>
                    {user?.id && r.user_id === user.id && (
                      <button
                        type="button"
                        onClick={() => delM.mutate(r.id)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Delete review"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {r.body && <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>}
                  {(r.pros || r.cons) && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {r.pros && (
                        <p className="flex items-start gap-1.5 text-xs">
                          <ThumbsUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                          {r.pros}
                        </p>
                      )}
                      {r.cons && (
                        <p className="flex items-start gap-1.5 text-xs">
                          <ThumbsDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                          {r.cons}
                        </p>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-display font-semibold">Rating breakdown</h2>
            <div className="mt-3 space-y-2">
              {data.ratingBreakdown.map((b) => (
                <div key={b.star} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-muted-foreground">{b.star}</span>
                  <Star className="h-3 w-3 fill-accent text-accent" />
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${(b.count / maxBreakdown) * 100}%` }}
                    />
                  </div>
                  <span className="w-5 text-right text-muted-foreground">{b.count}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-display font-semibold">Open roles ({data.internships.length})</h2>
            <div className="mt-3 space-y-2">
              {data.internships.map((j) => (
                <Link
                  key={j.id}
                  to="/internships/$id"
                  params={{ id: j.id }}
                  className="block rounded-lg border border-border p-3 transition-colors hover:border-primary/40"
                >
                  <p className="text-sm font-medium">{j.title}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {j.location}
                    </span>
                    {j.salary && (
                      <span className="flex items-center gap-1">
                        <Wallet className="h-3 w-3" /> {j.salary}
                      </span>
                    )}
                  </p>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
