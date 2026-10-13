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
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ChantierDetail } from "@/features/chantiers/api/chantiers-api";
import { ChantierDetailPage } from "@/features/chantiers/pages/ChantierDetailPage";

const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  remove: vi.fn(),
  detail: vi.fn(),
}));
vi.mock("@/features/auth/context/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "owner" } }),
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children: ReactNode; to: string }) => (
    <a {...props} href={to}>
      {children}
    </a>
  ),
}));
vi.mock("@/features/chantiers/pages/ChantierCreatePage", () => ({
  ChantierCreatePage: () => null,
}));
vi.mock("@/features/chantiers/api/chantiers-api", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/features/chantiers/api/chantiers-api")
  >()),
  getChantierDetail: mocks.detail,
  saveChantierAdjustment: mocks.save,
  deleteChantierAdjustment: mocks.remove,
}));

let detail: ChantierDetail;
beforeEach(() => {
  vi.resetAllMocks();
  detail = {
    chantier: {
      id: "chantier",
      clientId: "client",
      clientName: "Client test",
      name: "Chantier test",
      address: "",
      status: "IN_PROGRESS",
      plannedStartDate: null,
      plannedEndDate: null,
      actualEndDate: null,
      initialQuoteId: "quote",
      initialSignedQuoteAmount: 32000,
      notes: "",
      subcontractorIds: [],
      createdAt: "",
      updatedAt: "",
    },
    adjustments: [
      {
        id: "plus",
        label: "Variation ajoutée",
        description: "Description initiale",
        kind: "PLUS",
        amount: 1500,
        status: "PROPOSED",
        occurredOn: "2026-10-01",
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "minus",
        label: "Variation retirée",
        description: "",
        kind: "MINUS",
        amount: 500,
        status: "ACCEPTED",
        occurredOn: null,
        createdAt: "",
        updatedAt: "",
      },
    ],
    initialQuote: null,
    deposits: [],
    documents: [],
    procurements: [],
    subcontractorCommitments: [],
    subcontractors: [],
    availableSubcontractors: [],
  };
  mocks.detail.mockImplementation(async () => detail);
  mocks.save.mockImplementation(async ({ id, input }) => {
    detail = {
      ...detail,
      adjustments: detail.adjustments.map((item) =>
        item.id === id ? { ...item, ...input } : item,
      ),
    };
  });
  mocks.remove.mockImplementation(async (id) => {
    detail = {
      ...detail,
      adjustments: detail.adjustments.filter((item) => item.id !== id),
    };
  });
});
afterEach(cleanup);

function mount() {
  const cache = new QueryClient({
    defaultOptions: {
      queries: { staleTime: Infinity, retry: false },
      mutations: { retry: false },
    },
  });
  cache.setQueryData(["chantier", "owner", "chantier"], detail);
  render(
    <QueryClientProvider client={cache}>
      <ChantierDetailPage chantierId="chantier" />
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Plus / moins-values" }));
  return cache;
}

function openPlus() {
  fireEvent.click(screen.getByRole("row", { name: /Variation ajoutée/u }));
  return screen.getByRole("dialog", { name: "Modifier la plus-value" });
}

describe("chantier adjustment sheet", () => {
  it("opens the clicked row in a right-hand sheet with its actual values", () => {
    mount();
    const sheet = openPlus();
    expect(sheet.className).toContain("right-0");
    expect(
      (within(sheet).getByLabelText("Libellé *") as HTMLInputElement).value,
    ).toBe("Variation ajoutée");
    expect(
      (within(sheet).getByLabelText("Type") as HTMLSelectElement).value,
    ).toBe("PLUS");
    expect(
      (within(sheet).getByLabelText("Montant (€) *") as HTMLInputElement).value,
    ).toBe("1500");
    expect(
      (within(sheet).getByLabelText("Statut") as HTMLSelectElement).value,
    ).toBe("PROPOSED");
    expect(
      (within(sheet).getByLabelText("Date") as HTMLInputElement).value,
    ).toBe("2026-10-01");
    expect(
      (within(sheet).getByLabelText("Description") as HTMLTextAreaElement)
        .value,
    ).toBe("Description initiale");
    expect(
      within(sheet).getByRole("button", { name: "Supprimer" }),
    ).toBeTruthy();
  });

  it.each(["Enter", " "])(
    "supports keyboard activation with %s and keeps missing dates empty",
    (key) => {
      mount();
      fireEvent.keyDown(
        screen.getByRole("row", { name: /Variation retirée/u }),
        { key },
      );
      const sheet = screen.getByRole("dialog", {
        name: "Modifier la moins-value",
      });
      expect(
        (within(sheet).getByLabelText("Date") as HTMLInputElement).value,
      ).toBe("");
      expect(
        (within(sheet).getByLabelText("Type") as HTMLSelectElement).value,
      ).toBe("MINUS");
    },
  );

  it("blocks unchanged submissions in both the button and form handler", () => {
    mount();
    const sheet = openPlus();
    const saveButton = within(sheet).getByRole("button", {
      name: "Enregistrer",
    }) as HTMLButtonElement;
    expect(saveButton.disabled).toBe(true);
    fireEvent.submit(saveButton.closest("form")!);
    expect(mocks.save).not.toHaveBeenCalled();
    fireEvent.change(within(sheet).getByLabelText("Libellé *"), {
      target: { value: "Nouveau libellé" },
    });
    expect(saveButton.disabled).toBe(false);
    fireEvent.change(within(sheet).getByLabelText("Libellé *"), {
      target: { value: "Variation ajoutée" },
    });
    expect(saveButton.disabled).toBe(true);
  });

  it("updates only the selected occurrence and refreshes the table", async () => {
    mount();
    const sheet = openPlus();
    fireEvent.change(within(sheet).getByLabelText("Montant (€) *"), {
      target: { value: "2 000,50" },
    });
    fireEvent.change(within(sheet).getByLabelText("Statut"), {
      target: { value: "ACCEPTED" },
    });
    fireEvent.click(within(sheet).getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(mocks.save).toHaveBeenCalledWith({
      chantierId: "chantier",
      id: "plus",
      userId: "owner",
      input: {
        amount: 2000.5,
        description: "Description initiale",
        kind: "PLUS",
        label: "Variation ajoutée",
        occurredOn: "2026-10-01",
        status: "ACCEPTED",
      },
    });
    await waitFor(() =>
      expect(
        screen.getByRole("row", { name: /Variation ajoutée/u }).textContent,
      ).toContain("Acceptée"),
    );
    expect(detail.adjustments.find((item) => item.id === "minus")?.amount).toBe(
      500,
    );
    expect(mocks.detail).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Finances" }));
    expect(
      screen.getByText("Devis modifié", { exact: true }).closest("article")
        ?.textContent,
    ).toContain(
      new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
      }).format(33500.5),
    );
  });

  it("requires confirmation and deletes only the selected occurrence", async () => {
    mount();
    const sheet = openPlus();
    fireEvent.click(within(sheet).getByRole("button", { name: "Supprimer" }));
    expect(mocks.remove).not.toHaveBeenCalled();
    fireEvent.click(
      within(sheet).getByRole("button", { name: "Annuler la suppression" }),
    );
    expect(mocks.remove).not.toHaveBeenCalled();
    fireEvent.click(within(sheet).getByRole("button", { name: "Supprimer" }));
    fireEvent.click(
      within(sheet).getByRole("button", { name: "Confirmer la suppression" }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(mocks.remove).toHaveBeenCalledExactlyOnceWith("plus");
    await waitFor(() =>
      expect(
        screen.queryByRole("row", { name: /Variation ajoutée/u }),
      ).toBeNull(),
    );
    expect(
      screen.getByRole("row", { name: /Variation retirée/u }),
    ).toBeTruthy();
  });

  it("keeps the sheet and values available after a save error", async () => {
    mocks.save.mockRejectedValueOnce(new Error("Enregistrement indisponible"));
    mount();
    const sheet = openPlus();
    fireEvent.change(within(sheet).getByLabelText("Libellé *"), {
      target: { value: "Libellé modifié" },
    });
    fireEvent.click(within(sheet).getByRole("button", { name: "Enregistrer" }));
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Enregistrement indisponible",
    );
    expect(
      (within(sheet).getByLabelText("Libellé *") as HTMLInputElement).value,
    ).toBe("Libellé modifié");
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("does not close the sheet while deleting, and shows deletion errors", async () => {
    let rejectDelete: (error: Error) => void = () => {};
    mocks.remove.mockImplementationOnce(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectDelete = reject;
        }),
    );
    mount();
    const sheet = openPlus();
    fireEvent.click(within(sheet).getByRole("button", { name: "Supprimer" }));
    fireEvent.click(
      within(sheet).getByRole("button", { name: "Confirmer la suppression" }),
    );
    await within(sheet).findByRole("button", { name: "Suppression…" });
    expect(
      (
        within(sheet).getByRole("button", {
          name: "Fermer",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("dialog")).toBeTruthy();
    rejectDelete(new Error("Suppression indisponible"));
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Suppression indisponible",
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("keeps the existing add form functional without edit-only actions", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Ajouter un élément" }));
    const dialog = screen.getByRole("dialog", { name: "Ajouter un élément" });
    expect(
      (within(dialog).getByLabelText("Libellé *") as HTMLInputElement).value,
    ).toBe("");
    expect(
      within(dialog).queryByRole("button", { name: "Supprimer" }),
    ).toBeNull();
    expect(
      within(dialog).getByRole("button", { name: "Ajouter" }),
    ).toBeTruthy();
  });

  it("closes with Escape and restores focus to the selected row", async () => {
    mount();
    const row = screen.getByRole("row", { name: /Variation ajoutée/u });
    openPlus();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(row));
    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it("rejects invalid amounts before saving", async () => {
    mount();
    const sheet = openPlus();
    fireEvent.change(within(sheet).getByLabelText("Montant (€) *"), {
      target: { value: "-1" },
    });
    fireEvent.click(within(sheet).getByRole("button", { name: "Enregistrer" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "positif ou nul",
    );
    expect(mocks.save).not.toHaveBeenCalled();
  });
});
