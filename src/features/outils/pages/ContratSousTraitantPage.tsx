import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ExternalLink,
  FileText,
  LoaderCircle,
  UploadCloud,
} from "lucide-react";
import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import {
  getSubcontractorContractReferenceFiles,
  getSubcontractorContractReferenceFileUrl,
  type SubcontractorContractReferenceFile,
  type SubcontractorContractReferenceSlot,
  uploadSubcontractorContractReferenceFile,
} from "@/features/outils/api/subcontractor-contract-api";
import { useAuth } from "@/features/auth/context/AuthProvider";
import { PageCanvas } from "@/shared/components/app-shell/PageCanvas";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

const slots: Array<{
  label: string;
  slot: SubcontractorContractReferenceSlot;
}> = [
  { label: "Fichier témoin 1", slot: "REFERENCE_1" },
  { label: "Fichier témoin 2", slot: "REFERENCE_2" },
];

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} Ko`;
  }

  return `${(size / (1024 * 1024)).toLocaleString("fr-FR", {
    maximumFractionDigits: 1,
  })} Mo`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function ReferenceFileCard({
  file,
  isDownloading,
  isUploading,
  label,
  onDownload,
  onUpload,
  slot,
}: {
  file?: SubcontractorContractReferenceFile;
  isDownloading: boolean;
  isUploading: boolean;
  label: string;
  onDownload: (path: string) => void;
  onUpload: (file: File, slot: SubcontractorContractReferenceSlot) => void;
  slot: SubcontractorContractReferenceSlot;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const submitFile = (nextFile?: File) => {
    if (nextFile) {
      onUpload(nextFile, slot);
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    submitFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    submitFile(event.dataTransfer.files[0]);
  };

  return (
    <section className="border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{label}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {file ? "Fichier enregistré" : "Aucun fichier déposé"}
          </p>
        </div>
        <div className="grid size-10 shrink-0 place-items-center bg-seno-700 text-white">
          {isUploading ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            <FileText className="size-5" strokeWidth={1.7} />
          )}
        </div>
      </div>

      {file ? (
        <div className="mt-6 border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="truncate text-sm font-medium text-slate-900" title={file.fileName}>
            {file.fileName}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {formatFileSize(file.fileSize)} · Déposé le {formatDate(file.updatedAt)}
          </p>
        </div>
      ) : null}

      <div
        className={cn(
          "mt-5 border border-dashed px-4 py-7 text-center transition-colors",
          isDragging
            ? "border-seno-500 bg-seno-50"
            : "border-slate-300 bg-white hover:border-seno-500",
          isUploading && "pointer-events-none opacity-60",
        )}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          className="sr-only"
          onChange={handleChange}
          ref={inputRef}
          type="file"
        />
        <UploadCloud className="mx-auto size-5 text-seno-700" strokeWidth={1.7} />
        <p className="mt-3 text-sm text-slate-600">
          Déposez un fichier ici ou choisissez-le depuis votre ordinateur.
        </p>
        <Button
          className="mt-4"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          type="button"
          variant="outline"
        >
          {file ? "Remplacer le fichier" : "Choisir un fichier"}
        </Button>
        <p className="mt-3 text-xs text-slate-400">20 Mo maximum</p>
      </div>

      {file ? (
        <Button
          className="mt-4"
          disabled={isDownloading}
          onClick={() => onDownload(file.filePath)}
          type="button"
          variant="ghost"
        >
          {isDownloading ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <ExternalLink />
          )}
          Ouvrir le fichier
        </Button>
      ) : null}
    </section>
  );
}

export function ContratSousTraitantPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const referenceFilesQuery = useQuery({
    queryFn: getSubcontractorContractReferenceFiles,
    queryKey: ["subcontractor-contract-reference-files", user?.id],
  });
  const uploadMutation = useMutation({
    mutationFn: async ({
      file,
      slot,
    }: {
      file: File;
      slot: SubcontractorContractReferenceSlot;
    }) => {
      if (!user) {
        throw new Error("Connectez-vous pour déposer un fichier.");
      }

      await uploadSubcontractorContractReferenceFile({
        file,
        slot,
        userId: user.id,
      });
    },
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({
        queryKey: ["subcontractor-contract-reference-files", user?.id],
      });
    },
    onError: (reason) => {
      setError(
        reason instanceof Error
          ? reason.message
          : "Impossible d'enregistrer le fichier.",
      );
    },
  });
  const downloadMutation = useMutation({
    mutationFn: getSubcontractorContractReferenceFileUrl,
    onSuccess: (url) => window.open(url, "_blank", "noopener,noreferrer"),
    onError: (reason) => {
      setError(
        reason instanceof Error
          ? reason.message
          : "Impossible d'ouvrir le fichier.",
      );
    },
  });

  if (referenceFilesQuery.isPending) {
    return (
      <PageCanvas title="Contrat sous-traitant">
        <div className="mt-5 h-72 animate-pulse border border-slate-200 bg-white" />
      </PageCanvas>
    );
  }

  if (referenceFilesQuery.isError || !referenceFilesQuery.data) {
    return (
      <PageCanvas title="Contrat sous-traitant">
        <div className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Impossible de charger les fichiers témoins. Vérifiez que la migration a
          bien été appliquée, puis réessayez.
        </div>
      </PageCanvas>
    );
  }

  const filesBySlot = new Map(
    referenceFilesQuery.data.map((file) => [file.slot, file]),
  );
  const uploadingSlot = uploadMutation.isPending
    ? uploadMutation.variables?.slot
    : undefined;

  return (
    <PageCanvas title="Contrat sous-traitant">
      <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
        Déposez deux fichiers témoins. Ils serviront à une future génération de
        PDF.
      </p>

      {error ? (
        <div className="mt-5 flex gap-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>{error}</p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {slots.map(({ label, slot }) => (
          <ReferenceFileCard
            file={filesBySlot.get(slot)}
            isDownloading={
              downloadMutation.isPending &&
              downloadMutation.variables === filesBySlot.get(slot)?.filePath
            }
            isUploading={uploadingSlot === slot}
            key={slot}
            label={label}
            onDownload={(path) => {
              setError(null);
              downloadMutation.mutate(path);
            }}
            onUpload={(file, targetSlot) => {
              setError(null);
              uploadMutation.mutate({ file, slot: targetSlot });
            }}
            slot={slot}
          />
        ))}
      </div>
    </PageCanvas>
  );
}
