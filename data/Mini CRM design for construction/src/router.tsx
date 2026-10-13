import { createBrowserRouter, Navigate } from "react-router";
import Root from "./Root";
import Dashboard from "./components/dashboard/Dashboard";
import RoutinePage from "./components/routine/RoutinePage";
import RoutineSettingsPage from "./components/settings/RoutineSettingsPage";
import ClientsPage from "./components/clients/ClientsPage";
import ProspectionPage from "./components/clients/ProspectionPage";
import StatistiquesPage from "./components/clients/StatistiquesPage";
import DevisPage from "./components/devis/DevisPage";
import ChantiersPage from "./components/chantiers/ChantiersPage";
import ChantierDetailRoute from "./components/chantiers/ChantierDetailRoute";
import PlanningPage from "./components/planning/PlanningPage";
import FinancesOverview from "./components/finances/FinancesOverview";
import TresoreriePage from "./components/finances/TresoreriePage";
import ChargesFixesPage from "./components/finances/ChargesFixesPage";
import MargesPage from "./components/finances/MargesPage";
import RemboursementsPage from "./components/finances/RemboursementsPage";
import BasePrixPage from "./components/prix/BasePrixPage";
import BDCPage from "./components/outils/BDCPage";
import SettingsPage from "./components/settings/SettingsPage";
import CommandesAPasserPage from "./components/commandes/CommandesAPasserPage";
import AcomptesPage from "./components/acomptes/AcomptesPage";
import AchatsPage from "./components/achats/AchatsPage";
import UrgentPage from "./components/urgent/UrgentPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Dashboard },
      {
        path: "routine",
        children: [
          { index: true, Component: RoutinePage },
          { path: "parametres", Component: RoutineSettingsPage },
        ],
      },
      {
        path: "clients",
        children: [
          { index: true, element: <Navigate to="prospects" replace /> },
          { path: "liste", Component: ClientsPage },
          { path: "prospects", Component: ProspectionPage },
          { path: "statistiques", Component: StatistiquesPage },
        ],
      },
      { path: "devis", Component: DevisPage },
      { 
        path: "chantiers", 
        children: [
          { index: true, Component: ChantiersPage },
          { path: ":id", Component: ChantierDetailRoute }
        ]
      },
      { path: "planning", Component: PlanningPage },
      {
        path: "finances",
        children: [
          { index: true, element: <Navigate to="overview" replace /> },
          { path: "overview", Component: FinancesOverview },
          { path: "tresorerie", Component: TresoreriePage },
          { path: "charges", Component: ChargesFixesPage },
          { path: "marges", Component: MargesPage },
          { path: "remboursements", Component: RemboursementsPage },
        ],
      },
      {
        path: "outils",
        children: [
          { index: true, element: <Navigate to="base-prix" replace /> },
          { path: "base-prix", Component: BasePrixPage },
          { path: "bdc", Component: BDCPage },
        ],
      },
      { path: "urgent", Component: UrgentPage },
      { path: "achats", Component: AchatsPage },
      { path: "commandes", Component: CommandesAPasserPage },
      { path: "acomptes", Component: AcomptesPage },
      { path: "parametres", Component: SettingsPage },
    ],
  },
]);
