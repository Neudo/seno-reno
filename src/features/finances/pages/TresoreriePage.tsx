import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useAuth } from "@/features/auth/context/AuthProvider";
import {
  cashMovementStatuses,
  createManualCashMovement,
  deleteManualCashMovement,
  getFinanceSnapshot,
  updateManualCashMovement,
  type CashMovement,
  type CashMovementStatus,
} from "@/features/finances/api/finance-api";
import {
  CashMovementKindLabel,
  CashStatusBadge,
  FieldLabel,
  FinanceDrawer,
  FinanceEmpty,
  FinancePanel,
  addMonths,
  fieldClassName,
  formatCurrency,
  formatDate,
  getMonthLabel,
  getMonthRange,
  getTodayIso,
  isDateInRange,
  parseAmount,
  textAreaClassName,
} from "@/features/finances/components/finance-ui";
import { PageCanvas } from "@/shared/components/app-shell/PageCanvas";
import { cn } from "@/shared/lib/utils";

type MovementDraft = {
  actualDate: string;
  amount: string;
  comment: string;
  direction: CashMovement["direction"];
  expectedDate: string;
  id: string | null;
  label: string;
  status: CashMovementStatus;
};

function createDraft(movement?: CashMovement): MovementDraft {
  return {
    actualDate: movement?.actualDate ?? "",
    amount: movement ? String(movement.amount) : "",
    comment: movement?.comment ?? "",
    direction: movement?.direction ?? "EXPENSE",
    expectedDate: movement?.expectedDate ?? getTodayIso(),
    id: movement?.id ?? null,
    label: movement?.label ?? "",
    status: movement?.status ?? "PLANNED",
  };
}

const statusLabels: Record<CashMovementStatus, string> = {
  CANCELLED: "Annulé",
  COMPLETED: "Terminé",
  PLANNED: "Prévu",
};

function TreasuryDrawer({
  draft,
  errorMessage,
  isSaving,
  onClose,
  onSave,
  onUpdate,
}: {
  draft: MovementDraft;
  errorMessage: string | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: () => void;
  onUpdate: (patch: Partial<MovementDraft>) => void;
}) {
  const isCompleted = draft.status === "COMPLETED";

  return (
    <FinanceDrawer
      onClose={onClose}
      title={draft.id ? "Modifier le mouvement" : "Ajouter un mouvement"}
    >
      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid gap-5">
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              className={cn(
                "min-h-20 cursor-pointer border p-3 text-left transition-colors",
                draft.direction === "INCOME"
                  ? "border-seno-700 bg-seno-50"
                  : "border-slate-300 hover:bg-slate-50",
              )}
              onClick={() => onUpdate({ direction: "INCOME" })}
              type="button"
            >
              <span className="block text-sm font-medium text-slate-800">Entrée</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                Encaissement exceptionnel
              </span>
            </button>
            <button
              className={cn(
                "min-h-20 cursor-pointer border p-3 text-left transition-colors",
                draft.direction === "EXPENSE"
                  ? "border-amber-500 bg-amber-50"
                  : "border-slate-300 hover:bg-slate-50",
              )}
              onClick={() => onUpdate({ direction: "EXPENSE" })}
              type="button"
            >
              <span className="block text-sm font-medium text-slate-800">Sortie</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                Paiement exceptionnel
              </span>
            </button>
          </div>

          <FieldLabel htmlFor="movement-label">
            Libellé
            <input
              className={fieldClassName}
              id="movement-label"
              maxLength={180}
              onChange={(event) => onUpdate({ label: event.target.value })}
              placeholder="Ex. Caution matériel"
              value={draft.label}
            />
          </FieldLabel>

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldLabel htmlFor="movement-amount">
              Montant TTC
              <input
                className={fieldClassName}
                id="movement-amount"
                inputMode="decimal"
                min="0"
                onChange={(event) => onUpdate({ amount: event.target.value })}
                placeholder="0,00"
                value={draft.amount}
              />
            </FieldLabel>
            <FieldLabel htmlFor="movement-status">
              Statut
              <select
                className={fieldClassName}
                id="movement-status"
                onChange={(event) => {
                  const status = event.target.value as CashMovementStatus;
                  onUpdate({
                    actualDate:
                      status === "COMPLETED"
                        ? draft.actualDate || getTodayIso()
                        : "",
                    status,
                  });
                }}
                value={draft.status}
              >
                {cashMovementStatuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </FieldLabel>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldLabel htmlFor="movement-expected-date">
              Date prévue
              <input
                className={fieldClassName}
                id="movement-expected-date"
                onChange={(event) => onUpdate({ expectedDate: event.target.value })}
                type="date"
                value={draft.expectedDate}
              />
            </FieldLabel>
            {isCompleted ? (
              <FieldLabel htmlFor="movement-actual-date">
                Date réelle
                <input
                  className={fieldClassName}
                  id="movement-actual-date"
                  onChange={(event) => onUpdate({ actualDate: event.target.value })}
                  type="date"
                  value={draft.actualDate}
                />
              </FieldLabel>
            ) : (
              <div className="border border-dashed border-slate-300 px-3 py-2 text-sm leading-5 text-slate-500">
                La date réelle est renseignée lorsque le mouvement est terminé.
              </div>
            )}
          </div>

          <FieldLabel htmlFor="movement-comment">
            Commentaire <span className="font-normal text-slate-400">(facultatif)</span>
            <textarea
              className={textAreaClassName}
              id="movement-comment"
              maxLength={2000}
              onChange={(event) => onUpdate({ comment: event.target.value })}
              placeholder="Précision interne"
              value={draft.comment}
            />
          </FieldLabel>

          {errorMessage ? (
            <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </div>
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
    </FinanceDrawer>
  );
}

export function TresoreriePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const financeQuery = useQuery({
    queryFn: getFinanceSnapshot,
    queryKey: ["finance-snapshot"],
  });
  const today = new Date();
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | CashMovementStatus | "OVERDUE">(
    "ALL",
  );
  const [draft, setDraft] = useState<MovementDraft | null>(null);

  const invalidateFinance = () =>
    queryClient.invalidateQueries({ queryKey: ["finance-snapshot"] });

  const saveMutation = useMutation({
    mutationFn: async (nextDraft: MovementDraft) => {
      if (!user) {
        throw new Error("Connectez-vous pour enregistrer un mouvement.");
      }

      const amount = parseAmount(nextDraft.amount);
      if (!nextDraft.label.trim() || !amount || !nextDraft.expectedDate) {
        throw new Error("Renseignez le libellé, le montant et la date prévue.");
      }

      if (nextDraft.status === "COMPLETED" && !nextDraft.actualDate) {
        throw new Error("Renseignez la date réelle du mouvement terminé.");
      }

      const payload = {
        actualDate:
          nextDraft.status === "COMPLETED" ? nextDraft.actualDate : null,
        amount,
        comment: nextDraft.comment.trim(),
        direction: nextDraft.direction,
        expectedDate: nextDraft.expectedDate,
        label: nextDraft.label.trim(),
        status: nextDraft.status,
      };

      if (nextDraft.id) {
        await updateManualCashMovement({ ...payload, id: nextDraft.id });
      } else {
        await createManualCashMovement({ ...payload, userId: user.id });
      }
    },
    onSuccess: async () => {
      setDraft(null);
      await invalidateFinance();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteManualCashMovement,
    onSuccess: invalidateFinance,
  });

  const monthRange = getMonthRange(visibleMonth);
  const visibleMovements = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("fr-FR");

    return (financeQuery.data?.cashMovements ?? []).filter((movement) => {
      const matchesMonth = isDateInRange(
        movement.expectedDate,
        monthRange.start,
        monthRange.end,
      );
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "OVERDUE"
          ? movement.status === "PLANNED" && movement.expectedDate < getTodayIso()
          : movement.status === statusFilter);
      const haystack = `${movement.label} ${movement.comment}`.toLocaleLowerCase(
        "fr-FR",
      );

      return matchesMonth && matchesStatus && haystack.includes(normalizedSearch);
    });
  }, [financeQuery.data?.cashMovements, monthRange.end, monthRange.start, search, statusFilter]);

  const summaryMovements = (financeQuery.data?.cashMovements ?? []).filter(
    (movement) =>
      movement.status !== "CANCELLED" &&
      isDateInRange(movement.expectedDate, monthRange.start, monthRange.end),
  );
  const income = summaryMovements
    .filter((movement) => movement.direction === "INCOME")
    .reduce((total, movement) => total + movement.amount, 0);
  const expense = summaryMovements
    .filter((movement) => movement.direction === "EXPENSE")
    .reduce((total, movement) => total + movement.amount, 0);

  if (financeQuery.isPending) {
    return (
      <PageCanvas title="Trésorerie">
        <div className="mt-5 h-72 animate-pulse border border-slate-200 bg-white" />
      </PageCanvas>
    );
  }

  if (financeQuery.isError || !financeQuery.data) {
    return (
      <PageCanvas title="Trésorerie">
        <div className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Impossible de charger la trésorerie. Vérifiez que la migration a bien été
          appliquée, puis réessayez.
        </div>
      </PageCanvas>
    );
  }

  return (
    <PageCanvas title="Trésorerie">
      <div className="mt-2 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="max-w-3xl text-sm leading-6 text-slate-500">
            Prévision et suivi des mouvements exceptionnels. Les encaissements et
            paiements issus des chantiers seront ajoutés depuis leurs sources.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              aria-label="Mois précédent"
              className="grid size-9 cursor-pointer place-items-center border border-slate-300 text-slate-600 hover:bg-slate-50"
              onClick={() => setVisibleMonth((month) => addMonths(month, -1))}
              type="button"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </button>
            <p className="min-w-42 text-center text-sm font-semibold text-slate-800">
              {getMonthLabel(visibleMonth)}
            </p>
            <button
              aria-label="Mois suivant"
              className="grid size-9 cursor-pointer place-items-center border border-slate-300 text-slate-600 hover:bg-slate-50"
              onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
              type="button"
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>
        <button
          className="flex h-10 cursor-pointer items-center justify-center gap-2 bg-seno-700 px-4 text-sm font-medium text-white transition-colors hover:bg-seno-800"
          onClick={() => {
            saveMutation.reset();
            setDraft(createDraft());
          }}
          type="button"
        >
          <Plus aria-hidden="true" className="size-4" />
          Ajouter un mouvement
        </button>
      </div>

      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-[11px] font-semibold tracking-[0.1em] text-emerald-800 uppercase">
            Entrées
          </p>
          <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-emerald-900">
            {formatCurrency(income)}
          </p>
        </div>
        <div className="border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-[11px] font-semibold tracking-[0.1em] text-amber-900 uppercase">
            Sorties
          </p>
          <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-amber-950">
            {formatCurrency(expense)}
          </p>
        </div>
        <div className="border border-seno-100 bg-seno-50 px-4 py-3">
          <p className="text-[11px] font-semibold tracking-[0.1em] text-seno-700 uppercase">
            Solde prévisionnel
          </p>
          <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-seno-900">
            {formatCurrency(income - expense)}
          </p>
        </div>
      </section>

      <FinancePanel className="mt-5" title="Mouvements du mois">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            />
            <input
              aria-label="Rechercher un mouvement"
              className="h-10 w-full border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Libellé ou commentaire…"
              value={search}
            />
          </label>
          <select
            aria-label="Filtrer par statut"
            className="h-10 border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
            onChange={(event) =>
              setStatusFilter(
                event.target.value as "ALL" | CashMovementStatus | "OVERDUE",
              )
            }
            value={statusFilter}
          >
            <option value="ALL">Tous les statuts</option>
            <option value="PLANNED">Prévu</option>
            <option value="COMPLETED">Terminé</option>
            <option value="OVERDUE">En retard</option>
            <option value="CANCELLED">Annulé</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[850px] w-full border-collapse text-left">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] tracking-[0.1em] text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Date prévue</th>
                <th className="px-4 py-3 font-semibold">Date réelle</th>
                <th className="px-4 py-3 font-semibold">Libellé</th>
                <th className="px-4 py-3 font-semibold">Origine</th>
                <th className="px-4 py-3 text-right font-semibold">Montant</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="w-20 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleMovements.map((movement) => {
                const isManual = movement.kind !== "PERSONAL_REIMBURSEMENT";
                return (
                  <tr className="transition-colors hover:bg-slate-50" key={movement.id}>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDate(movement.expectedDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDate(movement.actualDate)}
                    </td>
                    <td className="max-w-85 px-4 py-3">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {movement.label}
                      </p>
                      {movement.comment ? (
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {movement.comment}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      <CashMovementKindLabel movement={movement} />
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right text-sm font-semibold",
                        movement.direction === "INCOME"
                          ? "text-emerald-700"
                          : "text-slate-800",
                      )}
                    >
                      {movement.direction === "INCOME" ? "+" : "−"}
                      {formatCurrency(movement.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <CashStatusBadge movement={movement} />
                    </td>
                    <td className="px-4 py-3">
                      {isManual ? (
                        <div className="flex justify-end gap-1">
                          <button
                            aria-label={`Modifier ${movement.label}`}
                            className="grid size-8 cursor-pointer place-items-center border border-slate-300 text-slate-600 hover:bg-slate-50"
                            onClick={() => {
                              saveMutation.reset();
                              setDraft(createDraft(movement));
                            }}
                            type="button"
                          >
                            <Pencil aria-hidden="true" className="size-3.5" />
                          </button>
                          <button
                            aria-label={`Supprimer ${movement.label}`}
                            className="grid size-8 cursor-pointer place-items-center border border-red-200 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={deleteMutation.isPending}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Supprimer le mouvement « ${movement.label} » ?`,
                                )
                              ) {
                                deleteMutation.mutate(movement.id);
                              }
                            }}
                            type="button"
                          >
                            <Trash2 aria-hidden="true" className="size-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="block text-right text-xs text-slate-400">PE</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {visibleMovements.length === 0 ? (
                <tr>
                  <td className="p-0" colSpan={7}>
                    <FinanceEmpty
                      detail={
                        search || statusFilter !== "ALL"
                          ? "Aucun mouvement ne correspond aux filtres du mois."
                          : "Ajoutez un mouvement exceptionnel pour démarrer le suivi de trésorerie."
                      }
                      title="Aucun mouvement ce mois-ci"
                    />
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <footer className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
          <span>
            {visibleMovements.length} mouvement{visibleMovements.length > 1 ? "s" : ""}
          </span>
          <span>Les montants sont exprimés TTC.</span>
        </footer>
      </FinancePanel>

      {deleteMutation.isError ? (
        <p className="mt-3 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {deleteMutation.error instanceof Error
            ? deleteMutation.error.message
            : "Le mouvement n’a pas pu être supprimé."}
        </p>
      ) : null}

      {draft ? (
        <TreasuryDrawer
          draft={draft}
          errorMessage={
            saveMutation.isError && saveMutation.error instanceof Error
              ? saveMutation.error.message
              : null
          }
          isSaving={saveMutation.isPending}
          onClose={() => setDraft(null)}
          onSave={() => saveMutation.mutate(draft)}
          onUpdate={(patch) => setDraft((current) => (current ? { ...current, ...patch } : current))}
        />
      ) : null}
    </PageCanvas>
  );
}
