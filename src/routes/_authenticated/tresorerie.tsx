import { createFileRoute } from "@tanstack/react-router";

import { TresoreriePage } from "@/features/finances/pages/TresoreriePage";

export const Route = createFileRoute("/_authenticated/tresorerie")({
  component: TresoreriePage,
});
