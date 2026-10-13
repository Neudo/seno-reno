export interface PrixItem {
  id: string;
  code: number;
  categorie: string;
  designation: string;
  unite: string;
  pvht: number | null; // null = à ajuster / non défini
  commentaire?: string;
}

export const CATEGORIES = [
  "Administratif",
  "Installation de chantier",
  "Démolition / Déposes",
  "Gros œuvre",
  "Maçonnerie / Plâtrerie",
  "Électricité — Courant fort",
  "Électricité — Courant faible",
  "Plomberie",
  "Chauffage",
  "Menuiserie intérieure",
  "Carrelage",
  "Parquet / Sols souples",
  "Peinture",
  "Menuiserie extérieure",
] as const;

export type Categorie = (typeof CATEGORIES)[number];

export const CATEGORY_COLORS: Record<Categorie, string> = {
  "Administratif": "#00365A",
  "Installation de chantier": "#0369A1",
  "Démolition / Déposes": "#B91C1C",
  "Gros œuvre": "#6B21A8",
  "Maçonnerie / Plâtrerie": "#B45309",
  "Électricité — Courant fort": "#CA8A04",
  "Électricité — Courant faible": "#D97706",
  "Plomberie": "#0891B2",
  "Chauffage": "#DC2626",
  "Menuiserie intérieure": "#166534",
  "Carrelage": "#7C3AED",
  "Parquet / Sols souples": "#92400E",
  "Peinture": "#BE185D",
  "Menuiserie extérieure": "#1D4ED8",
};

let _id = 1;
const id = () => String(_id++);

export const PRIX_DATA: PrixItem[] = [
  // ── ADMINISTRATIF ──────────────────────────────────────────────────────────
  { id: id(), code: 10, categorie: "Administratif", designation: "Divers administratif", unite: "u", pvht: 0 },
  { id: id(), code: 11, categorie: "Administratif", designation: "Facture d'acompte n°", unite: "u", pvht: 0 },
  { id: id(), code: 12, categorie: "Administratif", designation: "Montant Bon de Commande", unite: "ens", pvht: 0 },
  { id: id(), code: 13, categorie: "Administratif", designation: "Travaux supplémentaires réalisés selon devis N° DE", unite: "u", pvht: 0 },
  { id: id(), code: 14, categorie: "Administratif", designation: "Travaux supplémentaires", unite: "ens", pvht: 0 },

  // ── INSTALLATION DE CHANTIER ───────────────────────────────────────────────
  { id: id(), code: 101, categorie: "Installation de chantier", designation: "Constat d'huissier avant travaux dans parties communes (hall, cage d'escalier, palier, ascenseur, appartements limitrophes), rédaction d'un rapport écrit avec photos", unite: "u", pvht: 580, commentaire: "Préciser / Ajuster les zones concernées" },
  { id: id(), code: 102, categorie: "Installation de chantier", designation: "Réalisation d'un rapport technique réalisé par un bureau d'études spécialisé (Structure, thermique, phonique…)", unite: "ens", pvht: null, commentaire: "Ajuster selon besoins" },
  { id: id(), code: 103, categorie: "Installation de chantier", designation: "Installation et mise en place du chantier : protection par polyane des lieux, mise en place d'une zone vie, table, chaises, cafétière…, d'un point d'eau et d'un WC de chantier, d'un extincteur, nettoyage d'usage pendant les travaux, acheminement et repli du matériel en fin d'opération", unite: "ens", pvht: 950, commentaire: "Si multi entp et chantier très long – Pas suffisant – Prévoir 2 ou 3 K€ht mini" },
  { id: id(), code: 104, categorie: "Installation de chantier", designation: "Sécurisation du chantier : identification des réseaux existants, mise en place d'un tableau électrique de chantier provisoire normalisé avec protection pour mise en sécurité et éclairage par guirlandes lumineuses led", unite: "ens", pvht: 680 },
  { id: id(), code: 105, categorie: "Installation de chantier", designation: "Mise en place d'un monte-charge pour acheminement du matériel à l'étage et/ou évacuation des matériaux ou des gravats y compris main d'œuvre nécessaire pour manutention", unite: "u", pvht: 550 },
  { id: id(), code: 106, categorie: "Installation de chantier", designation: "Protection des sols par panneaux d'isorel de 3 mm, évacuation et mise à la déchetterie en fin d'opération", unite: "m²", pvht: 28 },
  { id: id(), code: 107, categorie: "Installation de chantier", designation: "Protection des sols par bâches plastiques au coton auto-adhésives, évacuation et mise à la déchetterie en fin d'opération", unite: "m²", pvht: 14 },
  { id: id(), code: 108, categorie: "Installation de chantier", designation: "PROVISION pour frais de livraison fournitures en pied de chantier", unite: "ens", pvht: 350, commentaire: "À ajuster selon frais facturés ou non par les différents fournisseurs" },
  { id: id(), code: 113, categorie: "Installation de chantier", designation: "Mise en place d'un échafaudage mobile pour travail en hauteur comprenant, montage, démontage, acheminement et repli en fin d'opération", unite: "ens", pvht: 400 },
  { id: id(), code: 114, categorie: "Installation de chantier", designation: "Mise à disposition d'un technicien pendant 1 journée pour pose d'éléments décoratifs simples (tringles à rideaux, porte serviettes, petits accessoires…)", unite: "u", pvht: 450 },
  { id: id(), code: 116, categorie: "Installation de chantier", designation: "Frais d'assurance Décennale et Responsabilité Civile", unite: "%", pvht: 1.2, commentaire: "À INDIQUER DANS TOUS LES DEVIS ?" },
  { id: id(), code: 117, categorie: "Installation de chantier", designation: "Frais d'OPC (Ordonnancement Pilotage et Coordination) si pas d'architecte", unite: "%", pvht: 3.5, commentaire: "TERTIAIRE uniquement" },

  // ── DEMOLITION / DEPOSES ───────────────────────────────────────────────────
  { id: id(), code: 202, categorie: "Démolition / Déposes", designation: "Dépose, après neutralisation de l'installation électrique existante, comprenant : tableau(x) électrique(s), appareillages, moulures et câblages apparents", unite: "ens", pvht: 700, commentaire: "Pour 150 m²" },
  { id: id(), code: 203, categorie: "Démolition / Déposes", designation: "Dépose complète, après fermeture vanne d'arrêt existante et vidange, de l'installation de chauffage individuel au gaz, comprenant 1 chaudière, 8 radiateurs et leurs fixations ainsi que les réseaux d'alimentation apparents en cuivre ou acier", unite: "ens", pvht: 1750 },
  { id: id(), code: 205, categorie: "Démolition / Déposes", designation: "Dépose après fermeture té de réglage existant et vidange d'un radiateur eau chaude", unite: "ens", pvht: 120 },
  { id: id(), code: 206, categorie: "Démolition / Déposes", designation: "Dépose d'un radiateur ou sèche-serviettes électrique", unite: "ens", pvht: 70 },
  { id: id(), code: 207, categorie: "Démolition / Déposes", designation: "Dépose après fermeture vanne d'arrêt existante et vidange d'un ballon d'eau chaude et son groupe de sécurité", unite: "ens", pvht: 260 },
  { id: id(), code: 208, categorie: "Démolition / Déposes", designation: "Dépose de faux-plafond en BA13 et rails alu (compris isolant éventuel)", unite: "m²", pvht: 26 },
  { id: id(), code: 209, categorie: "Démolition / Déposes", designation: "Dépose de plafond en baculé", unite: "m²", pvht: 70 },
  { id: id(), code: 210, categorie: "Démolition / Déposes", designation: "Dépose de corniche en staff au plafond", unite: "ml", pvht: 35 },
  { id: id(), code: 211, categorie: "Démolition / Déposes", designation: "Dépose d'un doublage mural collé ou 1/2 stil, jusqu'à 10 cm d'épaisseur, compris isolant laine minérale ou polystyrène", unite: "m²", pvht: 40 },
  { id: id(), code: 212, categorie: "Démolition / Déposes", designation: "Démolition de cloisons non porteuses en carreaux de plâtre, mâchefer ou placoplâtre, jusqu'à 10 cm d'épaisseur", unite: "m²", pvht: 60 },
  { id: id(), code: 213, categorie: "Démolition / Déposes", designation: "Dépose de l'ensemble des plinthes", unite: "ens", pvht: 350, commentaire: "Pour 150 m²" },
  { id: id(), code: 214, categorie: "Démolition / Déposes", designation: "Dépose d'une porte et son bâti bois y compris habillage de finition type chants plats ou chambranles", unite: "u", pvht: 90, commentaire: "À ajuster si bâti métal" },
  { id: id(), code: 218, categorie: "Démolition / Déposes", designation: "Dépose de carrelage au sol collé et chape maigre < 5 cm y compris les résidus de colle non adhérents", unite: "m²", pvht: 50 },
  { id: id(), code: 219, categorie: "Démolition / Déposes", designation: "Dépose de parquet collé sur chape ou cloué sur lambourdes (compris sous-couche éventuelle)", unite: "m²", pvht: 35 },
  { id: id(), code: 220, categorie: "Démolition / Déposes", designation: "Dépose de parquet cloué sur lambourdes (compris sous-couche éventuelle) y compris lambourdes et augets plâtre", unite: "m²", pvht: 70 },
  { id: id(), code: 224, categorie: "Démolition / Déposes", designation: "Dépose des WC comprenant : cuvette et réservoir, lave-mains, robinetterie, revêtements de sol et de murs, y compris réseaux plomberie existants jusqu'en pied de colonne", unite: "ens", pvht: 420 },
  { id: id(), code: 225, categorie: "Démolition / Déposes", designation: "Dépose complète de la salle de bain comprenant : baignoire, bac à douche, paroi vitrée, bidet, vasque, robinetterie, meuble, revêtements de sol et de murs y compris réseaux plomberie existants jusqu'en pied de colonne", unite: "ens", pvht: 1250 },
  { id: id(), code: 227, categorie: "Démolition / Déposes", designation: "Dépose complète de la cuisine comprenant : évier, robinetterie, meubles hauts et bas, plan de travail, électroménager, les revêtements de sol et de murs y compris réseaux plomberie existants jusqu'en pied de colonne", unite: "ens", pvht: 1550 },
  { id: id(), code: 228, categorie: "Démolition / Déposes", designation: "Dépose d'une fenêtre 2 vantaux et son bâti y compris habillage", unite: "u", pvht: 180, commentaire: "À ajuster selon dimensions [entre 100 et 400 €ht]" },
  { id: id(), code: 230, categorie: "Démolition / Déposes", designation: "Livraison, chargement et récupération d'une benne de chantier de 10 m3 pour gravats, évacuation et mise à la déchetterie", unite: "u", pvht: 850, commentaire: "Benne environ 500 €ht" },

  // ── GROS OEUVRE ───────────────────────────────────────────────────────────
  { id: id(), code: 300, categorie: "Gros œuvre", designation: "Divers gros œuvre", unite: "u", pvht: 0 },
  { id: id(), code: 301, categorie: "Gros œuvre", designation: "PROVISION pour la création d'une ouverture dans un mur porteur comprenant : l'étaiement, la démolition, la fourniture et pose scellée d'un linteau métallique de type IPN, dimension maxi 2ml, l'évacuation des gravats et la mise à la déchetterie", unite: "ens", pvht: 3000, commentaire: "À ajuster selon préco BET" },

  // ── MACONNERIE / PLATRERIE ────────────────────────────────────────────────
  { id: id(), code: 401, categorie: "Maçonnerie / Plâtrerie", designation: "Raccords de plâtre sur murs ou plafonds, suite aux démolitions", unite: "ens", pvht: 450, commentaire: "À ajuster" },
  { id: id(), code: 402, categorie: "Maçonnerie / Plâtrerie", designation: "Rebouchage ancienne ouverture par plaques ou carreaux de plâtre hydrofuge ou non, y compris raccords de maçonnerie et jointoiement par bandes calicots (max 3 m²)", unite: "u", pvht: 380 },
  { id: id(), code: 403, categorie: "Maçonnerie / Plâtrerie", designation: "Création d'une ouverture dans une cloison non porteuse y compris reprises de plâtre du tableau, évacuation des gravats et mise à la déchetterie", unite: "ens", pvht: 385 },
  { id: id(), code: 404, categorie: "Maçonnerie / Plâtrerie", designation: "Fourniture et pose de cloison placostil simple peau de 7 à 10 cm d'épaisseur sur ossature métallique avec une âme en laine minérale et 1 plaque de BA13 par face, hydrofuge ou non, y compris le jointoiement par bandes calicots", unite: "m²", pvht: 95, commentaire: "LAINE 20€ + PLACO 44,85€ + RAIL 1,92€ + MONTANT 25,02€ = 91,79€ POUR 7,5M² SOIT 12,24€/M129" },
  { id: id(), code: 405, categorie: "Maçonnerie / Plâtrerie", designation: "Fourniture et pose de cloison placostil double peau de 10 cm d'épaisseur sur ossature métallique avec une âme en laine minérale et 2 plaques de BA13, hydrofuge ou non, y compris le jointoiement par bandes calicots", unite: "m²", pvht: 120 },
  { id: id(), code: 406, categorie: "Maçonnerie / Plâtrerie", designation: "Fourniture et pose de cloison en carreaux de plâtre de 5 ou 7 cm d'épaisseur, hydrofuge ou non", unite: "m²", pvht: 95 },
  { id: id(), code: 407, categorie: "Maçonnerie / Plâtrerie", designation: "Fourniture et pose d'un doublage 1/2 stil de 5 à 10 cm d'épaisseur sur ossature métallique avec une âme en laine minérale et 1 plaque de BA13, hydrofuge ou non, y compris le jointoiement par bandes calicots", unite: "m²", pvht: 83 },
  { id: id(), code: 408, categorie: "Maçonnerie / Plâtrerie", designation: "Fourniture et pose d'un doublage 1/2 stil de 10 à 15 cm d'épaisseur sur ossature métallique avec une âme en laine minérale et 1 plaque de BA13, hydrofuge ou non, y compris le jointoiement par bandes calicots", unite: "m²", pvht: 95 },
  { id: id(), code: 411, categorie: "Maçonnerie / Plâtrerie", designation: "Fourniture et pose d'une isolation sous toiture sur ossature métallique avec isolant en laine minérale 60 mm R=1,7 (RT existant) et 1 plaque de BA13, hydrofuge ou non, y compris le jointoiement par bandes calicots", unite: "m²", pvht: 170 },
  { id: id(), code: 412, categorie: "Maçonnerie / Plâtrerie", designation: "Fourniture et pose d'une isolation sous toiture sur ossature métallique avec isolant en laine minérale 120 mm R=3,4 (RT existant) et 1 plaque de BA13, hydrofuge ou non, y compris jointoiement par bandes calicots", unite: "m²", pvht: 185 },
  { id: id(), code: 414, categorie: "Maçonnerie / Plâtrerie", designation: "Fourniture et pose d'un faux-plafond suspendu sur rails métalliques avec 1 plaque de BA13, hydrofuge ou non, y compris le jointoiement par bandes calicots", unite: "m²", pvht: 95 },
  { id: id(), code: 415, categorie: "Maçonnerie / Plâtrerie", designation: "Fourniture et pose d'un faux-plafond suspendu sur rails métalliques avec 1 plaque de BA13, hydrofuge ou non, et 5 cm de laine minérale, y compris le jointoiement par bandes calicots", unite: "m²", pvht: 110 },
  { id: id(), code: 416, categorie: "Maçonnerie / Plâtrerie", designation: "Fourniture d'une corniche en polyuréthane de type Orac, y compris chutes estimées", unite: "ml", pvht: 20 },
  { id: id(), code: 417, categorie: "Maçonnerie / Plâtrerie", designation: "Pose d'une corniche en polyuréthane de type Orac", unite: "ml", pvht: 40 },
  { id: id(), code: 422, categorie: "Maçonnerie / Plâtrerie", designation: "Fourniture et pose sur polyane d'une chape en mortier de ciment de 5 à 10 cm d'épaisseur, ferraillée et talochée, y compris l'approvisionnement et le gâchage manuel", unite: "m²", pvht: 165 },
  { id: id(), code: 423, categorie: "Maçonnerie / Plâtrerie", designation: "Fourniture et pose sur polyane d'une chape allégée de 5 à 10 cm d'épaisseur, en billes d'argile, de polystyrène ou vermiculite y compris l'approvisionnement et le gâchage manuel", unite: "m²", pvht: 115, commentaire: "Achat environ 10€/m² – 5kg/m² pour 5cm" },
  { id: id(), code: 431, categorie: "Maçonnerie / Plâtrerie", designation: "Création d'un soffite en BA13, hydrofuge ou non, y compris jointoiement par bandes calicots", unite: "u", pvht: 400, commentaire: "Au-dessus d'un placard… À ajuster selon dimensions" },
  { id: id(), code: 432, categorie: "Maçonnerie / Plâtrerie", designation: "Création d'une niche maçonnée 40 x 20 cm en BA13 y compris jointoiement par bandes calicots ou d'étanchéité", unite: "u", pvht: 380 },
  { id: id(), code: 434, categorie: "Maçonnerie / Plâtrerie", designation: "Fourniture et pose d'une trappe de visite métallique de format 30x30 cm", unite: "u", pvht: 92 },
  { id: id(), code: 435, categorie: "Maçonnerie / Plâtrerie", designation: "Fourniture et pose d'une trappe de visite métallique de format 50x50 cm", unite: "u", pvht: 125 },
  { id: id(), code: 438, categorie: "Maçonnerie / Plâtrerie", designation: "Fourniture et pose d'une trappe de visite (invisible) en plâtre de format 50x50 cm", unite: "u", pvht: 280 },

  // ── ELECTRICITE COURANT FORT ──────────────────────────────────────────────
  { id: id(), code: 501, categorie: "Électricité — Courant fort", designation: "Raccordement de l'appartement sur la colonne de terre de l'immeuble située sur le palier", unite: "ens", pvht: 350 },
  { id: id(), code: 505, categorie: "Électricité — Courant fort", designation: "Supplément par ligne avec câblage électrique 5 fils pour luminaires spécifiques y compris module Yokis au tableau", unite: "u", pvht: 220, commentaire: "Par ligne" },
  { id: id(), code: 506, categorie: "Électricité — Courant fort", designation: "Fourniture et pose d'un détecteur autonome de fumée (base fourniture seule : 40 €)", unite: "u", pvht: 80 },
  { id: id(), code: 508, categorie: "Électricité — Courant fort", designation: "Fourniture d'un certificat de conformité de l'installation électrique type Consuel", unite: "u", pvht: 520 },
  { id: id(), code: 509, categorie: "Électricité — Courant fort", designation: "Fourniture et pose d'une prise de courant simple en inox, avec clapet, à encastrer dans parquet ou carrelage, Legrand ou équivalent", unite: "u", pvht: 210 },
  { id: id(), code: 510, categorie: "Électricité — Courant fort", designation: "Fourniture et pose d'une prise de courant double en inox, avec clapet, à encastrer dans parquet ou carrelage, Legrand ou équivalent", unite: "u", pvht: 240 },
  { id: id(), code: 511, categorie: "Électricité — Courant fort", designation: "Fourniture et pose derrière interrupteur d'un module variateur Yokis ou équivalent", unite: "u", pvht: 140, commentaire: "Par ligne" },
  { id: id(), code: 514, categorie: "Électricité — Courant fort", designation: "Fourniture et pose d'un interrupteur pour coupure générale", unite: "u", pvht: 450 },
  { id: id(), code: 517, categorie: "Électricité — Courant fort", designation: "Création d'une ligne directe au tableau avec protection max. 32A pour climatisation, radiateur, volet roulant…", unite: "u", pvht: 240 },
  { id: id(), code: 519, categorie: "Électricité — Courant fort", designation: "Mise en place d'une gaine vide pour passage fibre ou autre", unite: "u", pvht: 160 },
  { id: id(), code: 522, categorie: "Électricité — Courant fort", designation: "Fourniture, pose et raccordement d'un spot encastré à enduire dans le faux-plafond (base fourniture seule : 70 €)", unite: "u", pvht: 170 },
  { id: id(), code: 523, categorie: "Électricité — Courant fort", designation: "Fourniture, pose et raccordement de ruban Led 2700 à 4000°K non dimmable avec transformateur y compris profilé alu en U et diffuseur standard (base fourniture seule : 60 €/ml)", unite: "ml", pvht: 100 },
  { id: id(), code: 524, categorie: "Électricité — Courant fort", designation: "Fourniture, pose et raccordement de ruban Led 2700 à 4000°K dimmable avec transformateur y compris profilé alu en U et diffuseur standard (base fourniture seule : 80 €/ml)", unite: "ml", pvht: 120 },
  { id: id(), code: 526, categorie: "Électricité — Courant fort", designation: "Fourniture, pose et raccordement sur gaine existante d'un kit de ventilation VMC simple flux Aldes ou équivalent comprenant : le moteur, la bouche d'extraction, les gaines et 3 grilles de ventilation standard", unite: "u", pvht: 880 },
  { id: id(), code: 527, categorie: "Électricité — Courant fort", designation: "Pose et raccordement d'une applique, liseuse, plafonnier, suspension… avec format et branchement standard (chiffrage à ajuster si modèle spécifique)", unite: "u", pvht: 40 },

  // ── ELECTRICITE COURANT FAIBLE ────────────────────────────────────────────
  { id: id(), code: 527, categorie: "Électricité — Courant faible", designation: "Fourniture, pose et raccordement d'un coffret de communication SCHNEIDER Resi9 Connect Grade 3TV pour 4 RJ45 avec switch POE ou équivalent (fourniture seule : 260 €)", unite: "ens", pvht: 460 },
  { id: id(), code: 528, categorie: "Électricité — Courant faible", designation: "Fourniture, pose et raccordement d'un coffret de communication SCHNEIDER Resi9 Connect Grade 3TV pour 8 RJ45 avec switch POE ou équivalent (fourniture seule : 520 €)", unite: "ens", pvht: 720 },
  { id: id(), code: 529, categorie: "Électricité — Courant faible", designation: "Fourniture, pose et raccordement d'une prise RJ45 avec câblage Grade 3 avec une ligne directe au tableau", unite: "u", pvht: 200 },
  { id: id(), code: 530, categorie: "Électricité — Courant faible", designation: "Fourniture, pose et raccordement d'une borne WiFi (base fourniture seule : 400 €)", unite: "ens", pvht: 600 },

  // ── PLOMBERIE ──────────────────────────────────────────────────────────────
  { id: id(), code: 603, categorie: "Plomberie", designation: "Création d'un pied de colonne d'arrêt 15x21 (hors coupure et vidange si nécessaire)", unite: "u", pvht: 280 },
  { id: id(), code: 604, categorie: "Plomberie", designation: "Création d'une attente pour machine à laver (LL, SL, LV) compris robinet d'alimentation d'eau froide", unite: "u", pvht: 270 },
  { id: id(), code: 605, categorie: "Plomberie", designation: "Fourniture, pose et raccordement d'un robinet EF extérieur, y compris alimentation et percement façade", unite: "ens", pvht: 420 },
  { id: id(), code: 610, categorie: "Plomberie", designation: "Fourniture, pose et raccordement d'un chauffe-eau électrique instantané Ariston 15 litres ou équivalent, équipé d'un groupe de sécurité et d'un siphon PVC y compris alimentation EF et évacuation (base fourniture seule : 420 €)", unite: "u", pvht: 870 },
  { id: id(), code: 611, categorie: "Plomberie", designation: "Fourniture, pose murale et raccordement d'un chauffe-eau électrique extra-plat à résistance blindée Ariston Velis Evo 65 litres ou équivalent, équipé d'un groupe de sécurité (base fourniture seule : 880 €)", unite: "u", pvht: 1430 },
  { id: id(), code: 614, categorie: "Plomberie", designation: "Fourniture, pose sur pied et raccordement d'un chauffe-eau électrique à résistance blindée Ariston ou équivalent 200 litres, équipé d'un groupe de sécurité (base fourniture seule : 730 €)", unite: "u", pvht: 1280 },
  { id: id(), code: 615, categorie: "Plomberie", designation: "Fourniture, pose et raccordement d'un pack WC sur pied Jacob Delafon ou équivalent à sortie horizontale avec cuvette, réservoir et abattant PVC (base fourniture seule : 250 €)", unite: "u", pvht: 580 },
  { id: id(), code: 616, categorie: "Plomberie", designation: "Fourniture, pose et raccordement d'un bâti-support autoportant Geberit Duofix, hauteur 112 cm", unite: "u", pvht: 780 },
  { id: id(), code: 618, categorie: "Plomberie", designation: "Fourniture d'une cuvette de WC suspendu Jacob Delafon ou équivalent avec abattant et plaque de commande Geberit Sigma 01 blanche (base fourniture seule : 450 €)", unite: "u", pvht: 450 },
  { id: id(), code: 623, categorie: "Plomberie", designation: "Fourniture d'une baignoire Jacob Delafon ou équivalent, équipée d'un jeu de pieds, d'un vidage et d'une bonde (base fourniture seule : 450 €)", unite: "u", pvht: 450 },
  { id: id(), code: 624, categorie: "Plomberie", designation: "Pose et raccordement d'une baignoire Jacob Delafon ou équivalent, équipée d'un jeu de pieds, d'un vidage et d'une bonde", unite: "u", pvht: 400 },
  { id: id(), code: 626, categorie: "Plomberie", designation: "Fourniture d'un pare-baignoire pivotant Rothalux ou équivalent avec profilés aluminium et verre de sécurité transparent (base fourniture seule : 380 €)", unite: "u", pvht: 380 },
  { id: id(), code: 632, categorie: "Plomberie", designation: "Fourniture d'une douchette à main et d'un support mural Grohe ou équivalent (base fourniture seule : 110 €)", unite: "u", pvht: 110 },
  { id: id(), code: 636, categorie: "Plomberie", designation: "Fourniture d'un receveur de douche à carreler Wedi Fundo Riolito Neo ou équivalent, dimensions maxi 80 x 120 cm, à écoulement linéaire type caniveau, barrette de finition inox, jeu de pieds et kit d'étanchéité (base fourniture seule : 850 €)", unite: "u", pvht: 850 },
  { id: id(), code: 652, categorie: "Plomberie", designation: "Fourniture d'un ensemble de douche Grohe ou équivalent comprenant : mitigeur thermostatique avec corps d'encastrement, tête de douche, flexible, inverseur, douchette (base fourniture seule : 750 €)", unite: "u", pvht: 750 },
  { id: id(), code: 656, categorie: "Plomberie", designation: "Fourniture d'une vasque à poser ou encastrer en céramique Jacob Delafon ou équivalent équipée d'une bonde chromée et d'un siphon PVC (base fourniture seule : 200 €)", unite: "u", pvht: 200 },
  { id: id(), code: 660, categorie: "Plomberie", designation: "Fourniture d'un lave-mains céramique Jacob Delafon ou équivalent équipé d'une bonde chromée et d'un siphon PVC (base fourniture seule : 150 €)", unite: "u", pvht: 150 },
  { id: id(), code: 666, categorie: "Plomberie", designation: "Fourniture d'un évier inox à poser ou encastrer Franke ou équivalent, équipé d'une bonde chromée et d'un siphon PVC (base fourniture seule : 200 €)", unite: "u", pvht: 200 },
  { id: id(), code: 674, categorie: "Plomberie", designation: "Fourniture et pose collée d'un miroir sur mesure 3 mm, vitrage clair avec joints polis, dimensions 60 x 80 cm – Hors percement éventuel", unite: "u", pvht: 380 },
  { id: id(), code: 675, categorie: "Plomberie", designation: "Fourniture et pose collée d'un miroir sur mesure 3 mm, vitrage clair avec joints polis, dimensions 120 x 80 cm – Hors percement éventuel", unite: "u", pvht: 480 },

  // ── CHAUFFAGE ──────────────────────────────────────────────────────────────
  { id: id(), code: 801, categorie: "Chauffage", designation: "Fourniture d'un certificat de conformité Qualigaz", unite: "u", pvht: 450 },
  { id: id(), code: 802, categorie: "Chauffage", designation: "Désembouage réseau de chauffage avec vidange, rinçage chaudière et radiateurs, injection d'un produit désembouant lent, vérification fonctionnement robinetteries et tés de réglage, remise en eau du réseau si nécessaire", unite: "u", pvht: 1200, commentaire: "Pour 150 m²" },
  { id: id(), code: 803, categorie: "Chauffage", designation: "Vidange d'un réseau de chauffage individuel avant dépose", unite: "u", pvht: 320 },
  { id: id(), code: 809, categorie: "Chauffage", designation: "Fourniture et pose d'un robinet thermostatique et d'un té de réglage Danfoss ou équivalent sur radiateur existant et sans modification réseau – hors vidange réseau si nécessaire (base fourniture seule : 90 €)", unite: "u", pvht: 190 },
  { id: id(), code: 810, categorie: "Chauffage", designation: "Fourniture d'un radiateur à eau chaude Acova ou équivalent d'une puissance de 1500 W, équipé d'un robinet thermostatique et d'un té de réglage (base fourniture seule : 550 €)", unite: "u", pvht: 550, commentaire: "Puiss nécess 100 W / m² env. À ajuster" },
  { id: id(), code: 811, categorie: "Chauffage", designation: "Pose et raccordement sur nouveau réseau d'un radiateur à eau chaude Acova ou équivalent d'une puissance de 1500 W, équipé d'un robinet thermostatique et d'un té de réglage", unite: "u", pvht: 400 },
  { id: id(), code: 813, categorie: "Chauffage", designation: "Fourniture d'un sèche-serviettes à eau chaude Acova ou équivalent d'une puissance de 500 W, équipé d'un robinet thermostatique et d'un té de réglage (base fourniture seule : 380 €)", unite: "u", pvht: 380 },
  { id: id(), code: 817, categorie: "Chauffage", designation: "Fourniture et pose d'un thermostat d'ambiance mécanique Flash ou Theben pour chaudière (base fourniture seule : 60 €)", unite: "u", pvht: 180, commentaire: "Si déporté" },
  { id: id(), code: 830, categorie: "Chauffage", designation: "Fourniture d'un radiateur électrique Acova ou équivalent, d'une puissance de 1000 W, avec thermostat d'ambiance (base fourniture seule : 300 €)", unite: "u", pvht: 300, commentaire: "Puiss nécess 100 W / m² env. À ajuster" },
  { id: id(), code: 831, categorie: "Chauffage", designation: "Pose et raccordement d'un radiateur électrique Acova ou équivalent, d'une puissance de 1000 W, avec thermostat d'ambiance", unite: "u", pvht: 220 },
  { id: id(), code: 832, categorie: "Chauffage", designation: "Fourniture d'un radiateur sèche-serviettes électrique Acova ou équivalent, d'une puissance de 500 W, avec thermostat d'ambiance (base fourniture seule : 350 €)", unite: "u", pvht: 350 },
  { id: id(), code: 854, categorie: "Chauffage", designation: "Fourniture et pose au sol d'un kit de chauffage composée d'une trame chauffante électrique Warm Up ou équivalent, d'une sonde de température et d'un thermostat de température", unite: "ens", pvht: 1550 },

  // ── MENUISERIE INTERIEURE ─────────────────────────────────────────────────
  { id: id(), code: 901, categorie: "Menuiserie intérieure", designation: "Fourniture et pose clouée ou collée de plinthes électriques en médium, Guimier ref 1186 ou équivalent, hauteur 11 cm (base fourniture seule : 16 € / ml)", unite: "ml", pvht: 36 },
  { id: id(), code: 902, categorie: "Menuiserie intérieure", designation: "Fourniture et pose d'un bloc porte intérieur alvéolaire (dimensions maximales 83x204 cm) avec serrure, hors fourniture poignée (base fourniture seule : 150 €)", unite: "u", pvht: 470 },
  { id: id(), code: 903, categorie: "Menuiserie intérieure", designation: "Fourniture et pose d'un bloc porte intérieur acoustique 24db Jeld Wen ou équivalent (dimensions maximales 83x204 cm) avec serrure, hors fourniture poignée (base fourniture seule : 280 €)", unite: "u", pvht: 600 },
  { id: id(), code: 906, categorie: "Menuiserie intérieure", designation: "Mise en jeu simple d'une porte ou fenêtre bois, hors réparations éventuelles", unite: "u", pvht: 150 },
  { id: id(), code: 907, categorie: "Menuiserie intérieure", designation: "Changement de sens d'ouverture d'une porte intérieure en bois (sous réserve état quincaillerie et sans remplacement bâti si nécessaire)", unite: "ens", pvht: 480 },
  { id: id(), code: 910, categorie: "Menuiserie intérieure", designation: "Fourniture et pose d'une porte battante prépeinte invisible 1 vantail, 80x210 cm, Scrigno Essential ou équivalent, avec chassis métal et hors jeu de poignée (base fourniture seule : 1 250 €)", unite: "u", pvht: 1850 },
  { id: id(), code: 913, categorie: "Menuiserie intérieure", designation: "Fourniture et pose en applique sur porte d'entrée existante d'une serrure bandeau caréné 5 points A2P* JPM ou équivalent comprenant un jeu de 3 clés et carte de sécurité (base fourniture seule : 850 €)", unite: "u", pvht: 1250 },
  { id: id(), code: 915, categorie: "Menuiserie intérieure", designation: "Fourniture et pose de cimaises murales de type Guimier y compris coupes d'onglet (base fourniture seule : 10 €/ml)", unite: "ml", pvht: 40 },
  { id: id(), code: 917, categorie: "Menuiserie intérieure", designation: "Forfait pose et raccordement des appareils électroménagers (fournis et livrés à l'étage par le client) y compris évacuation des emballages et mise à la déchetterie", unite: "ens", pvht: 450 },
  { id: id(), code: 918, categorie: "Menuiserie intérieure", designation: "Montage d'un caisson de meuble type Ikea y compris aménagement intérieur (dimensions 100x200 cm)", unite: "u", pvht: 200 },

  // ── CARRELAGE ──────────────────────────────────────────────────────────────
  { id: id(), code: 1003, categorie: "Carrelage", designation: "Fourniture et application d'une résine de protection à l'eau sous carrelage Carrosec 2 ou équivalent, avec application préalable d'une primaire et la pose de bandes plastifiées d'étanchéité aux angles d'emprise au sol", unite: "m²", pvht: 25 },
  { id: id(), code: 1004, categorie: "Carrelage", designation: "Fourniture et pose d'une natte d'étanchéité sous carrelage Schlüter-KERDI-200 ou équivalent y compris bandes d'étanchéité de jonction entre plaques", unite: "m²", pvht: 55 },
  { id: id(), code: 1005, categorie: "Carrelage", designation: "Fourniture d'un carrelage de sol en grès cérame y compris 15% de chutes estimées, à ajuster selon calepinage (base fourniture seule : 50 € / m²)", unite: "m²", pvht: 50 },
  { id: id(), code: 1007, categorie: "Carrelage", designation: "Pose droite d'un carrelage de sol en grès cérame de format 20 x 20 cm à 90 x 90 cm y compris le jointoiement ciment", unite: "m²", pvht: 120 },
  { id: id(), code: 1008, categorie: "Carrelage", designation: "Pose droite d'un carrelage mural en grès cérame de format 20 x 20 cm à 90 x 90 cm y compris le jointoiement ciment", unite: "m²", pvht: 120 },
  { id: id(), code: 1010, categorie: "Carrelage", designation: "Pose droite d'un carrelage de sol grand format de 100 x 100 cm à 120 x 120 cm y compris le jointoiement ciment", unite: "m²", pvht: 140 },
  { id: id(), code: 1012, categorie: "Carrelage", designation: "Pose droite d'un carrelage mural très grand format supérieur à 120 x 120 cm y compris le jointoiement ciment", unite: "m²", pvht: 220 },
  { id: id(), code: 1013, categorie: "Carrelage", designation: "Pose droite d'un carrelage de sol mosaïque sur trame 30 x 30 cm y compris le jointoiement ciment", unite: "m²", pvht: 180 },
  { id: id(), code: 1019, categorie: "Carrelage", designation: "Pose de plinthes coordonnées au carrelage de sol y compris le jointoiement ciment", unite: "ml", pvht: 40 },
  { id: id(), code: 1020, categorie: "Carrelage", designation: "Pose d'un carrelage mural, dans niche douche, y compris traitement des angles à 45°", unite: "u", pvht: 300 },

  // ── PARQUET / SOLS SOUPLES ────────────────────────────────────────────────
  { id: id(), code: 1101, categorie: "Parquet / Sols souples", designation: "Protection des sols par panneaux d'Isorel de 3 mm, évacuation et mise à la déchetterie en fin d'opération", unite: "m²", pvht: 28 },
  { id: id(), code: 1103, categorie: "Parquet / Sols souples", designation: "Fourniture de parquet en chêne, contrecollé ou massif, y compris 15% de chutes estimées, à ajuster selon calepinage (base fourniture seule : 80 € / m²)", unite: "m²", pvht: 80 },
  { id: id(), code: 1104, categorie: "Parquet / Sols souples", designation: "Pose collée à l'anglaise sur sol ragréé d'un parquet droit en chêne, contrecollé ou massif, y compris fourniture colle", unite: "m²", pvht: 80 },
  { id: id(), code: 1105, categorie: "Parquet / Sols souples", designation: "Pose flottante sur feutrine d'un parquet droit en chêne, contrecollé vernis usine", unite: "m²", pvht: 50 },
  { id: id(), code: 1107, categorie: "Parquet / Sols souples", designation: "Pose collée sur lambourdes d'un parquet massif en teck avec joints Pont de Bâteau", unite: "m²", pvht: 160 },
  { id: id(), code: 1109, categorie: "Parquet / Sols souples", designation: "Fourniture et pose d'une lame droite de parquet suite à la dépose de cloisons ou dégradations", unite: "ml", pvht: 250, commentaire: "Fx approximatif au ml – À ajuster" },
  { id: id(), code: 1113, categorie: "Parquet / Sols souples", designation: "Fourniture et pose clouée ou collée de plinthes en médium, hauteur 10 cm", unite: "ml", pvht: 28 },
  { id: id(), code: 1114, categorie: "Parquet / Sols souples", designation: "Vitrification parquet comprenant : ponçage, aspiration, nettoyage et application de 2 couches de vitrificateur mat ou satiné", unite: "m²", pvht: 55 },
  { id: id(), code: 1119, categorie: "Parquet / Sols souples", designation: "Fourniture de moquette en laine, hors chutes, à ajuster selon calepinage (base fourniture seule : 50 € / m²)", unite: "m²", pvht: 50, commentaire: "Chutes à calculer par fournisseur – ATTENTION car possibilité de chutes jusqu'à 30 ou 50%" },
  { id: id(), code: 1125, categorie: "Parquet / Sols souples", designation: "Fourniture d'un sol souple en dalles ou en lames PVC Forbo ou équivalent y compris chutes estimées, à ajuster selon calepinage (base fourniture seule : 50 € / m²)", unite: "m²", pvht: 50 },

  // ── PEINTURE ───────────────────────────────────────────────────────────────
  { id: id(), code: 1201, categorie: "Peinture", designation: "Murs, plafonds et boiseries intérieures (portes, fenêtres et plinthes) : ouverture fissures, rebouchages, 1 couche d'impression, 2 passes croisées d'enduit, 2 couches de peinture Guittet ou équivalent, finition mate, velours ou satinée, selon besoins — Pièces sans moulures ou corniches — Appart en bon état général", unite: "m²", pvht: 45, commentaire: "Laque mate ?" },
  { id: id(), code: 1202, categorie: "Peinture", designation: "Murs, plafonds et boiseries intérieures (portes, fenêtres et plinthes) : ouverture fissures, rebouchages, 1 couche d'impression, 2 passes croisées d'enduit, 2 couches de peinture Guittet ou équivalent, finition mate, velours ou satinée, selon besoins — Pièces sans moulures ou corniches — Appart en mauvais état général", unite: "m²", pvht: 50, commentaire: "Laque mate ?" },
  { id: id(), code: 1203, categorie: "Peinture", designation: "Murs, plafonds et boiseries intérieures (portes, fenêtres et plinthes) : ouverture fissures, rebouchages, 1 couche d'impression, 2 couches de peinture Guittet, finition mate, velours ou satinée, selon besoins — Pièces avec moulures et corniches — Appart en mauvais état général", unite: "m²", pvht: 58, commentaire: "Pièces avec moulures et corniches – Appart en mauvais état général" },
  { id: id(), code: 1205, categorie: "Peinture", designation: "Supplément pour la fourniture et la pose de peinture de marque Argile, Farrow & Ball, Ressources, Little Green… ou équivalent", unite: "m²", pvht: 10 },
  { id: id(), code: 1206, categorie: "Peinture", designation: "Mise en peinture de menuiseries en médium à peindre (portes placards, caissons, étagères…) avec ponçage, 1 couche d'impression et 2 couches de peinture Guittet, Tollens ou équivalent, finition mate ou satinée, selon besoins", unite: "m²", pvht: 60, commentaire: "Ne pas oublier de compter toutes les faces" },
  { id: id(), code: 1207, categorie: "Peinture", designation: "Mise en peinture d'une porte ancienne 1 vantail comprenant le grattage, le rebouchage au mastic Sintofer, le ponçage, la fourniture et 3 couches de peinture Guittet, Tollens ou équivalent, finition mate ou satinée, selon besoins", unite: "u", pvht: 110 },
  { id: id(), code: 1210, categorie: "Peinture", designation: "Mise en peinture sur place d'un radiateur en fonte existant, non déposé, comprenant 2 couches de peinture Guittet, Tollens ou équivalent", unite: "u", pvht: 180 },
  { id: id(), code: 1213, categorie: "Peinture", designation: "Fourniture et pose d'un échantillon de peinture couleur supplémentaire", unite: "u", pvht: 55, commentaire: "À la discrétion du CDT" },

  // ── MENUISERIE EXTERIEURE ─────────────────────────────────────────────────
  { id: id(), code: 1305, categorie: "Menuiserie extérieure", designation: "Fourniture et pose de chambranles sapin à doucine Guimier réf. 136 ou équivalent pour jonction bâti / maçonnerie (2 faces) y compris coupes d'onglet", unite: "ml", pvht: 220 },
  { id: id(), code: 1306, categorie: "Menuiserie extérieure", designation: "Fourniture et pose sur fenêtre d'un système oscillo-battant", unite: "u", pvht: 100 },
  { id: id(), code: 1307, categorie: "Menuiserie extérieure", designation: "Fourniture et pose sur fenêtre d'une crémone en fonte noire ou blanche en applique y compris découpe et toutes les ajustements nécessaires (base fourniture seule : 60 €)", unite: "u", pvht: 180, commentaire: "À ajuster selon modèle" },
  { id: id(), code: 1310, categorie: "Menuiserie extérieure", designation: "Fourniture et pose d'un volet roulant motorisé en PVC blanc 120x220 cm y compris alimentation électrique et protection au tableau (base fourniture seule : 350 €) – Hors coffrage si nécessaire", unite: "u", pvht: 950, commentaire: "À ajuster selon dimensions et contraintes techniques" },
  { id: id(), code: 1313, categorie: "Menuiserie extérieure", designation: "Mise en peinture de crémone existante comprenant : dépose, décapage, sablage, mise en peinture laquée au four (RAL à définir) et remontage", unite: "u", pvht: 240 },
  { id: id(), code: 1314, categorie: "Menuiserie extérieure", designation: "Mise en peinture d'une paire de persiennes ou volets métalliques existants comprenant : dépose, décapage, traitement anti-rouille et application sur place de 2 couches de peinture Tollens ou équivalent, repose sur emplacement existant (hors répartitions éventuelles)", unite: "u", pvht: 450, commentaire: "À ajuster selon dim. et travail à effectuer" },
  { id: id(), code: 1315, categorie: "Menuiserie extérieure", designation: "Mise en peinture d'une paire de persiennes ou volets métalliques existants comprenant : dépose, décapage, traitement anti-rouille et application sur place de 2 couches de peinture laquée au four (RAL à définir), repose sur emplacement existant et changement de quincaillerie", unite: "u", pvht: 1150, commentaire: "À ajuster selon dim. et travail à effectuer" },
  { id: id(), code: 1316, categorie: "Menuiserie extérieure", designation: "Remise en état des persiennes ou volets bois, ponçage ou application d'un décapant chimique et mise en peinture réalisé sur place (hors changement de quincaillerie)", unite: "u", pvht: 450, commentaire: "À ajuster selon dim. et travail à effectuer" },
];
