import { Brush, Drill, Leaf, Ruler, Sparkles, Wrench, type LucideIcon } from "lucide-react";
import type { Category, LoanStatus, ToolStatus } from "@/lib/bricoloop/types";
import { LOAN_STATUS_LABEL, TOOL_STATUS_LABEL } from "@/lib/bricoloop/types";
import { cn } from "@/lib/utils";

export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  Perçage: Drill,
  Jardinage: Leaf,
  Peinture: Brush,
  Nettoyage: Sparkles,
  Mesure: Ruler,
  Autre: Wrench,
};

export function ToolIllustration({
  category,
  className,
}: {
  category: Category;
  className?: string;
}) {
  const Icon = CATEGORY_ICON[category] ?? Wrench;
  return (
    <div className={cn("flex items-center justify-center bg-secondary text-primary", className)}>
      <Icon className="h-1/3 w-1/3" strokeWidth={1.4} aria-hidden />
    </div>
  );
}

const toolTone: Record<ToolStatus, string> = {
  available: "bg-success/15 text-success",
  lent: "bg-warning/20 text-foreground",
  unavailable: "bg-muted text-muted-foreground",
};
const loanTone: Record<LoanStatus, string> = {
  pending: "bg-warning/20 text-foreground",
  accepted: "bg-success/15 text-success",
  refused: "bg-destructive/10 text-destructive",
  returned: "bg-muted text-muted-foreground",
};

export function ToolStatusBadge({ status }: { status: ToolStatus }) {
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", toolTone[status])}>
      {TOOL_STATUS_LABEL[status]}
    </span>
  );
}
export function LoanStatusBadge({ status }: { status: LoanStatus }) {
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", loanTone[status])}>
      {LOAN_STATUS_LABEL[status]}
    </span>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="card p-10 text-center">
      <p className="font-display text-xl">{title}</p>
      {children && <div className="mt-2 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function Loading() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card h-64 animate-pulse bg-muted" />
      ))}
    </div>
  );
}

export function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
