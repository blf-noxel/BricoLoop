import type { Database } from "./seed";
import { createSeed } from "./seed";
import type { Category, Loan, LoanView, Tool, ToolView, User } from "./types";
import {
  decisionSchema,
  firstError,
  newLoanSchema,
  newToolSchema,
  ratingSchema,
} from "./validation";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const STATUS_ORDER = { available: 0, lent: 1, unavailable: 2 } as const;

function overlaps(
  a: { startDate: string; endDate: string },
  b: { startDate: string; endDate: string },
) {
  return a.startDate <= b.endDate && b.startDate <= a.endDate;
}

/** Pure business logic over an in-memory database. */
export class BricoLoopService {
  private seq = 100;
  constructor(public db: Database = createSeed()) {}

  private id(prefix: string) {
    this.seq += 1;
    return `${prefix}${this.seq}-${Math.random().toString(36).slice(2, 7)}`;
  }

  listUsers(): User[] {
    return this.db.users;
  }

  requireUser(userId: string | null | undefined): User {
    const user = this.db.users.find((u) => u.id === userId);
    if (!user)
      throw new ApiError(401, "Utilisateur non identifié (en-tête X-User-Id manquant ou inconnu).");
    return user;
  }

  private user(id: string) {
    return this.db.users.find((u) => u.id === id)!;
  }

  private view(tool: Tool): ToolView {
    return { ...tool, owner: this.user(tool.ownerId) };
  }

  private loanView(loan: Loan): LoanView {
    const tool = this.db.tools.find((t) => t.id === loan.toolId)!;
    return { ...loan, tool, owner: this.user(tool.ownerId), borrower: this.user(loan.borrowerId) };
  }

  listTools(
    filters: {
      q?: string | undefined;
      category?: string | undefined;
      ownerId?: string | undefined;
    } = {},
  ): ToolView[] {
    const q = filters.q?.trim().toLowerCase();
    return this.db.tools
      .filter((t) => !filters.category || t.category === filters.category)
      .filter((t) => !filters.ownerId || t.ownerId === filters.ownerId)
      .filter(
        (t) => !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
      )
      .slice()
      .sort(
        (a, b) =>
          STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.name.localeCompare(b.name, "fr"),
      )
      .map((t) => this.view(t));
  }

  getTool(id: string): ToolView {
    const tool = this.db.tools.find((t) => t.id === id);
    if (!tool) throw new ApiError(404, "Cet outil n'existe pas.");
    return this.view(tool);
  }

  addTool(userId: string, input: unknown): ToolView {
    this.requireUser(userId);
    const parsed = newToolSchema.safeParse(input);
    if (!parsed.success) throw new ApiError(400, firstError(parsed.error));
    const tool: Tool = {
      id: this.id("t"),
      ownerId: userId,
      name: parsed.data.name,
      category: parsed.data.category as Category,
      description: parsed.data.description ?? "",
      status: "available",
    };
    this.db.tools.push(tool);
    return this.view(tool);
  }

  /** Loans where the user is borrower, plus loans received on their tools. */
  listLoans(userId: string): { borrowed: LoanView[]; received: LoanView[] } {
    this.requireUser(userId);
    const myToolIds = new Set(this.db.tools.filter((t) => t.ownerId === userId).map((t) => t.id));
    const borrowed = this.db.loans
      .filter((l) => l.borrowerId === userId)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .map((l) => this.loanView(l));
    const received = this.db.loans
      .filter((l) => myToolIds.has(l.toolId))
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .map((l) => this.loanView(l));
    return { borrowed, received };
  }

  requestLoan(userId: string, input: unknown): LoanView {
    this.requireUser(userId);
    const parsed = newLoanSchema.safeParse(input);
    if (!parsed.success) throw new ApiError(400, firstError(parsed.error));
    const { toolId, startDate, endDate } = parsed.data;
    const tool = this.db.tools.find((t) => t.id === toolId);
    if (!tool) throw new ApiError(404, "Cet outil n'existe pas.");
    if (tool.ownerId === userId)
      throw new ApiError(403, "Vous ne pouvez pas emprunter votre propre outil.");
    if (tool.status !== "available")
      throw new ApiError(409, "Cet outil n'est pas disponible actuellement.");
    const conflict = this.db.loans.some(
      (l) => l.toolId === toolId && l.status === "accepted" && overlaps(l, { startDate, endDate }),
    );
    if (conflict) throw new ApiError(409, "Ces dates chevauchent un prêt déjà accepté.");
    const loan: Loan = {
      id: this.id("l"),
      toolId,
      borrowerId: userId,
      startDate,
      endDate,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    this.db.loans.push(loan);
    return this.loanView(loan);
  }

  private ownedLoan(userId: string, loanId: string) {
    this.requireUser(userId);
    const loan = this.db.loans.find((l) => l.id === loanId);
    if (!loan) throw new ApiError(404, "Cette demande n'existe pas.");
    const tool = this.db.tools.find((t) => t.id === loan.toolId)!;
    if (tool.ownerId !== userId)
      throw new ApiError(403, "Seul le propriétaire de l'outil peut effectuer cette action.");
    return { loan, tool };
  }

  decideLoan(userId: string, loanId: string, input: unknown): LoanView {
    const parsed = decisionSchema.safeParse(input);
    if (!parsed.success) throw new ApiError(400, firstError(parsed.error));
    const { loan, tool } = this.ownedLoan(userId, loanId);
    if (loan.status !== "pending") throw new ApiError(409, "Cette demande a déjà été traitée.");
    if (parsed.data.status === "accepted") {
      const conflict = this.db.loans.some(
        (l) =>
          l.id !== loan.id &&
          l.toolId === loan.toolId &&
          l.status === "accepted" &&
          overlaps(l, loan),
      );
      if (conflict) throw new ApiError(409, "Ces dates chevauchent un prêt déjà accepté.");
      if (tool.status !== "available") throw new ApiError(409, "L'outil n'est pas disponible.");
      loan.status = "accepted";
      tool.status = "lent";
    } else {
      loan.status = "refused";
    }
    return this.loanView(loan);
  }

  returnLoan(userId: string, loanId: string): LoanView {
    const { loan, tool } = this.ownedLoan(userId, loanId);
    if (loan.status !== "accepted")
      throw new ApiError(409, "Seul un prêt accepté peut être déclaré rendu.");
    loan.status = "returned";
    tool.status = "available";
    return this.loanView(loan);
  }

  rateLoan(userId: string, loanId: string, input: unknown): LoanView {
    const parsed = ratingSchema.safeParse(input);
    if (!parsed.success) throw new ApiError(400, firstError(parsed.error));
    const { loan } = this.ownedLoan(userId, loanId);
    if (loan.status !== "returned")
      throw new ApiError(409, "La note est possible uniquement après le retour.");
    if (loan.rating) throw new ApiError(409, "Ce prêt a déjà été noté.");
    loan.rating = parsed.data.rating;
    return this.loanView(loan);
  }

  history(toolId: string): LoanView[] {
    this.getTool(toolId);
    return this.db.loans
      .filter((l) => l.toolId === toolId && (l.status === "accepted" || l.status === "returned"))
      .sort((a, b) => b.startDate.localeCompare(a.startDate))
      .map((l) => this.loanView(l));
  }
}
