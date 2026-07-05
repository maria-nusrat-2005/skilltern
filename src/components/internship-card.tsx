import { Link } from "@tanstack/react-router";
import { MapPin, Wallet, Clock, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CompanyLogo } from "@/components/company-logo";

export type InternshipListItem = {
  id: string;
  title: string;
  company: string;
  company_type?: string | null;
  company_domain?: string | null;
  location: string;
  salary?: string | null;
  duration?: string | null;
  domain?: string | null;
  work_model?: string | null;
  tech_stack?: unknown;
};

function asArr(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : [];
}

export function InternshipCard({ item }: { item: InternshipListItem }) {
  const tech = asArr(item.tech_stack).slice(0, 4);
  return (
    <Link to="/internships/$id" params={{ id: item.id }} className="group block">
      <Card className="h-full gap-0 p-5 transition-all hover:border-primary/40 hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <CompanyLogo domain={item.company_domain} name={item.company} size={44} />
            <div className="min-w-0">
              <h3 className="truncate font-display text-base font-semibold group-hover:text-primary">
                {item.title}
              </h3>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                {item.company}
              </p>
            </div>
          </div>
          {item.work_model && (
            <Badge variant="secondary" className="shrink-0">
              {item.work_model}
            </Badge>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {item.location}
          </span>
          {item.salary && (
            <span className="flex items-center gap-1">
              <Wallet className="h-3.5 w-3.5" />
              {item.salary}
            </span>
          )}
          {item.duration && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {item.duration}
            </span>
          )}
        </div>

        {tech.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {tech.map((t) => (
              <Badge key={t} variant="outline" className="font-normal">
                {t}
              </Badge>
            ))}
          </div>
        )}

        {item.domain && (
          <p className="mt-4 text-xs font-medium text-primary">{item.domain}</p>
        )}
      </Card>
    </Link>
  );
}
