import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import heroImage from "../assets/hero.jpg";
import appCss from "../styles.css?url";
import { Toaster } from "sonner";
import { Header } from "../components/bricoloop/Header";
import { CurrentUserProvider } from "../lib/bricoloop/current-user";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "BricoLoop" },
      {
        name: "description",
        content:
          "Empruntez et prêtez des outils entre voisins. Les bons outils circulent avec BricoLoop.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "BricoLoop" },
      { property: "og:title", content: "BricoLoop — Prêt d'outils entre voisins" },
      {
        property: "og:description",
        content: "Empruntez et prêtez des outils entre voisins. Les bons outils circulent.",
      },
      { property: "og:image", content: heroImage },
      { property: "og:image:alt", content: "Outils partagés sur un établi" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "BricoLoop — Prêt d'outils entre voisins" },
      {
        name: "twitter:description",
        content: "Empruntez et prêtez des outils entre voisins. Les bons outils circulent.",
      },
      { name: "twitter:image", content: heroImage },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Nunito+Sans:wght@400;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <CurrentUserProvider>
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8">
          <Outlet />
        </main>
        <footer className="border-t py-6 text-center text-xs text-muted-foreground">
          BricoLoop — projet étudiant. Le sélecteur de profil est une démonstration, pas une
          authentification sécurisée.
        </footer>
        <Toaster richColors position="top-center" />
      </CurrentUserProvider>
    </QueryClientProvider>
  );
}
