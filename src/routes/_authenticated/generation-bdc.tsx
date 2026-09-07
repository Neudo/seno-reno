import { createFileRoute } from "@tanstack/react-router";

import { GenerationBdcPage } from "@/features/outils/pages/GenerationBdcPage";

export const Route = createFileRoute("/_authenticated/generation-bdc")({
  component: GenerationBdcPage,
});
