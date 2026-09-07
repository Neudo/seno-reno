import { createFileRoute } from "@tanstack/react-router";

import { RoutineSettingsPage } from "@/features/routine/pages/RoutineSettingsPage";

export const Route = createFileRoute("/_authenticated/routine/parametres")({
  component: RoutineSettingsPage,
});
