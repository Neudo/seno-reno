import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, FileUp } from "lucide-react";
import { useRef, useState } from "react";

import { useAuth } from "@/features/auth/context/AuthProvider";
import {
  chantierStatuses,
  createChantierFromQuoteWithDetails,
  getChantierSnapshot,
  type ChantierStatus,
} from "@/features/chantiers/api/chantiers-api";
import {
  emptyChantierPdfDraft,
  findExistingQuote,
  toChantierInput,
  toImportedQuoteInput,
  validateQuotePdf,
  type ChantierPdfDraft,
} from "@/features/chantiers/lib/chantier-from-pdf";
import {
  FieldLabel,
  inputClassName,
  textareaClassName,
} from "@/features/clients-prospects/components/client-prospecting-ui";
import {
  getQuoteSnapshot,
  importQuotePdf,
} from "@/features/devis/api/quotes-api";
import type { ParsedTolteckQuoteSummary } from "@/features/outils/bdc/types";

const statusLabels: Record<ChantierStatus, string> = {
  CANCELLED: "Annulé",
  COMPLETED: "Terminé",
  IN_PROGRESS: "En cours",
  PAUSED: "En pause",
  PENDING: "En attente",
};

function amountText(amount: number | null) {
  return amount === null ? "" : String(amount).replace(".", ",");
}

export function ChantierCreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<ChantierPdfDraft>(emptyChantierPdfDraft);
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<ParsedTolteckQuoteSummary | null>(
    null,
  );
  const [isReading, setIsReading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [readWarning, setReadWarning] = useState<string | null>(null);
  const [importedQuoteId, setImportedQuoteId] = useState<string | null>(null);
  // Keep the uploaded quote on a failed creation attempt, rather than importing it twice.
  const savedQuoteId = useRef<string | null>(null);
  const submitLock = useRef(false);
  const selectionVersion = useRef(0);

  const snapshotQuery = useQuery({
    enabled: Boolean(user),
    queryFn: getChantierSnapshot,
    queryKey: ["chantiers", user?.id],
  });
  const quotesQuery = useQuery({
    enabled: Boolean(user),
    queryFn: getQuoteSnapshot,
    queryKey: ["quotes", user?.id],
  });
  const existingQuote = findExistingQuote(
    quotesQuery.data?.quotes ?? [],
    draft.quoteNumber,
  );
  const effectiveDraft: ChantierPdfDraft = {
    ...draft,
    clientId: existingQuote?.clientId ?? draft.clientId,
    totalHtText: existingQuote
      ? amountText(existingQuote.totalHt)
      : draft.totalHtText,
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Utilisateur non disponible.");
      if (!file || isReading)
        throw new Error("Importez le PDF du devis avant de créer le chantier.");
      const input = toChantierInput(effectiveDraft);
      // Refresh the number lookup before writing: a quote may have been imported in another tab.
      const snapshot = await queryClient.fetchQuery({
        queryKey: ["quotes", user.id],
        queryFn: getQuoteSnapshot,
        staleTime: 0,
      });
      const quote = findExistingQuote(snapshot.quotes, draft.quoteNumber);
      if (quote?.clientId && quote.clientId !== input.clientId) {
        throw new Error(
          "Ce devis est rattaché à un autre client. Vérifiez les informations avant de réessayer.",
        );
      }
      let quoteId = savedQuoteId.current ?? quote?.id;
      if (!quoteId) {
        const client = snapshotQuery.data?.clients.find(
          (candidate) => candidate.id === input.clientId,
        );
        if (!client || client.isArchived)
          throw new Error("Sélectionnez un client disponible.");
        quoteId = await importQuotePdf({
          file,
          userId: user.id,
          input: toImportedQuoteInput({
            draft: effectiveDraft,
            summary,
            clientName: client.name,
          }),
        });
        savedQuoteId.current = quoteId;
        setImportedQuoteId(quoteId);
      }
      return createChantierFromQuoteWithDetails({ quoteId, input });
    },
    onSuccess: async (chantierId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["chantiers", user?.id] }),
        queryClient.invalidateQueries({ queryKey: ["quotes"] }),
      ]);
      await navigate({ params: { chantierId }, to: "/chantiers/$chantierId" });
    },
    onSettled: () => {
      submitLock.current = false;
    },
  });

  async function selectPdf(nextFile: File) {
    if (savedQuoteId.current || submitLock.current) return;
    const version = ++selectionVersion.current;
    createMutation.reset();
    setFile(null);
    setSummary(null);
    setFileError(null);
    setReadWarning(null);
    setIsReading(true);
    setDraft((current) => ({
      ...current,
      address: "",
      clientId: "",
      name: "",
      quoteNumber: "",
      totalHtText: "",
    }));
    try {
      await validateQuotePdf(nextFile);
      if (version !== selectionVersion.current) return;
      setFile(nextFile);
      try {
        const { parseTolteckQuoteSummary } =
          await import("@/features/outils/bdc/parse-tolteck-quote");
        const parsed = await parseTolteckQuoteSummary(nextFile);
        if (version !== selectionVersion.current) return;
        const matchingClient = snapshotQuery.data?.clients.find(
          (client) =>
            !client.isArchived &&
            client.name.localeCompare(parsed.clientName, "fr-FR", {
              sensitivity: "base",
            }) === 0,
        );
        setSummary(parsed);
        setDraft((current) => ({
          ...current,
          address: parsed.projectAddress,
          clientId: matchingClient?.id ?? "",
          name: parsed.projectTitle,
          quoteNumber: parsed.quoteNumber,
          totalHtText: amountText(parsed.totalHt),
        }));
        if (
          !parsed.quoteNumber ||
          !parsed.projectTitle ||
          parsed.totalHt === null
        ) {
          setReadWarning(
            "Certaines informations n’ont pas pu être lues. Vérifiez et complétez les champs ci-dessous.",
          );
        }
      } catch {
        if (version === selectionVersion.current) {
          setReadWarning(
            "Les informations du PDF n’ont pas pu être lues automatiquement. Renseignez-les ci-dessous ; le PDF sera conservé.",
          );
        }
      }
    } catch (error) {
      if (version === selectionVersion.current)
        setFileError(
          error instanceof Error
            ? error.message
            : "Impossible de lire le fichier.",
        );
    } finally {
      if (version === selectionVersion.current) setIsReading(false);
    }
  }

  if (snapshotQuery.isPending || quotesQuery.isPending) {
    return (
      <main className="min-w-0 flex-1 overflow-auto bg-[#f7f8f9]">
        <div className="mx-auto max-w-5xl px-5 py-6 sm:px-7">
          <div className="h-96 animate-pulse border border-slate-200 bg-white" />
        </div>
      </main>
    );
  }
  if (
    snapshotQuery.isError ||
    quotesQuery.isError ||
    !snapshotQuery.data ||
    !quotesQuery.data ||
    !user
  ) {
    return (
      <main className="min-w-0 flex-1 overflow-auto bg-[#f7f8f9]">
        <div className="mx-auto max-w-5xl px-5 py-6 sm:px-7">
          <Link
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-seno-700"
            to="/chantiers"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Retour aux chantiers
          </Link>
          <p className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Impossible de préparer la création du chantier. Réessayez dans un
            instant.
          </p>
        </div>
      </main>
    );
  }

  const availableClients = snapshotQuery.data.clients.filter(
    (client) => !client.isArchived || client.id === existingQuote?.clientId,
  );
  const availableSubcontractors = snapshotQuery.data.subcontractors.filter(
    (subcontractor) => !subcontractor.isArchived,
  );
  const error = createMutation.isError ? createMutation.error.message : null;
  const quoteFieldsLocked = Boolean(importedQuoteId);
  const setField = <K extends keyof ChantierPdfDraft>(
    key: K,
    value: ChantierPdfDraft[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  return (
    <main className="min-w-0 flex-1 overflow-auto bg-[#f7f8f9]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-5 py-5 sm:px-7">
          <Link
            className="inline-flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-seno-700"
            to="/chantiers"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Retour aux chantiers
          </Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-slate-900">
            Nouveau chantier
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Importez le PDF du devis, puis vérifiez les informations du
            chantier.
          </p>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-5 py-6 sm:px-7">
        <form
          className="grid gap-6 border border-slate-200 bg-white p-5 sm:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (
              !file ||
              isReading ||
              submitLock.current ||
              existingQuote?.chantierId
            )
              return;
            submitLock.current = true;
            createMutation.mutate();
          }}
        >
          <fieldset
            className="grid min-w-0 gap-4"
            disabled={
              isReading || createMutation.isPending || quoteFieldsLocked
            }
          >
            <legend className="mb-4 text-xs font-semibold tracking-[0.13em] text-slate-500 uppercase">
              Devis du chantier
            </legend>
            <label className="grid min-h-34 cursor-pointer place-items-center border border-dashed border-seno-500 bg-seno-50 p-5 text-center transition-colors hover:bg-seno-100">
              <input
                accept="application/pdf,.pdf"
                aria-label="PDF du devis"
                className="sr-only"
                type="file"
                onChange={(event) => {
                  const selected = event.target.files?.[0];
                  event.target.value = "";
                  if (selected) void selectPdf(selected);
                }}
              />
              <FileUp
                aria-hidden="true"
                className="mb-2 size-6 text-seno-700"
              />
              <span className="max-w-full text-sm font-medium break-all text-slate-900">
                {isReading
                  ? "Lecture du PDF…"
                  : (file?.name ?? "Choisir le PDF du devis")}
              </span>
              <span className="mt-1 text-xs text-slate-500">
                PDF · 20 Mo maximum · signé ou non signé
              </span>
            </label>
          </fieldset>
          {fileError ? (
            <p
              className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {fileError}
            </p>
          ) : null}
          {readWarning ? (
            <p
              className="border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
              role="status"
            >
              {readWarning}
            </p>
          ) : null}
          {file && !isReading ? (
            <>
              {existingQuote ? (
                <p className="border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-5 text-slate-600">
                  Ce numéro correspond à un devis déjà enregistré. Son PDF, son
                  montant et son client rattaché seront conservés.
                </p>
              ) : null}
              {importedQuoteId && error ? (
                <p className="border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Le devis est enregistré. Corrigez les informations du chantier
                  puis réessayez : le PDF ne sera pas importé une seconde fois.
                </p>
              ) : null}
              <fieldset
                className="grid min-w-0 gap-6"
                disabled={
                  createMutation.isPending || Boolean(existingQuote?.chantierId)
                }
              >
                <section className="grid gap-4 border-t border-slate-200 pt-6">
                  <h2 className="text-xs font-semibold tracking-[0.13em] text-slate-500 uppercase">
                    Informations générales
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FieldLabel label="Numéro du devis *">
                      <input
                        className={inputClassName}
                        disabled={quoteFieldsLocked}
                        maxLength={80}
                        required
                        value={draft.quoteNumber}
                        onChange={(event) =>
                          setField("quoteNumber", event.target.value)
                        }
                      />
                    </FieldLabel>
                    <FieldLabel label="Client *">
                      <select
                        className={inputClassName}
                        disabled={
                          quoteFieldsLocked || Boolean(existingQuote?.clientId)
                        }
                        required
                        value={effectiveDraft.clientId}
                        onChange={(event) =>
                          setField("clientId", event.target.value)
                        }
                      >
                        <option value="">Sélectionner un client</option>
                        {availableClients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                    </FieldLabel>
                  </div>
                  {availableClients.length === 0 ? (
                    <p className="border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-900">
                      Créez d’abord un client : chaque chantier lui est
                      obligatoirement rattaché.
                    </p>
                  ) : null}
                  <FieldLabel label="Nom du chantier *">
                    <input
                      className={inputClassName}
                      maxLength={240}
                      required
                      value={draft.name}
                      onChange={(event) => setField("name", event.target.value)}
                    />
                  </FieldLabel>
                  <FieldLabel label="Adresse du chantier">
                    <input
                      className={inputClassName}
                      maxLength={500}
                      value={draft.address}
                      onChange={(event) =>
                        setField("address", event.target.value)
                      }
                    />
                  </FieldLabel>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FieldLabel label="Statut du chantier">
                      <select
                        className={inputClassName}
                        value={draft.status}
                        onChange={(event) =>
                          setField(
                            "status",
                            event.target.value as ChantierStatus,
                          )
                        }
                      >
                        {chantierStatuses.map((status) => (
                          <option key={status} value={status}>
                            {statusLabels[status]}
                          </option>
                        ))}
                      </select>
                    </FieldLabel>
                    <FieldLabel label="Montant du devis HT">
                      <input
                        className={inputClassName}
                        disabled={quoteFieldsLocked || Boolean(existingQuote)}
                        inputMode="decimal"
                        placeholder="0,00"
                        value={effectiveDraft.totalHtText}
                        onChange={(event) =>
                          setField("totalHtText", event.target.value)
                        }
                      />
                    </FieldLabel>
                  </div>
                </section>
                <section className="grid gap-4 border-t border-slate-200 pt-6">
                  <h2 className="text-xs font-semibold tracking-[0.13em] text-slate-500 uppercase">
                    Planning
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FieldLabel label="Début prévu">
                      <input
                        className={inputClassName}
                        type="date"
                        value={draft.plannedStartDate ?? ""}
                        onChange={(event) =>
                          setField(
                            "plannedStartDate",
                            event.target.value || null,
                          )
                        }
                      />
                    </FieldLabel>
                    <FieldLabel label="Fin prévue">
                      <input
                        className={inputClassName}
                        min={draft.plannedStartDate ?? undefined}
                        type="date"
                        value={draft.plannedEndDate ?? ""}
                        onChange={(event) =>
                          setField("plannedEndDate", event.target.value || null)
                        }
                      />
                    </FieldLabel>
                  </div>
                </section>
                <section className="grid gap-4 border-t border-slate-200 pt-6">
                  <h2 className="text-xs font-semibold tracking-[0.13em] text-slate-500 uppercase">
                    Sous-traitants
                  </h2>
                  {availableSubcontractors.length ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {availableSubcontractors.map((subcontractor) => (
                        <label
                          className="flex cursor-pointer items-start gap-3 border border-slate-200 px-3 py-3 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                          key={subcontractor.id}
                        >
                          <input
                            checked={draft.subcontractorIds.includes(
                              subcontractor.id,
                            )}
                            className="mt-0.5 size-4 shrink-0 accent-seno-700"
                            type="checkbox"
                            onChange={(event) =>
                              setField(
                                "subcontractorIds",
                                event.target.checked
                                  ? [
                                      ...draft.subcontractorIds,
                                      subcontractor.id,
                                    ]
                                  : draft.subcontractorIds.filter(
                                      (id) => id !== subcontractor.id,
                                    ),
                              )
                            }
                          />
                          <span>
                            <span className="block font-medium text-slate-900">
                              {subcontractor.name}
                            </span>
                            {subcontractor.contactName || subcontractor.city ? (
                              <span className="mt-0.5 block text-xs text-slate-500">
                                {[subcontractor.contactName, subcontractor.city]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-5 text-slate-600">
                      Aucun sous-traitant disponible. Ajoutez-le depuis la page
                      Sous-traitants.
                    </p>
                  )}
                </section>
                <section className="grid gap-4 border-t border-slate-200 pt-6">
                  <h2 className="text-xs font-semibold tracking-[0.13em] text-slate-500 uppercase">
                    Notes
                  </h2>
                  <FieldLabel label="Notes internes">
                    <textarea
                      className={textareaClassName}
                      maxLength={4000}
                      value={draft.notes}
                      onChange={(event) =>
                        setField("notes", event.target.value)
                      }
                    />
                  </FieldLabel>
                </section>
              </fieldset>
            </>
          ) : null}
          {error ? (
            <p
              className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          {existingQuote?.chantierId ? (
            <p className="border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Ce devis est déjà rattaché à un chantier.{" "}
              <Link
                className="font-medium underline"
                params={{ chantierId: existingQuote.chantierId }}
                to="/chantiers/$chantierId"
              >
                Voir le chantier
              </Link>
            </p>
          ) : null}
          <footer className="flex justify-end gap-2 border-t border-slate-200 pt-5">
            <Link
              className="flex h-10 items-center border border-slate-300 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              to="/chantiers"
            >
              Annuler
            </Link>
            <button
              className="h-10 cursor-pointer bg-seno-700 px-4 text-sm font-medium text-white transition-colors hover:bg-seno-800 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={
                !file ||
                isReading ||
                createMutation.isPending ||
                !effectiveDraft.clientId ||
                Boolean(existingQuote?.chantierId)
              }
              type="submit"
            >
              {createMutation.isPending ? "Création…" : "Créer le chantier"}
            </button>
          </footer>
        </form>
      </div>
    </main>
  );
}
