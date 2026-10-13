import { supabase } from "@/features/auth/api/supabase-client";
import type { SubcontractorRecord } from "@/features/sous-traitants/api/subcontractors-api";

export const chantierStatuses = [
  "PENDING",
  "IN_PROGRESS",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type ChantierStatus = (typeof chantierStatuses)[number];

export const chantierProcurementKinds = ["PURCHASE", "ORDER"] as const;

export const orderStatuses = [
  "TO_ORDER",
  "ORDERED",
  "READY",
  "RECEIVED",
  "CANCELLED",
] as const;

export const paymentStatuses = ["UNPAID", "PARTIAL", "PAID"] as const;

export const depositStatuses = ["TO_CALL", "CALLED", "COLLECTED"] as const;

export const adjustmentKinds = ["PLUS", "MINUS"] as const;

export const adjustmentStatuses = ["PROPOSED", "ACCEPTED", "REFUSED"] as const;

export const chantierDocumentCategories = [
  "QUOTE",
  "PURCHASE_ORDER",
  "INVOICE",
  "PLAN",
  "PHOTO",
  "SUBCONTRACTOR_DOCUMENT",
  "ADMINISTRATIVE",
  "OTHER",
] as const;

export type ChantierProcurementKind = (typeof chantierProcurementKinds)[number];
export type OrderStatus = (typeof orderStatuses)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];
export type DepositStatus = (typeof depositStatuses)[number];
export type AdjustmentKind = (typeof adjustmentKinds)[number];
export type AdjustmentStatus = (typeof adjustmentStatuses)[number];
export type ChantierDocumentCategory =
  (typeof chantierDocumentCategories)[number];

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
  subcontractorIds: string[];
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
  subcontractors: SubcontractorRecord[];
};

export type ChantierInitialQuote = {
  documentName: string;
  documentPath: string;
  id: string;
  quoteNumber: string;
  title: string;
};

export type ChantierDetail = {
  adjustments: ChantierAdjustment[];
  chantier: ChantierRecord;
  deposits: ChantierDeposit[];
  documents: ChantierDocument[];
  initialQuote: ChantierInitialQuote | null;
  procurements: ChantierProcurement[];
  subcontractorCommitments: ChantierSubcontractorCommitment[];
  subcontractors: SubcontractorRecord[];
  availableSubcontractors: SubcontractorRecord[];
};

export type ChantierDeposit = {
  amount: number;
  callDueDate: string | null;
  createdAt: string;
  id: string;
  label: string;
  reminderDate: string | null;
  status: DepositStatus;
  updatedAt: string;
};

export type ChantierDepositInput = Omit<
  ChantierDeposit,
  "createdAt" | "id" | "updatedAt"
>;

export type ChantierAdjustment = {
  amount: number;
  createdAt: string;
  description: string;
  id: string;
  kind: AdjustmentKind;
  label: string;
  occurredOn: string | null;
  status: AdjustmentStatus;
  updatedAt: string;
};

export type ChantierAdjustmentInput = Omit<
  ChantierAdjustment,
  "createdAt" | "id" | "updatedAt"
>;

export type ChantierDocument = {
  category: ChantierDocumentCategory;
  createdAt: string;
  fileName: string | null;
  filePath: string | null;
  fileSize: number | null;
  id: string;
  mimeType: string | null;
  name: string;
  updatedAt: string;
};

export type ChantierDocumentInput = Pick<ChantierDocument, "category" | "name">;

export type ChantierSubcontractorCommitment = {
  actualAmount: number | null;
  comment: string;
  dueDate: string | null;
  forecastAmount: number | null;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  serviceDescription: string;
  subcontractor: SubcontractorRecord;
};

export type ChantierSubcontractorCommitmentInput = Omit<
  ChantierSubcontractorCommitment,
  "subcontractor"
> & {
  subcontractorId: string;
};

export type ChantierProcurement = {
  addToShoppingList: boolean;
  chantierId: string;
  createdAt: string;
  description: string;
  forecastAmount: number | null;
  id: string;
  kind: ChantierProcurementKind;
  orderStatus: OrderStatus | null;
  orderedAt: string | null;
  paymentStatus: PaymentStatus | null;
  plannedDeliveryDate: string | null;
  purchasedAt?: string | null;
  quantity: number | null;
  quantityLabel?: string;
  supplier: string;
  title: string;
  updatedAt: string;
};

export type CreateChantierProcurementInput = Omit<
  ChantierProcurement,
  "chantierId" | "createdAt" | "id" | "updatedAt" | "purchasedAt"
>;

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

type SubcontractorRow = {
  address: string;
  city: string;
  contact_name: string;
  created_at: string;
  email: string;
  id: string;
  is_archived: boolean;
  name: string;
  notes: string;
  phone: string;
  postal_code: string;
  updated_at: string;
};

type ChantierSubcontractorRow = {
  actual_amount?: number | string | null;
  comment?: string;
  due_date?: string | null;
  forecast_amount?: number | string | null;
  paid_amount?: number | string;
  payment_status?: PaymentStatus;
  service_description?: string;
  chantier_id: string;
  subcontractor_id: string;
};

type InitialQuoteRow = {
  document_name: string;
  document_path: string;
  id: string;
  quote_number: string;
  title: string;
};

type ChantierProcurementRow = {
  add_to_shopping_list: boolean;
  chantier_id: string;
  created_at: string;
  description: string;
  forecast_amount: number | string | null;
  id: string;
  kind: ChantierProcurementKind;
  order_status: OrderStatus | null;
  ordered_at: string | null;
  payment_status: PaymentStatus | null;
  planned_delivery_date: string | null;
  purchased_at?: string | null;
  quantity: number | string | null;
  quantity_label?: string;
  supplier: string;
  title: string;
  updated_at: string;
};

type ChantierDepositRow = {
  amount: number | string;
  call_due_date: string | null;
  created_at: string;
  id: string;
  label: string;
  reminder_date: string | null;
  status: DepositStatus;
  updated_at: string;
};

type ChantierAdjustmentRow = {
  amount: number | string;
  created_at: string;
  description: string;
  id: string;
  kind: AdjustmentKind;
  label: string;
  occurred_on: string | null;
  status: AdjustmentStatus;
  updated_at: string;
};

type ChantierDocumentRow = {
  category: ChantierDocumentCategory;
  created_at: string;
  file_name: string | null;
  file_path: string | null;
  file_size: number | string | null;
  id: string;
  mime_type: string | null;
  name: string;
  updated_at: string;
};

const chantierDocumentsBucket = "chantier-documents";

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

function getSafeFileName(name: string) {
  const normalized = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/[^a-zA-Z0-9._-]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 180);

  return normalized || "fichier";
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

function toSubcontractor(row: SubcontractorRow): SubcontractorRecord {
  return {
    address: row.address,
    city: row.city,
    contactName: row.contact_name,
    createdAt: row.created_at,
    email: row.email,
    id: row.id,
    isArchived: row.is_archived,
    name: row.name,
    notes: row.notes,
    phone: row.phone,
    postalCode: row.postal_code,
    updatedAt: row.updated_at,
  };
}

function toProcurement(row: ChantierProcurementRow): ChantierProcurement {
  return {
    addToShoppingList: row.add_to_shopping_list,
    chantierId: row.chantier_id,
    createdAt: row.created_at,
    description: row.description,
    forecastAmount: toNumber(row.forecast_amount),
    id: row.id,
    kind: row.kind,
    orderStatus: row.order_status,
    orderedAt: row.ordered_at,
    paymentStatus: row.payment_status,
    plannedDeliveryDate: row.planned_delivery_date,
    purchasedAt: row.purchased_at ?? null,
    quantity: toNumber(row.quantity),
    quantityLabel: row.quantity_label ?? "",
    supplier: row.supplier,
    title: row.title,
    updatedAt: row.updated_at,
  };
}

function toDeposit(row: ChantierDepositRow): ChantierDeposit {
  return {
    amount: Number(row.amount),
    callDueDate: row.call_due_date,
    createdAt: row.created_at,
    id: row.id,
    label: row.label,
    reminderDate: row.reminder_date,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

function toAdjustment(row: ChantierAdjustmentRow): ChantierAdjustment {
  return {
    amount: Number(row.amount),
    createdAt: row.created_at,
    description: row.description,
    id: row.id,
    kind: row.kind,
    label: row.label,
    occurredOn: row.occurred_on,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

function toChantierDocument(row: ChantierDocumentRow): ChantierDocument {
  return {
    category: row.category,
    createdAt: row.created_at,
    fileName: row.file_name,
    filePath: row.file_path,
    fileSize: toNumber(row.file_size),
    id: row.id,
    mimeType: row.mime_type,
    name: row.name,
    updatedAt: row.updated_at,
  };
}

function toChantier(
  row: ChantierRow,
  clientNames: Map<string, string>,
  subcontractorIdsByChantier: Map<string, string[]>,
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
    subcontractorIds: subcontractorIdsByChantier.get(row.id) ?? [],
    updatedAt: row.updated_at,
  };
}

export async function getChantierSnapshot(): Promise<ChantierSnapshot> {
  const client = getClient();
  const [
    chantiersResult,
    clientsResult,
    quotesResult,
    subcontractorsResult,
    assignmentsResult,
  ] = await Promise.all([
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
    client
      .from("subcontractors")
      .select(
        "id, name, contact_name, email, phone, address, postal_code, city, notes, is_archived, created_at, updated_at",
      )
      .order("name", { ascending: true }),
    client
      .from("chantier_subcontractors")
      .select("chantier_id, subcontractor_id"),
  ]);

  throwIfError(chantiersResult.error);
  throwIfError(clientsResult.error);
  throwIfError(quotesResult.error);
  throwIfError(subcontractorsResult.error);
  throwIfError(assignmentsResult.error);

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
  const subcontractorIdsByChantier = new Map<string, string[]>();
  for (const assignment of (assignmentsResult.data ??
    []) as ChantierSubcontractorRow[]) {
    const selectedIds =
      subcontractorIdsByChantier.get(assignment.chantier_id) ?? [];
    selectedIds.push(assignment.subcontractor_id);
    subcontractorIdsByChantier.set(assignment.chantier_id, selectedIds);
  }

  return {
    chantiers: ((chantiersResult.data ?? []) as ChantierRow[]).map((row) =>
      toChantier(row, clientNames, subcontractorIdsByChantier),
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
    subcontractors: (
      (subcontractorsResult.data ?? []) as SubcontractorRow[]
    ).map(toSubcontractor),
  };
}

export async function getChantierDetail(
  chantierId: string,
): Promise<ChantierDetail | null> {
  const client = getClient();
  const chantierResult = await client
    .from("chantiers")
    .select(
      "id, client_id, name, address, status, planned_start_date, planned_end_date, actual_end_date, initial_signed_quote_amount, initial_quote_id, notes, created_at, updated_at",
    )
    .eq("id", chantierId)
    .maybeSingle();

  throwIfError(chantierResult.error);

  const chantierRow = chantierResult.data as ChantierRow | null;
  if (!chantierRow) {
    return null;
  }

  const [
    clientResult,
    assignmentsResult,
    quoteResult,
    procurementsResult,
    depositsResult,
    adjustmentsResult,
    documentsResult,
    allSubcontractorsResult,
  ] = await Promise.all([
    client
      .from("clients")
      .select(
        "id, kind, first_name, last_name, company_name, primary_contact, address, postal_code, city, is_archived",
      )
      .eq("id", chantierRow.client_id)
      .maybeSingle(),
    client
      .from("chantier_subcontractors")
      .select(
        "chantier_id, subcontractor_id, service_description, forecast_amount, actual_amount, paid_amount, payment_status, due_date, comment",
      )
      .eq("chantier_id", chantierId),
    chantierRow.initial_quote_id
      ? client
          .from("quotes")
          .select("id, quote_number, title, document_name, document_path")
          .eq("id", chantierRow.initial_quote_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    client
      .from("chantier_procurements")
      .select(
        "id, chantier_id, kind, title, quantity, quantity_label, forecast_amount, supplier, order_status, payment_status, ordered_at, planned_delivery_date, purchased_at, description, add_to_shopping_list, created_at, updated_at",
      )
      .eq("chantier_id", chantierId)
      .order("created_at", { ascending: false }),
    client
      .from("chantier_deposits")
      .select(
        "id, label, amount, status, call_due_date, reminder_date, created_at, updated_at",
      )
      .eq("chantier_id", chantierId)
      .order("call_due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    client
      .from("chantier_adjustments")
      .select(
        "id, label, kind, amount, status, occurred_on, description, created_at, updated_at",
      )
      .eq("chantier_id", chantierId)
      .order("occurred_on", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
    client
      .from("chantier_documents")
      .select(
        "id, name, category, file_name, file_path, mime_type, file_size, created_at, updated_at",
      )
      .eq("chantier_id", chantierId)
      .order("created_at", { ascending: false }),
    client
      .from("subcontractors")
      .select(
        "id, name, contact_name, email, phone, address, postal_code, city, notes, is_archived, created_at, updated_at",
      )
      .order("name", { ascending: true }),
  ]);

  throwIfError(clientResult.error);
  throwIfError(assignmentsResult.error);
  throwIfError(quoteResult.error);
  throwIfError(procurementsResult.error);
  throwIfError(depositsResult.error);
  throwIfError(adjustmentsResult.error);
  throwIfError(documentsResult.error);
  throwIfError(allSubcontractorsResult.error);

  const clientRow = clientResult.data as ClientRow | null;
  const clientNames = new Map<string, string>();
  if (clientRow) {
    clientNames.set(clientRow.id, getClientName(clientRow));
  }

  const assignments = (assignmentsResult.data ??
    []) as ChantierSubcontractorRow[];
  const subcontractorIds = assignments.map(
    (assignment) => assignment.subcontractor_id,
  );
  const subcontractorIdsByChantier = new Map<string, string[]>([
    [chantierId, subcontractorIds],
  ]);

  const initialQuote = quoteResult.data as InitialQuoteRow | null;
  const availableSubcontractors = (
    (allSubcontractorsResult.data ?? []) as SubcontractorRow[]
  ).map(toSubcontractor);
  const subcontractorsById = new Map(
    availableSubcontractors.map((subcontractor) => [
      subcontractor.id,
      subcontractor,
    ]),
  );
  const subcontractorCommitments = assignments.flatMap((assignment) => {
    const subcontractor = subcontractorsById.get(assignment.subcontractor_id);
    if (!subcontractor) {
      return [];
    }

    return [
      {
        actualAmount: toNumber(assignment.actual_amount ?? null),
        comment: assignment.comment ?? "",
        dueDate: assignment.due_date ?? null,
        forecastAmount: toNumber(assignment.forecast_amount ?? null),
        paidAmount: Number(assignment.paid_amount ?? 0),
        paymentStatus: assignment.payment_status ?? "UNPAID",
        serviceDescription: assignment.service_description ?? "",
        subcontractor,
      },
    ];
  });

  return {
    adjustments: (
      (adjustmentsResult.data ?? []) as ChantierAdjustmentRow[]
    ).map(toAdjustment),
    chantier: toChantier(chantierRow, clientNames, subcontractorIdsByChantier),
    deposits: ((depositsResult.data ?? []) as ChantierDepositRow[]).map(
      toDeposit,
    ),
    documents: ((documentsResult.data ?? []) as ChantierDocumentRow[]).map(
      toChantierDocument,
    ),
    initialQuote: initialQuote
      ? {
          documentName: initialQuote.document_name,
          documentPath: initialQuote.document_path,
          id: initialQuote.id,
          quoteNumber: initialQuote.quote_number,
          title: initialQuote.title,
        }
      : null,
    procurements: (
      (procurementsResult.data ?? []) as ChantierProcurementRow[]
    ).map(toProcurement),
    subcontractorCommitments,
    subcontractors: subcontractorCommitments.map(
      (commitment) => commitment.subcontractor,
    ),
    availableSubcontractors,
  };
}

export async function createChantierProcurement({
  chantierId,
  input,
  userId,
}: {
  chantierId: string;
  input: CreateChantierProcurementInput;
  userId: string;
}) {
  const result = await getClient()
    .from("chantier_procurements")
    .insert({
      add_to_shopping_list: input.addToShoppingList,
      chantier_id: chantierId,
      description: input.description.trim(),
      forecast_amount: input.forecastAmount,
      kind: input.kind,
      order_status: input.orderStatus,
      ordered_at: input.orderedAt,
      payment_status: input.paymentStatus,
      planned_delivery_date: input.plannedDeliveryDate,
      quantity: input.quantity,
      quantity_label: input.quantityLabel?.trim() ?? "",
      supplier: input.supplier.trim(),
      title: input.title.trim(),
      user_id: userId,
    });

  throwIfError(result.error);
}

export async function saveChantierDeposit({
  chantierId,
  id,
  input,
  userId,
}: {
  chantierId: string;
  id?: string;
  input: ChantierDepositInput;
  userId: string;
}) {
  const payload = {
    amount: input.amount,
    call_due_date: input.callDueDate,
    label: input.label.trim(),
    reminder_date: input.reminderDate,
    status: input.status,
  };
  const result = id
    ? await getClient().from("chantier_deposits").update(payload).eq("id", id)
    : await getClient()
        .from("chantier_deposits")
        .insert({
          ...payload,
          chantier_id: chantierId,
          user_id: userId,
        });

  throwIfError(result.error);
}

export async function deleteChantierDeposit(id: string) {
  const result = await getClient()
    .from("chantier_deposits")
    .delete()
    .eq("id", id);

  throwIfError(result.error);
}

export async function saveChantierAdjustment({
  chantierId,
  id,
  input,
  userId,
}: {
  chantierId: string;
  id?: string;
  input: ChantierAdjustmentInput;
  userId: string;
}) {
  const payload = {
    amount: input.amount,
    description: input.description.trim(),
    kind: input.kind,
    label: input.label.trim(),
    occurred_on: input.occurredOn,
    status: input.status,
  };
  const result = id
    ? await getClient()
        .from("chantier_adjustments")
        .update(payload)
        .eq("id", id)
    : await getClient()
        .from("chantier_adjustments")
        .insert({
          ...payload,
          chantier_id: chantierId,
          user_id: userId,
        });

  throwIfError(result.error);
}

export async function deleteChantierAdjustment(id: string) {
  const result = await getClient()
    .from("chantier_adjustments")
    .delete()
    .eq("id", id);

  throwIfError(result.error);
}

export async function saveChantierDocument({
  chantierId,
  file,
  input,
  userId,
}: {
  chantierId: string;
  file: File;
  input: ChantierDocumentInput;
  userId: string;
}) {
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("Le fichier ne doit pas dépasser 20 Mo.");
  }

  const client = getClient();
  const safeFileName = getSafeFileName(file.name);
  const fileName = file.name.trim().slice(0, 240) || "fichier";
  const filePath = `${userId}/${chantierId}/${crypto.randomUUID()}-${safeFileName}`;
  const mimeType = file.type || "application/octet-stream";
  const uploadResult = await client.storage
    .from(chantierDocumentsBucket)
    .upload(filePath, file, {
      cacheControl: "3600",
      contentType: mimeType,
      upsert: false,
    });

  throwIfError(uploadResult.error);

  const result = await client.from("chantier_documents").insert({
    category: input.category,
    chantier_id: chantierId,
    file_name: fileName,
    file_path: filePath,
    file_size: file.size,
    mime_type: mimeType,
    name: input.name.trim(),
    user_id: userId,
  });

  if (result.error) {
    await client.storage.from(chantierDocumentsBucket).remove([filePath]);
  }

  throwIfError(result.error);
}

export async function getChantierDocumentUrl(path: string) {
  const result = await getClient()
    .storage.from(chantierDocumentsBucket)
    .createSignedUrl(path, 5 * 60);

  throwIfError(result.error);

  if (!result.data?.signedUrl) {
    throw new Error("Le fichier n'est pas disponible.");
  }

  return result.data.signedUrl;
}

export async function deleteChantierDocument(id: string) {
  const result = await getClient()
    .from("chantier_documents")
    .delete()
    .eq("id", id);

  throwIfError(result.error);
}

export async function saveChantierSubcontractorCommitment({
  chantierId,
  input,
  userId,
}: {
  chantierId: string;
  input: ChantierSubcontractorCommitmentInput;
  userId: string;
}) {
  const result = await getClient().from("chantier_subcontractors").upsert(
    {
      actual_amount: input.actualAmount,
      chantier_id: chantierId,
      comment: input.comment.trim(),
      due_date: input.dueDate,
      forecast_amount: input.forecastAmount,
      paid_amount: input.paidAmount,
      payment_status: input.paymentStatus,
      service_description: input.serviceDescription.trim(),
      subcontractor_id: input.subcontractorId,
      user_id: userId,
    },
    { onConflict: "chantier_id,subcontractor_id" },
  );

  throwIfError(result.error);
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
  const client = getClient();
  const result = id
    ? await client
        .from("chantiers")
        .update(toPayload(input))
        .eq("id", id)
        .select("id")
        .single()
    : await client
        .from("chantiers")
        .insert({ ...toPayload(input), user_id: userId })
        .select("id")
        .single();

  throwIfError(result.error);

  const chantierId = result.data?.id;
  if (!chantierId) {
    throw new Error("Le chantier n'a pas pu être enregistré.");
  }

  const assignmentResult = await client.rpc("replace_chantier_subcontractors", {
    selected_subcontractor_ids: input.subcontractorIds,
    target_chantier_id: chantierId,
  });

  throwIfError(assignmentResult.error);
  return chantierId;
}

export async function createChantierFromQuote(quoteId: string) {
  const result = await getClient().rpc("create_chantier_from_quote", {
    target_quote_id: quoteId,
  });

  throwIfError(result.error);
  return result.data as string;
}

export async function createChantierFromQuoteWithDetails({
  quoteId,
  input,
}: {
  quoteId: string;
  input: ChantierInput;
}) {
  const result = await getClient().rpc(
    "create_chantier_from_quote_with_details",
    {
      target_quote_id: quoteId,
      target_client_id: input.clientId,
      chantier_name: input.name.trim(),
      chantier_address: input.address.trim(),
      chantier_status: input.status,
      chantier_start_date: input.plannedStartDate,
      chantier_end_date: input.plannedEndDate,
      chantier_notes: input.notes.trim(),
      selected_subcontractor_ids: input.subcontractorIds,
    },
  );

  throwIfError(result.error);
  if (!result.data) {
    throw new Error("Le chantier n'a pas pu être créé.");
  }
  return result.data as string;
}
