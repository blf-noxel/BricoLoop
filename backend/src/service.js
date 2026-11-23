import { randomUUID } from 'node:crypto';

export const CATEGORIES = ['Perçage', 'Jardinage', 'Peinture', 'Nettoyage', 'Mesure', 'Autre'];

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function createSeed() {
  return {
    users: [
      { id: 'u1', firstName: 'Camille', district: 'Croix-Rousse' },
      { id: 'u2', firstName: 'Karim', district: 'Guillotière' },
      { id: 'u3', firstName: 'Léa', district: 'Monplaisir' },
      { id: 'u4', firstName: 'Julien', district: 'Vaise' },
    ],
    tools: [
      { id: 't1', ownerId: 'u1', name: 'Perceuse visseuse sans fil', category: 'Perçage', description: '18V, deux batteries, coffret de forets bois et métal.', status: 'available' },
      { id: 't2', ownerId: 'u1', name: 'Taille-haie électrique', category: 'Jardinage', description: 'Lame 50 cm, idéal pour les haies de jardin.', status: 'lent' },
      { id: 't3', ownerId: 'u2', name: 'Kit rouleaux de peinture', category: 'Peinture', description: 'Rouleaux, bac, perche télescopique et bâche.', status: 'available' },
      { id: 't4', ownerId: 'u2', name: 'Nettoyeur haute pression', category: 'Nettoyage', description: '130 bars, buse rotative pour terrasses.', status: 'available' },
      { id: 't5', ownerId: 'u3', name: 'Télémètre laser', category: 'Mesure', description: 'Portée 40 m, précision au millimètre.', status: 'available' },
      { id: 't6', ownerId: 'u3', name: 'Perforateur SDS', category: 'Perçage', description: 'Pour béton et pierre. Mèches non fournies.', status: 'unavailable' },
      { id: 't7', ownerId: 'u4', name: 'Tondeuse à gazon', category: 'Jardinage', description: 'Thermique, bac de ramassage 55 L.', status: 'available' },
      { id: 't8', ownerId: 'u4', name: 'Escabeau 5 marches', category: 'Autre', description: 'Aluminium, léger et pliable.', status: 'available' },
    ],
    loans: [
      { id: 'l1', toolId: 't2', borrowerId: 'u3', startDate: '2026-10-20', endDate: '2026-10-25', status: 'accepted', createdAt: '2026-10-15T10:00:00Z' },
      { id: 'l2', toolId: 't1', borrowerId: 'u2', startDate: '2026-11-02', endDate: '2026-11-04', status: 'pending', createdAt: '2026-10-18T09:00:00Z' },
      { id: 'l3', toolId: 't1', borrowerId: 'u4', startDate: '2026-11-03', endDate: '2026-11-05', status: 'pending', createdAt: '2026-10-19T09:00:00Z' },
      { id: 'l4', toolId: 't4', borrowerId: 'u1', startDate: '2026-09-10', endDate: '2026-09-12', status: 'returned', rating: 5, createdAt: '2026-09-01T09:00:00Z' },
      { id: 'l5', toolId: 't3', borrowerId: 'u4', startDate: '2026-10-01', endDate: '2026-10-03', status: 'refused', createdAt: '2026-09-25T09:00:00Z' },
    ],
  };
}

const validDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
};
const overlaps = (a, b) => a.startDate <= b.endDate && b.startDate <= a.endDate;
export class BricoLoopService {
  constructor(db = createSeed(), persist = () => {}) {
    this.db = db;
    this.persist = persist;
  }

  id(prefix) { return `${prefix}-${randomUUID()}`; }
  listUsers() { return this.db.users; }

  requireUser(userId) {
    const user = this.db.users.find((item) => item.id === userId);
    if (!user) throw new ApiError(401, 'Utilisateur non identifié (en-tête X-User-Id manquant ou inconnu).');
    return user;
  }

  user(id) {
    const user = this.db.users.find((item) => item.id === id);
    if (!user) throw new ApiError(500, 'Utilisateur associé introuvable.');
    return user;
  }

  toolView(tool) { return { ...tool, owner: this.user(tool.ownerId) }; }

  loanView(loan) {
    const tool = this.db.tools.find((item) => item.id === loan.toolId);
    if (!tool) throw new ApiError(500, 'Outil associé introuvable.');
    return { ...loan, tool, owner: this.user(tool.ownerId), borrower: this.user(loan.borrowerId) };
  }

  listTools({ q, category, ownerId } = {}) {
    const query = typeof q === 'string' ? q.trim().toLocaleLowerCase('fr') : '';
    const order = { available: 0, lent: 1, unavailable: 2 };
    return this.db.tools
      .filter((tool) => !category || tool.category === category)
      .filter((tool) => !ownerId || tool.ownerId === ownerId)
      .filter((tool) => !query || `${tool.name} ${tool.description}`.toLocaleLowerCase('fr').includes(query))
      .slice()
      .sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name, 'fr'))
      .map((tool) => this.toolView(tool));
  }

  getTool(id) {
    const tool = this.db.tools.find((item) => item.id === id);
    if (!tool) throw new ApiError(404, "Cet outil n'existe pas.");
    return this.toolView(tool);
  }

  addTool(userId, input) {
    this.requireUser(userId);
    const name = typeof input?.name === 'string' ? input.name.trim() : '';
    const description = input?.description === undefined ? '' : input.description;
    if (name.length < 2 || name.length > 60) throw new ApiError(400, 'Le nom doit contenir entre 2 et 60 caractères.');
    if (!CATEGORIES.includes(input?.category)) throw new ApiError(400, 'Choisissez une catégorie parmi la liste.');
    if (typeof description !== 'string' || description.trim().length > 300) throw new ApiError(400, 'La description ne peut pas dépasser 300 caractères.');
    const tool = { id: this.id('t'), ownerId: userId, name, category: input.category, description: description.trim(), status: 'available' };
    this.db.tools.push(tool);
    this.persist(this.db);
    return this.toolView(tool);
  }

  listLoans(userId) {
    this.requireUser(userId);
    const ownedToolIds = new Set(this.db.tools.filter((tool) => tool.ownerId === userId).map((tool) => tool.id));
    const byDate = (a, b) => a.startDate.localeCompare(b.startDate);
    return {
      borrowed: this.db.loans.filter((loan) => loan.borrowerId === userId).slice().sort(byDate).map((loan) => this.loanView(loan)),
      received: this.db.loans.filter((loan) => ownedToolIds.has(loan.toolId)).slice().sort(byDate).map((loan) => this.loanView(loan)),
    };
  }

  requestLoan(userId, input) {
    this.requireUser(userId);
    const { toolId, startDate, endDate } = input ?? {};
    if (typeof toolId !== 'string' || !toolId || !validDate(startDate) || !validDate(endDate) || endDate < startDate) {
      throw new ApiError(400, 'Vérifiez l’outil et les dates (format AAAA-MM-JJ, fin après le début).');
    }
    const tool = this.db.tools.find((item) => item.id === toolId);
    if (!tool) throw new ApiError(404, "Cet outil n'existe pas.");
    if (tool.ownerId === userId) throw new ApiError(403, 'Vous ne pouvez pas emprunter votre propre outil.');
    if (tool.status !== 'available') throw new ApiError(409, "Cet outil n'est pas disponible actuellement.");
    const conflict = this.db.loans.some((loan) => loan.toolId === toolId && loan.status === 'accepted' && overlaps(loan, { startDate, endDate }));
    if (conflict) throw new ApiError(409, 'Ces dates chevauchent un prêt déjà accepté.');
    const loan = { id: this.id('l'), toolId, borrowerId: userId, startDate, endDate, status: 'pending', createdAt: new Date().toISOString() };
    this.db.loans.push(loan);
    this.persist(this.db);
    return this.loanView(loan);
  }

  ownedLoan(userId, loanId) {
    this.requireUser(userId);
    const loan = this.db.loans.find((item) => item.id === loanId);
    if (!loan) throw new ApiError(404, 'Cette demande n’existe pas.');
    const tool = this.db.tools.find((item) => item.id === loan.toolId);
    if (!tool || tool.ownerId !== userId) throw new ApiError(403, 'Seul le propriétaire de l’outil peut effectuer cette action.');
    return { loan, tool };
  }

  decideLoan(userId, loanId, input) {
    if (!['accepted', 'refused'].includes(input?.status)) throw new ApiError(400, 'Décision invalide (accepted ou refused).');
    const { loan, tool } = this.ownedLoan(userId, loanId);
    if (loan.status !== 'pending') throw new ApiError(409, 'Cette demande a déjà été traitée.');
    if (input.status === 'accepted') {
      const conflict = this.db.loans.some((item) => item.id !== loan.id && item.toolId === loan.toolId && item.status === 'accepted' && overlaps(item, loan));
      if (conflict) throw new ApiError(409, 'Ces dates chevauchent un prêt déjà accepté.');
      if (tool.status !== 'available') throw new ApiError(409, 'L’outil n’est pas disponible.');
      loan.status = 'accepted';
      tool.status = 'lent';
    } else {
      loan.status = 'refused';
    }
    this.persist(this.db);
    return this.loanView(loan);
  }

  returnLoan(userId, loanId) {
    const { loan, tool } = this.ownedLoan(userId, loanId);
    if (loan.status !== 'accepted') throw new ApiError(409, 'Seul un prêt accepté peut être déclaré rendu.');
    loan.status = 'returned';
    tool.status = 'available';
    this.persist(this.db);
    return this.loanView(loan);
  }

  rateLoan(userId, loanId, input) {
    const rating = input?.rating;
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new ApiError(400, 'Note entre 1 et 5.');
    const { loan } = this.ownedLoan(userId, loanId);
    if (loan.status !== 'returned') throw new ApiError(409, 'La note est possible uniquement après le retour.');
    if (loan.rating !== undefined) throw new ApiError(409, 'Ce prêt a déjà été noté.');
    loan.rating = rating;
    this.persist(this.db);
    return this.loanView(loan);
  }

  history(toolId) {
    this.getTool(toolId);
    return this.db.loans
      .filter((loan) => loan.toolId === toolId && ['accepted', 'returned'].includes(loan.status))
      .slice().sort((a, b) => b.startDate.localeCompare(a.startDate)).map((loan) => this.loanView(loan));
  }
}
