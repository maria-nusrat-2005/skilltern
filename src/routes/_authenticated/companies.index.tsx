import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, Star, MapPin, Briefcase, ArrowRight } from "lucide-react";
import { listCompanies } from "@/lib/companies.functions";
import { PageHeader } from "@/components/dashboard-bits";
import { CompanyLogo } from "@/components/company-logo";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/companies/")({
  head: () => ({ meta: [{ title: "Companies — Skilltern" }] }),
  component: CompaniesPage,
});

function Stars({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-muted-foreground">No reviews yet</span>;
  return (
    <span className="flex items-center gap-1 text-sm font-medium">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      {value.toFixed(1)}
    </span>
  );
}

function CompaniesPage() {
  const [search, setSearch] = useState("");
  const q = useQuery({ queryKey: ["companies"], queryFn: () => listCompanies() });

  const companies = useMemo(() => {
    const list = q.data?.companies ?? [];
    if (!search.trim()) return list;
    const s = search.toLowerCase();
    return list.filter(
      (c) => c.company.toLowerCase().includes(s) || c.domains.some((d) => d.toLowerCase().includes(s)),
    );
  }, [q.data, search]);

  return (
    <div>
      <PageHeader
        title="Companies"
        description="Explore employers, their open roles, and what interns say about them."
      />

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search companies or domains…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {q.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((c) => (
            <Link
              key={c.company}
              to="/companies/$company"
              params={{ company: c.company }}
              className="group"
            >
              <Card className="flex h-full flex-col p-5 transition-colors group-hover:border-primary/40">
                <div className="flex items-start justify-between gap-3">
                  <CompanyLogo domain={c.companyDomain} name={c.company} logoUrl={c.logoUrl} size={48} />
                  <Stars value={c.avgRating} />
                </div>
                <h3 className="mt-3 font-display font-semibold">{c.company}</h3>
                {c.companyType && (
                  <p className="text-xs text-muted-foreground">{c.companyType}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.domains.slice(0, 3).map((d) => (
                    <Badge key={d} variant="outline" className="font-normal">
                      {d}
                    </Badge>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" /> {c.roleCount} open
                  </span>
                  {c.locations[0] && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {c.locations[0]}
                    </span>
                  )}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
