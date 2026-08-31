import { createFileRoute } from "@tanstack/react-router";

import { PublicOnly } from "@/features/auth/components/AuthRouteGuard";
import { SignInPage } from "@/features/auth/pages/SignInPage";

export const Route = createFileRoute("/signin")({
  component: SignInRoute,
});

function SignInRoute() {
  return (
    <PublicOnly>
      <SignInPage />
    </PublicOnly>
  );
}
