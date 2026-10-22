import { createFileRoute } from "@tanstack/react-router";
import { getService, handle } from "@/lib/bricoloop/http";

export const Route = createFileRoute("/api/tools/$id")({
  server: { handlers: { GET: ({ params }) => handle(() => getService().getTool(params.id)) } },
});
