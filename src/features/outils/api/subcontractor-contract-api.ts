import { supabase } from "@/features/auth/api/supabase-client";

export const subcontractorContractReferenceSlots = [
  "REFERENCE_1",
  "REFERENCE_2",
] as const;

export type SubcontractorContractReferenceSlot =
  (typeof subcontractorContractReferenceSlots)[number];

export type SubcontractorContractReferenceFile = {
  createdAt: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  id: string;
  mimeType: string;
  slot: SubcontractorContractReferenceSlot;
  updatedAt: string;
};

type SubcontractorContractReferenceFileRow = {
  created_at: string;
  file_name: string;
  file_path: string;
  file_size: number | string;
  id: string;
  mime_type: string;
  slot: SubcontractorContractReferenceSlot;
  updated_at: string;
};

const contractReferenceFilesBucket =
  "subcontractor-contract-reference-files";

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

function toReferenceFile(
  row: SubcontractorContractReferenceFileRow,
): SubcontractorContractReferenceFile {
  return {
    createdAt: row.created_at,
    fileName: row.file_name,
    filePath: row.file_path,
    fileSize: Number(row.file_size),
    id: row.id,
    mimeType: row.mime_type,
    slot: row.slot,
    updatedAt: row.updated_at,
  };
}

export async function getSubcontractorContractReferenceFiles() {
  const result = await getClient()
    .from("subcontractor_contract_reference_files")
    .select(
      "id, slot, file_name, file_path, mime_type, file_size, created_at, updated_at",
    )
    .order("slot", { ascending: true });

  throwIfError(result.error);

  return ((result.data ?? []) as SubcontractorContractReferenceFileRow[]).map(
    toReferenceFile,
  );
}

export async function uploadSubcontractorContractReferenceFile({
  file,
  slot,
  userId,
}: {
  file: File;
  slot: SubcontractorContractReferenceSlot;
  userId: string;
}) {
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("Le fichier ne doit pas dépasser 20 Mo.");
  }

  const client = getClient();
  const existingResult = await client
    .from("subcontractor_contract_reference_files")
    .select("file_path")
    .eq("slot", slot)
    .maybeSingle();

  throwIfError(existingResult.error);

  const safeFileName = getSafeFileName(file.name);
  const storedFileName = file.name.trim().slice(0, 240) || "fichier";
  const path = `${userId}/${slot}/${crypto.randomUUID()}-${safeFileName}`;
  const mimeType = file.type || "application/octet-stream";
  const uploadResult = await client.storage
    .from(contractReferenceFilesBucket)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: mimeType,
      upsert: false,
    });

  throwIfError(uploadResult.error);

  const saveResult = await client
    .from("subcontractor_contract_reference_files")
    .upsert(
      {
        file_name: storedFileName,
        file_path: path,
        file_size: file.size,
        mime_type: mimeType,
        slot,
        user_id: userId,
      },
      { onConflict: "user_id,slot" },
    );

  if (saveResult.error) {
    await client.storage.from(contractReferenceFilesBucket).remove([path]);
    throwIfError(saveResult.error);
  }

  const previousPath = existingResult.data?.file_path;
  if (previousPath && previousPath !== path) {
    await client.storage.from(contractReferenceFilesBucket).remove([previousPath]);
  }
}

export async function getSubcontractorContractReferenceFileUrl(path: string) {
  const result = await getClient()
    .storage.from(contractReferenceFilesBucket)
    .createSignedUrl(path, 5 * 60);

  throwIfError(result.error);

  if (!result.data?.signedUrl) {
    throw new Error("Le fichier n'est pas disponible.");
  }

  return result.data.signedUrl;
}
