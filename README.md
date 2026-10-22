# BricoLoop — Équipe <Les bricoleurs>


**Membres :** <Noah Azemar>, <Jordan Fuentes>, <Ethan Burgalet >, <Florian Ginestet>, <Matis Carrera> 
**Rotation PO :** Lancement PO : PO 1:Jordan Fuentes PO 2: 
**Vidéo :** <lien>

## Installer, lancer, tester
```bash
npm install
npm start          # http://localhost:3000 (interface web + API)
npm run check      # lint (0 warning) + tests
```
Utilisateur courant : en-tête `X-User-Id` (1 à 4) ou liste déroulante du front.

## API
| Méthode | Route | Story |
|---|---|---|
| GET | `/api/tools?category=&q=` | US-01, US-10, US-11 |
| POST | `/api/tools` | US-02 |
| GET | `/api/tools/:id` | US-03 |
| POST | `/api/tools/:id/loans` | US-04, US-06 |
| POST | `/api/loans/:id/accept` · `/refuse` | US-05 |
| POST | `/api/loans/:id/return` | US-07 |
| GET | `/api/my/loans` | US-08 |
| GET | `/api/my/tools` | US-12 |
| POST | `/api/loans/:id/rating` | US-13 |
| GET | `/api/tools/:id/history` | US-14 |

## Stories Done
| Story | PR |
|---|---|
| US-01 … | #? |
