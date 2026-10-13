import { createFileRoute } from "@tanstack/react-router";

import { SousTraitantsPage } from "@/features/sous-traitants/pages/SousTraitantsPage";

export const Route = createFileRoute("/_authenticated/sous-traitants")({
  component: SousTraitantsPage,
});
