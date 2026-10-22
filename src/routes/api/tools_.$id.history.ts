import { createFileRoute } from "@tanstack/react-router";
import { getService, handle } from "@/lib/bricoloop/http";

export const Route = createFileRoute("/api/tools_/$id/history")({
  server: { handlers: { GET: ({ params }) => handle(() => getService().history(params.id)) } },
});
