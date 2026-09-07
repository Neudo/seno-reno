import { createFileRoute } from "@tanstack/react-router";

import { AuthenticatedAppLayout } from "@/app/components/AuthenticatedAppLayout";
import { RequireAuthentication } from "@/features/auth/components/AuthRouteGuard";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedRoute,
});

function AuthenticatedRoute() {
  return (
    <RequireAuthentication>
      <AuthenticatedAppLayout />
    </RequireAuthentication>
  );
}
