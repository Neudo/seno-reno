import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { useAuth } from "@/features/auth/context/AuthProvider";
import {
  chantierStatuses,
  createChantierFromQuote,
  getChantierSnapshot,
  saveChantier,
  type ChantierClient,
  type ChantierInput,
  type ChantierRecord,
  type ChantierStatus,
  type SignedQuoteCandidate,
} from "@/features/chantiers/api/chantiers-api";
import {
  FieldLabel,
  inputClassName,
  textareaClassName,
} from "@/features/clients-prospects/components/client-prospecting-ui";
import { PageCanvas } from "@/shared/components/app-shell/PageCanvas";
import { cn } from "@/shared/lib/utils";

type ChantierDraft = ChantierInput & { id?: string };
type CreationMode = "MANUAL" | "QUOTE";

const statusLabels: Record<ChantierStatus, string> = {
  CANCELLED: "Annulé",
  COMPLETED: "Terminé",
  IN_PROGRESS: "En cours",
  PAUSED: "En pause",
  PENDING: "En attente",
};

const statusTone: Record<ChantierStatus, string> = {
  CANCELLED: "border-slate-200 bg-slate-50 text-slate-600",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  IN_PROGRESS: "border-sky-200 bg-sky-50 text-sky-700",
  PAUSED: "border-amber-200 bg-amber-50 text-amber-800",
  PENDING: "border-violet-200 bg-violet-50 text-violet-700",
};

const emptyChantiers: ChantierRecord[] = [];

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

function createDraft(chantier?: ChantierRecord): ChantierDraft {
  return {
    actualEndDate: chantier?.actualEndDate ?? null,
    address: chantier?.address ?? "",
    clientId: chantier?.clientId ?? "",
    id: chantier?.id,
    initialSignedQuoteAmount: chantier?.initialSignedQuoteAmount ?? null,
    name: chantier?.name ?? "",
    notes: chantier?.notes ?? "",
    plannedEndDate: chantier?.plannedEndDate ?? null,
    plannedStartDate: chantier?.plannedStartDate ?? null,
    status: chantier?.status ?? "PENDING",
  };
}

function formatCurrency(value: number | null) {
  return value === null ? "—" : currencyFormatter.format(value);
}

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(`${value}T12:00:00`)) : "—";
}

function parseAmount(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value.trim().replace(/\s/gu, "").replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function toInput(draft: ChantierDraft, amount: string): ChantierInput {
  const initialSignedQuoteAmount = parseAmount(amount);

  if (!draft.clientId) {
    throw new Error("Sélectionne le client du chantier.");
  }

  if (!draft.name.trim()) {
    throw new Error("Renseigne le nom du chantier.");
  }

  if (amount.trim() && initialSignedQuoteAmount === null) {
    throw new Error("Le CA prévisionnel doit être un montant positif ou nul.");
  }

  if (
    draft.plannedStartDate &&
    draft.plannedEndDate &&
    draft.plannedEndDate < draft.plannedStartDate
  ) {
    throw new Error("La fin prévue ne peut pas précéder le début prévu.");
  }

  return {
    ...draft,
    actualEndDate: draft.actualEndDate || null,
    initialSignedQuoteAmount,
    plannedEndDate: draft.plannedEndDate || null,
    plannedStartDate: draft.plannedStartDate || null,
  };
}

function ChantierStatusBadge({ status }: { status: ChantierStatus }) {
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
        aria-label="Fermer la fiche chantier"
        className="absolute inset-0 cursor-pointer bg-slate-950/35"
        onClick={onClose}
        type="button"
      />
      <aside className="relative flex h-[100dvh] w-full max-w-xl flex-col bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-seno-500">
              CHANTIERS
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

function ChantierForm({
  clients,
  draft,
  onUpdate,
  revenue,
  setRevenue,
}: {
  clients: ChantierClient[];
  draft: ChantierDraft;
  onUpdate: (patch: Partial<ChantierDraft>) => void;
  revenue: string;
  setRevenue: (value: string) => void;
}) {
  const availableClients = clients.filter((client) => !client.isArchived);

  return (
    <div className="grid gap-5">
      <section className="grid gap-3">
        <p className="text-xs font-semibold tracking-[0.13em] text-slate-500 uppercase">
          Informations générales
        </p>
        <FieldLabel label="Client *">
          <select
            className={inputClassName}
            onChange={(event) => {
              const client = availableClients.find(
                (candidate) => candidate.id === event.target.value,
              );
              onUpdate({
                address: draft.address || client?.address || "",
                clientId: event.target.value,
              });
            }}
            value={draft.clientId}
          >
            <option value="">Sélectionner un client</option>
            {availableClients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </FieldLabel>
        {availableClients.length === 0 ? (
          <p className="border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-900">
            Crée d’abord un client : chaque chantier lui est obligatoirement
            rattaché.
          </p>
        ) : null}
        <FieldLabel label="Nom du chantier *">
          <input
            className={inputClassName}
            maxLength={240}
            onChange={(event) => onUpdate({ name: event.target.value })}
            value={draft.name}
          />
        </FieldLabel>
        <FieldLabel label="Adresse du chantier">
          <input
            className={inputClassName}
            maxLength={500}
            onChange={(event) => onUpdate({ address: event.target.value })}
            value={draft.address}
          />
        </FieldLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldLabel label="Statut">
            <select
              className={inputClassName}
              onChange={(event) =>
                onUpdate({ status: event.target.value as ChantierStatus })
              }
              value={draft.status}
            >
              {chantierStatuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </FieldLabel>
          <FieldLabel label="CA prévisionnel HT">
            <input
              className={inputClassName}
              inputMode="decimal"
              onChange={(event) => setRevenue(event.target.value)}
              placeholder="0,00"
              value={revenue}
            />
          </FieldLabel>
        </div>
      </section>

      <section className="grid gap-3 border-t border-slate-200 pt-5">
        <p className="text-xs font-semibold tracking-[0.13em] text-slate-500 uppercase">
          Planning
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldLabel label="Début prévu">
            <input
              className={inputClassName}
              onChange={(event) =>
                onUpdate({ plannedStartDate: event.target.value || null })
              }
              type="date"
              value={draft.plannedStartDate ?? ""}
            />
          </FieldLabel>
          <FieldLabel label="Fin prévue">
            <input
              className={inputClassName}
              min={draft.plannedStartDate ?? undefined}
              onChange={(event) =>
                onUpdate({ plannedEndDate: event.target.value || null })
              }
              type="date"
              value={draft.plannedEndDate ?? ""}
            />
          </FieldLabel>
        </div>
        <FieldLabel label="Fin réelle">
          <input
            className={inputClassName}
            onChange={(event) =>
              onUpdate({ actualEndDate: event.target.value || null })
            }
            type="date"
            value={draft.actualEndDate ?? ""}
          />
        </FieldLabel>
      </section>

      <section className="grid gap-3 border-t border-slate-200 pt-5">
        <p className="text-xs font-semibold tracking-[0.13em] text-slate-500 uppercase">
          Notes
        </p>
        <FieldLabel label="Notes internes">
          <textarea
            className={textareaClassName}
            maxLength={4000}
            onChange={(event) => onUpdate({ notes: event.target.value })}
            value={draft.notes}
          />
        </FieldLabel>
      </section>
    </div>
  );
}

function QuoteCreation({
  candidates,
  errorMessage,
  isCreating,
  onCreate,
}: {
  candidates: SignedQuoteCandidate[];
  errorMessage: string | null;
  isCreating: boolean;
  onCreate: (quoteId: string) => void;
}) {
  const [selectedId, setSelectedId] = useState("");
  const selectedQuote = candidates.find((quote) => quote.id === selectedId);

  return (
    <div className="grid gap-5">
      <p className="text-sm leading-6 text-slate-600">
        Le chantier reprend le client, le projet, l’adresse et le montant HT du
        devis signé.
      </p>
      {candidates.length ? (
        <>
          <FieldLabel label="Devis signé">
            <select
              className={inputClassName}
              onChange={(event) => setSelectedId(event.target.value)}
              value={selectedId}
            >
              <option value="">Sélectionner un devis signé</option>
              {candidates.map((quote) => (
                <option key={quote.id} value={quote.id}>
                  {quote.quoteNumber} · {quote.clientName}
                  {quote.title ? ` · ${quote.title}` : ""}
                </option>
              ))}
            </select>
          </FieldLabel>
          {selectedQuote ? (
            <div className="border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <p className="font-medium text-slate-900">
                {selectedQuote.title || selectedQuote.quoteNumber}
              </p>
              <p className="mt-1 text-slate-600">{selectedQuote.clientName}</p>
              <p className="mt-1 text-slate-500">
                {selectedQuote.projectAddress || "Adresse non renseignée"} ·{" "}
                {formatCurrency(selectedQuote.totalHt)} HT
              </p>
            </div>
          ) : null}
          {errorMessage ? (
            <p
              className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}
          <div className="flex justify-end border-t border-slate-200 pt-4">
            <button
              className="h-10 cursor-pointer bg-seno-700 px-4 text-sm font-medium text-white hover:bg-seno-800 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!selectedId || isCreating}
              onClick={() => selectedId && onCreate(selectedId)}
              type="button"
            >
              {isCreating ? "Création…" : "Créer le chantier"}
            </button>
          </div>
        </>
      ) : (
        <div className="border border-slate-200 bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-600">
          Aucun devis signé et rattaché à un client n’est disponible. Tu peux
          créer le chantier manuellement.
        </div>
      )}
    </div>
  );
}

function ChantierDrawer({
  candidates,
  clients,
  creationError,
  creationMode,
  draft,
  isCreating,
  isSaving,
  onClose,
  onCreateFromQuote,
  onSave,
  onUpdate,
  setCreationMode,
}: {
  candidates: SignedQuoteCandidate[];
  clients: ChantierClient[];
  creationError: string | null;
  creationMode: CreationMode;
  draft: ChantierDraft;
  isCreating: boolean;
  isSaving: boolean;
  onClose: () => void;
  onCreateFromQuote: (quoteId: string) => void;
  onSave: (amount: string) => void;
  onUpdate: (patch: Partial<ChantierDraft>) => void;
  setCreationMode: (mode: CreationMode) => void;
}) {
  const [revenue, setRevenue] = useState(
    draft.initialSignedQuoteAmount === null
      ? ""
      : String(draft.initialSignedQuoteAmount),
  );
  const isNew = !draft.id;
  const isQuoteMode = isNew && creationMode === "QUOTE";
  const saveError = creationMode === "MANUAL" ? creationError : null;

  return (
    <DrawerShell
      onClose={onClose}
      title={isNew ? "Nouveau chantier" : "Modifier le chantier"}
    >
      <div className="flex-1 overflow-y-auto p-5">
        {isNew ? (
          <div className="mb-5 flex border border-slate-300">
            <button
              className={cn(
                "flex-1 cursor-pointer px-3 py-2 text-sm font-medium transition-colors",
                creationMode === "MANUAL"
                  ? "bg-seno-700 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50",
              )}
              onClick={() => setCreationMode("MANUAL")}
              type="button"
            >
              Création manuelle
            </button>
            <button
              className={cn(
                "flex-1 cursor-pointer border-l border-slate-300 px-3 py-2 text-sm font-medium transition-colors",
                creationMode === "QUOTE"
                  ? "bg-seno-700 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50",
              )}
              onClick={() => setCreationMode("QUOTE")}
              type="button"
            >
              Depuis un devis signé
            </button>
          </div>
        ) : null}

        {isQuoteMode ? (
          <QuoteCreation
            candidates={candidates.filter(
              (quote) => Boolean(quote.clientId) && !quote.chantierId,
            )}
            errorMessage={creationMode === "QUOTE" ? creationError : null}
            isCreating={isCreating}
            onCreate={onCreateFromQuote}
          />
        ) : (
          <>
            <ChantierForm
              clients={clients}
              draft={draft}
              onUpdate={onUpdate}
              revenue={revenue}
              setRevenue={setRevenue}
            />
            {saveError ? (
              <p
                className="mt-5 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                {saveError}
              </p>
            ) : null}
          </>
        )}
      </div>
      {!isQuoteMode ? (
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
            onClick={() => onSave(revenue)}
            type="button"
          >
            {isSaving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </footer>
      ) : null}
    </DrawerShell>
  );
}

export function ChantiersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<ChantierDraft | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ChantierStatus>(
    "ALL",
  );
  const [creationMode, setCreationMode] = useState<CreationMode>("MANUAL");

  const snapshotQuery = useQuery({
    enabled: Boolean(user),
    queryFn: getChantierSnapshot,
    queryKey: ["chantiers", user?.id],
  });

  const invalidateChantiers = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["chantiers", user?.id] }),
      queryClient.invalidateQueries({ queryKey: ["quotes"] }),
    ]);
  };

  const saveMutation = useMutation({
    mutationFn: async ({
      amount,
      nextDraft,
    }: {
      amount: string;
      nextDraft: ChantierDraft;
    }) => {
      if (!user) {
        throw new Error("Utilisateur non disponible.");
      }

      await saveChantier({
        id: nextDraft.id,
        input: toInput(nextDraft, amount),
        userId: user.id,
      });
    },
    onSuccess: async () => {
      setDraft(null);
      await invalidateChantiers();
    },
  });

  const createFromQuoteMutation = useMutation({
    mutationFn: createChantierFromQuote,
    onSuccess: async () => {
      setDraft(null);
      await invalidateChantiers();
    },
  });

  const chantiers = snapshotQuery.data?.chantiers ?? emptyChantiers;
  const visibleChantiers = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("fr-FR");

    return chantiers.filter((chantier) => {
      const matchesStatus =
        statusFilter === "ALL" || chantier.status === statusFilter;
      const haystack =
        `${chantier.name} ${chantier.clientName} ${chantier.address}`.toLocaleLowerCase(
          "fr-FR",
        );

      return matchesStatus && haystack.includes(normalizedSearch);
    });
  }, [chantiers, search, statusFilter]);

  if (snapshotQuery.isPending) {
    return (
      <PageCanvas title="Chantiers">
        <div className="mt-5 h-72 animate-pulse border border-slate-200 bg-white" />
      </PageCanvas>
    );
  }

  if (snapshotQuery.isError || !snapshotQuery.data || !user) {
    return (
      <PageCanvas title="Chantiers">
        <p className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Impossible de charger les chantiers. Vérifie que la migration a bien
          été appliquée, puis réessaie.
        </p>
      </PageCanvas>
    );
  }

  const statusCounts = chantierStatuses.reduce(
    (counts, status) => ({
      ...counts,
      [status]: chantiers.filter((chantier) => chantier.status === status)
        .length,
    }),
    {} as Record<ChantierStatus, number>,
  );

  return (
    <PageCanvas title="Chantiers">
      <section className="mt-6 border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-[280px]">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            />
            <input
              aria-label="Rechercher un chantier"
              className="h-10 w-full border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un chantier…"
              value={search}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <select
              aria-label="Filtrer par statut"
              className="h-10 cursor-pointer border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
              onChange={(event) =>
                setStatusFilter(event.target.value as "ALL" | ChantierStatus)
              }
              value={statusFilter}
            >
              <option value="ALL">Tous les statuts ({chantiers.length})</option>
              {chantierStatuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]} ({statusCounts[status]})
                </option>
              ))}
            </select>
            <button
              className="flex h-10 cursor-pointer items-center justify-center gap-2 bg-seno-700 px-4 text-sm font-medium text-white transition-colors hover:bg-seno-800"
              onClick={() => {
                saveMutation.reset();
                createFromQuoteMutation.reset();
                setCreationMode("MANUAL");
                setDraft(createDraft());
              }}
              type="button"
            >
              <Plus aria-hidden="true" className="size-4" />
              Nouveau chantier
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1060px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold tracking-[0.1em] text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Chantier</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Adresse</th>
                <th className="px-4 py-3 text-right">CA prévi.</th>
                <th className="px-4 py-3">Début</th>
                <th className="px-4 py-3">Fin prévue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleChantiers.map((chantier) => (
                <tr
                  className="cursor-pointer transition-colors hover:bg-slate-50"
                  key={chantier.id}
                  onClick={() => {
                    saveMutation.reset();
                    createFromQuoteMutation.reset();
                    setCreationMode("MANUAL");
                    setDraft(createDraft(chantier));
                  }}
                >
                  <td className="max-w-100 px-4 py-3">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {chantier.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Marge : —</p>
                  </td>
                  <td className="max-w-52 px-4 py-3 text-sm text-slate-700">
                    <p className="truncate">{chantier.clientName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <ChantierStatusBadge status={chantier.status} />
                  </td>
                  <td className="max-w-75 px-4 py-3 text-sm text-slate-600">
                    <p className="truncate">{chantier.address || "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-slate-800">
                    {formatCurrency(chantier.initialSignedQuoteAmount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {formatDate(chantier.plannedStartDate)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {formatDate(chantier.plannedEndDate)}
                  </td>
                </tr>
              ))}
              {visibleChantiers.length === 0 ? (
                <tr>
                  <td className="px-5 py-14 text-center" colSpan={7}>
                    <p className="text-sm font-medium text-slate-800">
                      {chantiers.length
                        ? "Aucun chantier ne correspond aux filtres"
                        : "Aucun chantier pour le moment"}
                    </p>
                    <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
                      {chantiers.length
                        ? "Ajuste la recherche ou le statut pour afficher d’autres chantiers."
                        : "Crée un chantier manuellement ou à partir d’un devis signé."}
                    </p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <footer className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
          <span>
            {visibleChantiers.length} chantier
            {visibleChantiers.length > 1 ? "s" : ""} affiché
            {visibleChantiers.length > 1 ? "s" : ""}
          </span>
        </footer>
      </section>

      {draft ? (
        <ChantierDrawer
          candidates={snapshotQuery.data.signedQuotes}
          clients={snapshotQuery.data.clients}
          creationError={
            saveMutation.isError && saveMutation.error instanceof Error
              ? saveMutation.error.message
              : createFromQuoteMutation.isError &&
                  createFromQuoteMutation.error instanceof Error
                ? createFromQuoteMutation.error.message
                : null
          }
          creationMode={creationMode}
          draft={draft}
          isCreating={createFromQuoteMutation.isPending}
          isSaving={saveMutation.isPending}
          onClose={() => setDraft(null)}
          onCreateFromQuote={(quoteId) =>
            createFromQuoteMutation.mutate(quoteId)
          }
          onSave={(amount) => saveMutation.mutate({ amount, nextDraft: draft })}
          onUpdate={(patch) =>
            setDraft((current) =>
              current ? { ...current, ...patch } : current,
            )
          }
          setCreationMode={(mode) => {
            saveMutation.reset();
            createFromQuoteMutation.reset();
            setCreationMode(mode);
          }}
        />
      ) : null}
    </PageCanvas>
  );
}
