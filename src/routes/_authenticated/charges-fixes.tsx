import { createFileRoute } from "@tanstack/react-router";

import { ChargesFixesPage } from "@/features/finances/pages/ChargesFixesPage";

export const Route = createFileRoute("/_authenticated/charges-fixes")({
  component: ChargesFixesPage,
});
