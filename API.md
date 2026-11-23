# BricoLoop API

The website is a TanStack Start frontend. Its REST API runs separately in Express from `backend/src`.

- Frontend: `npm run dev`
- Backend: `npm run backend` (defaults to `http://localhost:4000`)
- Browser API base: `VITE_API_BASE_URL` (see `.env.example`)
- Data is saved in `backend/.data/bricoloop.json`; the file is created with demo data the first time the server starts.
- Demo user selection is sent in `X-User-Id` (`u1` to `u4`). This is not secure authentication.

Every error response is `{ "error": "<message en français>" }`. Malformed JSON returns 400, unknown routes 404.

| Method | Route | Body | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/health` | — | 200 `{status: "ok"}` | — |
| GET | `/api/users` | — | 200 `User[]` | — |
| GET | `/api/tools?q=&category=&ownerId=` | — | 200 `ToolView[]`, available first, then by name | — |
| GET | `/api/tools/:id` | — | 200 `ToolView` | 404 |
| POST | `/api/tools` | `{name, category, description?}` | 201 `ToolView` | 400, 401 |
| GET | `/api/tools/:id/history` | — | 200 `LoanView[]` (accepted and returned, newest first) | 404 |
| GET | `/api/loans` | — | 200 `{borrowed: LoanView[], received: LoanView[]}` | 401 |
| POST | `/api/loans` | `{toolId, startDate, endDate}` (`YYYY-MM-DD`) | 201 `LoanView` (pending) | 400, 401, 403 (own tool), 404, 409 (unavailable or overlapping) |
| PATCH | `/api/loans/:id` | `{status: "accepted" \| "refused"}` | 200 `LoanView` | 400, 401, 403 (not owner), 404, 409 (already decided or overlapping) |
| PATCH | `/api/loans/:id/return` | — | 200 `LoanView` | 401, 403, 404, 409 (not accepted) |
| PATCH | `/api/loans/:id/rating` | `{rating: 1..5}` | 200 `LoanView` | 400, 401, 403, 404, 409 (not returned or already rated) |

`User`, `ToolView` and `LoanView` are defined in `src/lib/bricoloop/types.ts`.

## Scripts

- `npm test` runs the frontend tests and the backend HTTP tests (`backend/test/api.test.js`).
