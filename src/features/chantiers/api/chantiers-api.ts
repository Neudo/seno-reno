import { supabase } from "@/features/auth/api/supabase-client";

export const chantierStatuses = [
  "PENDING",
  "IN_PROGRESS",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type ChantierStatus = (typeof chantierStatuses)[number];

export type ChantierClient = {
  address: string;
  id: string;
  isArchived: boolean;
  name: string;
};

export type SignedQuoteCandidate = {
  chantierId: string | null;
  clientId: string | null;
  clientName: string;
  id: string;
  projectAddress: string;
  quoteNumber: string;
  title: string;
  totalHt: number | null;
};

export type ChantierRecord = {
  actualEndDate: string | null;
  address: string;
  clientId: string;
  clientName: string;
  createdAt: string;
  id: string;
  initialQuoteId: string | null;
  initialSignedQuoteAmount: number | null;
  name: string;
  notes: string;
  plannedEndDate: string | null;
  plannedStartDate: string | null;
  status: ChantierStatus;
  updatedAt: string;
};

export type ChantierInput = Omit<
  ChantierRecord,
  "clientName" | "createdAt" | "id" | "initialQuoteId" | "updatedAt"
>;

export type ChantierSnapshot = {
  chantiers: ChantierRecord[];
  clients: ChantierClient[];
  signedQuotes: SignedQuoteCandidate[];
};

type ChantierRow = {
  actual_end_date: string | null;
  address: string;
  client_id: string;
  created_at: string;
  id: string;
  initial_quote_id: string | null;
  initial_signed_quote_amount: number | string | null;
  name: string;
  notes: string;
  planned_end_date: string | null;
  planned_start_date: string | null;
  status: ChantierStatus;
  updated_at: string;
};

type ClientRow = {
  address: string;
  city: string;
  company_name: string;
  first_name: string;
  id: string;
  is_archived: boolean;
  kind: "COMPANY" | "PERSON";
  last_name: string;
  postal_code: string;
  primary_contact: string;
};

type QuoteRow = {
  chantier_id: string | null;
  client_id: string | null;
  client_name: string;
  id: string;
  project_address: string;
  quote_number: string;
  title: string;
  total_ht: number | string | null;
};

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

function toNumber(value: number | string | null) {
  return value === null ? null : Number(value);
}

function getClientName(client: ClientRow) {
  if (client.kind === "COMPANY") {
    return client.company_name || client.primary_contact;
  }

  return `${client.first_name} ${client.last_name}`.trim();
}

function getClientAddress(client: ClientRow) {
  return [client.address, client.postal_code, client.city]
    .filter(Boolean)
    .join(", ");
}

function toChantier(
  row: ChantierRow,
  clientNames: Map<string, string>,
): ChantierRecord {
  return {
    actualEndDate: row.actual_end_date,
    address: row.address,
    clientId: row.client_id,
    clientName: clientNames.get(row.client_id) ?? "Client introuvable",
    createdAt: row.created_at,
    id: row.id,
    initialQuoteId: row.initial_quote_id,
    initialSignedQuoteAmount: toNumber(row.initial_signed_quote_amount),
    name: row.name,
    notes: row.notes,
    plannedEndDate: row.planned_end_date,
    plannedStartDate: row.planned_start_date,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

export async function getChantierSnapshot(): Promise<ChantierSnapshot> {
  const client = getClient();
  const [chantiersResult, clientsResult, quotesResult] = await Promise.all([
    client
      .from("chantiers")
      .select(
        "id, client_id, name, address, status, planned_start_date, planned_end_date, actual_end_date, initial_signed_quote_amount, initial_quote_id, notes, created_at, updated_at",
      )
      .order("planned_start_date", { ascending: true, nullsFirst: false })
      .order("updated_at", { ascending: false }),
    client
      .from("clients")
      .select(
        "id, kind, first_name, last_name, company_name, primary_contact, address, postal_code, city, is_archived",
      )
      .order("last_name", { ascending: true })
      .order("company_name", { ascending: true }),
    client
      .from("quotes")
      .select(
        "id, client_id, client_name, quote_number, title, project_address, total_ht, chantier_id",
      )
      .eq("status", "SIGNED")
      .order("updated_at", { ascending: false }),
  ]);

  throwIfError(chantiersResult.error);
  throwIfError(clientsResult.error);
  throwIfError(quotesResult.error);

  const clients = ((clientsResult.data ?? []) as ClientRow[])
    .map((clientRow) => ({
      address: getClientAddress(clientRow),
      id: clientRow.id,
      isArchived: clientRow.is_archived,
      name: getClientName(clientRow),
    }))
    .filter((clientRow) => Boolean(clientRow.name))
    .sort((left, right) => left.name.localeCompare(right.name, "fr-FR"));
  const clientNames = new Map(
    clients.map((clientRow) => [clientRow.id, clientRow.name]),
  );

  return {
    chantiers: ((chantiersResult.data ?? []) as ChantierRow[]).map((row) =>
      toChantier(row, clientNames),
    ),
    clients,
    signedQuotes: ((quotesResult.data ?? []) as QuoteRow[]).map((row) => ({
      chantierId: row.chantier_id,
      clientId: row.client_id,
      clientName: row.client_name,
      id: row.id,
      projectAddress: row.project_address,
      quoteNumber: row.quote_number,
      title: row.title,
      totalHt: toNumber(row.total_ht),
    })),
  };
}

function toPayload(input: ChantierInput) {
  return {
    actual_end_date: input.actualEndDate,
    address: input.address.trim(),
    client_id: input.clientId,
    initial_signed_quote_amount: input.initialSignedQuoteAmount,
    name: input.name.trim(),
    notes: input.notes.trim(),
    planned_end_date: input.plannedEndDate,
    planned_start_date: input.plannedStartDate,
    status: input.status,
  };
}

export async function saveChantier({
  id,
  input,
  userId,
}: {
  id?: string;
  input: ChantierInput;
  userId: string;
}) {
  const result = id
    ? await getClient().from("chantiers").update(toPayload(input)).eq("id", id)
    : await getClient()
        .from("chantiers")
        .insert({ ...toPayload(input), user_id: userId });

  throwIfError(result.error);
}

export async function createChantierFromQuote(quoteId: string) {
  const result = await getClient().rpc("create_chantier_from_quote", {
    target_quote_id: quoteId,
  });

  throwIfError(result.error);
  return result.data as string;
}
