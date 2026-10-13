import { createFileRoute } from "@tanstack/react-router";

import { ChantiersPage } from "@/features/chantiers/pages/ChantiersPage";

export const Route = createFileRoute("/_authenticated/chantiers/")({
  component: ChantiersPage,
});
