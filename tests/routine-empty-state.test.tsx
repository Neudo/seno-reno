// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RoutineSnapshot } from "@/features/routine/api/routine-api";
import { RoutineChecklist } from "@/features/routine/components/RoutineChecklist";
import { RoutineSettingsPage } from "@/features/routine/pages/RoutineSettingsPage";

const mocks = vi.hoisted(() => ({
  snapshot: vi.fn(),
  createCategory: vi.fn(),
  toggle: vi.fn(),
  navigate: vi.fn(),
}));
vi.mock("@/features/auth/context/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "owner" } }),
}));
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
}));
vi.mock("@/features/routine/api/routine-api", () => ({
  getRoutineSnapshot: mocks.snapshot,
  createRoutineCategory: mocks.createCategory,
  toggleRoutineItemCompletion: mocks.toggle,
  createRoutineItem: vi.fn(),
  deleteRoutineItem: vi.fn(),
  resetRoutineDay: vi.fn(),
  deleteRoutineCategory: vi.fn(),
  updateRoutineCategory: vi.fn(),
  updateRoutineCategoryOrder: vi.fn(),
  updateRoutineItemOrder: vi.fn(),
  updateRoutineItemTitle: vi.fn(),
}));

const emptySnapshot: RoutineSnapshot = {
  sections: [],
  completedItemIds: new Set(),
  routineDate: "2026-10-13",
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.snapshot.mockResolvedValue(emptySnapshot);
  mocks.createCategory.mockResolvedValue(undefined);
  mocks.toggle.mockResolvedValue(undefined);
});
afterEach(cleanup);

function mount(component: "checklist" | "settings", snapshot = emptySnapshot) {
  const cache = new QueryClient({
    defaultOptions: {
      queries: { staleTime: Infinity, retry: false },
      mutations: { retry: false },
    },
  });
  cache.setQueryData(["routine", "owner"], snapshot);
  render(
    <QueryClientProvider client={cache}>
      {component === "checklist" ? (
        <RoutineChecklist />
      ) : (
        <RoutineSettingsPage />
      )}
    </QueryClientProvider>,
  );
}

describe("routine without default placeholders", () => {
  it("shows an empty checklist and keeps access to configuration", () => {
    mount("checklist");
    expect(screen.getByText("Aucune routine configurée.")).toBeTruthy();
    expect(screen.queryByRole("checkbox")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Personnaliser" }));
    expect(mocks.navigate).toHaveBeenCalledWith({ to: "/routine/parametres" });
  });

  it("has no restore-defaults action and allows creating a first real category", async () => {
    mount("settings");
    expect(screen.queryByRole("button", { name: "Réinitialiser" })).toBeNull();
    expect(screen.getByText(/Aucune catégorie configurée/u)).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Ajouter une catégorie" }),
    );
    fireEvent.change(screen.getByLabelText("Nom de la nouvelle catégorie"), {
      target: { value: "Mes suivis" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Ajouter", exact: true }),
    );
    await waitFor(() => expect(mocks.createCategory).toHaveBeenCalled());
    expect(mocks.createCategory.mock.calls[0][0]).toMatchObject({
      name: "Mes suivis",
      userId: "owner",
      position: 0,
    });
  });

  it("continues displaying and completing actual stored tasks via their label", async () => {
    const snapshot: RoutineSnapshot = {
      ...emptySnapshot,
      sections: [
        {
          id: "category",
          name: "Mes suivis",
          color: "#00365A",
          position: 0,
          items: [
            {
              id: "task",
              categoryId: "category",
              title: "Ma tâche réelle",
              position: 0,
              isCustom: true,
              isPermanent: true,
              sourceTag: null,
              isUrgent: false,
            },
          ],
        },
      ],
    };
    mount("checklist", snapshot);
    expect(screen.queryByText("Aucune routine configurée.")).toBeNull();
    fireEvent.click(screen.getByText("Ma tâche réelle"));
    await waitFor(() => expect(mocks.toggle).toHaveBeenCalled());
    expect(mocks.toggle.mock.calls[0][0]).toEqual({
      completed: false,
      itemId: "task",
      routineDate: "2026-10-13",
      userId: "owner",
    });
  });
});
