import { ApiError, BricoLoopService } from "./service";

// In-memory store for the demo. Lives as long as the server instance.
let service: BricoLoopService | null = null;
export function getService() {
  if (!service) service = new BricoLoopService();
  return service;
}

export function userIdOf(request: Request) {
  return request.headers.get("x-user-id") ?? "";
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function handle(fn: () => unknown | Promise<unknown>, okStatus = 200) {
  try {
    const data = await fn();
    return Response.json(data, { status: okStatus });
  } catch (e) {
    if (e instanceof ApiError) return Response.json({ error: e.message }, { status: e.status });
    console.error(e);
    return Response.json({ error: "Erreur interne du serveur." }, { status: 500 });
  }
}
