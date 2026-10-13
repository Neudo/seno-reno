import { describe, expect, it } from "vitest";
import { getDashboardSummary } from "@/features/dashboard/lib/dashboard";
import type { ChantierRecord } from "@/features/chantiers/api/chantiers-api";
import type { CashMovement } from "@/features/finances/api/finance-api";
import type { QuoteRecord } from "@/features/devis/api/quotes-api";

const movement = (overrides: Partial<CashMovement> = {}): CashMovement => ({
  id: "movement",
  label: "Test",
  amount: 100,
  direction: "INCOME",
  expectedDate: "2026-10-13",
  actualDate: null,
  status: "PLANNED",
  kind: "MANUAL_INCOME",
  personalExpenseId: null,
  comment: "",
  createdAt: "",
  updatedAt: "",
  ...overrides,
});
describe("dashboard actual data", () => {
  it("does not generate example metrics or events when there is no data", () => {
    const summary = getDashboardSummary({
      today: "2026-10-13",
      chantiers: [],
      quotes: [],
      movements: [],
    });
    expect(summary.income).toBe(0);
    expect(summary.outgoing).toBe(0);
    expect(summary.upcoming).toEqual([]);
    expect(summary.activeChantiers).toEqual([]);
  });
  it("limits forecast totals to 30 days, excluding completed and cancelled movements", () => {
    const summary = getDashboardSummary({
      today: "2026-10-13",
      chantiers: [],
      quotes: [],
      movements: [
        movement(),
        movement({ id: "expense", direction: "EXPENSE", amount: 20 }),
        movement({ id: "completed", status: "COMPLETED", amount: 1000 }),
        movement({ id: "cancelled", status: "CANCELLED", amount: 500 }),
        movement({ id: "later", expectedDate: "2026-11-12", amount: 800 }),
        movement({
          id: "overdue",
          direction: "EXPENSE",
          expectedDate: "2026-10-01",
          amount: 10,
        }),
      ],
    });
    expect(summary.income).toBe(100);
    expect(summary.outgoing).toBe(20);
    expect(summary.toPay.map((entry) => entry.id)).toEqual([
      "expense",
      "overdue",
    ]);
    expect(summary.weeks.reduce((sum, week) => sum + week.income, 0)).toBe(
      summary.income,
    );
  });
  it("uses registered quote follow-up status and dates, never fictional elapsed days", () => {
    const quote = {
      id: "quote",
      status: "SENT",
      nextFollowUpAt: "2026-10-13",
    } as QuoteRecord;
    const summary = getDashboardSummary({
      today: "2026-10-13",
      chantiers: [],
      movements: [],
      quotes: [
        quote,
        { ...quote, id: "later", nextFollowUpAt: "2026-10-14" },
        { ...quote, id: "signed", status: "SIGNED" },
      ],
    });
    expect(summary.toFollowUp.map((entry) => entry.id)).toEqual(["quote"]);
  });
  it("shows planned chantier dates without calculating a fictional measured progress", () => {
    const chantier = {
      id: "chantier",
      status: "IN_PROGRESS",
      plannedStartDate: "2026-10-14",
      plannedEndDate: "2026-10-20",
    } as ChantierRecord;
    const summary = getDashboardSummary({
      today: "2026-10-13",
      quotes: [],
      movements: [],
      chantiers: [chantier, { ...chantier, id: "closed", status: "COMPLETED" }],
    });
    expect(summary.upcoming).toHaveLength(2);
    expect(summary.activeChantiers).toHaveLength(1);
    expect(summary.activeChantiers[0]).not.toHaveProperty("progress");
  });
});
