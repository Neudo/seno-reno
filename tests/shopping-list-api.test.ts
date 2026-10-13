import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ShoppingItem } from "@/features/achats/api/shopping-list-api";

const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/features/auth/api/supabase-client", () => ({
  supabase: { from: mocks.from },
}));
import {
  createShoppingItem,
  getShoppingList,
  removeShoppingItem,
  toggleShoppingItem,
} from "@/features/achats/api/shopping-list-api";

function query(data: unknown = [], error: { message: string } | null = null) {
  const builder = {
    select: vi.fn(),
    order: vi.fn(),
    eq: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    single: vi.fn(),
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve({ data, error }).then(resolve),
  };
  for (const fn of [
    builder.select,
    builder.order,
    builder.eq,
    builder.insert,
    builder.update,
    builder.delete,
    builder.single,
  ])
    fn.mockReturnValue(builder);
  return builder;
}
const linkedItem: ShoppingItem = {
  id: "purchase",
  source: "CHANTIER",
  chantierId: "chantier",
  chantierName: "Chantier test",
  title: "Article test",
  quantity: "2",
  supplier: "",
  estimatedAmount: 12,
  purchasedAt: null,
  createdAt: "2026-10-13T10:00:00Z",
};
beforeEach(() => vi.resetAllMocks());

describe("shopping list persistence", () => {
  it("reads the original opted-in chantier purchases, not a copied seed list", async () => {
    const manual = query([
      {
        id: "manual",
        title: "Divers test",
        quantity: "3 rouleaux",
        supplier: "",
        estimated_amount: null,
        purchased_at: null,
        created_at: "2026-10-12T10:00:00Z",
      },
    ]);
    const linked = query([
      {
        id: "purchase",
        chantier_id: "chantier",
        title: "Article test",
        quantity: "2",
        supplier: "",
        forecast_amount: "12.50",
        purchased_at: null,
        created_at: "2026-10-13T10:00:00Z",
        chantier: { id: "chantier", name: "Chantier test" },
      },
    ]);
    mocks.from.mockImplementation((table) =>
      table === "shopping_list_items" ? manual : linked,
    );
    const result = await getShoppingList();
    expect(linked.eq).toHaveBeenCalledWith("kind", "PURCHASE");
    expect(linked.eq).toHaveBeenCalledWith("add_to_shopping_list", true);
    expect(result[0]).toMatchObject({
      id: "purchase",
      source: "CHANTIER",
      estimatedAmount: 12.5,
    });
    expect(result[1]).toMatchObject({
      id: "manual",
      source: "MANUAL",
      quantity: "3 rouleaux",
    });
  });
  it("marks the original purchase bought without changing its payment status or duplicating it", async () => {
    const builder = query({ id: "purchase" });
    mocks.from.mockReturnValue(builder);
    await toggleShoppingItem({ item: linkedItem, userId: "owner" });
    expect(mocks.from).toHaveBeenCalledWith("chantier_procurements");
    expect(builder.update).toHaveBeenCalledWith({
      purchased_at: expect.any(String),
    });
    expect(builder.eq).toHaveBeenCalledWith("user_id", "owner");
    expect(builder.insert).not.toHaveBeenCalled();
  });
  it("can unmark an already purchased article", async () => {
    const builder = query({ id: "purchase" });
    mocks.from.mockReturnValue(builder);
    await toggleShoppingItem({
      item: { ...linkedItem, purchasedAt: "2026-10-13T12:00:00Z" },
      userId: "owner",
    });
    expect(builder.update).toHaveBeenCalledWith({ purchased_at: null });
  });
  it("removes only the shopping-list flag on linked purchases", async () => {
    const builder = query({ id: "purchase" });
    mocks.from.mockReturnValue(builder);
    await removeShoppingItem({ item: linkedItem, userId: "owner" });
    expect(builder.update).toHaveBeenCalledWith({
      add_to_shopping_list: false,
    });
    expect(builder.delete).not.toHaveBeenCalled();
  });
  it("deletes a standalone article by its actual id and owner", async () => {
    const builder = query({ id: "manual" });
    mocks.from.mockReturnValue(builder);
    await removeShoppingItem({
      item: { ...linkedItem, id: "manual", source: "MANUAL" },
      userId: "owner",
    });
    expect(mocks.from).toHaveBeenCalledWith("shopping_list_items");
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith("id", "manual");
    expect(builder.eq).toHaveBeenCalledWith("user_id", "owner");
  });
  it("persists standalone form values and rejects an invalid amount", async () => {
    const builder = query();
    mocks.from.mockReturnValue(builder);
    await createShoppingItem({
      input: {
        title: " Article test ",
        quantity: "3 rouleaux",
        supplier: "",
        estimatedAmount: 0,
      },
      userId: "owner",
    });
    expect(builder.insert).toHaveBeenCalledWith({
      title: "Article test",
      quantity: "3 rouleaux",
      supplier: "",
      estimated_amount: 0,
      user_id: "owner",
    });
    await expect(
      createShoppingItem({
        input: {
          title: "Article",
          quantity: "",
          supplier: "",
          estimatedAmount: -1,
        },
        userId: "owner",
      }),
    ).rejects.toThrow();
  });
  it("propagates backend errors rather than pretending that a mutation succeeded", async () => {
    mocks.from.mockReturnValue(query(null, { message: "Denied" }));
    await expect(
      toggleShoppingItem({ item: linkedItem, userId: "owner" }),
    ).rejects.toThrow("Denied");
  });
});
