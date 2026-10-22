import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, MapPin } from "lucide-react";
import { toast } from "sonner";
import { api, HttpError } from "@/lib/bricoloop/api-client";
import { useCurrentUser } from "@/lib/bricoloop/current-user";
import { firstError, newLoanSchema } from "@/lib/bricoloop/validation";
import {
  EmptyState,
  fmtDate,
  LoanStatusBadge,
  ToolIllustration,
  ToolStatusBadge,
} from "@/components/bricoloop/ui";

export const Route = createFileRoute("/outils/$id")({
  head: () => ({
    meta: [
      { title: "Détail de l'outil — BricoLoop" },
      { name: "description", content: "Consultez l'outil et demandez à l'emprunter." },
      { property: "og:title", content: "Détail de l'outil — BricoLoop" },
      { property: "og:description", content: "Consultez l'outil et demandez à l'emprunter." },
    ],
  }),
  component: ToolDetail,
});

const today = () => new Date().toISOString().slice(0, 10);

function ToolDetail() {
  const { id } = Route.useParams();
  const { userId } = useCurrentUser();
  const qc = useQueryClient();
  const {
    data: tool,
    isLoading,
    error,
  } = useQuery({ queryKey: ["tools", id], queryFn: () => api.tool(id), retry: false });
  const { data: history = [] } = useQuery({
    queryKey: ["tools", id, "history"],
    queryFn: () => api.history(id),
    enabled: !!tool,
  });
  const [dates, setDates] = useState({ startDate: today(), endDate: today() });
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: api.requestLoan,
    onSuccess: () => {
      toast.success("Demande envoyée ! Elle est en attente de réponse du propriétaire.");
      qc.invalidateQueries({ queryKey: ["loans"] });
    },
    onError: (e: Error) => setFormError(e.message),
  });

  if (isLoading) return <div className="card h-96 animate-pulse bg-muted" />;
  if (error || !tool)
    return (
      <EmptyState
        title={
          error instanceof HttpError && error.status === 404
            ? "Cet outil n'existe pas"
            : "Erreur de chargement"
        }
      >
        <Link to="/" className="btn btn-outline mt-4">
          Retour au catalogue
        </Link>
      </EmptyState>
    );

  const isMine = tool.ownerId === userId;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = newLoanSchema.safeParse({ toolId: tool.id, ...dates });
    if (!parsed.success) return setFormError(firstError(parsed.error));
    setFormError(null);
    mutation.mutate(parsed.data);
  };

  return (
    <div className="space-y-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Catalogue
      </Link>
      <div className="grid gap-8 md:grid-cols-2">
        <ToolIllustration category={tool.category} className="card aspect-square" />
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {tool.category}
            </span>
            <ToolStatusBadge status={tool.status} />
          </div>
          <h1 className="text-4xl font-bold">{tool.name}</h1>
          <p className="text-muted-foreground">{tool.description || "Pas de description."}</p>
          <p className="flex items-center gap-1 font-semibold">
            <MapPin className="h-4 w-4 text-primary" /> {tool.owner.firstName} ·{" "}
            {tool.owner.district}
          </p>

          {isMine ? (
            <p className="rounded-xl bg-secondary p-4 text-sm text-secondary-foreground">
              C'est votre outil. Gérez les demandes depuis « Mes outils ».
            </p>
          ) : tool.status !== "available" ? (
            <p className="rounded-xl bg-muted p-4 text-sm">
              Cet outil n'est pas disponible pour le moment.
            </p>
          ) : (
            <form onSubmit={submit} className="card space-y-4 p-5" noValidate>
              <h2 className="text-xl">Demander l'emprunt</h2>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1 text-sm font-bold">
                  Du
                  <input
                    type="date"
                    className="field"
                    value={dates.startDate}
                    onChange={(e) => setDates({ ...dates, startDate: e.target.value })}
                  />
                </label>
                <label className="space-y-1 text-sm font-bold">
                  Au
                  <input
                    type="date"
                    className="field"
                    value={dates.endDate}
                    min={dates.startDate}
                    onChange={(e) => setDates({ ...dates, endDate: e.target.value })}
                  />
                </label>
              </div>
              {formError && (
                <p
                  role="alert"
                  className="rounded-lg bg-destructive/10 p-3 text-sm font-semibold text-destructive"
                >
                  {formError}
                </p>
              )}
              <button className="btn btn-primary w-full" disabled={mutation.isPending}>
                {mutation.isPending ? "Envoi…" : "Envoyer la demande"}
              </button>
            </form>
          )}
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-2xl">Historique des prêts</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun prêt pour l'instant.</p>
        ) : (
          <ul className="card divide-y">
            {history.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm"
              >
                <span>
                  <strong>{l.borrower.firstName}</strong> · {fmtDate(l.startDate)} →{" "}
                  {fmtDate(l.endDate)}
                </span>
                <span className="flex items-center gap-2">
                  {l.rating && (
                    <span aria-label={`Note ${l.rating} sur 5`}>{"★".repeat(l.rating)}</span>
                  )}
                  <LoanStatusBadge status={l.status} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
