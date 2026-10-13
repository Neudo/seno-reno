import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createRoutineItem,
  getRoutineSnapshot,
  resetRoutine,
} from "@/features/routine/api/routine-api";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
  insert: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("@/features/auth/api/supabase-client", () => ({ supabase: mocks }));

let rows: Record<
  string,
  { data: unknown[]; error: { message: string } | null }
>;
beforeEach(() => {
  vi.resetAllMocks();
  rows = {
    routine_categories: { data: [], error: null },
    routine_items: { data: [], error: null },
    routine_item_completions: { data: [], error: null },
  };
  mocks.insert.mockResolvedValue({ error: null });
  mocks.remove.mockResolvedValue({ error: null });
  mocks.rpc.mockImplementation(async () => {
    if (rows.routine_categories.data.length === 0) {
      rows.routine_categories.data = [
        { id: "base", name: "AGENDA", color: "#00365A", position: 0 },
      ];
      rows.routine_items.data = [
        {
          id: "base-task",
          category_id: "base",
          title: "Rendez-vous du jour",
          position: 0,
          source_key: "agenda:1",
          is_permanent: true,
          source_tag: null,
          is_urgent: false,
        },
      ];
    }
    return { error: null };
  });
  mocks.from.mockImplementation((table) => ({
    select: () => ({
      order: async () => rows[table],
      eq: async () => rows[table],
    }),
    insert: mocks.insert,
    delete: () => ({ in: mocks.remove }),
  }));
});

describe("routine preserves the base document and real data", () => {
  it("initializes the base document only for a new empty routine", async () => {
    const snapshot = await getRoutineSnapshot();
    expect(snapshot.sections[0].items[0]).toMatchObject({
      title: "Rendez-vous du jour",
      isPermanent: true,
      sourceTag: null,
    });
    expect(snapshot.completedItemIds.size).toBe(0);
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("bootstrap_routine");
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.from.mock.calls.map(([table]) => table)).toEqual([
      "routine_categories",
      "routine_categories",
      "routine_items",
      "routine_item_completions",
    ]);
  });

  it("does not recreate individually deleted tasks on subsequent loads", async () => {
    await getRoutineSnapshot();
    rows.routine_items.data = [];
    await getRoutineSnapshot();
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(rows.routine_items.data).toEqual([]);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("preserves stored tasks, business-generated tasks and their completions", async () => {
    rows.routine_categories.data = [
      { id: "category", name: "Mes suivis", color: "#00365A", position: 0 },
    ];
    rows.routine_items.data = [
      {
        id: "manual",
        category_id: "category",
        title: "Tâche saisie",
        position: 0,
        source_key: null,
        is_permanent: true,
        source_tag: null,
        is_urgent: false,
      },
      {
        id: "business",
        category_id: "category",
        title: "Échéance enregistrée",
        position: 1,
        source_key: "invoice:existing",
        is_permanent: false,
        source_tag: "Facture",
        is_urgent: true,
      },
    ];
    rows.routine_item_completions.data = [{ routine_item_id: "manual" }];
    const snapshot = await getRoutineSnapshot();
    expect(snapshot.sections[0].items).toHaveLength(2);
    expect(snapshot.sections[0].items[0]).toMatchObject({
      id: "manual",
      isCustom: true,
      title: "Tâche saisie",
    });
    expect(snapshot.sections[0].items[1]).toMatchObject({
      id: "business",
      isCustom: false,
      sourceTag: "Facture",
      isUrgent: true,
    });
    expect(snapshot.completedItemIds.has("manual")).toBe(true);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("reports a database error instead of filling the page with defaults", async () => {
    rows.routine_categories.error = { message: "Base indisponible" };
    await expect(getRoutineSnapshot()).rejects.toThrow("Base indisponible");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("inserts only the task explicitly entered by the user", async () => {
    await createRoutineItem({
      categoryId: "category",
      position: 0,
      title: "Ma tâche",
      userId: "owner",
    });
    expect(mocks.insert).toHaveBeenCalledExactlyOnceWith({
      category_id: "category",
      is_permanent: true,
      position: 0,
      title: "Ma tâche",
      user_id: "owner",
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("restores the base model only after an explicit routine reset", async () => {
    await resetRoutine(["category"]);
    expect(mocks.remove).toHaveBeenCalledExactlyOnceWith("id", ["category"]);
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("bootstrap_routine");
  });
});
