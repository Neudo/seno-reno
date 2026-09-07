import { createFileRoute } from "@tanstack/react-router";

import { RoutinePage } from "@/features/dashboard/pages/RoutinePage";

export const Route = createFileRoute("/_authenticated/routine")({
  component: RoutinePage,
});
