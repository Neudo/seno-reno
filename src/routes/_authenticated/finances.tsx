import { createFileRoute } from "@tanstack/react-router";

import { FinancesOverviewPage } from "@/features/finances/pages/FinancesOverviewPage";

export const Route = createFileRoute("/_authenticated/finances")({
  component: FinancesOverviewPage,
});
