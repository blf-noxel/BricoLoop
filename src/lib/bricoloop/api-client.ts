import type { LoanView, ToolView, User } from "./types";
import type { NewLoanInput, NewToolInput } from "./validation";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

let currentUserId = "u1";
export function setApiUser(id: string) {
  currentUserId = id;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", "X-User-Id": currentUserId, ...init.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new HttpError(res.status, (data as { error?: string }).error ?? "Erreur inattendue.");
  return data as T;
}

export const api = {
  users: () => request<User[]>("/api/users"),
  tools: (params: { q?: string; category?: string; ownerId?: string } = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v) as [string, string][],
    );
    return request<ToolView[]>(`/api/tools${qs.size ? `?${qs}` : ""}`);
  },
  tool: (id: string) => request<ToolView>(`/api/tools/${id}`),
  history: (id: string) => request<LoanView[]>(`/api/tools/${id}/history`),
  addTool: (input: NewToolInput) =>
    request<ToolView>("/api/tools", { method: "POST", body: JSON.stringify(input) }),
  loans: () => request<{ borrowed: LoanView[]; received: LoanView[] }>("/api/loans"),
  requestLoan: (input: NewLoanInput) =>
    request<LoanView>("/api/loans", { method: "POST", body: JSON.stringify(input) }),
  decide: (id: string, status: "accepted" | "refused") =>
    request<LoanView>(`/api/loans/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  returnLoan: (id: string) => request<LoanView>(`/api/loans/${id}/return`, { method: "PATCH" }),
  rate: (id: string, rating: number) =>
    request<LoanView>(`/api/loans/${id}/rating`, {
      method: "PATCH",
      body: JSON.stringify({ rating }),
    }),
};
