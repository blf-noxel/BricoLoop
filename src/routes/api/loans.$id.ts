import { createFileRoute } from "@tanstack/react-router";
import { getService, handle, readJson, userIdOf } from "@/lib/bricoloop/http";

export const Route = createFileRoute("/api/loans/$id")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const body = await readJson(request);
        return handle(() => getService().decideLoan(userIdOf(request), params.id, body));
      },
    },
  },
});
