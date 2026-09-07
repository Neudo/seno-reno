import { createFileRoute } from "@tanstack/react-router";

import { ProspectionPage } from "@/features/prospection/pages/ProspectionPage";

export const Route = createFileRoute("/_authenticated/prospection")({
  component: ProspectionPage,
});
