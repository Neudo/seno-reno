import { describe, expect, it } from "vitest";
import type { ShoppingItem } from "@/features/achats/api/shopping-list-api";
import {
  getShoppingListView,
  parseEstimatedAmount,
  serializePurchaseQuantity,
} from "@/features/achats/lib/shopping-list";

const item = (overrides: Partial<ShoppingItem> = {}): ShoppingItem => ({
  id: "item",
  source: "CHANTIER",
  chantierId: "chantier",
  chantierName: "Chantier test",
  title: "Article test",
  quantity: "2",
  supplier: "",
  estimatedAmount: 100,
  purchasedAt: null,
  createdAt: "2026-10-13T10:00:00Z",
  ...overrides,
});
describe("shopping list real data", () => {
  it("does not generate any demonstration articles", () => {
    expect(getShoppingListView([], "TO_BUY")).toEqual({
      toBuyCount: 0,
      purchasedCount: 0,
      totalEstimate: 0,
      groups: [],
    });
  });
  it("groups actual purchases by chantier and standalone entries under Divers", () => {
    const view = getShoppingListView(
      [
        item(),
        item({
          id: "manual",
          source: "MANUAL",
          chantierId: null,
          chantierName: null,
          estimatedAmount: null,
        }),
      ],
      "TO_BUY",
    );
    expect(view.groups.map((group) => group.label)).toEqual([
      "Chantier test",
      "Divers",
    ]);
    expect(view.totalEstimate).toBe(100);
  });
  it("does not merge distinct chantiers with the same name", () => {
    expect(
      getShoppingListView(
        [item(), item({ id: "second", chantierId: "different" })],
        "TO_BUY",
      ).groups,
    ).toHaveLength(2);
  });
  it("filters purchased entries and excludes them from the remaining estimate", () => {
    const items = [
      item(),
      item({
        id: "purchased",
        purchasedAt: "2026-10-13T12:00:00Z",
        estimatedAmount: 900,
      }),
    ];
    const view = getShoppingListView(items, "PURCHASED");
    expect(view.toBuyCount).toBe(1);
    expect(view.purchasedCount).toBe(1);
    expect(view.totalEstimate).toBe(100);
    expect(view.groups[0].items[0].id).toBe("purchased");
    expect(getShoppingListView(items, "ALL").groups[0].items).toHaveLength(2);
  });
  it("accepts French amounts and optional values without silently accepting bad input", () => {
    expect(parseEstimatedAmount("1 200,50")).toBe(1200.5);
    expect(parseEstimatedAmount("0")).toBe(0);
    expect(parseEstimatedAmount("")).toBeNull();
    for (const value of [
      "-1",
      "NaN",
      "Infinity",
      "100abc",
      "1,234",
      "0x10",
      "1e5",
    ])
      expect(() => parseEstimatedAmount(value)).toThrow();
  });
  it("accepts Figma quantity labels while preserving numeric quantities", () => {
    expect(serializePurchaseQuantity(" 3 sacs ")).toEqual({
      quantity: null,
      quantityLabel: "3 sacs",
    });
    expect(serializePurchaseQuantity("2,5")).toEqual({
      quantity: 2.5,
      quantityLabel: "2,5",
    });
    expect(serializePurchaseQuantity("")).toEqual({
      quantity: null,
      quantityLabel: "",
    });
  });
});
