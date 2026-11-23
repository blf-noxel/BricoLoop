# BricoLoop — Équipe <Les bricoleurs>

BricoLoop facilite le prêt et l'emprunt d'outils entre voisins. Trouvez un outil près de chez
vous, faites une demande de prêt et rendez-le pour qu'il puisse circuler à nouveau.

**Membres :** <Noah Azemar>, <Jordan Fuentes>, <Ethan Burgalet >, <Florian Ginestet>, <Matis Carrera> 
**Rotation PO :** Lancement PO : PO 1:Jordan Fuentes PO 2: 
**Vidéo :** <lien>

## Installer, lancer, tester
```bash
npm install
npm run backend    # API Express sur http://localhost:4000
npm run dev        # site web sur http://localhost:8080 (dans un 2e terminal)
npm test           # tests du site et de l'API
npm run lint       # lint
```
Utilisateur courant : en-tête `X-User-Id` (`u1` à `u4`) ou sélecteur « Profil démo » du site.
Les données sont enregistrées dans `backend/.data/bricoloop.json` (créé au premier lancement).

## API
Détails (corps, réponses, erreurs) dans [API.md](API.md).

| Méthode | Route | Story |
|---|---|---|
| GET | `/api/tools?category=&q=&ownerId=` | US-01, US-10, US-11, US-12 |
| POST | `/api/tools` | US-02 |
| GET | `/api/tools/:id` | US-03 |
| POST | `/api/loans` | US-04, US-06 |
| PATCH | `/api/loans/:id` (`accepted` / `refused`) | US-05 |
| PATCH | `/api/loans/:id/return` | US-07 |
| GET | `/api/loans` | US-08 |
| PATCH | `/api/loans/:id/rating` | US-13 |
| GET | `/api/tools/:id/history` | US-14 |

## Stories Done
| Story | PR |
|---|---|
| US-01 … | #? |
