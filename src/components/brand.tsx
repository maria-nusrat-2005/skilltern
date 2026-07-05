import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import briefcase from "@/assets/briefcase.png";

export function Brand({ className, to = "/" }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={cn("flex items-center gap-2 font-display", className)}>
      <img src={briefcase} alt="Skilltern" className="h-8 w-8 rounded-lg object-contain" />
      <span className="text-lg font-bold tracking-tight">Skilltern</span>
    </Link>
  );
}
