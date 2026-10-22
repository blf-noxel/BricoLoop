# BricoLoop — Contrat API

Architecture : TanStack Start (React + TypeScript + Vite). Pas d'Express : les routes API sont des routes serveur TanStack (`src/routes/api/*`), la logique métier est dans `src/lib/bricoloop/service.ts`.
Stockage : en mémoire côté serveur (données de démo réinitialisées au redémarrage du serveur).
Utilisateur courant : en-tête `X-User-Id` (u1…u4), choisi via le sélecteur de profil — **démonstration, pas une authentification sécurisée**.

| Méthode | Route | Description | Erreurs |
|---|---|---|---|
| GET | /health | État du serveur | — |
| GET | /api/users | Profils de démo | — |
| GET | /api/tools?q=&category=&ownerId= | Catalogue (disponibles d'abord) | — |
| GET | /api/tools/:id | Détail | 404 |
| POST | /api/tools | `{name, category, description?}` | 400, 401 |
| GET | /api/tools/:id/history | Prêts acceptés/rendus, plus récent d'abord | 404 |
| GET | /api/loans | `{borrowed, received}` de l'utilisateur | 401 |
| POST | /api/loans | `{toolId, startDate, endDate}` → pending | 400, 403 (propre outil), 404, 409 (indisponible/chevauchement) |
| PATCH | /api/loans/:id | `{status: accepted|refused}` | 400, 403, 404, 409 (déjà traitée) |
| PATCH | /api/loans/:id/return | Déclarer rendu | 403, 409 |
| PATCH | /api/loans/:id/rating | `{rating: 1..5}` une fois après retour | 400, 403, 409 |

## Scripts
- `bun run dev` — démarrer
- `bunx vitest run` — tests (`src/test/bricoloop.test.ts`)
- `bunx eslint src` — qualité
