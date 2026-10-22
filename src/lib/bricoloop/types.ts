export const CATEGORIES = [
  "Perçage",
  "Jardinage",
  "Peinture",
  "Nettoyage",
  "Mesure",
  "Autre",
] as const;
export type Category = (typeof CATEGORIES)[number];

export type ToolStatus = "available" | "lent" | "unavailable";
export type LoanStatus = "pending" | "accepted" | "refused" | "returned";

export interface User {
  id: string;
  firstName: string;
  district: string;
}

export interface Tool {
  id: string;
  ownerId: string;
  name: string;
  category: Category;
  description: string;
  status: ToolStatus;
}

export interface Loan {
  id: string;
  toolId: string;
  borrowerId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  status: LoanStatus;
  rating?: number | undefined;
  createdAt: string;
}

/** Tool enriched with owner info, as returned by the API. */
export interface ToolView extends Tool {
  owner: User;
}

export interface LoanView extends Loan {
  tool: Tool;
  owner: User;
  borrower: User;
}

export const TOOL_STATUS_LABEL: Record<ToolStatus, string> = {
  available: "Disponible",
  lent: "Prêté",
  unavailable: "Indisponible",
};

export const LOAN_STATUS_LABEL: Record<LoanStatus, string> = {
  pending: "En attente",
  accepted: "Acceptée",
  refused: "Refusée",
  returned: "Rendu",
};
