import { createFileRoute } from "@tanstack/react-router";
import { getService, handle, userIdOf } from "@/lib/bricoloop/http";

export const Route = createFileRoute("/api/loans_/$id/return")({
  server: {
    handlers: {
      PATCH: ({ request, params }) =>
        handle(() => getService().returnLoan(userIdOf(request), params.id)),
    },
  },
});
