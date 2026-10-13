// @vitest-environment jsdom
import { File as NodeFile } from "node:buffer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChantierCreatePage } from "@/features/chantiers/pages/ChantierCreatePage";
import type {
  QuoteRecord,
  QuoteSnapshot,
} from "@/features/devis/api/quotes-api";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  importPdf: vi.fn(),
  navigate: vi.fn(),
  quotes: vi.fn(),
  parse: vi.fn(),
}));
vi.mock("@/features/auth/context/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "owner" } }),
}));
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
  Link: ({
    children,
    to,
    params,
    ...props
  }: {
    children: ReactNode;
    to: string;
    params?: { chantierId: string };
  }) => (
    <a {...props} href={to.replace("$chantierId", params?.chantierId ?? "")}>
      {children}
    </a>
  ),
}));
vi.mock("@/features/chantiers/api/chantiers-api", () => ({
  chantierStatuses: [
    "PENDING",
    "IN_PROGRESS",
    "PAUSED",
    "COMPLETED",
    "CANCELLED",
  ],
  createChantierFromQuoteWithDetails: mocks.create,
  getChantierSnapshot: vi.fn(),
}));
vi.mock("@/features/devis/api/quotes-api", () => ({
  getQuoteSnapshot: mocks.quotes,
  importQuotePdf: mocks.importPdf,
}));
vi.mock("@/features/outils/bdc/parse-tolteck-quote", () => ({
  parseTolteckQuoteSummary: mocks.parse,
}));

function mount(quotes: QuoteRecord[] = []) {
  const snapshot: QuoteSnapshot = {
    clients: [{ id: "client", name: "Client local" }],
    quotes,
  };
  mocks.quotes.mockResolvedValue(snapshot);
  const cache = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
  cache.setQueryData(["quotes", "owner"], snapshot);
  cache.setQueryData(["chantiers", "owner"], {
    chantiers: [],
    signedQuotes: [],
    subcontractors: [],
    clients: [
      { id: "client", name: "Client local", address: "", isArchived: false },
    ],
  });
  render(
    <QueryClientProvider client={cache}>
      <ChantierCreatePage />
    </QueryClientProvider>,
  );
  return cache;
}

async function selectPdf() {
  fireEvent.change(screen.getByLabelText("PDF du devis"), {
    target: {
      files: [
        new NodeFile(["%PDF-1.7\n"], "devis.pdf", { type: "application/pdf" }),
      ],
    },
  });
  await screen.findByLabelText("Numéro du devis *");
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.importPdf.mockResolvedValue("imported-quote");
  mocks.create.mockResolvedValue("created-chantier");
  mocks.navigate.mockResolvedValue(undefined);
  mocks.parse.mockResolvedValue({
    clientName: "Client local",
    fileName: "devis.pdf",
    projectAddress: "Adresse du chantier",
    projectTitle: "Rénovation",
    quoteDate: "05/10/2026",
    quoteNumber: "DEV-TEST-1",
    totalHt: 32000,
    totalTtc: 35200,
  });
});
afterEach(cleanup);

describe("PDF-only chantier form", () => {
  it("starts with one upload, no creation-mode tabs and no write", () => {
    mount();
    expect(screen.queryByText("Création manuelle")).toBeNull();
    expect(screen.queryByText("Depuis un devis signé")).toBeNull();
    expect(screen.queryByLabelText("Nom du chantier *")).toBeNull();
    expect(
      (
        screen.getByRole("button", {
          name: "Créer le chantier",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(mocks.importPdf).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("reviews the PDF before creating an unsigned quote and navigating to the chantier", async () => {
    mount();
    await selectPdf();
    expect(
      (screen.getByLabelText("Nom du chantier *") as HTMLInputElement).value,
    ).toBe("Rénovation");
    expect(
      (screen.getByLabelText("Montant du devis HT") as HTMLInputElement).value,
    ).toBe("32000");
    expect(screen.queryByLabelText(/fin réelle/iu)).toBeNull();
    expect(mocks.importPdf).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Créer le chantier" }));
    await waitFor(() =>
      expect(mocks.navigate).toHaveBeenCalledWith({
        params: { chantierId: "created-chantier" },
        to: "/chantiers/$chantierId",
      }),
    );
    expect(mocks.importPdf.mock.calls[0][0].input).toMatchObject({
      status: "TO_SEND",
      clientId: "client",
      totalHt: 32000,
    });
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ quoteId: "imported-quote" }),
    );
  });

  it("retries a failed creation without uploading the PDF again", async () => {
    mocks.create.mockRejectedValueOnce(new Error("Erreur temporaire"));
    mount();
    await selectPdf();
    fireEvent.click(screen.getByRole("button", { name: "Créer le chantier" }));
    await screen.findByRole("alert");
    await waitFor(() =>
      expect(
        (
          screen.getByRole("button", {
            name: "Créer le chantier",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false),
    );
    fireEvent.click(screen.getByRole("button", { name: "Créer le chantier" }));
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalled());
    expect(mocks.importPdf).toHaveBeenCalledTimes(1);
    expect(mocks.create).toHaveBeenCalledTimes(2);
  });

  it("reuses an existing unsigned quote, keeping its PDF and amount", async () => {
    mount([
      {
        id: "existing",
        quoteNumber: "DEV-TEST-1",
        clientId: "client",
        totalHt: 1200,
        status: "SENT",
        chantierId: null,
      } as QuoteRecord,
    ]);
    await selectPdf();
    expect(
      (screen.getByLabelText("Montant du devis HT") as HTMLInputElement).value,
    ).toBe("1200");
    fireEvent.click(screen.getByRole("button", { name: "Créer le chantier" }));
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalled());
    expect(mocks.importPdf).not.toHaveBeenCalled();
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ quoteId: "existing" }),
    );
  });

  it("prevents a duplicate chantier for an already attached quote", async () => {
    mount([
      {
        id: "existing",
        quoteNumber: "DEV-TEST-1",
        clientId: "client",
        totalHt: 1200,
        status: "SENT",
        chantierId: "already-created",
      } as QuoteRecord,
    ]);
    await selectPdf();
    expect(
      (
        screen.getByRole("button", {
          name: "Créer le chantier",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      screen
        .getByRole("link", { name: "Voir le chantier" })
        .getAttribute("href"),
    ).toBe("/chantiers/already-created");
    expect(mocks.importPdf).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("allows review when automatic extraction fails", async () => {
    mocks.parse.mockRejectedValueOnce(new Error("Unreadable PDF text"));
    mount();
    await selectPdf();
    expect(screen.getByRole("status").textContent).toContain(
      "n’ont pas pu être lues automatiquement",
    );
    expect(
      (screen.getByLabelText("Numéro du devis *") as HTMLInputElement).value,
    ).toBe("");
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
