import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, keepPreviousData, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, BellPlus, Bell, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { listInternships, getInternshipFacets } from "@/lib/internships.functions";
import {
  listSavedSearches,
  saveSearch,
  markSearchSeen,
  deleteSavedSearch,
} from "@/lib/saved-searches.functions";
import { PageHeader } from "@/components/dashboard-bits";
import { InternshipCard } from "@/components/internship-card";
import { BookmarkButton } from "@/components/bookmark-button";
import { CompareToggle } from "@/components/compare-bits";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/internships/")({
  head: () => ({ meta: [{ title: "Internships — Skilltern" }] }),
  component: InternshipsPage,
});

const WORK_MODELS = ["all", "Onsite", "Remote", "Hybrid"];

function InternshipsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("all");
  const [workModel, setWorkModel] = useState("all");
  const [page, setPage] = useState(1);

  const facetsQ = useQuery({ queryKey: ["facets"], queryFn: () => getInternshipFacets() });
  const savedQ = useQuery({ queryKey: ["saved-searches"], queryFn: () => listSavedSearches() });
  const listQ = useQuery({
    queryKey: ["internships", query, domain, workModel, page],
    queryFn: () => listInternships({ data: { search: query, domain, workModel, page, pageSize: 12 } }),
    placeholderData: keepPreviousData,
  });

  const saveM = useMutation({
    mutationFn: (name: string) =>
      saveSearch({ data: { name, filters: { search: query, domain, workModel } } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved-searches"] });
      toast.success("Search saved. We'll track new matches for you.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const delM = useMutation({
    mutationFn: (id: string) => deleteSavedSearch({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-searches"] }),
  });

  const seenM = useMutation({
    mutationFn: (v: { id: string; count: number }) => markSearchSeen({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-searches"] }),
  });

  const items = listQ.data?.items ?? [];
  const total = listQ.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 12));
  const hasFilters = query !== "" || domain !== "all" || workModel !== "all";
  const saved = savedQ.data?.searches ?? [];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setQuery(search);
  };

  const onSave = () => {
    const name = window.prompt("Name this search (e.g. Remote AI/ML internships):");
    if (name?.trim()) saveM.mutate(name.trim());
  };

  const applySaved = (f: { search?: string; domain?: string; workModel?: string }) => {
    setSearch(f.search ?? "");
    setQuery(f.search ?? "");
    setDomain(f.domain ?? "all");
    setWorkModel(f.workModel ?? "all");
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Internships"
        description={`${total} open roles across Bangladesh.`}
        action={
          hasFilters ? (
            <Button variant="outline" size="sm" className="gap-2" onClick={onSave} disabled={saveM.isPending}>
              <BellPlus className="h-4 w-4" /> Save search
            </Button>
          ) : undefined
        }
      />

      {saved.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {saved.map((s) => (
            <div
              key={s.id}
              className="group flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm"
            >
              <button
                type="button"
                className="flex items-center gap-1.5 font-medium hover:text-primary"
                onClick={() => {
                  applySaved(s.filters);
                  if (s.newCount > 0) seenM.mutate({ id: s.id, count: s.currentCount });
                }}
              >
                <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                {s.name}
              </button>
              {s.newCount > 0 && (
                <Badge className="gap-1 bg-accent text-accent-foreground">
                  <Sparkles className="h-3 w-3" />
                  {s.newCount} new
                </Badge>
              )}
              <button
                type="button"
                onClick={() => delM.mutate(s.id)}
                className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                aria-label="Delete saved search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <form onSubmit={submit} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title or company…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </form>
        <Select
          value={domain}
          onValueChange={(v) => {
            setDomain(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Domain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All domains</SelectItem>
            {(facetsQ.data?.domains ?? []).map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={workModel}
          onValueChange={(v) => {
            setWorkModel(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Work model" />
          </SelectTrigger>
          <SelectContent>
            {WORK_MODELS.map((w) => (
              <SelectItem key={w} value={w}>
                {w === "all" ? "All models" : w}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {listQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">No internships match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="relative">
              <div className="absolute bottom-3 right-3 z-10 flex gap-1.5">
                <CompareToggle id={item.id} />
                <BookmarkButton internshipId={item.id} />
              </div>
              <InternshipCard item={item} />
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
