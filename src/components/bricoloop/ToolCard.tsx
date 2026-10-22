import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import type { ToolView } from "@/lib/bricoloop/types";
import { ToolIllustration, ToolStatusBadge } from "./ui";

export function ToolCard({ tool }: { tool: ToolView }) {
  return (
    <article className="card flex flex-col overflow-hidden">
      <ToolIllustration category={tool.category} className="aspect-[4/3]" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {tool.category}
          </span>
          <ToolStatusBadge status={tool.status} />
        </div>
        <h3 className="text-lg leading-tight">{tool.name}</h3>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {tool.owner.firstName} · {tool.owner.district}
        </p>
        <Link to="/outils/$id" params={{ id: tool.id }} className="btn btn-outline mt-auto">
          Voir le détail
        </Link>
      </div>
    </article>
  );
}
