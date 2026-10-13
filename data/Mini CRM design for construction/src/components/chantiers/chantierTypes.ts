export type StatutChantier = "en_attente" | "en_cours" | "en_pause" | "termine" | "annule";
export type StatutAcompte = "a_appeler" | "appele" | "encaisse";
export type StatutCommande = "a_commander" | "commande" | "pret" | "recu" | "annule";
export type StatutPaiement = "non_paye" | "partiellement_paye" | "paye";
export type TypePMV = "plus_value" | "moins_value";
export type StatutPMV = "proposee" | "acceptee" | "refusee";
export type CategorieDocument =
  | "devis"
  | "bon_commande"
  | "facture"
  | "plan"
  | "photo"
  | "sous_traitant"
  | "administratif"
  | "autre";

export const STATUT_CHANTIER_LABELS: Record<StatutChantier, string> = {
  en_attente: "En attente",
  en_cours: "En cours",
  en_pause: "En pause",
  termine: "Terminé",
  annule: "Annulé",
};

export const STATUT_CHANTIER_STYLE: Record<StatutChantier, string> = {
  en_attente: "bg-gray-100 text-gray-500",
  en_cours: "bg-blue-100 text-blue-700",
  en_pause: "bg-amber-100 text-amber-700",
  termine: "bg-emerald-100 text-emerald-700",
  annule: "bg-red-100 text-red-400",
};

export const STATUT_COMMANDE_LABELS: Record<StatutCommande, string> = {
  a_commander: "À commander",
  commande: "Commandé",
  pret: "Prêt",
  recu: "Reçu",
  annule: "Annulé",
};

export const STATUT_COMMANDE_STYLE: Record<StatutCommande, string> = {
  a_commander: "bg-gray-100 text-gray-500",
  commande: "bg-blue-100 text-blue-700",
  pret: "bg-violet-100 text-violet-700",
  recu: "bg-emerald-100 text-emerald-700",
  annule: "bg-red-100 text-red-400",
};

export const STATUT_PAIEMENT_LABELS: Record<StatutPaiement, string> = {
  non_paye: "Non payé",
  partiellement_paye: "Partiel",
  paye: "Payé",
};

export const STATUT_PAIEMENT_STYLE: Record<StatutPaiement, string> = {
  non_paye: "bg-gray-100 text-gray-500",
  partiellement_paye: "bg-amber-100 text-amber-700",
  paye: "bg-emerald-100 text-emerald-700",
};

export const STATUT_PMV_LABELS: Record<StatutPMV, string> = {
  proposee: "Proposée",
  acceptee: "Acceptée",
  refusee: "Refusée",
};

export const STATUT_PMV_STYLE: Record<StatutPMV, string> = {
  proposee: "bg-blue-100 text-blue-700",
  acceptee: "bg-emerald-100 text-emerald-700",
  refusee: "bg-red-100 text-red-400",
};

export const CATEGORIE_DOCUMENT_LABELS: Record<CategorieDocument, string> = {
  devis: "Devis",
  bon_commande: "Bon de commande",
  facture: "Facture",
  plan: "Plan",
  photo: "Photo",
  sous_traitant: "Document sous-traitant",
  administratif: "Administratif",
  autre: "Autre",
};

export interface Commande {
  id: number;
  titre: string;
  fournisseur: string;
  description?: string;
  montantPrevisionnel: number;
  montantReel?: number;
  statutCommande: StatutCommande;
  dateCommande?: string;
  dateLivraisonPrevue?: string;
  statutPaiement: StatutPaiement;
  datePaiementPrevue?: string;
  commentaire?: string;
}

export interface SousTraitant {
  id: number;
  entreprise: string;
  prestation: string;
  montantPrevisionnel: number;
  montantReel?: number;
  montantPaye: number;
  echeance?: string;
  statutPaiement: StatutPaiement;
  commentaire?: string;
}

export interface PlusMoinsValue {
  id: number;
  libelle: string;
  description?: string;
  type: TypePMV;
  montant: number;
  statut: StatutPMV;
  date: string;
}

export const STATUT_ACOMPTE_LABELS: Record<StatutAcompte, string> = {
  a_appeler: "À appeler",
  appele: "Appelé",
  encaisse: "Encaissé",
};

export const STATUT_ACOMPTE_STYLE: Record<StatutAcompte, string> = {
  a_appeler: "bg-amber-100 text-amber-700",
  appele: "bg-blue-100 text-blue-700",
  encaisse: "bg-emerald-100 text-emerald-700",
};

export interface Acompte {
  id: number;
  libelle: string;
  montant: number;
  statut: StatutAcompte;
  dateAppelPrevue?: string;
  dateRelance?: string;
}

export interface DocumentChantier {
  id: number;
  nom: string;
  categorie: CategorieDocument;
  dateAjout: string;
  taille?: string;
}

export interface Chantier {
  id: number;
  nom: string;
  clientId: number;
  clientNom: string;
  adresse: string;
  statut: StatutChantier;
  dateDebutPrevue?: string;
  dateFinPrevue?: string;
  montantDevisInitial: number;
  notes?: string;
  commandes: Commande[];
  sousTraitants: SousTraitant[];
  plusMoinsValues: PlusMoinsValue[];
  documents: DocumentChantier[];
  acomptes: Acompte[];
}

// --- Finance helpers ---

export function calcCaPrevisionnel(c: Chantier): number {
  const pmv = c.plusMoinsValues
    .filter((p) => p.statut === "acceptee")
    .reduce((sum, p) => sum + (p.type === "plus_value" ? p.montant : -p.montant), 0);
  return c.montantDevisInitial + pmv;
}

export function calcCaReel(c: Chantier): number {
  // same as prévisionnel for now; will refine when invoicing added
  return calcCaPrevisionnel(c);
}

export function calcCoutsPrevisionnels(c: Chantier): number {
  const cmd = c.commandes.filter(co => co.statutCommande !== "annule").reduce((s, co) => s + co.montantPrevisionnel, 0);
  const st = c.sousTraitants.reduce((s, st) => s + st.montantPrevisionnel, 0);
  return cmd + st;
}

export function calcCoutsReels(c: Chantier): number {
  const cmd = c.commandes.filter(co => co.statutCommande !== "annule").reduce((s, co) => s + (co.montantReel ?? co.montantPrevisionnel), 0);
  const st = c.sousTraitants.reduce((s, st) => s + (st.montantReel ?? st.montantPrevisionnel), 0);
  return cmd + st;
}

export function pct(margin: number, ca: number): string {
  if (!ca) return "—";
  return ((margin / ca) * 100).toFixed(1) + " %";
}
