import type { ChantierRecord } from "@/features/chantiers/api/chantiers-api";
import type { QuoteRecord } from "@/features/devis/api/quotes-api";
import type { CashMovement } from "@/features/finances/api/finance-api";

export function getDashboardSummary({
  chantiers,
  movements,
  quotes,
  today,
}: {
  chantiers: ChantierRecord[];
  movements: CashMovement[];
  quotes: QuoteRecord[];
  today: string;
}) {
  const rangeStart = new Date(`${today}T12:00:00`);
  const iso = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
  };
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + 29);
  const end = iso(rangeEnd);
  const activeChantiers = chantiers.filter(
    (chantier) => chantier.status === "IN_PROGRESS",
  );
  const planned = movements.filter((movement) => movement.status === "PLANNED");
  const income = planned.filter(
    (movement) =>
      movement.direction === "INCOME" &&
      movement.expectedDate >= today &&
      movement.expectedDate <= end,
  );
  const outgoing = planned.filter(
    (movement) =>
      movement.direction === "EXPENSE" &&
      movement.expectedDate >= today &&
      movement.expectedDate <= end,
  );
  const toPay = planned.filter(
    (movement) =>
      movement.direction === "EXPENSE" && movement.expectedDate <= end,
  );
  const toFollowUp = quotes.filter(
    (quote) =>
      quote.status === "TO_FOLLOW_UP" ||
      ((quote.status === "SENT" || quote.status === "IN_DISCUSSION") &&
        Boolean(quote.nextFollowUpAt && quote.nextFollowUpAt <= today)),
  );
  const total = (items: CashMovement[]) =>
    items.reduce((sum, movement) => sum + movement.amount, 0);
  const weeks = Array.from({ length: 5 }, (_, index) => {
    const start = new Date(rangeStart);
    start.setDate(start.getDate() + index * 7);
    const weekEnd = new Date(start);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const startIso = iso(start);
    const endIso = iso(weekEnd) < end ? iso(weekEnd) : end;
    const weekly = (items: CashMovement[]) =>
      total(
        items.filter(
          (movement) =>
            movement.expectedDate >= startIso &&
            movement.expectedDate <= endIso,
        ),
      );
    return {
      date: startIso,
      income: weekly(income),
      outgoing: weekly(outgoing),
    };
  });
  const upcoming = chantiers
    .filter(
      (chantier) =>
        chantier.status !== "COMPLETED" && chantier.status !== "CANCELLED",
    )
    .flatMap((chantier) => [
      {
        chantier,
        date: chantier.plannedStartDate,
        label: "Démarrage chantier",
        color: "#166534",
      },
      {
        chantier,
        date: chantier.plannedEndDate,
        label: "Fin prévisionnelle",
        color: "#6B21A8",
      },
    ])
    .filter((event): event is typeof event & { date: string } =>
      Boolean(event.date && event.date >= today && event.date <= end),
    )
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(0, 5);

  return {
    activeChantiers,
    income: total(income),
    outgoing: total(outgoing),
    toPay,
    toFollowUp,
    upcoming,
    weeks,
  };
}
