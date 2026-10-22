import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/bricoloop/api-client";
import { CATEGORIES } from "@/lib/bricoloop/types";
import { firstError, newToolSchema } from "@/lib/bricoloop/validation";

export const Route = createFileRoute("/proposer")({
  head: () => ({
    meta: [
      { title: "Proposer un outil — BricoLoop" },
      { name: "description", content: "Mettez votre outil à disposition de vos voisins." },
      { property: "og:title", content: "Proposer un outil — BricoLoop" },
      { property: "og:description", content: "Mettez votre outil à disposition de vos voisins." },
    ],
  }),
  component: NewTool,
});

function NewTool() {
  const [form, setForm] = useState({ name: "", category: "", description: "" });
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: api.addTool,
    onSuccess: (tool) => {
      qc.invalidateQueries({ queryKey: ["tools"] });
      toast.success(`« ${tool.name} » est maintenant proposé à vos voisins.`);
      navigate({ to: "/outils/$id", params: { id: tool.id } });
    },
    onError: (e: Error) => setError(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = newToolSchema.safeParse(form);
    if (!parsed.success) return setError(firstError(parsed.error));
    setError(null);
    mutation.mutate(parsed.data);
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-3xl">Proposer un outil</h1>
      <p className="mt-1 text-muted-foreground">
        Votre outil sera visible immédiatement comme disponible.
      </p>
      <form onSubmit={submit} className="card mt-6 space-y-5 p-6" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-bold">
            Nom *
          </label>
          <input
            id="name"
            className="field"
            maxLength={60}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex. Ponceuse orbitale"
          />
          <p className="text-xs text-muted-foreground">2 à 60 caractères</p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="category" className="text-sm font-bold">
            Catégorie *
          </label>
          <select
            id="category"
            className="field"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="">Choisir…</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="description" className="text-sm font-bold">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            className="field"
            maxLength={300}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <p className="text-right text-xs text-muted-foreground">{form.description.length}/300</p>
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-destructive/10 p-3 text-sm font-semibold text-destructive"
          >
            {error}
          </p>
        )}
        <button className="btn btn-primary w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Publication…" : "Publier l'outil"}
        </button>
      </form>
    </div>
  );
}
