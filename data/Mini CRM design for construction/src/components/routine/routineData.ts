// ── Shared types ──────────────────────────────────────────────────────────────

export interface RoutineItem {
  id: string;
  label: string;
  auto?: boolean;
  autoTag?: string;
  autoUrgent?: boolean;
  custom?: boolean;
}

export interface RoutineSection {
  id: string;
  title: string;
  color: string;
  items: RoutineItem[];
}

// ── Auto-generated items (simulated from business data) ───────────────────────

const AUTO_ITEMS: Record<string, RoutineItem[]> = {
  finances: [
    { id: "auto-f1", label: "Facture acompte 30% à envoyer — Extension Bernard, Auxerre — 18 600 €", auto: true, autoTag: "Facture", autoUrgent: true },
    { id: "auto-f2", label: "Paiement sous-traitant — Plomberie Fontaine — 4 000 € — échéance aujourd'hui — Chantier Renard", auto: true, autoTag: "Paiement ST", autoUrgent: true },
    { id: "auto-f3", label: "Acompte intermédiaire à recevoir — Extension Moreau, Toucy — 20 400 €", auto: true, autoTag: "Encaissement" },
  ],
  chantiers_cours: [
    { id: "auto-cc1", label: "Vérifier livraison parquet chêne — BL PB-2026-1142 — Appart T3 quai Marine, Auxerre", auto: true, autoTag: "Suivi commande" },
    { id: "auto-cc2", label: "Commande menuiseries extérieures en attente — Longère Aubert, Saint-Fargeau", auto: true, autoTag: "Suivi commande", autoUrgent: true },
    { id: "auto-cc3", label: "Mettre à jour tableau de suivi — Rénovation Chabrier, Joigny (avancement 71%)", auto: true, autoTag: "MAJ tableau" },
  ],
  chantiers_signes: [
    { id: "auto-cs1", label: "Envoyer bon de commande Béton Yonne — Dalle extension Bernard, Auxerre — 8 000 €", auto: true, autoTag: "Bon de commande", autoUrgent: true },
    { id: "auto-cs2", label: "Construire tableau de suivi — Maison Renard, Auxerre — démarrage 7 sept.", auto: true, autoTag: "Tableau suivi" },
  ],
  devis: [
    { id: "auto-d1", label: "Relancer DEV-2026-0074 — Philippe Garnier, Migennes — électricité — 6 800 € — 19 jours sans réponse", auto: true, autoTag: "Relance devis", autoUrgent: true },
    { id: "auto-d2", label: "Envoyer DEV-2026-0069 — Guy Lefebvre, Moutiers — plomberie — 7 400 € — finalisé le 25/08", auto: true, autoTag: "Devis à envoyer", autoUrgent: true },
    { id: "auto-d3", label: "Mettre à jour devis — Faure, Sens — cuisine — choix matériaux en cours", auto: true, autoTag: "Devis à avancer" },
  ],
  suivi_general: [
    { id: "auto-sg1", label: "Relancer devis — DEV-2026-0065 — Corinne Thibaut, Chablis — SDB — 14 000 € — 5 jours sans réponse", auto: true, autoTag: "À relancer", autoUrgent: true },
    { id: "auto-sg2", label: "Prospect à rappeler — Corinne Thibaut — rendez-vous à fixer début septembre", auto: true, autoTag: "Prospection" },
  ],
};

// ── Default sections ───────────────────────────────────────────────────────────

export const DEFAULT_SECTIONS: RoutineSection[] = [
  {
    id: "agenda",
    title: "AGENDA",
    color: "#00365A",
    items: [
      { id: "ag1", label: "Rendez-vous du jour" },
      { id: "ag2", label: "Contraintes horaires pro / perso" },
    ],
  },
  {
    id: "messagerie",
    title: "MESSAGERIE",
    color: "#1D4ED8",
    items: [
      { id: "mg1", label: "Emails" },
      { id: "mg2", label: "Répondeur téléphonique" },
      { id: "mg3", label: "Messenger" },
      { id: "mg4", label: "WIX (formulaires site)" },
      { id: "mg5", label: "Instagram (messages directs)" },
    ],
  },
  {
    id: "finances",
    title: "FINANCES",
    color: "#166534",
    items: [
      { id: "fi1", label: "Position des comptes" },
      { id: "fi2", label: "Facture acompte / solde ?" },
      { id: "fi3", label: "Paiement sous-traitant ?" },
      { id: "fi4", label: "Justificatifs → Charlotte" },
      ...AUTO_ITEMS.finances,
    ],
  },
  {
    id: "chantiers_cours",
    title: "CHANTIERS EN COURS",
    color: "#6B21A8",
    items: [
      { id: "cc1", label: "MAJ tableau Clients / Sous-traitants" },
      { id: "cc2", label: "Vérifier marge / coûts" },
      { id: "cc3", label: "Docs client / Sous-traitant" },
      { id: "cc4", label: "Suivi commandes" },
      ...AUTO_ITEMS.chantiers_cours,
    ],
  },
  {
    id: "chantiers_signes",
    title: "CHANTIERS SIGNÉS – NON COMMENCÉS",
    color: "#B45309",
    items: [
      { id: "cs1", label: "Faire / envoyer bon de commande sous-traitant" },
      { id: "cs2", label: "Construire tableau de suivi" },
      { id: "cs3", label: "Construire tableau de commandes" },
      ...AUTO_ITEMS.chantiers_signes,
    ],
  },
  {
    id: "devis",
    title: "DEVIS EN COURS",
    color: "#0369A1",
    items: [
      { id: "dv1", label: "Avancer / envoyer devis en cours" },
      ...AUTO_ITEMS.devis,
    ],
  },
  {
    id: "suivi_general",
    title: "TABLEAU SUIVI GÉNÉRAL SENO",
    color: "#7C3AED",
    items: [
      { id: "sg1", label: "Devis à commencer" },
      { id: "sg2", label: "Devis à relancer" },
      ...AUTO_ITEMS.suivi_general,
    ],
  },
  {
    id: "prospection",
    title: "PROSPECTION",
    color: "#BE185D",
    items: [
      { id: "pr1", label: "Architectes" },
      { id: "pr2", label: "Notaires" },
      { id: "pr3", label: "Agents immobiliers" },
      { id: "pr4", label: "Autres contacts" },
    ],
  },
  {
    id: "communication",
    title: "COMMUNICATION",
    color: "#B91C1C",
    items: [
      { id: "co1", label: "Instagram" },
      { id: "co2", label: "Facebook" },
      { id: "co3", label: "Site SENO" },
    ],
  },
];
