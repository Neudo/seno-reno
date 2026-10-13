import { describe, expect, it } from "vitest";

import type { ChantierRecord } from "@/features/chantiers/api/chantiers-api";
import {
  getMonthDays,
  getPlanningChantiers,
  isScheduledOn,
  overlapsMonth,
  toIsoDate,
} from "@/features/planning/lib/planning";

function chantier(
  id: string,
  patch: Partial<ChantierRecord> = {},
): ChantierRecord {
  return {
    id,
    name: id,
    clientId: "client-test",
    clientName: "Client test",
    address: "",
    notes: "",
    status: "IN_PROGRESS",
    plannedStartDate: "2026-10-01",
    plannedEndDate: "2026-10-31",
    actualEndDate: null,
    initialQuoteId: null,
    initialSignedQuoteAmount: null,
    subcontractorIds: [],
    createdAt: "",
    updatedAt: "",
    ...patch,
  };
}

describe("planning calendar", () => {
  it.each([
    [new Date(2021, 1, 1), 28, "2021-02-01", "2021-02-28"],
    [new Date(2026, 9, 1), 35, "2026-09-28", "2026-11-01"],
    [new Date(2026, 2, 1), 42, "2026-02-23", "2026-04-05"],
  ])("only displays the weeks needed for %s", (month, length, first, last) => {
    const days = getMonthDays(month);
    expect(days).toHaveLength(length);
    expect(days[0].getDay()).toBe(1);
    expect(toIsoDate(days[0])).toBe(first);
    expect(toIsoDate(days.at(-1)!)).toBe(last);
  });

  it("includes the starting and ending dates", () => {
    const record = chantier("test", {
      plannedStartDate: "2026-10-10",
      plannedEndDate: "2026-10-12",
    });
    expect(isScheduledOn(record, new Date(2026, 9, 9))).toBe(false);
    expect(isScheduledOn(record, new Date(2026, 9, 10))).toBe(true);
    expect(isScheduledOn(record, new Date(2026, 9, 12))).toBe(true);
    expect(isScheduledOn(record, new Date(2026, 9, 13))).toBe(false);
  });

  it("prefers the actual ending date and handles cross-month ranges", () => {
    const record = chantier("test", {
      plannedStartDate: "2026-09-20",
      actualEndDate: "2026-10-02",
    });
    expect(overlapsMonth(record, new Date(2026, 8, 1))).toBe(true);
    expect(overlapsMonth(record, new Date(2026, 9, 1))).toBe(true);
    expect(isScheduledOn(record, new Date(2026, 9, 3))).toBe(false);
    expect(overlapsMonth(record, new Date(2026, 10, 1))).toBe(false);
  });

  it("does not invent a range when dates are missing", () => {
    expect(
      overlapsMonth(
        chantier("none", { plannedStartDate: null }),
        new Date(2026, 9, 1),
      ),
    ).toBe(false);
    const singleDay = chantier("start", { plannedEndDate: null });
    expect(isScheduledOn(singleDay, new Date(2026, 9, 1))).toBe(true);
    expect(isScheduledOn(singleDay, new Date(2026, 9, 2))).toBe(false);
  });
});

describe("planning chantier selection", () => {
  const records = [
    chantier("later", {
      plannedStartDate: "2026-11-01",
      plannedEndDate: "2026-11-15",
    }),
    chantier("undated", { plannedStartDate: null, plannedEndDate: null }),
    chantier("current"),
  ];

  it("shows all chantiers in the list, chronologically, without mutating the source", () => {
    expect(getPlanningChantiers(records, "").map((item) => item.id)).toEqual([
      "current",
      "later",
      "undated",
    ]);
    expect(records[0].id).toBe("later");
  });

  it("limits the calendar to the displayed month", () => {
    expect(
      getPlanningChantiers(records, "", new Date(2026, 9, 1)).map(
        (item) => item.id,
      ),
    ).toEqual(["current"]);
  });

  it("isolates the selected chantier in both views", () => {
    expect(
      getPlanningChantiers(records, "later").map((item) => item.id),
    ).toEqual(["later"]);
    expect(
      getPlanningChantiers(records, "later", new Date(2026, 9, 1)),
    ).toEqual([]);
    expect(
      getPlanningChantiers(records, "later", new Date(2026, 10, 1)).map(
        (item) => item.id,
      ),
    ).toEqual(["later"]);
    expect(
      getPlanningChantiers(records, "undated").map((item) => item.id),
    ).toEqual(["undated"]);
  });
});
