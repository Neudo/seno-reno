import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/chantiers")({
  component: ChantiersRouteLayout,
});

function ChantiersRouteLayout() {
  return <Outlet />;
}
