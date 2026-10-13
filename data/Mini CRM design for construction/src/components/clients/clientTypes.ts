export type ClientType = "personne" | "societe";
export type ClientFilter = "tous" | "en_cours" | "sans_chantier" | "archives";

export type SourceClient =
  | "site_internet"
  | "instagram"
  | "linkedin"
  | "recommandation"
  | "ancien_client"
  | "evenement"
  | "reseau_pro"
  | "prospect_converti"
  | "autre";

export const SOURCE_CLIENT_LABELS: Record<SourceClient, string> = {
  site_internet: "Site internet",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  recommandation: "Recommandation",
  ancien_client: "Ancien client",
  evenement: "Événement",
  reseau_pro: "Réseau professionnel",
  prospect_converti: "Prospect converti",
  autre: "Autre",
};

export type StatutChantier = "en_cours" | "termine" | "en_pause" | "annule";

export const STATUT_CHANTIER_LABELS: Record<StatutChantier, string> = {
  en_cours: "En cours",
  termine: "Terminé",
  en_pause: "En pause",
  annule: "Annulé",
};

export const STATUT_CHANTIER_STYLE: Record<StatutChantier, string> = {
  en_cours: "bg-blue-100 text-blue-700",
  termine: "bg-emerald-100 text-emerald-700",
  en_pause: "bg-amber-100 text-amber-700",
  annule: "bg-gray-100 text-gray-400",
};

export interface ChantierClient {
  id: number;
  nom: string;
  statut: StatutChantier;
  adresse: string;
  montant?: number;
  dateDebut?: string;
  dateFinPrevue?: string;
}

export interface DocumentClient {
  id: number;
  nom: string;
  type: string;
  dateAjout: string;
  taille?: string;
}

export interface Client {
  id: number;
  type: ClientType;
  // Personne
  prenom?: string;
  nom?: string;
  // Société
  societe?: string;
  contactPrincipal?: string;
  // Commun
  email: string;
  telephone: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  source: SourceClient;
  sourceDetail?: string;
  notes?: string;
  oneDriveUrl?: string;
  dateCreation: string;
  dateConversionProspect?: string;
  archive: boolean;
  chantiers: ChantierClient[];
  documents: DocumentClient[];
}

export function clientDisplayName(c: Client): string {
  if (c.type === "societe") return c.societe ?? "—";
  return [c.prenom, c.nom].filter(Boolean).join(" ") || "—";
}

export function clientSubtitle(c: Client): string | undefined {
  if (c.type === "societe") return c.contactPrincipal;
  return c.societe;
}

export function clientLocalisation(c: Client): string {
  return [c.codePostal, c.ville].filter(Boolean).join(" ") || "—";
}

export function clientDerniereActivite(c: Client): string {
  if (!c.chantiers.length) return "—";
  const dates = c.chantiers.map(ch => ch.dateDebut).filter(Boolean) as string[];
  if (!dates.length) return "—";
  const latest = dates.sort().at(-1)!;
  return new Date(latest).toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
}
