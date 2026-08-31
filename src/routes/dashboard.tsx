import { createFileRoute } from "@tanstack/react-router";

import { RequireAuthentication } from "@/features/auth/components/AuthRouteGuard";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";

export const Route = createFileRoute("/dashboard")({
  component: DashboardRoute,
});

function DashboardRoute() {
  return (
    <RequireAuthentication>
      <DashboardPage />
    </RequireAuthentication>
  );
}
