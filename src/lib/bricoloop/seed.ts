import type { Loan, Tool, User } from "./types";

export interface Database {
  users: User[];
  tools: Tool[];
  loans: Loan[];
}

export function createSeed(): Database {
  return {
    users: [
      { id: "u1", firstName: "Camille", district: "Croix-Rousse" },
      { id: "u2", firstName: "Karim", district: "Guillotière" },
      { id: "u3", firstName: "Léa", district: "Monplaisir" },
      { id: "u4", firstName: "Julien", district: "Vaise" },
    ],
    tools: [
      {
        id: "t1",
        ownerId: "u1",
        name: "Perceuse visseuse sans fil",
        category: "Perçage",
        description: "18V, deux batteries, coffret de forets bois et métal.",
        status: "available",
      },
      {
        id: "t2",
        ownerId: "u1",
        name: "Taille-haie électrique",
        category: "Jardinage",
        description: "Lame 50 cm, idéal pour les haies de jardin.",
        status: "lent",
      },
      {
        id: "t3",
        ownerId: "u2",
        name: "Kit rouleaux de peinture",
        category: "Peinture",
        description: "Rouleaux, bac, perche télescopique et bâche.",
        status: "available",
      },
      {
        id: "t4",
        ownerId: "u2",
        name: "Nettoyeur haute pression",
        category: "Nettoyage",
        description: "130 bars, buse rotative pour terrasses.",
        status: "available",
      },
      {
        id: "t5",
        ownerId: "u3",
        name: "Télémètre laser",
        category: "Mesure",
        description: "Portée 40 m, précision au millimètre.",
        status: "available",
      },
      {
        id: "t6",
        ownerId: "u3",
        name: "Perforateur SDS",
        category: "Perçage",
        description: "Pour béton et pierre. Mèches non fournies.",
        status: "unavailable",
      },
      {
        id: "t7",
        ownerId: "u4",
        name: "Tondeuse à gazon",
        category: "Jardinage",
        description: "Thermique, bac de ramassage 55 L.",
        status: "available",
      },
      {
        id: "t8",
        ownerId: "u4",
        name: "Escabeau 5 marches",
        category: "Autre",
        description: "Aluminium, léger et pliable.",
        status: "available",
      },
    ],
    loans: [
      {
        id: "l1",
        toolId: "t2",
        borrowerId: "u3",
        startDate: "2026-10-20",
        endDate: "2026-10-25",
        status: "accepted",
        createdAt: "2026-10-15T10:00:00Z",
      },
      {
        id: "l2",
        toolId: "t1",
        borrowerId: "u2",
        startDate: "2026-11-02",
        endDate: "2026-11-04",
        status: "pending",
        createdAt: "2026-10-18T09:00:00Z",
      },
      {
        id: "l3",
        toolId: "t1",
        borrowerId: "u4",
        startDate: "2026-11-03",
        endDate: "2026-11-05",
        status: "pending",
        createdAt: "2026-10-19T09:00:00Z",
      },
      {
        id: "l4",
        toolId: "t4",
        borrowerId: "u1",
        startDate: "2026-09-10",
        endDate: "2026-09-12",
        status: "returned",
        rating: 5,
        createdAt: "2026-09-01T09:00:00Z",
      },
      {
        id: "l5",
        toolId: "t3",
        borrowerId: "u4",
        startDate: "2026-10-01",
        endDate: "2026-10-03",
        status: "refused",
        createdAt: "2026-09-25T09:00:00Z",
      },
    ],
  };
}
