import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarCheck, HandHeart, Search, Undo2 } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { api } from "@/lib/bricoloop/api-client";
import { CATEGORIES } from "@/lib/bricoloop/types";
import { ToolCard } from "@/components/bricoloop/ToolCard";
import { EmptyState, Loading } from "@/components/bricoloop/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BricoLoop — Prêt d'outils entre voisins" },
      {
        name: "description",
        content:
          "Empruntez une perceuse, une tondeuse ou un escabeau à un voisin en quelques clics.",
      },
      { property: "og:title", content: "BricoLoop — Prêt d'outils entre voisins" },
      { property: "og:description", content: "Les bons outils circulent entre voisins." },
    ],
  }),
  component: Index,
});

const steps = [
  {
    icon: Search,
    title: "Trouvez",
    text: "Cherchez l'outil dont vous avez besoin dans votre quartier.",
  },
  {
    icon: CalendarCheck,
    title: "Demandez",
    text: "Choisissez vos dates, le propriétaire accepte ou refuse.",
  },
  {
    icon: Undo2,
    title: "Rendez",
    text: "Rapportez l'outil : il redevient disponible pour les voisins.",
  },
];

function Index() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const {
    data: tools,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["tools", { q, category }],
    queryFn: () => api.tools({ q, category }),
  });
  const available = tools?.filter((t) => t.status === "available").length ?? 0;

  return (
    <div className="space-y-14">
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div className="space-y-5">
          <p className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm font-bold text-secondary-foreground">
            <HandHeart className="h-4 w-4" /> Partage entre voisins
          </p>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            Les bons outils circulent entre voisins.
          </h1>
          <p className="text-lg text-muted-foreground">
            Pourquoi acheter une perceuse utilisée dix minutes par an ? Empruntez-la à côté de chez
            vous, prêtez la vôtre.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#catalogue" className="btn btn-primary">
              Découvrir les outils
            </a>
            <Link to="/proposer" className="btn btn-outline">
              Proposer un outil
            </Link>
          </div>
        </div>
        <img
          src={hero}
          alt="Outils partagés sur un établi"
          width={1280}
          height={896}
          className="card aspect-[4/3] w-full object-cover"
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.title} className="card p-5">
            <s.icon className="h-6 w-6 text-primary" />
            <h2 className="mt-3 text-lg">
              {i + 1}. {s.title}
            </h2>
            <p className="text-sm text-muted-foreground">{s.text}</p>
          </div>
        ))}
      </section>

      <section id="catalogue" className="scroll-mt-24 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl">Catalogue</h2>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              <strong className="text-primary">{available}</strong> outil{available > 1 ? "s" : ""}{" "}
              disponible{available > 1 ? "s" : ""}
            </p>
          </div>
          <label className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="field pl-9"
              placeholder="Rechercher un outil…"
              aria-label="Rechercher un outil"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par catégorie">
          {["", ...CATEGORIES].map((c) => (
            <button
              key={c || "all"}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={cn(
                "rounded-full border px-3 py-1 text-sm font-semibold",
                category === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card hover:bg-muted",
              )}
            >
              {c || "Toutes"}
            </button>
          ))}
        </div>
        {isLoading ? (
          <Loading />
        ) : isError ? (
          <EmptyState title="Impossible de charger le catalogue">
            Réessayez dans un instant.
          </EmptyState>
        ) : !tools?.length ? (
          <EmptyState title="Aucun outil trouvé">
            {q || category
              ? "Essayez une autre recherche ou catégorie."
              : "Soyez le premier à proposer un outil !"}
          </EmptyState>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {tools.map((t) => (
              <ToolCard key={t.id} tool={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
