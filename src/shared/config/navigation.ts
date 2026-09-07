import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  FileText,
  HardHat,
  Home,
  Settings,
  UsersRound,
  Wrench,
} from "lucide-react";

export type AppPath =
  | "/dashboard"
  | "/routine"
  | "/clients"
  | "/prospection"
  | "/statistiques"
  | "/devis"
  | "/chantiers"
  | "/planning"
  | "/finances"
  | "/tresorerie"
  | "/charges-fixes"
  | "/marges"
  | "/remboursements-pe"
  | "/base-prix"
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
};

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
      { label: "Base de prix", path: "/base-prix" },
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
