import { z } from "zod";

import type { SubcontractorRecord } from "@/features/sous-traitants/api/subcontractors-api";

const requiredText = (max: number) =>
  z.string().trim().min(1, "Ce champ est requis.").max(max);

const partySchema = z.object({
  name: requiredText(120),
  legalForm: requiredText(100),
  capital: z.string().trim().max(60),
  address: requiredText(320),
  registryCity: requiredText(100),
  registrationNumber: requiredText(50),
});

const principalSchema = z.object({
  principal: partySchema,
  principalRepresentatives: requiredText(200),
  courtCity: requiredText(100),
});

export const contractSettingsSchema = principalSchema.extend({
  defaultSignatureCity: z.string().trim().max(100),
});

export const contractJobSchema = z.object({
  siteAddress: requiredText(320),
  contractNumber: requiredText(60),
  purchaseOrderNumber: requiredText(60),
  subcontractor: partySchema,
  specialties: requiredText(500),
  declarantFirstName: requiredText(80),
  declarantLastName: requiredText(80),
  declarantRole: requiredText(100),
  signatureCity: requiredText(100),
  signatureDate: z.iso.date("Renseignez une date de signature valide."),
});

export const contractSchema = contractJobSchema.extend(principalSchema.shape);

export type ContractData = z.infer<typeof contractSchema>;
export type ContractParty = ContractData["principal"];
export type ContractSettings = z.infer<typeof contractSettingsSchema>;
export type ContractJobData = z.infer<typeof contractJobSchema>;

export type ContractContext = {
  contractNumber?: string;
  purchaseOrderNumber?: string;
  signatureCity?: string;
  signatureDate?: string | null;
  siteName: string;
  siteAddress: string;
  serviceDescription: string;
  subcontractor: SubcontractorRecord;
};

function getPartyDefaults(record?: SubcontractorRecord): ContractParty {
  return {
    name: record?.name ?? "",
    address: record
      ? [
          record.address.trim(),
          [record.postalCode, record.city].filter(Boolean).join(" "),
        ]
          .filter(Boolean)
          .join(", ")
      : "",
    legalForm: record?.legalForm ?? "",
    capital: record?.capital ?? "",
    registryCity: record?.registryCity ?? "",
    registrationNumber: record?.registrationNumber ?? "",
  };
}

export function getContractSettingsDefaults(): ContractSettings {
  return {
    principal: getPartyDefaults(),
    principalRepresentatives: "",
    courtCity: "",
    defaultSignatureCity: "",
  };
}

export function getContractJobDefaults(
  context: ContractContext,
  settings: ContractSettings,
): ContractJobData {
  return {
    siteAddress: context.siteAddress,
    contractNumber: context.contractNumber ?? "",
    purchaseOrderNumber: context.purchaseOrderNumber ?? "",
    subcontractor: getPartyDefaults(context.subcontractor),
    specialties: context.serviceDescription,
    declarantFirstName: context.subcontractor.declarantFirstName ?? "",
    declarantLastName: context.subcontractor.declarantLastName ?? "",
    declarantRole: context.subcontractor.declarantRole ?? "",
    signatureCity: context.signatureCity || settings.defaultSignatureCity,
    signatureDate: context.signatureDate ?? "",
  };
}

export function buildContractData(
  job: ContractJobData,
  settings: ContractSettings,
): ContractData {
  return {
    ...job,
    principal: settings.principal,
    principalRepresentatives: settings.principalRepresentatives,
    courtCity: settings.courtCity,
  };
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeZone: "UTC",
});

export function formatContractDate(value: string) {
  return dateFormatter.format(new Date(`${value}T12:00:00Z`));
}

export function getContractFilenames(reference: string) {
  const slug =
    reference
      .normalize("NFKD")
      .replace(/\p{Mark}/gu, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "sans-reference";

  return {
    contract: `contrat-sous-traitance-${slug}.pdf`,
    declaration: `declaration-sur-l-honneur-${slug}.pdf`,
  };
}
