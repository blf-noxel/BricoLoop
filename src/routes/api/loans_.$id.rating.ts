import { createFileRoute } from "@tanstack/react-router";
import { getService, handle, readJson, userIdOf } from "@/lib/bricoloop/http";

export const Route = createFileRoute("/api/loans_/$id/rating")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        const body = await readJson(request);
        return handle(() => getService().rateLoan(userIdOf(request), params.id, body));
      },
    },
  },
});
