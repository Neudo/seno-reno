import { createFileRoute } from "@tanstack/react-router";

import { MargesPage } from "@/features/finances/pages/MargesPage";

export const Route = createFileRoute("/_authenticated/marges")({
  component: MargesPage,
});
