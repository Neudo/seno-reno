export type TypeEvenement =
  | "foire"
  | "salon"
  | "reunion_reseau"
  | "lieu_prospection"
  | "autre";

export type StatutEvenement = "prevu" | "en_cours" | "termine" | "annule";

export interface Evenement {
  id: number;
  nom: string;
  type: TypeEvenement;
  lieu: string;
  date?: string;
  statut: StatutEvenement;
  commentaire?: string;
  contactsIds: number[]; // lien vers prospects
}

export const TYPE_EVENEMENT_LABELS: Record<TypeEvenement, string> = {
  foire: "Foire",
  salon: "Salon professionnel",
  reunion_reseau: "Réunion réseau",
  lieu_prospection: "Lieu de prospection",
  autre: "Autre",
};

export const STATUT_EVENEMENT_LABELS: Record<StatutEvenement, string> = {
  prevu: "Prévu",
  en_cours: "En cours",
  termine: "Terminé",
  annule: "Annulé",
};

export const STATUT_EVENEMENT_STYLE: Record<StatutEvenement, string> = {
  prevu: "bg-blue-50 text-blue-700 border border-blue-200",
  en_cours: "bg-amber-50 text-amber-700 border border-amber-200",
  termine: "bg-gray-100 text-gray-500 border border-gray-200",
  annule: "bg-red-50 text-red-400 border border-red-200",
};

export const INITIAL_EVENEMENTS: Evenement[] = [
  {
    id: 1,
    nom: "Foire d'Auxerre 2026",
    type: "foire",
    lieu: "Auxerre (89)",
    date: "2026-09-12",
    statut: "prevu",
    commentaire: "Stand prévu. Budget communication à prévoir.",
    contactsIds: [1, 2, 3],
  },
  {
    id: 2,
    nom: "Foire de Toucy",
    type: "foire",
    lieu: "Toucy (89)",
    date: "2026-06-15",
    statut: "termine",
    commentaire: "Bonne fréquentation. 4 contacts qualifiés récupérés.",
    contactsIds: [4, 5],
  },
  {
    id: 3,
    nom: "Réunion réseau BTP — Yonne",
    type: "reunion_reseau",
    lieu: "Auxerre (89)",
    date: "2026-07-08",
    statut: "termine",
    commentaire: "Rencontre avec plusieurs artisans locaux. 2 leads potentiels.",
    contactsIds: [6],
  },
  {
    id: 4,
    nom: "Zone commerciale de Migennes",
    type: "lieu_prospection",
    lieu: "Migennes (89)",
    statut: "en_cours",
    commentaire: "Prospection terrain en cours. Distribution de flyers.",
    contactsIds: [],
  },
];
