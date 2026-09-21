import { supabase } from "@/features/auth/api/supabase-client";

export const clientKinds = ["PERSON", "COMPANY"] as const;
export const prospectStatuses = [
  "NEW",
  "TO_CONTACT",
  "CONTACTED",
  "TO_FOLLOW_UP",
  "IN_DISCUSSION",
  "CLOSED",
  "CONVERTED",
] as const;
export const prospectPriorities = ["HIGH", "MEDIUM", "LOW"] as const;
export const interactionTypes = [
  "CALL",
  "EMAIL",
  "MEETING",
  "MESSAGE",
  "NOTE",
  "OTHER",
] as const;
export const sourceKinds = [
  "WEBSITE",
  "INSTAGRAM",
  "LINKEDIN",
  "RECOMMENDATION",
  "FORMER_CLIENT",
  "EVENT",
  "PROFESSIONAL_NETWORK",
  "OTHER",
] as const;
export const eventStatuses = [
  "PLANNED",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
] as const;
export const communicationStatuses = [
  "ACTIVE",
  "COMPLETED",
  "PAUSED",
  "PLANNED",
] as const;

export type ClientKind = (typeof clientKinds)[number];
export type ProspectStatus = (typeof prospectStatuses)[number];
export type ProspectPriority = (typeof prospectPriorities)[number];
export type InteractionType = (typeof interactionTypes)[number];
export type SourceKind = (typeof sourceKinds)[number];
export type EventStatus = (typeof eventStatuses)[number];
export type CommunicationStatus = (typeof communicationStatuses)[number];

export type ClientRecord = {
  address: string;
  city: string;
  companyName: string;
  createdAt: string;
  email: string;
  firstName: string;
  id: string;
  isArchived: boolean;
  kind: ClientKind;
  lastName: string;
  notes: string;
  onedriveUrl: string;
  phone: string;
  postalCode: string;
  primaryContact: string;
  sourceDetail: string;
  sourceKind: SourceKind;
  updatedAt: string;
};

export type ProspectRecord = {
  city: string;
  companyName: string;
  convertedClientId: string | null;
  createdAt: string;
  email: string;
  firstName: string;
  id: string;
  kind: ClientKind;
  lastInteractionAt: string | null;
  lastName: string;
  nextFollowUpAt: string | null;
  notes: string;
  originCommunicationId: string | null;
  originEventId: string | null;
  phone: string;
  postalCode: string;
  priority: ProspectPriority;
  sourceDetail: string;
  sourceKind: SourceKind;
  status: ProspectStatus;
  updatedAt: string;
};

export type ProspectingEvent = {
  comment: string;
  createdAt: string;
  eventDate: string | null;
  id: string;
  location: string;
  name: string;
  status: EventStatus;
  type: string;
  updatedAt: string;
};

export type ProspectingCommunication = {
  channel: string;
  comment: string;
  createdAt: string;
  id: string;
  name: string;
  periodLabel: string;
  status: CommunicationStatus;
  updatedAt: string;
};

export type ProspectIdea = {
  city: string;
  convertedClientId: string | null;
  createdAt: string;
  email: string;
  id: string;
  name: string;
  note: string;
  phone: string;
  updatedAt: string;
};

export type ProspectInteraction = {
  createdAt: string;
  id: string;
  nextFollowUpAt: string | null;
  note: string;
  occurredAt: string;
  prospectId: string;
  type: InteractionType;
};

export type ClientProspectingSnapshot = {
  clients: ClientRecord[];
  communications: ProspectingCommunication[];
  events: ProspectingEvent[];
  ideas: ProspectIdea[];
  interactions: ProspectInteraction[];
  prospects: ProspectRecord[];
};

export type ClientInput = Omit<ClientRecord, "createdAt" | "id" | "updatedAt">;
export type ProspectInput = Omit<
  ProspectRecord,
  "convertedClientId" | "createdAt" | "id" | "lastInteractionAt" | "updatedAt"
>;
export type EventInput = Omit<
  ProspectingEvent,
  "createdAt" | "id" | "updatedAt"
>;
export type CommunicationInput = Omit<
  ProspectingCommunication,
  "createdAt" | "id" | "updatedAt"
>;
export type IdeaInput = Omit<
  ProspectIdea,
  "convertedClientId" | "createdAt" | "id" | "updatedAt"
>;

type ClientRow = {
  address: string;
  city: string;
  company_name: string;
  created_at: string;
  email: string;
  first_name: string;
  id: string;
  is_archived: boolean;
  kind: ClientKind;
  last_name: string;
  notes: string;
  onedrive_url: string;
  phone: string;
  postal_code: string;
  primary_contact: string;
  source_detail: string;
  source_kind: SourceKind;
  updated_at: string;
};

type ProspectRow = {
  city: string;
  company_name: string;
  converted_client_id: string | null;
  created_at: string;
  email: string;
  first_name: string;
  id: string;
  kind: ClientKind;
  last_interaction_at: string | null;
  last_name: string;
  next_follow_up_at: string | null;
  notes: string;
  origin_communication_id: string | null;
  origin_event_id: string | null;
  phone: string;
  postal_code: string;
  priority: ProspectPriority;
  source_detail: string;
  source_kind: SourceKind;
  status: ProspectStatus;
  updated_at: string;
};

type EventRow = {
  comment: string;
  created_at: string;
  event_date: string | null;
  id: string;
  location: string;
  name: string;
  status: EventStatus;
  type: string;
  updated_at: string;
};

type CommunicationRow = {
  channel: string;
  comment: string;
  created_at: string;
  id: string;
  name: string;
  period_label: string;
  status: CommunicationStatus;
  updated_at: string;
};

type IdeaRow = {
  city: string;
  converted_client_id: string | null;
  created_at: string;
  email: string;
  id: string;
  name: string;
  note: string;
  phone: string;
  updated_at: string;
};

type InteractionRow = {
  created_at: string;
  id: string;
  next_follow_up_at: string | null;
  note: string;
  occurred_at: string;
  prospect_id: string;
  type: InteractionType;
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

function mapClient(row: ClientRow): ClientRecord {
  return {
    address: row.address,
    city: row.city,
    companyName: row.company_name,
    createdAt: row.created_at,
    email: row.email,
    firstName: row.first_name,
    id: row.id,
    isArchived: row.is_archived,
    kind: row.kind,
    lastName: row.last_name,
    notes: row.notes,
    onedriveUrl: row.onedrive_url,
    phone: row.phone,
    postalCode: row.postal_code,
    primaryContact: row.primary_contact,
    sourceDetail: row.source_detail,
    sourceKind: row.source_kind,
    updatedAt: row.updated_at,
  };
}

function mapProspect(row: ProspectRow): ProspectRecord {
  return {
    city: row.city,
    companyName: row.company_name,
    convertedClientId: row.converted_client_id,
    createdAt: row.created_at,
    email: row.email,
    firstName: row.first_name,
    id: row.id,
    kind: row.kind,
    lastInteractionAt: row.last_interaction_at,
    lastName: row.last_name,
    nextFollowUpAt: row.next_follow_up_at,
    notes: row.notes,
    originCommunicationId: row.origin_communication_id,
    originEventId: row.origin_event_id,
    phone: row.phone,
    postalCode: row.postal_code,
    priority: row.priority,
    sourceDetail: row.source_detail,
    sourceKind: row.source_kind,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

function mapEvent(row: EventRow): ProspectingEvent {
  return {
    comment: row.comment,
    createdAt: row.created_at,
    eventDate: row.event_date,
    id: row.id,
    location: row.location,
    name: row.name,
    status: row.status,
    type: row.type,
    updatedAt: row.updated_at,
  };
}

function mapCommunication(row: CommunicationRow): ProspectingCommunication {
  return {
    channel: row.channel,
    comment: row.comment,
    createdAt: row.created_at,
    id: row.id,
    name: row.name,
    periodLabel: row.period_label,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

function mapIdea(row: IdeaRow): ProspectIdea {
  return {
    city: row.city,
    convertedClientId: row.converted_client_id,
    createdAt: row.created_at,
    email: row.email,
    id: row.id,
    name: row.name,
    note: row.note,
    phone: row.phone,
    updatedAt: row.updated_at,
  };
}

function mapInteraction(row: InteractionRow): ProspectInteraction {
  return {
    createdAt: row.created_at,
    id: row.id,
    nextFollowUpAt: row.next_follow_up_at,
    note: row.note,
    occurredAt: row.occurred_at,
    prospectId: row.prospect_id,
    type: row.type,
  };
}

export async function getClientProspectingSnapshot(): Promise<ClientProspectingSnapshot> {
  const client = getClient();
  const [
    clientsResult,
    prospectsResult,
    eventsResult,
    communicationsResult,
    ideasResult,
    interactionsResult,
  ] = await Promise.all([
    client
      .from("clients")
      .select("*")
      .order("updated_at", { ascending: false }),
    client
      .from("prospects")
      .select("*")
      .order("updated_at", { ascending: false }),
    client
      .from("prospecting_events")
      .select("*")
      .order("event_date", { ascending: false, nullsFirst: false }),
    client
      .from("prospecting_communications")
      .select("*")
      .order("updated_at", { ascending: false }),
    client
      .from("prospect_ideas")
      .select("*")
      .order("created_at", { ascending: false }),
    client
      .from("prospect_interactions")
      .select("*")
      .order("occurred_at", { ascending: false }),
  ]);

  throwIfError(clientsResult.error);
  throwIfError(prospectsResult.error);
  throwIfError(eventsResult.error);
  throwIfError(communicationsResult.error);
  throwIfError(ideasResult.error);
  throwIfError(interactionsResult.error);

  return {
    clients: ((clientsResult.data ?? []) as ClientRow[]).map(mapClient),
    communications: (
      (communicationsResult.data ?? []) as CommunicationRow[]
    ).map(mapCommunication),
    events: ((eventsResult.data ?? []) as EventRow[]).map(mapEvent),
    ideas: ((ideasResult.data ?? []) as IdeaRow[]).map(mapIdea),
    interactions: ((interactionsResult.data ?? []) as InteractionRow[]).map(
      mapInteraction,
    ),
    prospects: ((prospectsResult.data ?? []) as ProspectRow[]).map(mapProspect),
  };
}

export async function saveClient(
  input: ClientInput,
  userId: string,
  id?: string,
) {
  const payload = {
    address: input.address.trim(),
    city: input.city.trim(),
    company_name: input.companyName.trim(),
    email: input.email.trim(),
    first_name: input.firstName.trim(),
    is_archived: input.isArchived,
    kind: input.kind,
    last_name: input.lastName.trim(),
    notes: input.notes.trim(),
    onedrive_url: input.onedriveUrl.trim(),
    phone: input.phone.trim(),
    postal_code: input.postalCode.trim(),
    primary_contact: input.primaryContact.trim(),
    source_detail: input.sourceDetail.trim(),
    source_kind: input.sourceKind,
  };
  const client = getClient();
  const result = id
    ? await client.from("clients").update(payload).eq("id", id)
    : await client.from("clients").insert({ ...payload, user_id: userId });

  throwIfError(result.error);
}

export async function saveProspect(
  input: ProspectInput,
  userId: string,
  id?: string,
) {
  const payload = {
    city: input.city.trim(),
    company_name: input.companyName.trim(),
    email: input.email.trim(),
    first_name: input.firstName.trim(),
    kind: input.kind,
    last_name: input.lastName.trim(),
    next_follow_up_at: input.nextFollowUpAt || null,
    notes: input.notes.trim(),
    origin_communication_id: input.originCommunicationId,
    origin_event_id: input.originEventId,
    phone: input.phone.trim(),
    postal_code: input.postalCode.trim(),
    priority: input.priority,
    source_detail: input.sourceDetail.trim(),
    source_kind: input.sourceKind,
    status: input.status,
  };
  const client = getClient();
  const result = id
    ? await client.from("prospects").update(payload).eq("id", id)
    : await client
        .from("prospects")
        .insert({ ...payload, user_id: userId })
        .select("id")
        .single();

  throwIfError(result.error);
  return id ?? (result.data as { id: string } | null)?.id;
}

export async function saveProspectingEvent(
  input: EventInput,
  userId: string,
  id?: string,
) {
  const payload = {
    comment: input.comment.trim(),
    event_date: input.eventDate || null,
    location: input.location.trim(),
    name: input.name.trim(),
    status: input.status,
    type: input.type.trim(),
  };
  const client = getClient();
  const result = id
    ? await client.from("prospecting_events").update(payload).eq("id", id)
    : await client
        .from("prospecting_events")
        .insert({ ...payload, user_id: userId });

  throwIfError(result.error);
}

export async function saveProspectingCommunication(
  input: CommunicationInput,
  userId: string,
  id?: string,
) {
  const payload = {
    channel: input.channel.trim(),
    comment: input.comment.trim(),
    name: input.name.trim(),
    period_label: input.periodLabel.trim(),
    status: input.status,
  };
  const client = getClient();
  const result = id
    ? await client
        .from("prospecting_communications")
        .update(payload)
        .eq("id", id)
    : await client
        .from("prospecting_communications")
        .insert({ ...payload, user_id: userId });

  throwIfError(result.error);
}

export async function saveProspectIdea(
  input: IdeaInput,
  userId: string,
  id?: string,
) {
  const payload = {
    city: input.city.trim(),
    email: input.email.trim(),
    name: input.name.trim(),
    note: input.note.trim(),
    phone: input.phone.trim(),
  };
  const client = getClient();
  const result = id
    ? await client.from("prospect_ideas").update(payload).eq("id", id)
    : await client
        .from("prospect_ideas")
        .insert({ ...payload, user_id: userId });

  throwIfError(result.error);
}

export async function convertProspectToClient(prospectId: string) {
  const result = await getClient().rpc("convert_prospect_to_client", {
    target_prospect_id: prospectId,
  });
  throwIfError(result.error);
  return result.data as string;
}

export async function convertProspectIdeaToClient(ideaId: string) {
  const result = await getClient().rpc("convert_prospect_idea_to_client", {
    target_idea_id: ideaId,
  });
  throwIfError(result.error);
  return result.data as string;
}

export async function recordProspectInteraction({
  nextFollowUpAt,
  note,
  prospectId,
  type,
}: {
  nextFollowUpAt: string | null;
  note: string;
  prospectId: string;
  type: InteractionType;
}) {
  const result = await getClient().rpc("record_prospect_interaction", {
    interaction_next_follow_up_at: nextFollowUpAt,
    interaction_note: note.trim(),
    interaction_type: type,
    target_prospect_id: prospectId,
  });
  throwIfError(result.error);
  return result.data as string;
}
