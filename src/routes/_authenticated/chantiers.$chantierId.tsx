import { createFileRoute } from "@tanstack/react-router";

import { ChantierDetailPage } from "@/features/chantiers/pages/ChantierDetailPage";

export const Route = createFileRoute("/_authenticated/chantiers/$chantierId")({
  component: ChantierDetailRoute,
});

function ChantierDetailRoute() {
  const { chantierId } = Route.useParams();

  return <ChantierDetailPage chantierId={chantierId} />;
}
