import { supabase } from "@/features/auth/api/supabase-client";
import {
  contractSettingsSchema,
  type ContractSettings,
} from "@/features/outils/subcontracting/contract-data";

const table = "subcontractor_contract_settings";
const columns =
  "company_name, legal_form, capital, registered_address, registry_city, registration_number, representatives, court_city, default_signature_city";

export const contractSettingsKey = (userId?: string) =>
  ["subcontractor-contract-settings", userId] as const;

function getClient() {
  if (!supabase) throw new Error("Supabase n’est pas configuré.");
  return supabase;
}

type SettingsRow = {
  company_name: string;
  legal_form: string;
  capital: string;
  registered_address: string;
  registry_city: string;
  registration_number: string;
  representatives: string;
  court_city: string;
  default_signature_city: string;
};

function toSettings(row: SettingsRow): ContractSettings {
  return contractSettingsSchema.parse({
    principal: {
      name: row.company_name,
      legalForm: row.legal_form,
      capital: row.capital,
      address: row.registered_address,
      registryCity: row.registry_city,
      registrationNumber: row.registration_number,
    },
    principalRepresentatives: row.representatives,
    courtCity: row.court_city,
    defaultSignatureCity: row.default_signature_city,
  });
}

export async function getContractSettings(userId: string) {
  const { data, error } = await getClient()
    .from(table)
    .select(columns)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ? toSettings(data) : null;
}

export async function saveContractSettings(
  userId: string,
  input: ContractSettings,
) {
  const settings = contractSettingsSchema.parse(input);
  const { principal } = settings;
  const { data, error } = await getClient()
    .from(table)
    .upsert(
      {
        user_id: userId,
        company_name: principal.name,
        legal_form: principal.legalForm,
        capital: principal.capital,
        registered_address: principal.address,
        registry_city: principal.registryCity,
        registration_number: principal.registrationNumber,
        representatives: settings.principalRepresentatives,
        court_city: settings.courtCity,
        default_signature_city: settings.defaultSignatureCity,
      },
      { onConflict: "user_id" },
    )
    .select(columns)
    .single();

  if (error) throw error;
  return toSettings(data);
}
