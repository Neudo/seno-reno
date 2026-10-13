import { createFileRoute } from "@tanstack/react-router";

import { ContratSousTraitantPage } from "@/features/outils/pages/ContratSousTraitantPage";

export const Route = createFileRoute("/_authenticated/contrat-sous-traitant")({
  component: ContratSousTraitantPage,
});
