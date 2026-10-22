import { createFileRoute } from "@tanstack/react-router";
import { getService, handle } from "@/lib/bricoloop/http";

export const Route = createFileRoute("/api/users")({
  server: { handlers: { GET: () => handle(() => getService().listUsers()) } },
});
