// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AchatsPage } from "@/features/achats/pages/AchatsPage";
import type { ShoppingItem } from "@/features/achats/api/shopping-list-api";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  create: vi.fn(),
  toggle: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("@/features/auth/context/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "owner" } }),
}));
vi.mock("@/features/achats/api/shopping-list-api", () => ({
  getShoppingList: mocks.get,
  createShoppingItem: mocks.create,
  toggleShoppingItem: mocks.toggle,
  removeShoppingItem: mocks.remove,
}));
let items: ShoppingItem[];
beforeEach(() => {
  vi.resetAllMocks();
  items = [
    {
      id: "purchase",
      source: "CHANTIER",
      chantierId: "chantier",
      chantierName: "Chantier test",
      title: "Article lié au chantier",
      quantity: "3 sacs",
      supplier: "",
      estimatedAmount: 100,
      purchasedAt: null,
      createdAt: "2026-10-13T10:00:00Z",
    },
  ];
  mocks.get.mockImplementation(async () => items);
  mocks.toggle.mockImplementation(async ({ item }) => {
    items = items.map((entry) =>
      entry.id === item.id
        ? {
            ...entry,
            purchasedAt: item.purchasedAt ? null : "2026-10-13T12:00:00Z",
          }
        : entry,
    );
  });
  mocks.remove.mockImplementation(async ({ item }) => {
    items = items.filter((entry) => entry.id !== item.id);
  });
  mocks.create.mockResolvedValue(undefined);
});
afterEach(cleanup);
function mount() {
  const cache = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
  cache.setQueryData(["shopping-list", "owner"], items);
  render(
    <QueryClientProvider client={cache}>
      <AchatsPage />
    </QueryClientProvider>,
  );
  return cache;
}
describe("shopping-list UI matching Figma Make", () => {
  it("displays actual chantier articles and their quantity labels", () => {
    mount();
    expect(screen.getByText("Article lié au chantier")).toBeTruthy();
    expect(screen.getByText("3 sacs")).toBeTruthy();
    expect(screen.queryByText("Bac acier couverture")).toBeNull();
  });
  it("persists a click on the article label and moves it to Achetés", async () => {
    mount();
    fireEvent.click(screen.getByText("Article lié au chantier"));
    await waitFor(() =>
      expect(screen.queryByText("Article lié au chantier")).toBeNull(),
    );
    expect(mocks.toggle.mock.calls[0][0]).toMatchObject({
      item: { id: "purchase", source: "CHANTIER" },
      userId: "owner",
    });
    fireEvent.click(screen.getByRole("button", { name: /Achetés/ }));
    expect(
      screen
        .getByRole("checkbox", {
          name: "Marquer Article lié au chantier comme à acheter",
        })
        .getAttribute("checked"),
    ).not.toBeNull();
  });
  it("removes a linked entry via its actual source, leaving deletion semantics to the API", async () => {
    mount();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Retirer Article lié au chantier de la liste de courses",
      }),
    );
    await waitFor(() => expect(mocks.remove).toHaveBeenCalled());
    expect(mocks.remove.mock.calls[0][0]).toMatchObject({
      item: { source: "CHANTIER", id: "purchase" },
      userId: "owner",
    });
  });
  it("opens the reference form and submits a French amount with free-text quantity", async () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Ajouter un article" }));
    const modal = screen.getByRole("dialog");
    fireEvent.change(within(modal).getByLabelText("Article *"), {
      target: { value: "Article divers" },
    });
    fireEvent.change(within(modal).getByLabelText("Quantité"), {
      target: { value: "2 boîtes" },
    });
    fireEvent.change(within(modal).getByLabelText("Montant estimé (€)"), {
      target: { value: "1 200,50" },
    });
    fireEvent.click(
      within(modal).getByRole("button", { name: "Ajouter", exact: true }),
    );
    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith({
        input: {
          title: "Article divers",
          quantity: "2 boîtes",
          supplier: "",
          estimatedAmount: 1200.5,
        },
        userId: "owner",
      }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
  it("does not submit an invalid amount or close the form on failure", async () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Ajouter un article" }));
    const modal = screen.getByRole("dialog");
    fireEvent.change(within(modal).getByLabelText("Article *"), {
      target: { value: "Article divers" },
    });
    fireEvent.change(within(modal).getByLabelText("Montant estimé (€)"), {
      target: { value: "-10" },
    });
    fireEvent.click(
      within(modal).getByRole("button", { name: "Ajouter", exact: true }),
    );
    await waitFor(() => expect(within(modal).getByRole("alert")).toBeTruthy());
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("keeps the article and surfaces a failed checkbox mutation", async () => {
    mocks.toggle.mockRejectedValueOnce(new Error("Enregistrement impossible"));
    mount();
    fireEvent.click(screen.getByText("Article lié au chantier"));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "Enregistrement impossible",
      ),
    );
    expect(screen.getByText("Article lié au chantier")).toBeTruthy();
  });
});
