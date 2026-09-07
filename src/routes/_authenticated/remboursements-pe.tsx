import { createFileRoute } from "@tanstack/react-router";

import { RemboursementsPePage } from "@/features/finances/pages/RemboursementsPePage";

export const Route = createFileRoute("/_authenticated/remboursements-pe")({
  component: RemboursementsPePage,
});
