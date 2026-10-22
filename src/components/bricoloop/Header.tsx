import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Repeat, UserRound } from "lucide-react";
import { api } from "@/lib/bricoloop/api-client";
import { useCurrentUser } from "@/lib/bricoloop/current-user";

const nav = [
  { to: "/", label: "Catalogue" },
  { to: "/proposer", label: "Proposer" },
  { to: "/mes-outils", label: "Mes outils" },
  { to: "/mes-emprunts", label: "Mes emprunts" },
] as const;

export function Header() {
  const { userId, setUserId } = useCurrentUser();
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: api.users });
  return (
    <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link
          to="/"
          className="flex items-center gap-2 font-display text-xl font-bold text-primary"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Repeat className="h-5 w-5" />
          </span>
          BricoLoop
        </Link>
        <nav className="order-3 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
              activeProps={{ className: "bg-secondary text-secondary-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <label className="ml-auto flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm">
          <UserRound className="h-4 w-4 text-primary" />
          <span className="hidden text-muted-foreground md:inline">Profil démo :</span>
          <select
            aria-label="Choisir le profil de démonstration"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="bg-transparent font-bold focus:outline-none"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} ({u.district})
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  );
}
