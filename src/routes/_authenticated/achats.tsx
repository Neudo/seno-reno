import { createFileRoute } from "@tanstack/react-router";

import { AchatsPage } from "@/features/achats/pages/AchatsPage";

export const Route = createFileRoute("/_authenticated/achats")({
  component: AchatsPage,
});
