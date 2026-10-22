import { beforeEach, describe, expect, it } from "vitest";
import { ApiError, BricoLoopService } from "@/lib/bricoloop/service";

let s: BricoLoopService;
beforeEach(() => {
  s = new BricoLoopService();
});

function status(fn: () => unknown) {
  try {
    fn();
  } catch (e) {
    return (e as ApiError).status;
  }
  return 200;
}

describe("Catalogue", () => {
  it("liste les outils disponibles en premier", () => {
    const list = s.listTools();
    expect(list).toHaveLength(8);
    const firstNonAvailable = list.findIndex((t) => t.status !== "available");
    expect(list.slice(firstNonAvailable).every((t) => t.status !== "available")).toBe(true);
    expect(list[0]?.owner.firstName).toBeTruthy();
  });
  it("renvoie une liste vide si aucun outil", () => {
    s.db.tools = [];
    expect(s.listTools()).toEqual([]);
  });
  it("recherche insensible à la casse dans nom et description", () => {
    expect(s.listTools({ q: "PERCEUSE" }).map((t) => t.id)).toEqual(["t1"]);
    expect(s.listTools({ q: "terrasses" }).map((t) => t.id)).toEqual(["t4"]);
  });
  it("filtre par catégorie", () => {
    expect(s.listTools({ category: "Perçage" }).every((t) => t.category === "Perçage")).toBe(true);
    expect(s.listTools({ category: "Perçage" })).toHaveLength(2);
  });
  it("404 pour un outil inexistant", () => {
    expect(status(() => s.getTool("nope"))).toBe(404);
  });
});

describe("Ajout d'outil", () => {
  it("crée un outil disponible associé à l'utilisateur", () => {
    const t = s.addTool("u2", { name: "Ponceuse", category: "Autre" });
    expect(t.ownerId).toBe("u2");
    expect(t.status).toBe("available");
    expect(s.listTools()).toHaveLength(9);
  });
  it("rejette un nom trop court ou trop long (400)", () => {
    expect(status(() => s.addTool("u1", { name: "a", category: "Autre" }))).toBe(400);
    expect(status(() => s.addTool("u1", { name: "x".repeat(61), category: "Autre" }))).toBe(400);
  });
  it("rejette une catégorie invalide (400)", () => {
    expect(status(() => s.addTool("u1", { name: "Scie", category: "Cuisine" }))).toBe(400);
  });
  it("rejette une description de plus de 300 caractères", () => {
    expect(
      status(() =>
        s.addTool("u1", { name: "Scie", category: "Autre", description: "x".repeat(301) }),
      ),
    ).toBe(400);
  });
});

describe("Demandes d'emprunt", () => {
  it("crée une demande en attente", () => {
    const l = s.requestLoan("u2", { toolId: "t5", startDate: "2026-12-01", endDate: "2026-12-03" });
    expect(l.status).toBe("pending");
  });
  it("rejette une date de fin avant la date de début (400)", () => {
    expect(
      status(() =>
        s.requestLoan("u2", { toolId: "t5", startDate: "2026-12-05", endDate: "2026-12-01" }),
      ),
    ).toBe(400);
  });
  it("interdit d'emprunter son propre outil", () => {
    expect(
      status(() =>
        s.requestLoan("u3", { toolId: "t5", startDate: "2026-12-01", endDate: "2026-12-02" }),
      ),
    ).toBe(403);
  });
  it("refuse une demande sur un outil indisponible", () => {
    expect(
      status(() =>
        s.requestLoan("u1", { toolId: "t6", startDate: "2026-12-01", endDate: "2026-12-02" }),
      ),
    ).toBe(409);
  });
  it("autorise plusieurs demandes en attente sur le même outil", () => {
    s.requestLoan("u1", { toolId: "t5", startDate: "2026-12-01", endDate: "2026-12-03" });
    s.requestLoan("u2", { toolId: "t5", startDate: "2026-12-02", endDate: "2026-12-04" });
    expect(s.db.loans.filter((l) => l.toolId === "t5" && l.status === "pending")).toHaveLength(2);
  });
});

describe("Traitement par le propriétaire", () => {
  it("accepter passe la demande en acceptée et l'outil en prêté", () => {
    const l = s.decideLoan("u1", "l2", { status: "accepted" });
    expect(l.status).toBe("accepted");
    expect(s.getTool("t1").status).toBe("lent");
  });
  it("refuser ne change pas le statut de l'outil", () => {
    expect(s.decideLoan("u1", "l2", { status: "refused" }).status).toBe("refused");
    expect(s.getTool("t1").status).toBe("available");
  });
  it("interdit de traiter une demande déjà traitée (409)", () => {
    s.decideLoan("u1", "l2", { status: "refused" });
    expect(status(() => s.decideLoan("u1", "l2", { status: "accepted" }))).toBe(409);
  });
  it("refuse l'action d'un non-propriétaire (403)", () => {
    expect(status(() => s.decideLoan("u2", "l2", { status: "accepted" }))).toBe(403);
  });
  it("empêche deux prêts acceptés qui se chevauchent", () => {
    s.decideLoan("u1", "l2", { status: "accepted" }); // 02→04 nov
    s.returnLoan("u1", "l2"); // outil disponible mais prêt historique
    // l3 (03→05 nov) ne chevauche pas un prêt *accepté* actif => OK
    expect(status(() => s.decideLoan("u1", "l3", { status: "accepted" }))).toBe(200);
    // nouvelle demande chevauchant l3 accepté
    s.db.tools.find((t) => t.id === "t1")!.status = "available";
    expect(
      status(() =>
        s.requestLoan("u3", { toolId: "t1", startDate: "2026-11-04", endDate: "2026-11-06" }),
      ),
    ).toBe(409);
  });
});

describe("Retour et notation", () => {
  it("le retour remet l'outil disponible et garde l'historique", () => {
    const l = s.returnLoan("u1", "l1");
    expect(l.status).toBe("returned");
    expect(s.getTool("t2").status).toBe("available");
    expect(s.history("t2").map((h) => h.id)).toContain("l1");
  });
  it("seul le propriétaire peut déclarer le retour", () => {
    expect(status(() => s.returnLoan("u3", "l1"))).toBe(403);
  });
  it("une seule note par prêt, entre 1 et 5", () => {
    expect(status(() => s.rateLoan("u2", "l4", { rating: 6 }))).toBe(400);
    s.db.loans.find((l) => l.id === "l4")!.rating = undefined;
    s.rateLoan("u2", "l4", { rating: 4 });
    expect(status(() => s.rateLoan("u2", "l4", { rating: 3 }))).toBe(409);
  });
  it("historique trié du plus récent au plus ancien", () => {
    s.returnLoan("u1", "l1");
    s.decideLoan("u1", "l2", { status: "accepted" });
    s.returnLoan("u1", "l2");
    // t1 history only l2; t2 only l1 — build multi-entry check on t1
    s.decideLoan("u1", "l3", { status: "accepted" });
    const h = s.history("t1");
    expect(h.map((x) => x.startDate)).toEqual(["2026-11-03", "2026-11-02"]);
  });
});

describe("Isolation des emprunts", () => {
  it("chaque utilisateur ne voit que ses propres demandes", () => {
    const { borrowed } = s.listLoans("u2");
    expect(borrowed.every((l) => l.borrowerId === "u2")).toBe(true);
    expect(borrowed.map((l) => l.id)).toEqual(["l2"]);
  });
  it("utilisateur inconnu => 401", () => {
    expect(status(() => s.listLoans("zz"))).toBe(401);
  });
});
