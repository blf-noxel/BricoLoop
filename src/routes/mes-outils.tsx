import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Star, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/bricoloop/api-client";
import { useCurrentUser } from "@/lib/bricoloop/current-user";
import type { LoanView } from "@/lib/bricoloop/types";
import {
  EmptyState,
  fmtDate,
  LoanStatusBadge,
  ToolIllustration,
  ToolStatusBadge,
} from "@/components/bricoloop/ui";

export const Route = createFileRoute("/mes-outils")({
  head: () => ({
    meta: [
      { title: "Mes outils et demandes reçues — BricoLoop" },
      { name: "description", content: "Gérez vos outils et répondez aux demandes de vos voisins." },
      { property: "og:title", content: "Mes outils — BricoLoop" },
      {
        property: "og:description",
        content: "Gérez vos outils et répondez aux demandes de vos voisins.",
      },
    ],
  }),
  component: MyTools,
});

function MyTools() {
  const { userId } = useCurrentUser();
  const qc = useQueryClient();
  const tools = useQuery({
    queryKey: ["tools", { ownerId: userId }],
    queryFn: () => api.tools({ ownerId: userId }),
  });
  const loans = useQuery({ queryKey: ["loans", userId], queryFn: api.loans });

  const act = useMutation({
    mutationFn: async (a: { loan: LoanView; kind: "accepted" | "refused" | "return" | number }) =>
      a.kind === "return"
        ? api.returnLoan(a.loan.id)
        : typeof a.kind === "number"
          ? api.rate(a.loan.id, a.kind)
          : api.decide(a.loan.id, a.kind),
    onSuccess: (_, a) => {
      const msg = {
        accepted: "Demande acceptée, l'outil est prêté.",
        refused: "Demande refusée.",
        return: "Retour enregistré, l'outil est de nouveau disponible.",
      };
      toast.success(typeof a.kind === "number" ? "Merci pour votre note !" : msg[a.kind]);
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const received = loans.data?.received ?? [];
  const pending = received.filter((l) => l.status === "pending").length;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">Mes outils</h1>
        <Link to="/proposer" className="btn btn-primary">
          Proposer un outil
        </Link>
      </div>

      {tools.isLoading ? (
        <div className="card h-32 animate-pulse bg-muted" />
      ) : !tools.data?.length ? (
        <EmptyState title="Vous ne proposez encore aucun outil" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tools.data.map((t) => (
            <Link
              key={t.id}
              to="/outils/$id"
              params={{ id: t.id }}
              className="card flex items-center gap-3 p-3 hover:bg-muted"
            >
              <ToolIllustration category={t.category} className="h-14 w-14 rounded-lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{t.name}</p>
                <ToolStatusBadge status={t.status} />
              </div>
            </Link>
          ))}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-2xl">
          Demandes reçues{" "}
          <span className="ml-1 rounded-full bg-warning/20 px-2.5 py-0.5 align-middle font-sans text-sm font-bold">
            {pending} en attente
          </span>
        </h2>
        {received.length === 0 ? (
          <EmptyState title="Aucune demande reçue" />
        ) : (
          <ul className="card divide-y">
            {received.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-bold">{l.tool.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {l.borrower.firstName} ({l.borrower.district}) · {fmtDate(l.startDate)} →{" "}
                    {fmtDate(l.endDate)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <LoanStatusBadge status={l.status} />
                  {l.status === "pending" && (
                    <>
                      <button
                        className="btn btn-primary px-3 py-1.5"
                        disabled={act.isPending}
                        onClick={() => act.mutate({ loan: l, kind: "accepted" })}
                      >
                        <Check className="h-4 w-4" /> Accepter
                      </button>
                      <button
                        className="btn btn-danger px-3 py-1.5"
                        disabled={act.isPending}
                        onClick={() => act.mutate({ loan: l, kind: "refused" })}
                      >
                        <X className="h-4 w-4" /> Refuser
                      </button>
                    </>
                  )}
                  {l.status === "accepted" && (
                    <button
                      className="btn btn-outline px-3 py-1.5"
                      disabled={act.isPending}
                      onClick={() => act.mutate({ loan: l, kind: "return" })}
                    >
                      <Undo2 className="h-4 w-4" /> Déclarer rendu
                    </button>
                  )}
                  {l.status === "returned" &&
                    (l.rating ? (
                      <span className="text-sm text-warning" aria-label={`Note ${l.rating} sur 5`}>
                        {"★".repeat(l.rating)}
                      </span>
                    ) : (
                      <span className="flex" role="group" aria-label="Noter l'emprunteur">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            aria-label={`${n} sur 5`}
                            disabled={act.isPending}
                            onClick={() => act.mutate({ loan: l, kind: n })}
                            className="p-0.5 text-muted-foreground hover:text-warning"
                          >
                            <Star className="h-4 w-4" />
                          </button>
                        ))}
                      </span>
                    ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
