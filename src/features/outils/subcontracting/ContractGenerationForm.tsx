import { zodResolver } from "@hookform/resolvers/zod";
import { skipToken, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Download, ExternalLink, FileText, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { useAuth } from "@/features/auth/context/AuthProvider";
import {
  contractSettingsKey,
  getContractSettings,
} from "@/features/outils/api/subcontractor-contract-settings-api";
import {
  ContractField,
  FormSection,
  PartyFields,
} from "@/features/outils/subcontracting/ContractFormFields";
import {
  buildContractData,
  contractJobSchema,
  getContractJobDefaults,
  type ContractContext,
  type ContractJobData,
  type ContractSettings,
} from "@/features/outils/subcontracting/contract-data";
import type { GeneratedContractPdf } from "@/features/outils/subcontracting/generate-contract-pdfs";
import { Button } from "@/shared/components/ui/button";

function PdfDownload({ file }: { file: GeneratedContractPdf }) {
  const previewLink = useRef<HTMLAnchorElement>(null);
  const downloadLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file.blob);
    previewLink.current?.setAttribute("href", objectUrl);
    downloadLink.current?.setAttribute("href", objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file.blob]);

  const label =
    file.kind === "contract"
      ? "Contrat de sous-traitance"
      : "Déclaration sur l’honneur";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <FileText aria-hidden="true" className="size-4 shrink-0 text-primary" />
        <span>{label}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant="ghost">
          <a
            aria-label={`Aperçu : ${label}`}
            ref={previewLink}
            rel="noopener noreferrer"
            target="_blank"
          >
            <ExternalLink aria-hidden="true" />
            Aperçu
          </a>
        </Button>
        <Button asChild size="sm" variant="outline">
          <a
            aria-label={`Télécharger : ${label}`}
            download={file.filename}
            ref={downloadLink}
          >
            <Download aria-hidden="true" />
            Télécharger
          </a>
        </Button>
      </div>
    </div>
  );
}

export function ContractGenerationForm({
  context,
}: {
  context: ContractContext;
}) {
  const { user } = useAuth();
  const settings = useQuery({
    queryKey: contractSettingsKey(user?.id),
    queryFn: user ? () => getContractSettings(user.id) : skipToken,
  });

  if (!user) return null;
  if (settings.isPending) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Chargement des coordonnées de la société…
      </p>
    );
  }
  if (settings.isError) {
    return (
      <div className="grid gap-3">
        <p className="text-sm text-destructive" role="alert">
          Impossible de charger les coordonnées de la société.
        </p>
        <Button
          className="justify-self-start"
          disabled={settings.isFetching}
          onClick={() => void settings.refetch()}
          type="button"
          variant="outline"
        >
          Réessayer
        </Button>
      </div>
    );
  }
  if (!settings.data) {
    return (
      <div className="grid gap-3 border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">
          Enregistrez d’abord les coordonnées de la société donneuse d’ordre
          dans Outils → Contrat sous-traitant.
        </p>
        <Button asChild className="justify-self-start">
          <Link to="/contrat-sous-traitant">Renseigner les coordonnées</Link>
        </Button>
      </div>
    );
  }
  return (
    <ConfiguredContractForm
      context={context}
      key={user.id}
      settings={settings.data}
    />
  );
}

function ConfiguredContractForm({
  context,
  settings,
}: {
  context: ContractContext;
  settings: ContractSettings;
}) {
  const [files, setFiles] = useState<GeneratedContractPdf[]>([]);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const form = useForm<ContractJobData>({
    defaultValues: getContractJobDefaults(context, settings),
    resolver: zodResolver(contractJobSchema),
  });
  const isGenerating = form.formState.isSubmitting;
  const clearResult = () => {
    setFiles((current) => (current.length ? [] : current));
    setGenerationError(null);
  };

  const generate = form.handleSubmit(async (data) => {
    clearResult();
    try {
      const { generateContractPdfs } =
        await import("@/features/outils/subcontracting/generate-contract-pdfs");
      setFiles(await generateContractPdfs(buildContractData(data, settings)));
    } catch {
      setGenerationError(
        "La génération des PDF a échoué. Réessayez sans quitter le formulaire.",
      );
    }
  });

  return (
    <form
      aria-label="Génération du contrat et de la déclaration"
      className="grid gap-4"
      noValidate
      onChange={clearResult}
      onSubmit={(event) => void generate(event)}
    >
      <div className="grid gap-1 text-sm">
        <p className="text-sm text-muted-foreground">
          Chantier :{" "}
          <span className="font-medium text-foreground">
            {context.siteName}
          </span>
          .
        </p>
        <p className="text-muted-foreground">
          Donneur d’ordre :{" "}
          <span className="font-medium text-foreground">
            {settings.principal.name}
          </span>
          . Les coordonnées de la société sont reprises depuis Outils.
        </p>
      </div>
      <fieldset
        aria-busy={isGenerating}
        className="grid min-w-0 gap-4"
        disabled={isGenerating}
      >
        <FormSection title="Chantier et références">
          <ContractField
            form={form}
            label="Adresse du chantier"
            maxLength={320}
            name="siteAddress"
            type="multiline"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <ContractField
              form={form}
              label="Numéro de contrat"
              maxLength={60}
              name="contractNumber"
            />
            <ContractField
              form={form}
              label="Numéro de bon de commande"
              maxLength={60}
              name="purchaseOrderNumber"
            />
          </div>
        </FormSection>
        <FormSection title="Sous-traitant et déclarant">
          <PartyFields
            renderField={(field, props) => (
              <ContractField
                {...props}
                form={form}
                name={`subcontractor.${field}`}
              />
            )}
          />
          <ContractField
            form={form}
            label="Spécialités ou prestations"
            maxLength={500}
            name="specialties"
            type="multiline"
          />
          <div className="grid gap-4 border-t border-border pt-4">
            {context.subcontractor.contactName ? (
              <p className="text-xs text-muted-foreground">
                Contact de la fiche : {context.subcontractor.contactName}.
                Vérifiez l’identité du déclarant.
              </p>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <ContractField
                form={form}
                label="Prénom du déclarant"
                maxLength={80}
                name="declarantFirstName"
              />
              <ContractField
                form={form}
                label="Nom du déclarant"
                maxLength={80}
                name="declarantLastName"
              />
            </div>
            <ContractField
              form={form}
              label="Qualité du déclarant"
              maxLength={100}
              name="declarantRole"
            />
          </div>
        </FormSection>
        <FormSection title="Signature">
          <div className="grid gap-4 sm:grid-cols-2">
            <ContractField
              form={form}
              label="Lieu de signature"
              maxLength={100}
              name="signatureCity"
            />
            <ContractField
              form={form}
              label="Date de signature"
              name="signatureDate"
              type="date"
            />
          </div>
        </FormSection>
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-3 border border-border bg-card px-4 py-3 sm:px-5">
        <p className="max-w-lg text-xs leading-5 text-muted-foreground">
          Les textes des modèles sont repris sans mise à jour juridique. Faites
          vérifier les clauses et leurs références avant signature.
        </p>
        <Button disabled={isGenerating} type="submit">
          {isGenerating ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" />
          ) : (
            <FileText aria-hidden="true" />
          )}
          {isGenerating ? "Génération des PDF…" : "Générer les deux PDF"}
        </Button>
      </div>
      {generationError ? (
        <p
          className="border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
          role="alert"
        >
          {generationError}
        </p>
      ) : null}
      {files.length ? (
        <section
          aria-label="Documents générés"
          className="border border-border bg-card"
        >
          <p
            aria-live="polite"
            className="px-4 py-3 text-sm font-semibold text-foreground sm:px-5"
          >
            Les deux PDF sont prêts.
          </p>
          {files.map((file) => (
            <PdfDownload file={file} key={file.kind} />
          ))}
        </section>
      ) : null}
    </form>
  );
}
