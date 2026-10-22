import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/bricoloop/api-client";
import { useCurrentUser } from "@/lib/bricoloop/current-user";
import { EmptyState, fmtDate, LoanStatusBadge } from "@/components/bricoloop/ui";

export const Route = createFileRoute("/mes-emprunts")({
  head: () => ({
    meta: [
      { title: "Mes emprunts — BricoLoop" },
      { name: "description", content: "Suivez vos demandes d'emprunt d'outils." },
      { property: "og:title", content: "Mes emprunts — BricoLoop" },
      { property: "og:description", content: "Suivez vos demandes d'emprunt d'outils." },
    ],
  }),
  component: MyLoans,
});

function MyLoans() {
  const { userId } = useCurrentUser();
  const { data, isLoading } = useQuery({ queryKey: ["loans", userId], queryFn: api.loans });
  const loans = data?.borrowed ?? [];
  return (
    <div className="space-y-6">
      <h1 className="text-3xl">Mes emprunts</h1>
      {isLoading ? (
        <div className="card h-40 animate-pulse bg-muted" />
      ) : loans.length === 0 ? (
        <EmptyState title="Aucune demande pour l'instant">
          <Link to="/" className="btn btn-primary mt-4">
            Parcourir le catalogue
          </Link>
        </EmptyState>
      ) : (
        <ul className="card divide-y">
          {loans.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <Link
                  to="/outils/$id"
                  params={{ id: l.toolId }}
                  className="font-bold hover:underline"
                >
                  {l.tool.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  Prêté par {l.owner.firstName} ({l.owner.district}) · {fmtDate(l.startDate)} →{" "}
                  {fmtDate(l.endDate)}
                </p>
              </div>
              <LoanStatusBadge status={l.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
