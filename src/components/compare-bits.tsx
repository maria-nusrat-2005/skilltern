import { Link } from "@tanstack/react-router";
import { GitCompareArrows, X, Check } from "lucide-react";
import { useCompare } from "@/hooks/use-compare";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CompareToggle({ id, className }: { id: string; className?: string }) {
  const { has, toggle, isFull } = useCompare();
  const active = has(id);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
      disabled={!active && isFull}
      aria-label={active ? "Remove from compare" : "Add to compare"}
      className={cn(
        "grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition-colors disabled:opacity-40",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {active ? <Check className="h-4 w-4" /> : <GitCompareArrows className="h-4 w-4" />}
    </button>
  );
}

export function CompareBar() {
  const { ids, clear } = useCompare();
  if (ids.length === 0) return null;
  return (
    <div className="fixed inset-x-0 bottom-16 z-40 flex justify-center px-4 lg:bottom-6 lg:pl-64">
      <div className="flex items-center gap-3 rounded-full border border-border bg-card/95 px-4 py-2.5 shadow-lg backdrop-blur">
        <GitCompareArrows className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">{ids.length} selected to compare</span>
        <Button asChild size="sm" disabled={ids.length < 2}>
          <Link to="/compare" search={{ ids: ids.join(",") }}>
            Compare
          </Link>
        </Button>
        <button
          type="button"
          onClick={clear}
          className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Clear comparison"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
