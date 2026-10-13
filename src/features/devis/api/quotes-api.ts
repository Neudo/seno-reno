import { supabase } from "@/features/auth/api/supabase-client";

export const quoteStatuses = [
  "TO_SEND",
  "SENT",
  "TO_FOLLOW_UP",
  "IN_DISCUSSION",
  "SIGNED",
  "REFUSED",
] as const;

export type QuoteStatus = (typeof quoteStatuses)[number];

export type QuoteRecord = {
  chantierId: string | null;
  clientId: string | null;
  clientName: string;
  comment: string;
  createdAt: string;
  documentName: string;
  documentPath: string;
  id: string;
  lastActionAt: string | null;
  lastActionNote: string;
  nextFollowUpAt: string | null;
  projectAddress: string;
  quoteDate: string | null;
  quoteNumber: string;
  status: QuoteStatus;
  title: string;
  totalHt: number | null;
  totalTtc: number | null;
  updatedAt: string;
};

export type QuoteClient = {
  id: string;
  name: string;
};

export type QuoteSnapshot = {
  clients: QuoteClient[];
  quotes: QuoteRecord[];
};

export type QuoteInput = Omit<
  QuoteRecord,
  | "chantierId"
  | "createdAt"
  | "documentName"
  | "documentPath"
  | "id"
  | "updatedAt"
>;

type ClientRow = {
  company_name: string;
  first_name: string;
  id: string;
  kind: "COMPANY" | "PERSON";
  last_name: string;
  primary_contact: string;
};

type QuoteRow = {
  chantier_id: string | null;
  client_id: string | null;
  client_name: string;
  comment: string;
  created_at: string;
  document_name: string;
  document_path: string;
  id: string;
  last_action_at: string | null;
  last_action_note: string;
  next_follow_up_at: string | null;
  project_address: string;
  quote_date: string | null;
  quote_number: string;
  status: QuoteStatus;
  title: string;
  total_ht: number | string | null;
  total_ttc: number | string | null;
  updated_at: string;
};

const quoteDocumentsBucket = "quote-documents";

function getClient() {
  if (!supabase) {
    throw new Error("Supabase n'est pas configuré.");
  }

  return supabase;
}

function throwIfError(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }
}

function clientName(client: ClientRow) {
  if (client.kind === "COMPANY") {
    return client.company_name || client.primary_contact;
  }

  return `${client.first_name} ${client.last_name}`.trim();
}

function toNumber(value: number | string | null) {
  return value === null ? null : Number(value);
}

function toQuote(row: QuoteRow): QuoteRecord {
  return {
    chantierId: row.chantier_id,
    clientId: row.client_id,
    clientName: row.client_name,
    comment: row.comment,
    createdAt: row.created_at,
    documentName: row.document_name,
    documentPath: row.document_path,
    id: row.id,
    lastActionAt: row.last_action_at,
    lastActionNote: row.last_action_note,
    nextFollowUpAt: row.next_follow_up_at,
    projectAddress: row.project_address,
    quoteDate: row.quote_date,
    quoteNumber: row.quote_number,
    status: row.status,
    title: row.title,
    totalHt: toNumber(row.total_ht),
    totalTtc: toNumber(row.total_ttc),
    updatedAt: row.updated_at,
  };
}

function toQuotePayload(input: QuoteInput) {
  return {
    client_id: input.clientId,
    client_name: input.clientName.trim(),
    comment: input.comment.trim(),
    last_action_at: input.lastActionAt,
    last_action_note: input.lastActionNote.trim(),
    next_follow_up_at: input.nextFollowUpAt,
    project_address: input.projectAddress.trim(),
    quote_date: input.quoteDate,
    quote_number: input.quoteNumber.trim(),
    status: input.status,
    title: input.title.trim(),
    total_ht: input.totalHt,
    total_ttc: input.totalTtc,
  };
}

function getSafeFileName(name: string) {
  const normalized = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/[^a-zA-Z0-9._-]+/gu, "-")
    .replace(/^-+|-+$/gu, "");

  return normalized || "devis.pdf";
}

export async function getQuoteSnapshot(): Promise<QuoteSnapshot> {
  const client = getClient();
  const [quotesResult, clientsResult] = await Promise.all([
    client
      .from("quotes")
      .select(
        "id, client_id, chantier_id, client_name, quote_number, title, project_address, quote_date, total_ht, total_ttc, document_name, document_path, status, last_action_note, last_action_at, next_follow_up_at, comment, created_at, updated_at",
      )
      .order("updated_at", { ascending: false }),
    client
      .from("clients")
      .select("id, kind, first_name, last_name, company_name, primary_contact")
      .eq("is_archived", false)
      .order("last_name", { ascending: true })
      .order("company_name", { ascending: true }),
  ]);

  throwIfError(quotesResult.error);
  throwIfError(clientsResult.error);

  return {
    clients: ((clientsResult.data ?? []) as ClientRow[])
      .map((clientRow) => ({ id: clientRow.id, name: clientName(clientRow) }))
      .filter((clientRow) => Boolean(clientRow.name))
      .sort((left, right) => left.name.localeCompare(right.name, "fr-FR")),
    quotes: ((quotesResult.data ?? []) as QuoteRow[]).map(toQuote),
  };
}

export async function importQuotePdf({
  file,
  input,
  userId,
}: {
  file: File;
  input: QuoteInput;
  userId: string;
}) {
  const client = getClient();
  const quoteId = crypto.randomUUID();
  const path = `${userId}/${quoteId}/${getSafeFileName(file.name)}`;
  const uploadResult = await client.storage
    .from(quoteDocumentsBucket)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: "application/pdf",
      upsert: false,
    });

  throwIfError(uploadResult.error);

  const insertResult = await client.from("quotes").insert({
    ...toQuotePayload(input),
    document_name: file.name,
    document_path: path,
    id: quoteId,
    user_id: userId,
  });

  if (insertResult.error) {
    await client.storage.from(quoteDocumentsBucket).remove([path]);
    throwIfError(insertResult.error);
  }

  return quoteId;
}

export async function updateQuote({
  id,
  input,
}: {
  id: string;
  input: QuoteInput;
}) {
  const result = await getClient()
    .from("quotes")
    .update(toQuotePayload(input))
    .eq("id", id);

  throwIfError(result.error);
}

export async function getQuoteDocumentUrl(path: string) {
  const result = await getClient()
    .storage.from(quoteDocumentsBucket)
    .createSignedUrl(path, 5 * 60);

  throwIfError(result.error);

  if (!result.data?.signedUrl) {
    throw new Error("Le document n'est pas disponible.");
  }

  return result.data.signedUrl;
}
