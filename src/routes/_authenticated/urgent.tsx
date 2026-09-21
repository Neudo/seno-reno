import { createFileRoute } from "@tanstack/react-router";

import { UrgentPage } from "@/features/urgent/pages/UrgentPage";

export const Route = createFileRoute("/_authenticated/urgent")({
  component: UrgentPage,
});
