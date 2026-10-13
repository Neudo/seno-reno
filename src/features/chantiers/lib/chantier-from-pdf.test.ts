import { describe, expect, it } from "vitest";

import {
  emptyChantierPdfDraft,
  findExistingQuote,
  toChantierInput,
  toImportedQuoteInput,
  validateQuotePdf,
  type ChantierPdfDraft,
} from "@/features/chantiers/lib/chantier-from-pdf";
import type { QuoteRecord } from "@/features/devis/api/quotes-api";

const draft: ChantierPdfDraft = {
  ...emptyChantierPdfDraft,
  clientId: "client-1",
  name: "Rénovation",
  quoteNumber: "DEV-2026-0001",
  totalHtText: "32 000,00",
};

describe("chantier PDF creation", () => {
  it("accepts unsigned quotes without inventing a signature", () => {
    const input = toImportedQuoteInput({
      draft,
      summary: null,
      clientName: "Client",
    });
    expect(input.status).toBe("TO_SEND");
    expect(input.totalHt).toBe(32000);
    expect(input.clientId).toBe("client-1");
    expect(input.quoteDate).toBeNull();
    expect(input.totalTtc).toBeNull();
  });

  it("keeps the date and TTC actually extracted from the PDF", () => {
    const input = toImportedQuoteInput({
      draft,
      clientName: "Client",
      summary: {
        clientName: "Client",
        fileName: "devis.pdf",
        projectAddress: "",
        projectTitle: "Rénovation",
        quoteDate: "05/10/2026",
        quoteNumber: draft.quoteNumber,
        totalHt: 32000,
        totalTtc: 35200,
      },
    });
    expect(input.quoteDate).toBe("2026-10-05");
    expect(input.totalTtc).toBe(35200);
  });

  it("does not set an actual end date at creation", () => {
    expect(toChantierInput(draft).actualEndDate).toBeNull();
  });

  it.each([
    [{ clientId: "" }, "Sélectionnez le client"],
    [{ name: "  " }, "nom du chantier"],
    [{ quoteNumber: "  " }, "numéro du devis"],
    [{ totalHtText: "-1" }, "positif ou nul"],
    [{ totalHtText: "abc" }, "positif ou nul"],
    [
      { plannedStartDate: "2026-10-10", plannedEndDate: "2026-10-01" },
      "fin prévue",
    ],
  ])("validates the review before any import: %s", (patch, message) => {
    expect(() => toChantierInput({ ...draft, ...patch })).toThrow(message);
  });

  it("preserves an unknown amount instead of inventing a zero", () => {
    expect(
      toChantierInput({ ...draft, totalHtText: "" }).initialSignedQuoteAmount,
    ).toBeNull();
  });

  it("recognizes an existing quote number regardless of case", () => {
    const quote = {
      id: "existing",
      quoteNumber: draft.quoteNumber,
      status: "SENT",
    } as QuoteRecord;
    expect(findExistingQuote([quote], " dev-2026-0001 ")).toBe(quote);
    expect(findExistingQuote([quote], "")).toBeUndefined();
    expect(quote.status).toBe("SENT");
  });

  it("checks the PDF header and rejects a renamed text file", async () => {
    await expect(
      validateQuotePdf(
        new File(["%PDF-1.7\n"], "devis.pdf", { type: "application/pdf" }),
      ),
    ).resolves.toBeUndefined();
    await expect(
      validateQuotePdf(
        new File(["text"], "devis.pdf", { type: "application/pdf" }),
      ),
    ).rejects.toThrow("PDF valide");
    await expect(
      validateQuotePdf(
        new File(["%PDF-1.7"], "devis.txt", { type: "text/plain" }),
      ),
    ).rejects.toThrow("fichier PDF");
  });

  it("rejects a PDF exceeding the storage limit", async () => {
    const file = {
      name: "devis.pdf",
      type: "application/pdf",
      size: 20 * 1024 * 1024 + 1,
    } as File;
    await expect(validateQuotePdf(file)).rejects.toThrow("20 Mo");
  });
});
