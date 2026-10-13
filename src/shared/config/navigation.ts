import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  FileText,
  HardHat,
  Home,
  Settings,
  ShoppingBasket,
  UsersRound,
  Wrench,
  Zap,
} from "lucide-react";

export type AppPath =
  | "/dashboard"
  | "/urgent"
  | "/achats"
  | "/routine"
  | "/clients"
  | "/prospection"
  | "/statistiques"
  | "/devis"
  | "/chantiers"
  | "/sous-traitants"
  | "/planning"
  | "/finances"
  | "/tresorerie"
  | "/charges-fixes"
  | "/marges"
  | "/remboursements-pe"
  | "/contrat-sous-traitant"
  | "/generation-bdc"
  | "/parametres";

export type NavigationChild = {
  label: string;
  path: AppPath;
};

export type NavigationItem = {
  children?: NavigationChild[];
  icon: LucideIcon;
  label: string;
  path?: AppPath;
  tone?: "urgent";
};

export const quickNavigation: NavigationItem[] = [
  { icon: Zap, label: "URGENT", path: "/urgent", tone: "urgent" },
  { icon: ShoppingBasket, label: "Achats", path: "/achats" },
];

export const primaryNavigation: NavigationItem[] = [
  { icon: Home, label: "Accueil", path: "/dashboard" },
  { icon: ClipboardList, label: "Routine", path: "/routine" },
  {
    children: [
      { label: "Clients", path: "/clients" },
      { label: "Prospection", path: "/prospection" },
      { label: "Statistiques", path: "/statistiques" },
    ],
    icon: UsersRound,
    label: "Clients & prospects",
  },
  { icon: FileText, label: "Devis", path: "/devis" },
  { icon: HardHat, label: "Chantiers", path: "/chantiers" },
  { icon: UsersRound, label: "Sous-traitants", path: "/sous-traitants" },
  { icon: CalendarDays, label: "Planning", path: "/planning" },
  {
    children: [
      { label: "Vue d’ensemble", path: "/finances" },
      { label: "Trésorerie", path: "/tresorerie" },
      { label: "Charges fixes", path: "/charges-fixes" },
      { label: "Marges", path: "/marges" },
      { label: "Remboursements PE", path: "/remboursements-pe" },
    ],
    icon: BarChart3,
    label: "Finances",
  },
  {
    children: [
      { label: "Contrat sous-traitant", path: "/contrat-sous-traitant" },
      { label: "Génération BDC", path: "/generation-bdc" },
    ],
    icon: Wrench,
    label: "Outils",
  },
];

export const settingsNavigation: NavigationItem = {
  icon: Settings,
  label: "Paramètres",
  path: "/parametres",
};
