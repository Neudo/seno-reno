import type { ChantierAdjustment } from "@/features/chantiers/api/chantiers-api";

export function getModifiedQuoteSummary(
  initialAmount: number | null,
  adjustments: ChantierAdjustment[],
) {
  const acceptedAdjustments = adjustments.filter(
    (adjustment) => adjustment.status === "ACCEPTED",
  );
  const impactInCents = acceptedAdjustments.reduce(
    (total, adjustment) =>
      total +
      (adjustment.kind === "PLUS" ? 1 : -1) * Math.round(adjustment.amount * 100),
    0,
  );

  return {
    acceptedAdjustments,
    impact: impactInCents / 100,
    revisedAmount:
      initialAmount === null
        ? null
        : (Math.round(initialAmount * 100) + impactInCents) / 100,
  };
}
