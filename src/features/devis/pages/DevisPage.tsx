import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, FileText, FileUp, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { useAuth } from "@/features/auth/context/AuthProvider";
import { createChantierFromQuote } from "@/features/chantiers/api/chantiers-api";
import {
  getQuoteDocumentUrl,
  getQuoteSnapshot,
  importQuotePdf,
  quoteStatuses,
  updateQuote,
  type QuoteClient,
  type QuoteInput,
  type QuoteRecord,
  type QuoteStatus,
} from "@/features/devis/api/quotes-api";
import { parseTolteckQuoteSummary } from "@/features/outils/bdc/parse-tolteck-quote";
import { PageCanvas } from "@/shared/components/app-shell/PageCanvas";
import { cn } from "@/shared/lib/utils";

type QuoteDraft = {
  chantierId: string | null;
  clientId: string;
  clientName: string;
  comment: string;
  id: string | null;
  lastActionAt: string;
  lastActionNote: string;
  nextFollowUpAt: string;
  projectAddress: string;
  quoteDate: string;
  quoteNumber: string;
  status: QuoteStatus;
  title: string;
  totalHt: string;
  totalTtc: string;
};

const statusLabels: Record<QuoteStatus, string> = {
  IN_DISCUSSION: "En discussion",
  REFUSED: "Refusé",
  SENT: "Envoyé",
  SIGNED: "Signé",
  TO_FOLLOW_UP: "À relancer",
  TO_SEND: "À envoyer",
};

const statusTone: Record<QuoteStatus, string> = {
  IN_DISCUSSION: "border-violet-200 bg-violet-50 text-violet-700",
  REFUSED: "border-red-200 bg-red-50 text-red-700",
  SENT: "border-sky-200 bg-sky-50 text-sky-700",
  SIGNED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  TO_FOLLOW_UP: "border-amber-200 bg-amber-50 text-amber-800",
  TO_SEND: "border-slate-200 bg-slate-50 text-slate-600",
};

const emptyQuotes: QuoteRecord[] = [];

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  currency: "EUR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency",
});

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function getTodayIso() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function toIsoDate(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/u);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : "";
}

function parseAmount(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value.trim().replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function formatCurrency(value: number | null) {
  return value === null ? "—" : currencyFormatter.format(value);
}

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(`${value}T12:00:00`)) : "—";
}

function createDraft(quote?: QuoteRecord): QuoteDraft {
  return {
    chantierId: quote?.chantierId ?? null,
    clientId: quote?.clientId ?? "",
    clientName: quote?.clientName ?? "",
    comment: quote?.comment ?? "",
    id: quote?.id ?? null,
    lastActionAt: quote?.lastActionAt ?? "",
    lastActionNote: quote?.lastActionNote ?? "",
    nextFollowUpAt: quote?.nextFollowUpAt ?? "",
    projectAddress: quote?.projectAddress ?? "",
    quoteDate: quote?.quoteDate ?? "",
    quoteNumber: quote?.quoteNumber ?? "",
    status: quote?.status ?? "TO_SEND",
    title: quote?.title ?? "",
    totalHt:
      quote?.totalHt === null || quote?.totalHt === undefined
        ? ""
        : String(quote.totalHt),
    totalTtc:
      quote?.totalTtc === null || quote?.totalTtc === undefined
        ? ""
        : String(quote.totalTtc),
  };
}

function toQuoteInput(draft: QuoteDraft): QuoteInput {
  const totalHt = parseAmount(draft.totalHt);
  const totalTtc = parseAmount(draft.totalTtc);

  if (!draft.quoteNumber.trim() || !draft.clientName.trim()) {
    throw new Error("Renseignez le numéro de devis et le client.");
  }

  if (
    (draft.totalHt.trim() && totalHt === null) ||
    (draft.totalTtc.trim() && totalTtc === null)
  ) {
    throw new Error("Les montants doivent être des nombres positifs ou nuls.");
  }

  if (
    draft.lastActionAt &&
    draft.nextFollowUpAt &&
    draft.nextFollowUpAt < draft.lastActionAt
  ) {
    throw new Error(
      "La prochaine relance ne peut pas précéder la dernière action.",
    );
  }

  return {
    clientId: draft.clientId || null,
    clientName: draft.clientName.trim(),
    comment: draft.comment.trim(),
    lastActionAt: draft.lastActionAt || null,
    lastActionNote: draft.lastActionNote.trim(),
    nextFollowUpAt:
      draft.status === "SIGNED" || draft.status === "REFUSED"
        ? null
        : draft.nextFollowUpAt || null,
    projectAddress: draft.projectAddress.trim(),
    quoteDate: draft.quoteDate || null,
    quoteNumber: draft.quoteNumber.trim(),
    status: draft.status,
    title: draft.title.trim(),
    totalHt,
    totalTtc,
  };
}

function getFollowUp(quote: QuoteRecord) {
  if (!quote.nextFollowUpAt) {
    return "—";
  }

  if (quote.nextFollowUpAt >= getTodayIso()) {
    return formatDate(quote.nextFollowUpAt);
  }

  const due = new Date(`${quote.nextFollowUpAt}T12:00:00`);
  const today = new Date(`${getTodayIso()}T12:00:00`);
  const overdueDays = Math.max(
    1,
    Math.round((today.getTime() - due.getTime()) / 86_400_000),
  );

  return `En retard de ${overdueDays} jour${overdueDays > 1 ? "s" : ""}`;
}

function isActionRequired(quote: QuoteRecord) {
  return (
    quote.status === "TO_SEND" ||
    (quote.status !== "SIGNED" &&
      quote.status !== "REFUSED" &&
      Boolean(quote.nextFollowUpAt) &&
      quote.nextFollowUpAt! <= getTodayIso())
  );
}

function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <span
      className={cn(
        "inline-flex border px-2 py-1 text-[11px] font-medium whitespace-nowrap",
        statusTone[status],
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

function DrawerShell({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Fermer la fiche"
        className="absolute inset-0 cursor-pointer bg-slate-950/35"
        onClick={onClose}
        type="button"
      />
      <aside className="relative flex h-[100dvh] w-full max-w-xl flex-col bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-seno-500">
              DEVIS
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-slate-900">
              {title}
            </h2>
          </div>
          <button
            aria-label="Fermer"
            className="grid size-9 cursor-pointer place-items-center border border-slate-300 text-slate-500 transition-colors hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </header>
        {children}
      </aside>
    </div>
  );
}

const fieldClassName =
  "h-10 border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15";

const textAreaClassName =
  "min-h-24 resize-y border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15";

function QuoteFields({
  clients,
  draft,
  onUpdate,
}: {
  clients: QuoteClient[];
  draft: QuoteDraft;
  onUpdate: (patch: Partial<QuoteDraft>) => void;
}) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label
          className="grid gap-1.5 text-sm font-medium text-slate-700"
          htmlFor="quote-status"
        >
          Statut commercial
          <select
            className={fieldClassName}
            id="quote-status"
            onChange={(event) =>
              onUpdate({
                nextFollowUpAt:
                  event.target.value === "SIGNED" ||
                  event.target.value === "REFUSED"
                    ? ""
                    : draft.nextFollowUpAt,
                status: event.target.value as QuoteStatus,
              })
            }
            value={draft.status}
          >
            {quoteStatuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </label>
        <label
          className="grid gap-1.5 text-sm font-medium text-slate-700"
          htmlFor="quote-client-link"
        >
          Client associé
          <select
            className={fieldClassName}
            id="quote-client-link"
            onChange={(event) => {
              const client = clients.find(
                (entry) => entry.id === event.target.value,
              );
              onUpdate({
                clientId: client?.id ?? "",
                clientName: client?.name ?? draft.clientName,
              });
            }}
            value={draft.clientId}
          >
            <option value="">Sans rattachement</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label
        className="grid gap-1.5 text-sm font-medium text-slate-700"
        htmlFor="quote-client-name"
      >
        Client affiché
        <input
          className={fieldClassName}
          id="quote-client-name"
          maxLength={180}
          onChange={(event) =>
            onUpdate({ clientId: "", clientName: event.target.value })
          }
          placeholder="Nom du client figurant sur le devis"
          value={draft.clientName}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label
          className="grid gap-1.5 text-sm font-medium text-slate-700"
          htmlFor="quote-number"
        >
          N° de devis
          <input
            className={fieldClassName}
            id="quote-number"
            maxLength={80}
            onChange={(event) => onUpdate({ quoteNumber: event.target.value })}
            placeholder="DEV-2026-0001"
            value={draft.quoteNumber}
          />
        </label>
        <label
          className="grid gap-1.5 text-sm font-medium text-slate-700"
          htmlFor="quote-date"
        >
          Date du devis
          <input
            className={fieldClassName}
            id="quote-date"
            onChange={(event) => onUpdate({ quoteDate: event.target.value })}
            type="date"
            value={draft.quoteDate}
          />
        </label>
      </div>

      <label
        className="grid gap-1.5 text-sm font-medium text-slate-700"
        htmlFor="quote-title"
      >
        Projet / chantier
        <input
          className={fieldClassName}
          id="quote-title"
          maxLength={240}
          onChange={(event) => onUpdate({ title: event.target.value })}
          placeholder="Intitulé du projet"
          value={draft.title}
        />
      </label>

      <label
        className="grid gap-1.5 text-sm font-medium text-slate-700"
        htmlFor="quote-address"
      >
        Adresse du chantier{" "}
        <span className="font-normal text-slate-400">(facultative)</span>
        <textarea
          className={textAreaClassName}
          id="quote-address"
          maxLength={500}
          onChange={(event) => onUpdate({ projectAddress: event.target.value })}
          placeholder="Adresse extraite du devis"
          value={draft.projectAddress}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label
          className="grid gap-1.5 text-sm font-medium text-slate-700"
          htmlFor="quote-total-ht"
        >
          Montant HT{" "}
          <span className="font-normal text-slate-400">(facultatif)</span>
          <input
            className={fieldClassName}
            id="quote-total-ht"
            inputMode="decimal"
            onChange={(event) => onUpdate({ totalHt: event.target.value })}
            placeholder="0,00"
            value={draft.totalHt}
          />
        </label>
        <label
          className="grid gap-1.5 text-sm font-medium text-slate-700"
          htmlFor="quote-total-ttc"
        >
          Montant TTC{" "}
          <span className="font-normal text-slate-400">(facultatif)</span>
          <input
            className={fieldClassName}
            id="quote-total-ttc"
            inputMode="decimal"
            onChange={(event) => onUpdate({ totalTtc: event.target.value })}
            placeholder="0,00"
            value={draft.totalTtc}
          />
        </label>
      </div>

      <div className="border-y border-slate-200 py-5">
        <p className="text-sm font-semibold text-slate-800">Suivi commercial</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label
            className="grid gap-1.5 text-sm font-medium text-slate-700"
            htmlFor="quote-last-action-date"
          >
            Dernière action
            <input
              className={fieldClassName}
              id="quote-last-action-date"
              onChange={(event) =>
                onUpdate({ lastActionAt: event.target.value })
              }
              type="date"
              value={draft.lastActionAt}
            />
          </label>
          <label
            className="grid gap-1.5 text-sm font-medium text-slate-700"
            htmlFor="quote-follow-up-date"
          >
            Prochaine relance
            <input
              className={fieldClassName}
              disabled={draft.status === "SIGNED" || draft.status === "REFUSED"}
              id="quote-follow-up-date"
              onChange={(event) =>
                onUpdate({ nextFollowUpAt: event.target.value })
              }
              type="date"
              value={draft.nextFollowUpAt}
            />
          </label>
        </div>
        <label
          className="mt-4 grid gap-1.5 text-sm font-medium text-slate-700"
          htmlFor="quote-last-action-note"
        >
          Note d’action{" "}
          <span className="font-normal text-slate-400">(facultative)</span>
          <textarea
            className={textAreaClassName}
            id="quote-last-action-note"
            maxLength={2000}
            onChange={(event) =>
              onUpdate({ lastActionNote: event.target.value })
            }
            placeholder="Ex. Appel client, en attente de confirmation"
            value={draft.lastActionNote}
          />
        </label>
      </div>

      <label
        className="grid gap-1.5 text-sm font-medium text-slate-700"
        htmlFor="quote-comment"
      >
        Commentaire interne{" "}
        <span className="font-normal text-slate-400">(facultatif)</span>
        <textarea
          className={textAreaClassName}
          id="quote-comment"
          maxLength={4000}
          onChange={(event) => onUpdate({ comment: event.target.value })}
          placeholder="Précision interne"
          value={draft.comment}
        />
      </label>
    </div>
  );
}

function QuoteEditorDrawer({
  clients,
  draft,
  errorMessage,
  isCreatingChantier,
  isSaving,
  onClose,
  onCreateChantier,
  onSave,
  onUpdate,
}: {
  clients: QuoteClient[];
  draft: QuoteDraft;
  errorMessage: string | null;
  isCreatingChantier: boolean;
  isSaving: boolean;
  onClose: () => void;
  onCreateChantier: () => void;
  onSave: () => void;
  onUpdate: (patch: Partial<QuoteDraft>) => void;
}) {
  return (
    <DrawerShell onClose={onClose} title="Suivi du devis">
      <div className="flex-1 overflow-y-auto p-5">
        {draft.status === "SIGNED" ? (
          <div className="mb-5 border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm leading-5 text-emerald-900">
            {draft.chantierId ? (
              "Le chantier créé depuis ce devis est bien rattaché."
            ) : !draft.clientId ? (
              "Associez un client au devis avant de créer le chantier."
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>
                  Le devis est signé. Créez le chantier avec ces informations.
                </span>
                <button
                  className="h-8 cursor-pointer border border-emerald-300 bg-white px-3 text-xs font-medium text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isCreatingChantier}
                  onClick={onCreateChantier}
                  type="button"
                >
                  {isCreatingChantier ? "Création…" : "Créer le chantier"}
                </button>
              </div>
            )}
          </div>
        ) : null}
        <QuoteFields clients={clients} draft={draft} onUpdate={onUpdate} />
        {errorMessage ? (
          <p
            className="mt-5 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}
      </div>
      <footer className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
        <button
          className="h-10 cursor-pointer border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          onClick={onClose}
          type="button"
        >
          Annuler
        </button>
        <button
          className="h-10 cursor-pointer bg-seno-700 px-4 text-sm font-medium text-white hover:bg-seno-800 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSaving}
          onClick={onSave}
          type="button"
        >
          {isSaving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </footer>
    </DrawerShell>
  );
}

function ImportQuoteDrawer({
  clients,
  errorMessage,
  isSaving,
  onClose,
  onSave,
}: {
  clients: QuoteClient[];
  errorMessage: string | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (file: File, draft: QuoteDraft) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [draft, setDraft] = useState<QuoteDraft>(createDraft());
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const importFile = async (nextFile: File | null) => {
    if (!nextFile) {
      return;
    }

    const isPdf =
      nextFile.type === "application/pdf" ||
      nextFile.name.toLocaleLowerCase().endsWith(".pdf");
    if (!isPdf || nextFile.size > 20 * 1024 * 1024) {
      setParseError("Choisissez un PDF Tolteck de 20 Mo maximum.");
      return;
    }

    setFile(nextFile);
    setParseError(null);
    setIsParsing(true);

    try {
      const summary = await parseTolteckQuoteSummary(nextFile);
      const matchingClient = clients.find(
        (client) =>
          client.name.localeCompare(summary.clientName, "fr-FR", {
            sensitivity: "base",
          }) === 0,
      );

      setDraft({
        ...createDraft(),
        clientId: matchingClient?.id ?? "",
        clientName: matchingClient?.name ?? summary.clientName,
        projectAddress: summary.projectAddress,
        quoteDate: toIsoDate(summary.quoteDate),
        quoteNumber: summary.quoteNumber,
        title: summary.projectTitle,
        totalHt: summary.totalHt === null ? "" : String(summary.totalHt),
        totalTtc: summary.totalTtc === null ? "" : String(summary.totalTtc),
      });
    } catch (error) {
      setParseError(
        error instanceof Error
          ? error.message
          : "Le PDF n’a pas pu être analysé.",
      );
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <DrawerShell onClose={onClose} title="Importer un devis Tolteck">
      <div className="flex-1 overflow-y-auto p-5">
        <label className="grid min-h-34 cursor-pointer place-items-center border border-dashed border-seno-500 bg-seno-50 p-5 text-center transition-colors hover:bg-seno-100">
          <input
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(event) =>
              void importFile(event.target.files?.[0] ?? null)
            }
            type="file"
          />
          <FileUp aria-hidden="true" className="size-6 text-seno-700" />
          <span className="mt-3 text-sm font-medium text-seno-900">
            {file ? file.name : "Choisir le PDF du devis"}
          </span>
          <span className="mt-1 text-xs leading-5 text-seno-700">
            PDF Tolteck · 20 Mo maximum
          </span>
        </label>

        {isParsing ? (
          <p className="mt-4 text-sm text-slate-500">
            Lecture des informations du devis…
          </p>
        ) : null}
        {parseError ? (
          <p
            className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {parseError}
          </p>
        ) : null}

        {file && !isParsing ? (
          <div className="mt-6">
            <QuoteFields
              clients={clients}
              draft={draft}
              onUpdate={(patch) =>
                setDraft((current) => ({ ...current, ...patch }))
              }
            />
          </div>
        ) : null}

        {errorMessage ? (
          <p
            className="mt-5 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}
      </div>
      <footer className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
        <button
          className="h-10 cursor-pointer border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          onClick={onClose}
          type="button"
        >
          Annuler
        </button>
        <button
          className="h-10 cursor-pointer bg-seno-700 px-4 text-sm font-medium text-white hover:bg-seno-800 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!file || isParsing || isSaving}
          onClick={() => file && onSave(file, draft)}
          type="button"
        >
          {isSaving ? "Import…" : "Importer"}
        </button>
      </footer>
    </DrawerShell>
  );
}

export function DevisPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const quoteQuery = useQuery({
    queryFn: getQuoteSnapshot,
    queryKey: ["quotes"],
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | QuoteStatus>("ALL");
  const [showRequired, setShowRequired] = useState(false);
  const [quoteDraft, setQuoteDraft] = useState<QuoteDraft | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const invalidateQuotes = () =>
    queryClient.invalidateQueries({ queryKey: ["quotes"] });

  const updateMutation = useMutation({
    mutationFn: async (draft: QuoteDraft) => {
      if (!draft.id) {
        throw new Error("Le devis à modifier est introuvable.");
      }

      await updateQuote({ id: draft.id, input: toQuoteInput(draft) });
    },
    onSuccess: async () => {
      setQuoteDraft(null);
      await invalidateQuotes();
    },
  });
  const createChantierMutation = useMutation({
    mutationFn: async (draft: QuoteDraft) => {
      if (!draft.id) {
        throw new Error("Le devis à modifier est introuvable.");
      }

      await updateQuote({ id: draft.id, input: toQuoteInput(draft) });
      return createChantierFromQuote(draft.id);
    },
    onSuccess: async () => {
      setQuoteDraft(null);
      await Promise.all([
        invalidateQuotes(),
        queryClient.invalidateQueries({ queryKey: ["chantiers", user?.id] }),
      ]);
    },
  });
  const importMutation = useMutation({
    mutationFn: async ({ file, draft }: { file: File; draft: QuoteDraft }) => {
      if (!user) {
        throw new Error("Connectez-vous pour importer un devis.");
      }

      await importQuotePdf({
        file,
        input: toQuoteInput(draft),
        userId: user.id,
      });
    },
    onSuccess: async () => {
      setIsImportOpen(false);
      await invalidateQuotes();
    },
  });
  const documentMutation = useMutation({ mutationFn: getQuoteDocumentUrl });

  const quotes = quoteQuery.data?.quotes;
  const visibleQuotes = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("fr-FR");

    return (quotes ?? emptyQuotes).filter((quote) => {
      const matchesStatus =
        statusFilter === "ALL" || quote.status === statusFilter;
      const matchesRequired = !showRequired || isActionRequired(quote);
      const haystack =
        `${quote.quoteNumber} ${quote.clientName} ${quote.title} ${quote.projectAddress} ${quote.lastActionNote}`.toLocaleLowerCase(
          "fr-FR",
        );

      return (
        matchesStatus && matchesRequired && haystack.includes(normalizedSearch)
      );
    });
  }, [quotes, search, showRequired, statusFilter]);

  if (quoteQuery.isPending) {
    return (
      <PageCanvas title="Devis">
        <div className="mt-5 h-72 animate-pulse border border-slate-200 bg-white" />
      </PageCanvas>
    );
  }

  if (quoteQuery.isError || !quoteQuery.data) {
    return (
      <PageCanvas title="Devis">
        <div className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Impossible de charger les devis. Vérifiez que la migration a bien été
          appliquée, puis réessayez.
        </div>
      </PageCanvas>
    );
  }

  const quoteRows = quoteQuery.data.quotes;
  const requiredCount = quoteRows.filter(isActionRequired).length;
  const statusCounts = quoteStatuses.reduce(
    (counts, status) => ({
      ...counts,
      [status]: quoteRows.filter((quote) => quote.status === status).length,
    }),
    {} as Record<QuoteStatus, number>,
  );

  return (
    <PageCanvas title="Devis">
      <div className="mt-2 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <p className="max-w-3xl text-sm leading-6 text-slate-500">
          Suivi commercial des devis créés dans Tolteck. Importez le PDF pour
          centraliser les informations utiles, sans modifier le document formel.
        </p>
        <button
          className="flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 bg-seno-700 px-4 text-sm font-medium text-white transition-colors hover:bg-seno-800"
          onClick={() => {
            importMutation.reset();
            setIsImportOpen(true);
          }}
          type="button"
        >
          <FileUp aria-hidden="true" className="size-4" />
          Importer un devis
        </button>
      </div>

      <section className="mt-5 border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            />
            <input
              aria-label="Rechercher un devis"
              className="h-10 w-full border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="N° de devis, client, projet…"
              value={search}
            />
          </label>
          <button
            className={cn(
              "flex h-10 shrink-0 cursor-pointer items-center gap-2 border px-3 text-sm font-medium transition-colors",
              showRequired
                ? "border-amber-500 bg-amber-50 text-amber-900"
                : "border-slate-300 text-slate-700 hover:bg-slate-50",
            )}
            onClick={() => setShowRequired((current) => !current)}
            type="button"
          >
            <AlertCircle aria-hidden="true" className="size-4" />
            {requiredCount} action{requiredCount > 1 ? "s" : ""} requise
            {requiredCount > 1 ? "s" : ""}
          </button>
        </div>

        <div className="flex gap-px overflow-x-auto border-b border-slate-200 bg-slate-100 p-2">
          <button
            className={cn(
              "h-9 shrink-0 cursor-pointer px-3 text-sm font-medium transition-colors",
              statusFilter === "ALL"
                ? "bg-white text-seno-900 shadow-sm"
                : "text-slate-600 hover:bg-white/60",
            )}
            onClick={() => setStatusFilter("ALL")}
            type="button"
          >
            Tous{" "}
            <span className="ml-1 text-xs text-slate-400">
              {quoteRows.length}
            </span>
          </button>
          {quoteStatuses.map((status) => (
            <button
              className={cn(
                "h-9 shrink-0 cursor-pointer px-3 text-sm font-medium transition-colors",
                statusFilter === status
                  ? "bg-white text-seno-900 shadow-sm"
                  : "text-slate-600 hover:bg-white/60",
              )}
              key={status}
              onClick={() => setStatusFilter(status)}
              type="button"
            >
              {statusLabels[status]}{" "}
              <span className="ml-1 text-xs text-slate-400">
                {statusCounts[status]}
              </span>
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1060px] w-full border-collapse text-left">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] tracking-[0.1em] text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">N° devis</th>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Projet / chantier</th>
                <th className="px-4 py-3 text-right font-semibold">
                  Montant TTC
                </th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-4 py-3 font-semibold">Dernière action</th>
                <th className="px-4 py-3 font-semibold">Prochaine relance</th>
                <th className="w-18 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleQuotes.map((quote) => (
                <tr
                  className="cursor-pointer transition-colors hover:bg-slate-50"
                  key={quote.id}
                  onClick={() => {
                    updateMutation.reset();
                    createChantierMutation.reset();
                    setQuoteDraft(createDraft(quote));
                  }}
                >
                  <td className="px-4 py-3 font-mono text-xs font-medium text-slate-600">
                    {quote.quoteNumber}
                  </td>
                  <td className="max-w-48 px-4 py-3">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {quote.clientName}
                    </p>
                    {!quote.clientId ? (
                      <p className="mt-1 text-xs text-amber-700">
                        Client non rattaché
                      </p>
                    ) : null}
                  </td>
                  <td className="max-w-85 px-4 py-3">
                    <p className="truncate text-sm text-slate-700">
                      {quote.title || "—"}
                    </p>
                    {quote.projectAddress ? (
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {quote.projectAddress}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-slate-800">
                    {formatCurrency(quote.totalTtc)}
                  </td>
                  <td className="px-4 py-3">
                    <QuoteStatusBadge status={quote.status} />
                  </td>
                  <td className="max-w-80 px-4 py-3 text-sm text-slate-600">
                    {quote.lastActionNote ? (
                      <>
                        <p className="truncate">{quote.lastActionNote}</p>
                        {quote.lastActionAt ? (
                          <p className="mt-1 text-xs text-slate-400">
                            {formatDate(quote.lastActionAt)}
                          </p>
                        ) : null}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-sm",
                      quote.nextFollowUpAt &&
                        quote.nextFollowUpAt < getTodayIso()
                        ? "font-medium text-red-700"
                        : "text-slate-600",
                    )}
                  >
                    {getFollowUp(quote)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      aria-label={`Ouvrir le PDF ${quote.quoteNumber}`}
                      className="grid size-8 cursor-pointer place-items-center border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={documentMutation.isPending}
                      onClick={(event) => {
                        event.stopPropagation();
                        const documentWindow = window.open("", "_blank");
                        if (documentWindow) {
                          documentWindow.opener = null;
                        }

                        documentMutation.mutate(quote.documentPath, {
                          onSuccess: (url) => {
                            if (documentWindow) {
                              documentWindow.location.replace(url);
                              return;
                            }

                            window.open(url, "_blank", "noopener,noreferrer");
                          },
                          onError: () => documentWindow?.close(),
                        });
                      }}
                      type="button"
                    >
                      <FileText aria-hidden="true" className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {visibleQuotes.length === 0 ? (
                <tr>
                  <td className="px-5 py-14 text-center" colSpan={8}>
                    <p className="text-sm font-medium text-slate-800">
                      {quoteRows.length === 0
                        ? "Aucun devis importé"
                        : "Aucun devis ne correspond aux filtres"}
                    </p>
                    <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
                      {quoteRows.length === 0
                        ? "Importez le PDF Tolteck pour commencer le suivi commercial."
                        : "Ajuste la recherche ou les filtres pour afficher d’autres devis."}
                    </p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <footer className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
          <span>
            {visibleQuotes.length} devis affiché
            {visibleQuotes.length > 1 ? "s" : ""}
          </span>
          <span>Les PDF restent privés et liés à leur propriétaire.</span>
        </footer>
      </section>

      {documentMutation.isError ? (
        <p
          className="mt-3 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {documentMutation.error instanceof Error
            ? documentMutation.error.message
            : "Le PDF n’a pas pu être ouvert."}
        </p>
      ) : null}

      {quoteDraft ? (
        <QuoteEditorDrawer
          clients={quoteQuery.data.clients}
          draft={quoteDraft}
          errorMessage={
            updateMutation.isError && updateMutation.error instanceof Error
              ? updateMutation.error.message
              : createChantierMutation.isError &&
                  createChantierMutation.error instanceof Error
                ? createChantierMutation.error.message
                : null
          }
          isCreatingChantier={createChantierMutation.isPending}
          isSaving={updateMutation.isPending}
          onClose={() => {
            updateMutation.reset();
            createChantierMutation.reset();
            setQuoteDraft(null);
          }}
          onCreateChantier={() => {
            createChantierMutation.mutate(quoteDraft);
          }}
          onSave={() => updateMutation.mutate(quoteDraft)}
          onUpdate={(patch) =>
            setQuoteDraft((current) =>
              current ? { ...current, ...patch } : current,
            )
          }
        />
      ) : null}

      {isImportOpen ? (
        <ImportQuoteDrawer
          clients={quoteQuery.data.clients}
          errorMessage={
            importMutation.isError && importMutation.error instanceof Error
              ? importMutation.error.message
              : null
          }
          isSaving={importMutation.isPending}
          onClose={() => setIsImportOpen(false)}
          onSave={(file, draft) => importMutation.mutate({ file, draft })}
        />
      ) : null}
    </PageCanvas>
  );
}
