import { createFileRoute } from "@tanstack/react-router";

import { DevisPage } from "@/features/devis/pages/DevisPage";

export const Route = createFileRoute("/_authenticated/devis")({
  component: DevisPage,
});
