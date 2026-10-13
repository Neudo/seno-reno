import type { Chantier } from "./chantierTypes";

export const INITIAL_CHANTIERS: Chantier[] = [
  // ─── Client 1 : Jean Dupont — Auxerre ─────────────────────────────────────
  {
    id: 1,
    nom: "Rénovation complète maison ancienne — Dupont",
    clientId: 1,
    clientNom: "Jean Dupont",
    adresse: "14 rue de l'Yonne, 89000 Auxerre",
    statut: "en_cours",
    dateDebutPrevue: "2026-07-07",
    dateFinPrevue: "2026-11-28",
    montantDevisInitial: 42000,
    notes: "Rénovation complète maison XIXe — plomberie, électricité, carrelage, enduits, menuiseries intérieures.",
    commandes: [
      { id: 1, titre: "Carrelage grès cérame 45 m²", fournisseur: "Ceramica Pro Auxerre", montantPrevisionnel: 2800, statutCommande: "recu", statutPaiement: "paye" },
      { id: 2, titre: "Menuiseries intérieures (portes + plinthes)", fournisseur: "Lapeyre", montantPrevisionnel: 4500, montantReel: 4680, statutCommande: "recu", statutPaiement: "paye" },
      { id: 3, titre: "Matériaux divers — enduits, visserie", fournisseur: "Tout Faire Auxerre", montantPrevisionnel: 3200, statutCommande: "recu", statutPaiement: "paye" },
    ],
    sousTraitants: [
      { id: 1, entreprise: "Morvan Électricité", prestation: "Mise aux normes électrique complète", montantPrevisionnel: 4800, montantPaye: 4800, statutPaiement: "paye" },
      { id: 2, entreprise: "Plomberie Fontaine", prestation: "Rénovation plomberie + salle de bain", montantPrevisionnel: 5500, montantPaye: 2750, echeance: "2026-10-15", statutPaiement: "partiellement_paye" },
    ],
    plusMoinsValues: [
      { id: 1, libelle: "Ajout VMC double flux", type: "plus_value", montant: 3200, statut: "acceptee", date: "2026-07-20" },
    ],
    documents: [
      { id: 1, nom: "Devis signé — Dupont Rénovation", categorie: "devis", dateAjout: "2026-06-28", taille: "480 Ko" },
      { id: 2, nom: "Plan RDC", categorie: "plan", dateAjout: "2026-06-30", taille: "1,2 Mo" },
    ],
    acomptes: [
      { id: 1, libelle: "Acompte 30% à la commande", montant: 12600, statut: "encaisse", dateAppelPrevue: "2026-07-07" },
      { id: 2, libelle: "Acompte 40% mi-chantier", montant: 16800, statut: "a_appeler", dateAppelPrevue: "2026-09-20", dateRelance: "2026-09-25" },
      { id: 3, libelle: "Solde 30% à la réception", montant: 12600, statut: "a_appeler", dateAppelPrevue: "2026-11-28" },
    ],
  },
  {
    id: 2,
    nom: "Isolation combles + toiture — Dupont",
    clientId: 1,
    clientNom: "Jean Dupont",
    adresse: "14 rue de l'Yonne, 89000 Auxerre",
    statut: "termine",
    dateDebutPrevue: "2026-03-02",
    dateFinPrevue: "2026-05-09",
    montantDevisInitial: 18500,
    notes: "Soufflage ouate de cellulose 180 m² + réfection couverture tuiles mécaniques.",
    commandes: [
      { id: 4, titre: "Ouate de cellulose 180 m²", fournisseur: "Isocell", montantPrevisionnel: 4200, montantReel: 4350, statutCommande: "recu", statutPaiement: "paye" },
      { id: 5, titre: "Tuiles mécaniques + faîtières", fournisseur: "Edilians", montantPrevisionnel: 3800, montantReel: 3800, statutCommande: "recu", statutPaiement: "paye" },
    ],
    sousTraitants: [],
    plusMoinsValues: [],
    documents: [
      { id: 3, nom: "Devis isolation signé", categorie: "devis", dateAjout: "2026-02-15", taille: "310 Ko" },
    ],
    acomptes: [],
  },
  {
    id: 3,
    nom: "Réfection salle de bain — Dupont",
    clientId: 1,
    clientNom: "Jean Dupont",
    adresse: "14 rue de l'Yonne, 89000 Auxerre",
    statut: "termine",
    dateDebutPrevue: "2026-01-05",
    dateFinPrevue: "2026-02-14",
    montantDevisInitial: 8200,
    notes: "SDB complète : douche italienne, meuble vasque, WC suspendu, carrelage.",
    commandes: [
      { id: 6, titre: "Carrelage SDB 18 m²", fournisseur: "Ceramica Pro Auxerre", montantPrevisionnel: 1400, montantReel: 1400, statutCommande: "recu", statutPaiement: "paye" },
      { id: 7, titre: "Pack sanitaires (douche + WC + vasque)", fournisseur: "Ideal Standard", montantPrevisionnel: 2100, montantReel: 2100, statutCommande: "recu", statutPaiement: "paye" },
    ],
    sousTraitants: [
      { id: 3, entreprise: "Plomberie Fontaine", prestation: "Plomberie salle de bain", montantPrevisionnel: 1800, montantReel: 1800, montantPaye: 1800, statutPaiement: "paye" },
    ],
    plusMoinsValues: [],
    documents: [],
    acomptes: [],
  },

  // ─── Client 2 : Marie-Claire Aubert — Saint-Fargeau ─────────────────────────
  {
    id: 4,
    nom: "Rénovation longère — intérieur complet — Aubert",
    clientId: 2,
    clientNom: "Marie-Claire Aubert",
    adresse: "12 chemin des Chênes, 89170 Saint-Fargeau",
    statut: "en_cours",
    dateDebutPrevue: "2026-06-02",
    dateFinPrevue: "2026-12-18",
    montantDevisInitial: 78000,
    notes: "Rénovation complète longère en pierre : charpente, isolation, plomberie, électricité, finitions intérieures.",
    commandes: [
      { id: 8, titre: "Bois charpente + chevrons", fournisseur: "Négoce Bois Bourgogne", montantPrevisionnel: 8500, montantReel: 8800, statutCommande: "recu", statutPaiement: "paye" },
      { id: 9, titre: "Menuiseries extérieures (6 fenêtres + porte)", fournisseur: "K•LINE", montantPrevisionnel: 6200, statutCommande: "commande", statutPaiement: "non_paye", dateLivraisonPrevue: "2026-09-10" },
      { id: 10, titre: "Laine de bois 220 m²", fournisseur: "Isover", montantPrevisionnel: 3400, statutCommande: "recu", statutPaiement: "paye" },
    ],
    sousTraitants: [
      { id: 4, entreprise: "Charpente Puisaye", prestation: "Charpente et couverture ardoise", montantPrevisionnel: 12000, montantPaye: 6000, echeance: "2026-10-01", statutPaiement: "partiellement_paye" },
      { id: 5, entreprise: "Morvan Électricité", prestation: "Électricité complète NF C 15-100", montantPrevisionnel: 7500, montantPaye: 0, echeance: "2026-11-15", statutPaiement: "non_paye" },
    ],
    plusMoinsValues: [
      { id: 2, libelle: "Création d'une véranda 12 m²", type: "plus_value", montant: 8500, statut: "proposee", date: "2026-08-15" },
    ],
    documents: [
      { id: 4, nom: "Devis longère signé", categorie: "devis", dateAjout: "2026-05-28", taille: "560 Ko" },
      { id: 5, nom: "Plans architecte", categorie: "plan", dateAjout: "2026-05-30", taille: "3,4 Mo" },
    ],
    acomptes: [
      { id: 4, libelle: "Acompte 30% à la commande", montant: 23400, statut: "encaisse", dateAppelPrevue: "2026-06-02" },
      { id: 5, libelle: "Acompte 40% mi-chantier", montant: 31200, statut: "a_appeler", dateAppelPrevue: "2026-09-10", dateRelance: "2026-09-18" },
      { id: 6, libelle: "Solde 30% à la réception", montant: 23400, statut: "a_appeler", dateAppelPrevue: "2026-12-18" },
    ],
  },
  {
    id: 5,
    nom: "Rénovation cuisine — Aubert",
    clientId: 2,
    clientNom: "Marie-Claire Aubert",
    adresse: "12 chemin des Chênes, 89170 Saint-Fargeau",
    statut: "termine",
    dateDebutPrevue: "2025-10-06",
    dateFinPrevue: "2025-11-21",
    montantDevisInitial: 14500,
    notes: "Cuisine ouverte sur salon : démolition cloison, carrelage sol, plans de travail, habillage.",
    commandes: [
      { id: 11, titre: "Carrelage cuisine 28 m²", fournisseur: "Ceramica Pro Auxerre", montantPrevisionnel: 1900, montantReel: 1900, statutCommande: "recu", statutPaiement: "paye" },
    ],
    sousTraitants: [
      { id: 6, entreprise: "Plomberie Fontaine", prestation: "Plomberie cuisine", montantPrevisionnel: 1800, montantReel: 1800, montantPaye: 1800, statutPaiement: "paye" },
    ],
    plusMoinsValues: [],
    documents: [],
    acomptes: [],
  },

  // ─── Client 3 : Pascal Bernard — Auxerre ─────────────────────────────────────
  {
    id: 6,
    nom: "Extension ossature bois 40 m² — Bernard",
    clientId: 3,
    clientNom: "Pascal Bernard",
    adresse: "8 allée des Vignes, 89000 Auxerre",
    statut: "en_cours",
    dateDebutPrevue: "2026-09-01",
    dateFinPrevue: "2026-12-19",
    montantDevisInitial: 62000,
    notes: "Extension 40 m² ossature bois — dalle béton, structure, couverture bac acier, isolation, finitions.",
    commandes: [
      { id: 12, titre: "Kit ossature bois 40 m²", fournisseur: "Piveteaubois", montantPrevisionnel: 18000, statutCommande: "commande", statutPaiement: "non_paye", dateLivraisonPrevue: "2026-09-05" },
      { id: 13, titre: "Bac acier couverture", fournisseur: "ArcelorMittal Distribution", montantPrevisionnel: 3200, statutCommande: "a_commander", statutPaiement: "non_paye" },
      { id: 14, titre: "Isolation parois + sol", fournisseur: "Isover", montantPrevisionnel: 4500, statutCommande: "a_commander", statutPaiement: "non_paye" },
    ],
    sousTraitants: [
      { id: 7, entreprise: "Béton Yonne", prestation: "Dalle béton 40 m²", montantPrevisionnel: 8000, montantPaye: 0, echeance: "2026-09-20", statutPaiement: "non_paye" },
      { id: 8, entreprise: "Morvan Électricité", prestation: "Électricité extension", montantPrevisionnel: 5500, montantPaye: 0, echeance: "2026-12-01", statutPaiement: "non_paye" },
    ],
    plusMoinsValues: [],
    documents: [
      { id: 6, nom: "Devis extension Bernard signé", categorie: "devis", dateAjout: "2026-08-12", taille: "510 Ko" },
    ],
    acomptes: [
      { id: 7, libelle: "Acompte 30% à la commande", montant: 18600, statut: "appele", dateAppelPrevue: "2026-09-01" },
      { id: 8, libelle: "Acompte 40% mi-chantier", montant: 24800, statut: "a_appeler", dateAppelPrevue: "2026-10-20", dateRelance: "2026-10-27" },
      { id: 9, libelle: "Solde 30% à la réception", montant: 18600, statut: "a_appeler", dateAppelPrevue: "2026-12-19" },
    ],
  },
  {
    id: 7,
    nom: "Isolation thermique façade ITE — Bernard",
    clientId: 3,
    clientNom: "Pascal Bernard",
    adresse: "8 allée des Vignes, 89000 Auxerre",
    statut: "en_attente",
    dateDebutPrevue: "2026-12-07",
    dateFinPrevue: "2027-01-30",
    montantDevisInitial: 22000,
    notes: "ITE façade sud + nord — laine de roche + enduit minéral. À démarrer après extension.",
    commandes: [],
    sousTraitants: [],
    plusMoinsValues: [],
    documents: [
      { id: 7, nom: "Devis ITE Bernard signé", categorie: "devis", dateAjout: "2026-08-20", taille: "360 Ko" },
    ],
    acomptes: [],
  },

  // ─── Client 4 : SCI Les Rives de l'Yonne — Auxerre ─────────────────────────
  {
    id: 8,
    nom: "Rénovation appartement T3 — quai de la Marine — SCI Rives",
    clientId: 4,
    clientNom: "SCI Les Rives de l'Yonne",
    adresse: "2 quai de la Marine, 89000 Auxerre",
    statut: "en_cours",
    dateDebutPrevue: "2026-08-04",
    dateFinPrevue: "2026-10-16",
    montantDevisInitial: 38000,
    notes: "Appartement T3 — carrelage, parquet, peinture, salle de bain, cuisine équipée.",
    commandes: [
      { id: 15, titre: "Carrelage grès cérame 42 m²", fournisseur: "Ceramica Pro Auxerre", montantPrevisionnel: 3200, montantReel: 3200, statutCommande: "recu", statutPaiement: "paye" },
      { id: 16, titre: "Parquet chêne 28 m²", fournisseur: "Parquet Bourgogne", montantPrevisionnel: 2400, statutCommande: "commande", statutPaiement: "non_paye", dateLivraisonPrevue: "2026-08-28" },
      { id: 17, titre: "Pack sanitaires salle de bain", fournisseur: "Ideal Standard", montantPrevisionnel: 3800, montantReel: 3800, statutCommande: "recu", statutPaiement: "paye" },
      { id: 18, titre: "Peinture acrylique (8 pièces)", fournisseur: "Weldom Auxerre", montantPrevisionnel: 1800, statutCommande: "recu", statutPaiement: "paye" },
    ],
    sousTraitants: [
      { id: 9, entreprise: "Plomberie Fontaine", prestation: "Plomberie salle de bain + cuisine", montantPrevisionnel: 6500, montantPaye: 3250, echeance: "2026-10-01", statutPaiement: "partiellement_paye" },
    ],
    plusMoinsValues: [],
    documents: [
      { id: 8, nom: "Devis T3 quai Marine signé", categorie: "devis", dateAjout: "2026-07-22", taille: "420 Ko" },
    ],
    acomptes: [
      { id: 10, libelle: "Acompte 30% à la commande", montant: 11400, statut: "encaisse", dateAppelPrevue: "2026-08-04" },
      { id: 11, libelle: "Acompte 40% mi-chantier", montant: 15200, statut: "a_appeler", dateAppelPrevue: "2026-09-25", dateRelance: "2026-10-02" },
      { id: 12, libelle: "Solde 30% à la réception", montant: 11400, statut: "a_appeler", dateAppelPrevue: "2026-10-16" },
    ],
  },
  {
    id: 9,
    nom: "Rénovation appartement T4 — rue du Temple — SCI Rives",
    clientId: 4,
    clientNom: "SCI Les Rives de l'Yonne",
    adresse: "18 rue du Temple, 89000 Auxerre",
    statut: "en_attente",
    dateDebutPrevue: "2026-10-19",
    dateFinPrevue: "2027-01-29",
    montantDevisInitial: 52000,
    notes: "Appartement T4 — rénovation complète : plomberie, électricité, carrelage, parquet, cuisine.",
    commandes: [],
    sousTraitants: [],
    plusMoinsValues: [],
    documents: [
      { id: 9, nom: "Devis T4 rue Temple signé", categorie: "devis", dateAjout: "2026-09-10", taille: "480 Ko" },
    ],
    acomptes: [],
  },

  // ─── Client 5 : Philippe Garnier — Migennes ─────────────────────────────────
  {
    id: 10,
    nom: "Isolation combles perdus — Garnier",
    clientId: 5,
    clientNom: "Philippe Garnier",
    adresse: "3 rue des Tonneliers, 89400 Migennes",
    statut: "en_pause",
    dateDebutPrevue: "2026-05-04",
    dateFinPrevue: "2026-06-13",
    montantDevisInitial: 9600,
    notes: "Chantier en pause suite à problème d'humidité en toiture. Traitement hydrofuge nécessaire avant reprise.",
    commandes: [
      { id: 19, titre: "Ouate de cellulose 160 m²", fournisseur: "Isocell", montantPrevisionnel: 3100, statutCommande: "recu", statutPaiement: "paye" },
    ],
    sousTraitants: [],
    plusMoinsValues: [
      { id: 3, libelle: "Traitement humidité — surcoût", type: "plus_value", montant: 1200, statut: "proposee", date: "2026-06-01" },
    ],
    documents: [],
    acomptes: [],
  },
  {
    id: 11,
    nom: "Électricité mise aux normes — Garnier",
    clientId: 5,
    clientNom: "Philippe Garnier",
    adresse: "3 rue des Tonneliers, 89400 Migennes",
    statut: "en_attente",
    dateDebutPrevue: "2026-11-02",
    dateFinPrevue: "2026-11-20",
    montantDevisInitial: 6800,
    notes: "Tableau électrique neuf + mise aux normes NF C 15-100 — maison de 1968.",
    commandes: [],
    sousTraitants: [
      { id: 10, entreprise: "Morvan Électricité", prestation: "Tableau + mise aux normes complète", montantPrevisionnel: 4200, montantPaye: 0, echeance: "2026-11-25", statutPaiement: "non_paye" },
    ],
    plusMoinsValues: [],
    documents: [],
    acomptes: [],
  },

  // ─── Client 6 : Isabelle Leconte — Chablis ───────────────────────────────────
  {
    id: 12,
    nom: "Isolation extérieure ITE — Leconte",
    clientId: 6,
    clientNom: "Isabelle Leconte",
    adresse: "5 rue des Vignerons, 89800 Chablis",
    statut: "en_attente",
    dateDebutPrevue: "2026-10-05",
    dateFinPrevue: "2026-11-14",
    montantDevisInitial: 28500,
    notes: "ITE façade complète — laine de roche 14 cm + enduit minéral blanc cassé — 180 m².",
    commandes: [],
    sousTraitants: [],
    plusMoinsValues: [],
    documents: [],
    acomptes: [],
  },

  // ─── Client 7 : Robert Moreau — Toucy ───────────────────────────────────────
  {
    id: 13,
    nom: "Extension ossature bois 40 m² — Moreau",
    clientId: 7,
    clientNom: "Robert Moreau",
    adresse: "22 route de Joigny, 89130 Toucy",
    statut: "en_cours",
    dateDebutPrevue: "2026-08-11",
    dateFinPrevue: "2026-11-27",
    montantDevisInitial: 68000,
    notes: "Extension 40 m² — dalle, ossature bois, couverture bac acier, menuiseries, isolation, finitions intérieures.",
    commandes: [
      { id: 20, titre: "Kit ossature bois 40 m²", fournisseur: "Piveteaubois", montantPrevisionnel: 19500, montantReel: 19800, statutCommande: "recu", statutPaiement: "paye" },
      { id: 21, titre: "Couverture bac acier + zinguerie", fournisseur: "ArcelorMittal Distribution", montantPrevisionnel: 4200, statutCommande: "commande", statutPaiement: "non_paye" },
      { id: 22, titre: "Terrasse bois ipé 20 m²", fournisseur: "Négoce Bois Bourgogne", montantPrevisionnel: 5800, statutCommande: "a_commander", statutPaiement: "non_paye" },
    ],
    sousTraitants: [
      { id: 11, entreprise: "Béton Yonne", prestation: "Dalle béton 40 m²", montantPrevisionnel: 9000, montantReel: 9200, montantPaye: 9200, statutPaiement: "paye" },
      { id: 12, entreprise: "Morvan Électricité", prestation: "Électricité extension", montantPrevisionnel: 5200, montantPaye: 0, echeance: "2026-11-10", statutPaiement: "non_paye" },
    ],
    plusMoinsValues: [
      { id: 4, libelle: "Terrasse bois supplémentaire 8 m²", type: "plus_value", montant: 2800, statut: "acceptee", date: "2026-08-20" },
    ],
    documents: [
      { id: 10, nom: "Devis extension Moreau signé", categorie: "devis", dateAjout: "2026-07-30", taille: "530 Ko" },
      { id: 11, nom: "Plan extension", categorie: "plan", dateAjout: "2026-08-01", taille: "1,8 Mo" },
    ],
    acomptes: [
      { id: 13, libelle: "Acompte 30% à la commande", montant: 20400, statut: "encaisse", dateAppelPrevue: "2026-08-11" },
      { id: 14, libelle: "Acompte 40% mi-chantier", montant: 27200, statut: "a_appeler", dateAppelPrevue: "2026-10-05", dateRelance: "2026-10-12" },
      { id: 15, libelle: "Solde 30% à la réception", montant: 20400, statut: "a_appeler", dateAppelPrevue: "2026-11-27" },
    ],
  },
  {
    id: 14,
    nom: "Réfection toiture ardoise — Moreau",
    clientId: 7,
    clientNom: "Robert Moreau",
    adresse: "22 route de Joigny, 89130 Toucy",
    statut: "termine",
    dateDebutPrevue: "2026-04-07",
    dateFinPrevue: "2026-05-16",
    montantDevisInitial: 22000,
    notes: "Réfection toiture ardoise naturelle 220 m² + velux + solins.",
    commandes: [
      { id: 23, titre: "Ardoise naturelle 220 m²", fournisseur: "Edilians", montantPrevisionnel: 7800, montantReel: 7800, statutCommande: "recu", statutPaiement: "paye" },
      { id: 24, titre: "Velux x2 + accessoires", fournisseur: "Velux", montantPrevisionnel: 1400, montantReel: 1400, statutCommande: "recu", statutPaiement: "paye" },
    ],
    sousTraitants: [],
    plusMoinsValues: [],
    documents: [],
    acomptes: [],
  },

  // ─── Client 8 : Emmanuelle Faure — Sens ─────────────────────────────────────
  {
    id: 15,
    nom: "Rénovation cuisine complète — Faure",
    clientId: 8,
    clientNom: "Emmanuelle Faure",
    adresse: "17 boulevard Jean Jaurès, 89100 Sens",
    statut: "en_attente",
    dateDebutPrevue: "2026-11-09",
    dateFinPrevue: "2026-12-18",
    montantDevisInitial: 16200,
    notes: "Cuisine ouverte sur salon — dépose ancienne cuisine, carrelage, plans de travail, plomberie, électricité.",
    commandes: [],
    sousTraitants: [],
    plusMoinsValues: [],
    documents: [],
    acomptes: [],
  },

  // ─── Client 9 : Michel Chabrier — Joigny ─────────────────────────────────────
  {
    id: 16,
    nom: "Rénovation intérieure complète — Chabrier",
    clientId: 9,
    clientNom: "Michel Chabrier",
    adresse: "9 rue du Château, 89300 Joigny",
    statut: "en_cours",
    dateDebutPrevue: "2026-07-13",
    dateFinPrevue: "2026-10-09",
    montantDevisInitial: 54000,
    notes: "Maison de ville XIXe — rénovation intérieure : cloisons, carrelage, parquet, peinture, SDB, cuisine.",
    commandes: [
      { id: 25, titre: "Carrelage sols 65 m²", fournisseur: "Ceramica Pro Auxerre", montantPrevisionnel: 4500, montantReel: 4500, statutCommande: "recu", statutPaiement: "paye" },
      { id: 26, titre: "Parquet chêne 40 m²", fournisseur: "Parquet Bourgogne", montantPrevisionnel: 3800, montantReel: 3800, statutCommande: "recu", statutPaiement: "paye" },
      { id: 27, titre: "Peinture acrylique (10 pièces)", fournisseur: "Weldom Auxerre", montantPrevisionnel: 2200, statutCommande: "recu", statutPaiement: "paye" },
      { id: 28, titre: "Menuiseries intérieures", fournisseur: "Lapeyre", montantPrevisionnel: 3500, statutCommande: "commande", statutPaiement: "non_paye", dateLivraisonPrevue: "2026-09-15" },
    ],
    sousTraitants: [
      { id: 13, entreprise: "Plomberie Fontaine", prestation: "SDB + cuisine — plomberie", montantPrevisionnel: 6000, montantPaye: 3000, echeance: "2026-09-30", statutPaiement: "partiellement_paye" },
      { id: 14, entreprise: "Morvan Électricité", prestation: "Électricité complète", montantPrevisionnel: 5500, montantPaye: 5500, statutPaiement: "paye" },
    ],
    plusMoinsValues: [],
    documents: [
      { id: 12, nom: "Devis Chabrier signé", categorie: "devis", dateAjout: "2026-07-01", taille: "490 Ko" },
    ],
    acomptes: [
      { id: 16, libelle: "Acompte 30% à la commande", montant: 16200, statut: "encaisse", dateAppelPrevue: "2026-07-13" },
      { id: 17, libelle: "Acompte 40% mi-chantier", montant: 21600, statut: "a_appeler", dateAppelPrevue: "2026-09-01", dateRelance: "2026-09-18" },
      { id: 18, libelle: "Solde 30% à la réception", montant: 16200, statut: "a_appeler", dateAppelPrevue: "2026-10-09" },
    ],
  },

  // ─── Client 10 : SARL Immo Bourgogne — Auxerre ───────────────────────────────
  {
    id: 17,
    nom: "Rénovation appartement T4 — avenue Gambetta — Immo Bourgogne",
    clientId: 10,
    clientNom: "SARL Immo Bourgogne",
    adresse: "34 avenue Gambetta, 89000 Auxerre",
    statut: "en_cours",
    dateDebutPrevue: "2026-08-17",
    dateFinPrevue: "2026-11-13",
    montantDevisInitial: 48000,
    notes: "Appartement T4 locatif — carrelage, parquet, cuisine équipée, SDB, peinture, électricité.",
    commandes: [
      { id: 29, titre: "Carrelage grès cérame 55 m²", fournisseur: "Ceramica Pro Auxerre", montantPrevisionnel: 3800, montantReel: 3800, statutCommande: "recu", statutPaiement: "paye" },
      { id: 30, titre: "Cuisine équipée 8 éléments", fournisseur: "Lapeyre", montantPrevisionnel: 5200, statutCommande: "commande", statutPaiement: "non_paye", dateLivraisonPrevue: "2026-09-12" },
      { id: 31, titre: "Pack sanitaires SDB", fournisseur: "Ideal Standard", montantPrevisionnel: 3400, montantReel: 3400, statutCommande: "recu", statutPaiement: "paye" },
      { id: 32, titre: "Peinture (8 pièces)", fournisseur: "Weldom Auxerre", montantPrevisionnel: 2000, statutCommande: "recu", statutPaiement: "paye" },
    ],
    sousTraitants: [
      { id: 15, entreprise: "Plomberie Fontaine", prestation: "Plomberie SDB + cuisine", montantPrevisionnel: 6500, montantPaye: 0, echeance: "2026-10-20", statutPaiement: "non_paye" },
      { id: 16, entreprise: "Morvan Électricité", prestation: "Électricité T4", montantPrevisionnel: 4800, montantPaye: 4800, statutPaiement: "paye" },
    ],
    plusMoinsValues: [],
    documents: [
      { id: 13, nom: "Devis T4 Gambetta signé", categorie: "devis", dateAjout: "2026-08-05", taille: "430 Ko" },
    ],
    acomptes: [
      { id: 19, libelle: "Acompte 30% à la commande", montant: 14400, statut: "encaisse", dateAppelPrevue: "2026-08-17" },
      { id: 20, libelle: "Acompte 40% mi-chantier", montant: 19200, statut: "a_appeler", dateAppelPrevue: "2026-10-01", dateRelance: "2026-10-08" },
      { id: 21, libelle: "Solde 30% à la réception", montant: 14400, statut: "a_appeler", dateAppelPrevue: "2026-11-13" },
    ],
  },
  {
    id: 18,
    nom: "Rénovation appartement T2 — rue de Paris — Immo Bourgogne",
    clientId: 10,
    clientNom: "SARL Immo Bourgogne",
    adresse: "12 rue de Paris, 89000 Auxerre",
    statut: "termine",
    dateDebutPrevue: "2026-04-06",
    dateFinPrevue: "2026-06-12",
    montantDevisInitial: 24000,
    notes: "T2 rénové pour location meublée — carrelage, SDB neuve, cuisine, peinture.",
    commandes: [
      { id: 33, titre: "Carrelage + sanitaires", fournisseur: "Ceramica Pro Auxerre", montantPrevisionnel: 3200, montantReel: 3200, statutCommande: "recu", statutPaiement: "paye" },
    ],
    sousTraitants: [
      { id: 17, entreprise: "Plomberie Fontaine", prestation: "Plomberie T2", montantPrevisionnel: 3500, montantReel: 3500, montantPaye: 3500, statutPaiement: "paye" },
    ],
    plusMoinsValues: [],
    documents: [],
    acomptes: [],
  },

  // ─── Client 11 : Thomas Petit — Appoigny ─────────────────────────────────────
  {
    id: 19,
    nom: "Salle de bain complète — douche italienne — Petit",
    clientId: 11,
    clientNom: "Thomas Petit",
    adresse: "6 impasse du Moulin, 89380 Appoigny",
    statut: "en_attente",
    dateDebutPrevue: "2026-09-14",
    dateFinPrevue: "2026-10-09",
    montantDevisInitial: 11500,
    notes: "SDB 6 m² — douche italienne 120×80, meuble vasque suspendu, WC suspendu, carrelage grand format.",
    commandes: [
      { id: 34, titre: "Carrelage grand format 12 m²", fournisseur: "Ceramica Pro Auxerre", montantPrevisionnel: 1800, statutCommande: "a_commander", statutPaiement: "non_paye" },
      { id: 35, titre: "Pack sanitaires (douche + WC + vasque)", fournisseur: "Ideal Standard", montantPrevisionnel: 2200, statutCommande: "a_commander", statutPaiement: "non_paye" },
    ],
    sousTraitants: [
      { id: 18, entreprise: "Plomberie Fontaine", prestation: "Plomberie salle de bain", montantPrevisionnel: 2800, montantPaye: 0, echeance: "2026-10-05", statutPaiement: "non_paye" },
    ],
    plusMoinsValues: [],
    documents: [
      { id: 14, nom: "Devis Petit SDB signé", categorie: "devis", dateAjout: "2026-08-22", taille: "290 Ko" },
    ],
    acomptes: [],
  },

  // ─── Client 12 : Nathalie Renard — Auxerre ───────────────────────────────────
  {
    id: 20,
    nom: "Rénovation maison ancienne en pierre — Renard",
    clientId: 12,
    clientNom: "Nathalie Renard",
    adresse: "28 rue Fourier, 89000 Auxerre",
    statut: "en_cours",
    dateDebutPrevue: "2026-09-07",
    dateFinPrevue: "2027-03-26",
    montantDevisInitial: 85000,
    notes: "Maison en pierre XIXe — rénovation complète : charpente, toiture, isolation, électricité, plomberie, finitions.",
    commandes: [
      { id: 36, titre: "Bois charpente + traitement", fournisseur: "Négoce Bois Bourgogne", montantPrevisionnel: 8000, statutCommande: "commande", statutPaiement: "non_paye", dateLivraisonPrevue: "2026-09-15" },
      { id: 37, titre: "Menuiseries extérieures (8 ouvertures)", fournisseur: "K•LINE", montantPrevisionnel: 7500, statutCommande: "a_commander", statutPaiement: "non_paye" },
      { id: 38, titre: "Isolation laine de roche 250 m²", fournisseur: "Isover", montantPrevisionnel: 5500, statutCommande: "a_commander", statutPaiement: "non_paye" },
      { id: 39, titre: "Carrelage grès cérame 80 m²", fournisseur: "Ceramica Pro Auxerre", montantPrevisionnel: 4200, statutCommande: "a_commander", statutPaiement: "non_paye" },
    ],
    sousTraitants: [
      { id: 19, entreprise: "Charpente Puisaye", prestation: "Charpente + couverture ardoise", montantPrevisionnel: 12000, montantPaye: 0, echeance: "2026-10-30", statutPaiement: "non_paye" },
      { id: 20, entreprise: "Plomberie Fontaine", prestation: "Plomberie complète", montantPrevisionnel: 8000, montantPaye: 0, echeance: "2027-01-15", statutPaiement: "non_paye" },
      { id: 21, entreprise: "Morvan Électricité", prestation: "Électricité complète NF C 15-100", montantPrevisionnel: 7500, montantPaye: 0, echeance: "2027-01-30", statutPaiement: "non_paye" },
    ],
    plusMoinsValues: [],
    documents: [
      { id: 15, nom: "Devis Renard maison signé", categorie: "devis", dateAjout: "2026-08-20", taille: "620 Ko" },
    ],
    acomptes: [
      { id: 22, libelle: "Acompte 30% à la commande", montant: 25500, statut: "a_appeler", dateAppelPrevue: "2026-09-07", dateRelance: "2026-09-18" },
      { id: 23, libelle: "Acompte 40% mi-chantier", montant: 34000, statut: "a_appeler", dateAppelPrevue: "2026-12-01" },
      { id: 24, libelle: "Solde 30% à la réception", montant: 25500, statut: "a_appeler", dateAppelPrevue: "2027-03-26" },
    ],
  },

  // ─── Client 13 : Guy Lefebvre — Moutiers-en-Puisaye ─────────────────────────
  {
    id: 21,
    nom: "Plomberie complète — remplacement réseau — Lefebvre",
    clientId: 13,
    clientNom: "Guy Lefebvre",
    adresse: "4 route de Toucy, 89110 Moutiers-en-Puisaye",
    statut: "en_attente",
    dateDebutPrevue: "2026-10-12",
    dateFinPrevue: "2026-10-30",
    montantDevisInitial: 7400,
    notes: "Remplacement réseau plomberie vétuste — canalisations plomb à remplacer — maison 1958.",
    commandes: [],
    sousTraitants: [
      { id: 22, entreprise: "Plomberie Fontaine", prestation: "Remplacement réseau plomb complet", montantPrevisionnel: 4200, montantPaye: 0, echeance: "2026-10-28", statutPaiement: "non_paye" },
    ],
    plusMoinsValues: [],
    documents: [],
    acomptes: [],
  },

  // ─── Client 14 : Christine Vasseur — Saint-Fargeau ───────────────────────────
  {
    id: 22,
    nom: "Ravalement façade — enduit taloché — Vasseur",
    clientId: 14,
    clientNom: "Christine Vasseur",
    adresse: "7 rue des Pommiers, 89170 Saint-Fargeau",
    statut: "en_pause",
    dateDebutPrevue: "2026-06-08",
    dateFinPrevue: "2026-09-25",
    montantDevisInitial: 15800,
    notes: "Ravalement 220 m² — enduit taloché gris clair. Chantier interrompu suite intempéries. Reprise prévue octobre.",
    commandes: [
      { id: 40, titre: "Enduit Weber R310 + primaire", fournisseur: "Weber Saint-Gobain", montantPrevisionnel: 2800, montantReel: 2800, statutCommande: "recu", statutPaiement: "paye" },
    ],
    sousTraitants: [],
    plusMoinsValues: [],
    documents: [],
    acomptes: [],
  },

  // ─── Client 15 : Frédéric Arnould — Sens ─────────────────────────────────────
  {
    id: 23,
    nom: "Réfection salle de bain — douche italienne + baignoire — Arnould",
    clientId: 15,
    clientNom: "Frédéric Arnould",
    adresse: "11 rue Saint-Antoine, 89100 Sens",
    statut: "en_cours",
    dateDebutPrevue: "2026-08-25",
    dateFinPrevue: "2026-09-26",
    montantDevisInitial: 13600,
    notes: "SDB 8 m² — douche italienne + baignoire îlot, carrelage grand format, meuble double vasque.",
    commandes: [
      { id: 41, titre: "Carrelage grand format 16 m²", fournisseur: "Ceramica Pro Auxerre", montantPrevisionnel: 1800, montantReel: 1800, statutCommande: "recu", statutPaiement: "paye" },
      { id: 42, titre: "Pack sanitaires (douche + baignoire + vasques)", fournisseur: "Ideal Standard", montantPrevisionnel: 2200, montantReel: 2200, statutCommande: "recu", statutPaiement: "paye" },
    ],
    sousTraitants: [
      { id: 23, entreprise: "Plomberie Fontaine", prestation: "Plomberie salle de bain", montantPrevisionnel: 2800, montantPaye: 1400, echeance: "2026-09-20", statutPaiement: "partiellement_paye" },
    ],
    plusMoinsValues: [],
    documents: [
      { id: 16, nom: "Devis Arnould SDB signé", categorie: "devis", dateAjout: "2026-08-10", taille: "310 Ko" },
    ],
    acomptes: [
      { id: 25, libelle: "Acompte 30% à la commande", montant: 4080, statut: "encaisse", dateAppelPrevue: "2026-08-25" },
      { id: 26, libelle: "Solde 70% à la réception", montant: 9520, statut: "a_appeler", dateAppelPrevue: "2026-09-26", dateRelance: "2026-10-03" },
    ],
  },
];

let nextChantierId = 24;
let nextCommandeId = 43;
let nextSTId = 24;
let nextPMVId = 5;
let nextDocId = 17;
let nextAcompteId = 100;

export const getNextChantierId = () => nextChantierId++;
export const getNextCommandeId = () => nextCommandeId++;
export const getNextSTId = () => nextSTId++;
export const getNextPMVId = () => nextPMVId++;
export const getNextDocId = () => nextDocId++;
export const getNextAcompteId = () => nextAcompteId++;
