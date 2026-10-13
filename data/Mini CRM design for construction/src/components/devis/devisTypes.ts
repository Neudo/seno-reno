export type StatutDevis =
  | "a-envoyer"
  | "envoye"
  | "a-relancer"
  | "en-discussion"
  | "signe"
  | "refuse";

export type TypeInteraction =
  | "appel"
  | "email"
  | "rendez-vous"
  | "message"
  | "note"
  | "autre";

export interface Interaction {
  id: number;
  date: string;
  type: TypeInteraction;
  commentaire: string;
}

export interface Devis {
  id: number;
  numero: string;
  client: string;
  clientEmail?: string;
  clientTel?: string;
  projet: string;
  adresse: string;
  date: string;
  montantHT: number;
  montantTTC: number;
  statut: StatutDevis;
  derniereAction?: string;
  prochaineRelance?: string; // ISO date or null
  interactions: Interaction[];
  pdfNom?: string;
  chantierId?: number;
}

export const STATUT_LABELS: Record<StatutDevis, string> = {
  "a-envoyer": "À envoyer",
  envoye: "Envoyé",
  "a-relancer": "À relancer",
  "en-discussion": "En discussion",
  signe: "Signé",
  refuse: "Refusé",
};

export const STATUT_STYLE: Record<StatutDevis, string> = {
  "a-envoyer": "bg-amber-50 text-amber-700 border border-amber-200",
  envoye: "bg-blue-50 text-blue-700 border border-blue-200",
  "a-relancer": "bg-orange-50 text-orange-700 border border-orange-200",
  "en-discussion": "bg-violet-50 text-violet-700 border border-violet-200",
  signe: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  refuse: "bg-gray-100 text-gray-500 border border-gray-200",
};

export const TYPE_INTERACTION_LABELS: Record<TypeInteraction, string> = {
  appel: "Appel",
  email: "Email",
  "rendez-vous": "Rendez-vous",
  message: "Message",
  note: "Note",
  autre: "Autre",
};

export const TYPE_INTERACTION_ICON: Record<TypeInteraction, string> = {
  appel: "📞",
  email: "✉️",
  "rendez-vous": "🤝",
  message: "💬",
  note: "📝",
  autre: "•",
};

export function fmtMontant(n: number) {
  return n.toLocaleString("fr-FR") + " €";
}

export function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function relanceLabel(iso?: string): { label: string; urgent: boolean } {
  if (!iso) return { label: "—", urgent: false };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return { label: "Aujourd'hui", urgent: true };
  if (diff === 1) return { label: "Demain", urgent: false };
  if (diff === -1) return { label: "En retard de 1 jour", urgent: true };
  if (diff < -1) return { label: `En retard de ${Math.abs(diff)} jours`, urgent: true };
  return {
    label: d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
    urgent: false,
  };
}
