import { useState } from "react";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Renders a company's logo using a keyless favicon source, with a graceful
 * fallback to an icon when no domain is available or the logo fails to load.
 */
export function CompanyLogo({
  domain,
  name,
  size = 40,
  className,
}: {
  domain?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImg = domain && !failed;

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-lg border bg-background",
        className,
      )}
      style={{ width: size, height: size }}
      aria-label={name ? `${name} logo` : "Company logo"}
    >
      {showImg ? (
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
          alt={name ? `${name} logo` : "Company logo"}
          width={size}
          height={size}
          loading="lazy"
          className="h-full w-full object-contain p-1.5"
          onError={() => setFailed(true)}
        />
      ) : (
        <Building2 className="h-1/2 w-1/2 text-muted-foreground" />
      )}
    </span>
  );
}
