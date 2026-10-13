export interface Achat {
  id: number;
  titre: string;
  quantite?: string;
  fournisseur?: string;
  montantEstime?: number;
  chantierId?: number;
  chantierNom?: string;
  checked: boolean;
  dateAjout: string;
}

let nextAchatId = 100;
export const getNextAchatId = () => nextAchatId++;

export const ACHATS_LISTE: Achat[] = [
  {
    id: 1,
    titre: "Bac acier couverture",
    quantite: "1 lot",
    fournisseur: "ArcelorMittal Distribution",
    montantEstime: 3200,
    chantierId: 6,
    chantierNom: "Extension ossature bois 40 m² — Bernard",
    checked: false,
    dateAjout: "2026-09-10",
  },
  {
    id: 2,
    titre: "Isolation parois + sol",
    quantite: "220 m²",
    fournisseur: "Isover",
    montantEstime: 4500,
    chantierId: 6,
    chantierNom: "Extension ossature bois 40 m² — Bernard",
    checked: false,
    dateAjout: "2026-09-10",
  },
  {
    id: 3,
    titre: "Menuiseries extérieures (8 ouvertures)",
    quantite: "8 unités",
    fournisseur: "K•LINE",
    montantEstime: 7500,
    chantierId: 20,
    chantierNom: "Rénovation maison ancienne en pierre — Renard",
    checked: false,
    dateAjout: "2026-09-12",
  },
  {
    id: 4,
    titre: "Carrelage grand format 12 m²",
    quantite: "12 m²",
    fournisseur: "Ceramica Pro Auxerre",
    montantEstime: 1800,
    chantierId: 19,
    chantierNom: "Salle de bain complète — douche italienne — Petit",
    checked: false,
    dateAjout: "2026-09-13",
  },
  {
    id: 5,
    titre: "Ruban de chantier + bâches",
    quantite: "3 rouleaux",
    fournisseur: "",
    checked: false,
    dateAjout: "2026-09-14",
  },
  {
    id: 6,
    titre: "Visserie inox 6×60 mm",
    quantite: "2 boîtes",
    fournisseur: "Tout Faire Auxerre",
    checked: true,
    dateAjout: "2026-09-08",
  },
];
