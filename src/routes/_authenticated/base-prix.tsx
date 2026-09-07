import { createFileRoute } from "@tanstack/react-router";

import { BasePrixPage } from "@/features/prix/pages/BasePrixPage";

export const Route = createFileRoute("/_authenticated/base-prix")({
  component: BasePrixPage,
});
