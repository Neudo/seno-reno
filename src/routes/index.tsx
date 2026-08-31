import { createFileRoute } from "@tanstack/react-router";

import { AuthEntryRedirect } from "@/features/auth/components/AuthRouteGuard";

export const Route = createFileRoute("/")({
  component: AuthEntryRedirect,
});
