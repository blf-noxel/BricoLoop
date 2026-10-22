import { createFileRoute } from "@tanstack/react-router";
import { getService, handle, readJson, userIdOf } from "@/lib/bricoloop/http";

export const Route = createFileRoute("/api/loans")({
  server: {
    handlers: {
      GET: ({ request }) => handle(() => getService().listLoans(userIdOf(request))),
      POST: async ({ request }) => {
        const body = await readJson(request);
        return handle(() => getService().requestLoan(userIdOf(request), body), 201);
      },
    },
  },
});
