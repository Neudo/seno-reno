export type StatutProspect =
  | "nouveau"
  | "a_contacter"
  | "contacte"
  | "a_relancer"
  | "en_discussion"
  | "sans_suite"
  | "converti";

export type PrioriteProspect = "haute" | "moyenne" | "basse";

export type SourceProspect =
  | "site_internet"
  | "instagram"
  | "linkedin"
  | "recommandation"
  | "ancien_client"
  | "evenement"
  | "reseau_pro"
  | "autre";

export type TypeInteraction =
  | "appel"
  | "email"
  | "rendez_vous"
  | "message"
  | "note"
  | "autre";

export interface Interaction {
  id: number;
  date: string;
  type: TypeInteraction;
  commentaire: string;
  prochaineRelance?: string;
}

export interface Prospect {
  id: number;
  prenom: string;
  nom: string;
  societe?: string;
  email: string;
  telephone: string;
  localisation: string;
  statut: StatutProspect;
  priorite: PrioriteProspect;
  source: SourceProspect;
  sourceDetail?: string;
  prochaineRelance?: string;
  commentaire?: string;
  interactions: Interaction[];
  dateCreation: string;
}

export const STATUT_LABELS: Record<StatutProspect, string> = {
  nouveau: "Nouveau",
  a_contacter: "À contacter",
  contacte: "Contacté",
  a_relancer: "À relancer",
  en_discussion: "En discussion",
  sans_suite: "Sans suite",
  converti: "Converti en client",
};

export const STATUT_STYLE: Record<StatutProspect, string> = {
  nouveau: "bg-blue-100 text-blue-700",
  a_contacter: "bg-amber-100 text-amber-700",
  contacte: "bg-sky-100 text-sky-700",
  a_relancer: "bg-orange-100 text-orange-700",
  en_discussion: "bg-violet-100 text-violet-700",
  sans_suite: "bg-gray-100 text-gray-400",
  converti: "bg-emerald-100 text-emerald-700",
};

export const PRIORITE_LABELS: Record<PrioriteProspect, string> = {
  haute: "Haute",
  moyenne: "Moyenne",
  basse: "Basse",
};

export const PRIORITE_STYLE: Record<PrioriteProspect, string> = {
  haute: "text-red-500",
  moyenne: "text-amber-500",
  basse: "text-gray-400",
};

export const SOURCE_LABELS: Record<SourceProspect, string> = {
  site_internet: "Site internet",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  recommandation: "Recommandation",
  ancien_client: "Ancien client",
  evenement: "Événement",
  reseau_pro: "Réseau professionnel",
  autre: "Autre",
};

export const TYPE_INTERACTION_LABELS: Record<TypeInteraction, string> = {
  appel: "Appel",
  email: "Email",
  rendez_vous: "Rendez-vous",
  message: "Message",
  note: "Note",
  autre: "Autre",
};

export const TYPE_INTERACTION_ICON: Record<TypeInteraction, string> = {
  appel: "📞",
  email: "✉️",
  rendez_vous: "📅",
  message: "💬",
  note: "📝",
  autre: "•",
};
