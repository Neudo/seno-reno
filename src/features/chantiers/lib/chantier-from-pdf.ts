import type {
  ChantierInput,
  ChantierStatus,
} from "@/features/chantiers/api/chantiers-api";
import type { QuoteInput, QuoteRecord } from "@/features/devis/api/quotes-api";
import type { ParsedTolteckQuoteSummary } from "@/features/outils/bdc/types";

export type ChantierPdfDraft = {
  address: string;
  clientId: string;
  name: string;
  notes: string;
  plannedEndDate: string | null;
  plannedStartDate: string | null;
  quoteNumber: string;
  status: ChantierStatus;
  subcontractorIds: string[];
  totalHtText: string;
};

export const emptyChantierPdfDraft: ChantierPdfDraft = {
  address: "",
  clientId: "",
  name: "",
  notes: "",
  plannedEndDate: null,
  plannedStartDate: null,
  quoteNumber: "",
  status: "PENDING",
  subcontractorIds: [],
  totalHtText: "",
};

export function findExistingQuote(quotes: QuoteRecord[], quoteNumber: string) {
  const normalized = quoteNumber.trim().toLowerCase();
  return normalized
    ? quotes.find((quote) => quote.quoteNumber.toLowerCase() === normalized)
    : undefined;
}

export async function validateQuotePdf(file: File) {
  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    throw new Error("Sélectionnez un fichier PDF.");
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("Le PDF ne doit pas dépasser 20 Mo.");
  }
  const header = new TextDecoder().decode(
    await file.slice(0, 1024).arrayBuffer(),
  );
  if (!header.includes("%PDF-")) {
    throw new Error("Ce fichier n'est pas un PDF valide.");
  }
}

export function toChantierInput(draft: ChantierPdfDraft): ChantierInput {
  const amountText = draft.totalHtText.trim();
  const amount = amountText
    ? Number(amountText.replace(/\s/gu, "").replace(",", "."))
    : null;
  if (!draft.quoteNumber.trim())
    throw new Error("Renseignez le numéro du devis.");
  if (!draft.clientId) throw new Error("Sélectionnez le client du chantier.");
  if (!draft.name.trim()) throw new Error("Renseignez le nom du chantier.");
  if (amount !== null && (!Number.isFinite(amount) || amount < 0)) {
    throw new Error("Le montant HT doit être positif ou nul.");
  }
  if (
    draft.plannedStartDate &&
    draft.plannedEndDate &&
    draft.plannedEndDate < draft.plannedStartDate
  ) {
    throw new Error("La fin prévue ne peut pas précéder le début prévu.");
  }
  return {
    actualEndDate: null,
    address: draft.address.trim(),
    clientId: draft.clientId,
    initialSignedQuoteAmount: amount,
    name: draft.name.trim(),
    notes: draft.notes.trim(),
    plannedEndDate: draft.plannedEndDate,
    plannedStartDate: draft.plannedStartDate,
    status: draft.status,
    subcontractorIds: draft.subcontractorIds,
  };
}

export function toImportedQuoteInput({
  draft,
  summary,
  clientName,
}: {
  draft: ChantierPdfDraft;
  summary: ParsedTolteckQuoteSummary | null;
  clientName: string;
}): QuoteInput {
  const input = toChantierInput(draft);
  const dateMatch = summary?.quoteDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/u);
  return {
    clientId: input.clientId,
    clientName,
    comment: "",
    lastActionAt: null,
    lastActionNote: "",
    nextFollowUpAt: null,
    projectAddress: input.address,
    quoteDate: dateMatch
      ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`
      : null,
    quoteNumber: draft.quoteNumber.trim(),
    status: "TO_SEND",
    title: input.name,
    totalHt: input.initialSignedQuoteAmount,
    totalTtc: summary?.totalTtc ?? null,
  };
}
