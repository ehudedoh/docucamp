export const ROLES = { STUDENT: "STUDENT", ADMIN: "ADMIN" };

export const RESOURCE_TYPES = [
  { value: "EXAM", label: "Examen" },
  { value: "ASSIGNMENT", label: "Devoir" },
  { value: "CORRECTION", label: "Correction" },
  { value: "REVISION_SHEET", label: "Fiche de révision" },
  { value: "COURSE", label: "Cours" },
  { value: "TP", label: "TP" },
  { value: "OTHER", label: "Autre" },
];

export const MATERIAL_CATEGORIES = [
  { value: "CALCULATOR", label: "Calculatrice" },
  { value: "BOOK", label: "Livre" },
  { value: "ELECTRONICS", label: "Électronique" },
  { value: "TP_KIT", label: "Kit de TP" },
  { value: "STATIONERY", label: "Fournitures" },
  { value: "COMPUTER_ACCESSORY", label: "Accessoire informatique" },
  { value: "OTHER", label: "Autre" },
];

export const TRANSACTION_TYPES = [
  { value: "SALE", label: "Vente" },
  { value: "RENT", label: "Location" },
  { value: "DONATION", label: "Don" },
];

export const MATERIAL_CONDITIONS = [
  { value: "NEW", label: "Neuf" },
  { value: "VERY_GOOD", label: "Très bon état" },
  { value: "GOOD", label: "Bon état" },
  { value: "ACCEPTABLE", label: "État acceptable" },
  { value: "TO_REPAIR", label: "À réparer" },
];

export const STATUSES = {
  PENDING: "PENDING",
  PUBLISHED: "PUBLISHED",
  REJECTED: "REJECTED",
  SOLD: "SOLD",
  RENTED: "RENTED",
  CLOSED: "CLOSED",
};

export const REPORT_REASONS = [
  { value: "INAPPROPRIATE", label: "Contenu inapproprié" },
  { value: "SPAM", label: "Spam" },
  { value: "FRAUD", label: "Fraude suspectée" },
  { value: "INCORRECT", label: "Document incorrect" },
  { value: "ILLEGAL", label: "Contenu illégal" },
  { value: "MISLEADING", label: "Annonce trompeuse" },
  { value: "OTHER", label: "Autre" },
];

export const PAGE_SIZE = 12;
