import { supabase } from "@/features/auth/api/supabase-client";

export type SubcontractorRecord = {
  legalForm: string;
  capital: string;
  registryCity: string;
  registrationNumber: string;
  declarantFirstName: string;
  declarantLastName: string;
  declarantRole: string;

  address: string;
  city: string;
  contactName: string;
  createdAt: string;
  email: string;
  id: string;
  isArchived: boolean;
  name: string;
  notes: string;
  phone: string;
  postalCode: string;
  updatedAt: string;
};

export type SubcontractorInput = Omit<
  SubcontractorRecord,
  "createdAt" | "id" | "updatedAt"
>;

export type SubcontractorAssignment = {
  chantierId: string;
  subcontractorId: string;
};

export type SubcontractorSnapshot = {
  assignments: SubcontractorAssignment[];
  subcontractors: SubcontractorRecord[];
};

export type SubcontractorRow = {
  legal_form: string;
  capital: string;
  registry_city: string;
  registration_number: string;
  declarant_first_name: string;
  declarant_last_name: string;
  declarant_role: string;

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

export const subcontractorColumns =
  "id, name, contact_name, email, phone, address, postal_code, city, notes, is_archived, created_at, updated_at, legal_form, capital, registry_city, registration_number, declarant_first_name, declarant_last_name, declarant_role";

type SubcontractorAssignmentRow = {
  chantier_id: string;
  subcontractor_id: string;
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

export function toSubcontractor(row: SubcontractorRow): SubcontractorRecord {
  return {
    legalForm: row.legal_form ?? "",
    capital: row.capital ?? "",
    registryCity: row.registry_city ?? "",
    registrationNumber: row.registration_number ?? "",
    declarantFirstName: row.declarant_first_name ?? "",
    declarantLastName: row.declarant_last_name ?? "",
    declarantRole: row.declarant_role ?? "",
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

function toPayload(input: SubcontractorInput) {
  return {
    legal_form: input.legalForm.trim(),
    capital: input.capital.trim(),
    registry_city: input.registryCity.trim(),
    registration_number: input.registrationNumber.trim(),
    declarant_first_name: input.declarantFirstName.trim(),
    declarant_last_name: input.declarantLastName.trim(),
    declarant_role: input.declarantRole.trim(),
    address: input.address.trim(),
    city: input.city.trim(),
    contact_name: input.contactName.trim(),
    email: input.email.trim(),
    is_archived: input.isArchived,
    name: input.name.trim(),
    notes: input.notes.trim(),
    phone: input.phone.trim(),
    postal_code: input.postalCode.trim(),
  };
}

export async function getSubcontractorSnapshot(): Promise<SubcontractorSnapshot> {
  const client = getClient();
  const [subcontractorsResult, assignmentsResult] = await Promise.all([
    client
      .from("subcontractors")
      .select(subcontractorColumns)
      .order("name", { ascending: true }),
    client
      .from("chantier_subcontractors")
      .select("chantier_id, subcontractor_id"),
  ]);

  throwIfError(subcontractorsResult.error);
  throwIfError(assignmentsResult.error);

  return {
    assignments: (
      (assignmentsResult.data ?? []) as SubcontractorAssignmentRow[]
    ).map((assignment) => ({
      chantierId: assignment.chantier_id,
      subcontractorId: assignment.subcontractor_id,
    })),
    subcontractors: (
      (subcontractorsResult.data ?? []) as SubcontractorRow[]
    ).map(toSubcontractor),
  };
}

export async function saveSubcontractor({
  id,
  input,
  userId,
}: {
  id?: string;
  input: SubcontractorInput;
  userId: string;
}) {
  const result = id
    ? await getClient().from("subcontractors").update(toPayload(input)).eq("id", id)
    : await getClient()
        .from("subcontractors")
        .insert({ ...toPayload(input), user_id: userId });

  throwIfError(result.error);
}
