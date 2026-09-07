import { createFileRoute } from "@tanstack/react-router";

import { StatistiquesPage } from "@/features/prospection/pages/StatistiquesPage";

export const Route = createFileRoute("/_authenticated/statistiques")({
  component: StatistiquesPage,
});
