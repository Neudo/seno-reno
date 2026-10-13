import { describe, expect, it } from "vitest";

import type { ChantierAdjustment } from "@/features/chantiers/api/chantiers-api";
import { getModifiedQuoteSummary } from "@/features/chantiers/lib/modified-quote";

function adjustment(
  id: string,
  kind: ChantierAdjustment["kind"],
  amount: number,
  status: ChantierAdjustment["status"],
): ChantierAdjustment {
  return {
    amount,
    createdAt: "2026-10-04T12:00:00Z",
    description: "",
    id,
    kind,
    label: id,
    occurredOn: "2026-10-04",
    status,
    updatedAt: "2026-10-04T12:00:00Z",
  };
}

describe("getModifiedQuoteSummary", () => {
  it("includes only accepted plus and minus values", () => {
    const summary = getModifiedQuoteSummary(100000, [
      adjustment("plus", "PLUS", 4500, "ACCEPTED"),
      adjustment("moins", "MINUS", 1000, "ACCEPTED"),
      adjustment("proposition", "PLUS", 900, "PROPOSED"),
      adjustment("refus", "MINUS", 500, "REFUSED"),
    ]);

    expect(summary.acceptedAdjustments.map((item) => item.id)).toEqual([
      "plus",
      "moins",
    ]);
    expect(summary.impact).toBe(3500);
    expect(summary.revisedAmount).toBe(103500);
  });

  it("keeps a missing quote amount unknown", () => {
    const summary = getModifiedQuoteSummary(null, [
      adjustment("plus", "PLUS", 100, "ACCEPTED"),
    ]);

    expect(summary.impact).toBe(100);
    expect(summary.revisedAmount).toBeNull();
  });

  it("calculates in cents and preserves the source amount without variations", () => {
    expect(getModifiedQuoteSummary(0.1, [
      adjustment("plus", "PLUS", 0.2, "ACCEPTED"),
    ]).revisedAmount).toBe(0.3);
    expect(getModifiedQuoteSummary(1200.01, []).revisedAmount).toBe(1200.01);
  });
});
