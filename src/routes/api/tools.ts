import { createFileRoute } from "@tanstack/react-router";
import { getService, handle, readJson, userIdOf } from "@/lib/bricoloop/http";

export const Route = createFileRoute("/api/tools")({
  server: {
    handlers: {
      GET: ({ request }) =>
        handle(() => {
          const url = new URL(request.url);
          return getService().listTools({
            q: url.searchParams.get("q") ?? undefined,
            category: url.searchParams.get("category") ?? undefined,
            ownerId: url.searchParams.get("ownerId") ?? undefined,
          });
        }),
      POST: async ({ request }) => {
        const body = await readJson(request);
        return handle(() => getService().addTool(userIdOf(request), body), 201);
      },
    },
  },
});
