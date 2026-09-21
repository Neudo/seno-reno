import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Landmark, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { useAuth } from "@/features/auth/context/AuthProvider";
import {
  createFixedCost,
  deleteFixedCost,
  fixedCostRecurrences,
  getFinanceSnapshot,
  updateFixedCost,
  type FixedCost,
  type FixedCostRecurrence,
} from "@/features/finances/api/finance-api";
import {
  FieldLabel,
  FinanceCard,
  FinanceDrawer,
  FinanceEmpty,
  FinancePanel,
  fieldClassName,
  formatCurrency,
  formatDate,
  getMonthlyEquivalent,
  getRecurringDueDate,
  getTodayIso,
  parseAmount,
  recurrenceLabels,
  textAreaClassName,
} from "@/features/finances/components/finance-ui";
import { PageCanvas } from "@/shared/components/app-shell/PageCanvas";
import { cn } from "@/shared/lib/utils";

type FixedCostDraft = {
  amount: string;
  category: string;
  comment: string;
  dueDate: string;
  dueDay: string;
  dueMode: "DATE" | "DAY";
  endDate: string;
  id: string | null;
  isActive: boolean;
  name: string;
  recurrence: FixedCostRecurrence;
  reminderDaysBefore: string;
  startDate: string;
};

function createDraft(cost?: FixedCost): FixedCostDraft {
  return {
    amount: cost ? String(cost.amount) : "",
    category: cost?.category ?? "",
    comment: cost?.comment ?? "",
    dueDate: cost?.dueDate ?? "",
    dueDay: cost?.dueDay ? String(cost.dueDay) : "",
    dueMode: cost?.dueDate ? "DATE" : "DAY",
    endDate: cost?.endDate ?? "",
    id: cost?.id ?? null,
    isActive: cost?.isActive ?? true,
    name: cost?.name ?? "",
    recurrence: cost?.recurrence ?? "MONTHLY",
    reminderDaysBefore: String(cost?.reminderDaysBefore ?? 3),
    startDate: cost?.startDate ?? getTodayIso(),
  };
}

function FixedCostDrawer({
  draft,
  errorMessage,
  isSaving,
  onClose,
  onSave,
  onUpdate,
}: {
  draft: FixedCostDraft;
  errorMessage: string | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: () => void;
  onUpdate: (patch: Partial<FixedCostDraft>) => void;
}) {
  return (
    <FinanceDrawer
      onClose={onClose}
      title={draft.id ? "Modifier la charge" : "Nouvelle charge"}
    >
      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
            <FieldLabel htmlFor="cost-name">
              Charge
              <input
                className={fieldClassName}
                id="cost-name"
                maxLength={180}
                onChange={(event) => onUpdate({ name: event.target.value })}
                placeholder="Ex. Assurance décennale"
                value={draft.name}
              />
            </FieldLabel>
            <FieldLabel htmlFor="cost-category">
              Catégorie
              <input
                className={fieldClassName}
                id="cost-category"
                maxLength={80}
                onChange={(event) => onUpdate({ category: event.target.value })}
                placeholder="Ex. Assurance"
                value={draft.category}
              />
            </FieldLabel>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldLabel htmlFor="cost-amount">
              Montant TTC
              <input
                className={fieldClassName}
                id="cost-amount"
                inputMode="decimal"
                onChange={(event) => onUpdate({ amount: event.target.value })}
                placeholder="0,00"
                value={draft.amount}
              />
            </FieldLabel>
            <FieldLabel htmlFor="cost-recurrence">
              Fréquence
              <select
                className={fieldClassName}
                id="cost-recurrence"
                onChange={(event) =>
                  onUpdate({ recurrence: event.target.value as FixedCostRecurrence })
                }
                value={draft.recurrence}
              >
                {fixedCostRecurrences.map((recurrence) => (
                  <option key={recurrence} value={recurrence}>
                    {recurrenceLabels[recurrence]}
                  </option>
                ))}
              </select>
            </FieldLabel>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700">Échéance</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <button
                className={cn(
                  "cursor-pointer border p-3 text-left text-sm transition-colors",
                  draft.dueMode === "DAY"
                    ? "border-seno-700 bg-seno-50 text-seno-900"
                    : "border-slate-300 text-slate-600 hover:bg-slate-50",
                )}
                onClick={() => onUpdate({ dueMode: "DAY" })}
                type="button"
              >
                Jour du mois
              </button>
              <button
                className={cn(
                  "cursor-pointer border p-3 text-left text-sm transition-colors",
                  draft.dueMode === "DATE"
                    ? "border-seno-700 bg-seno-50 text-seno-900"
                    : "border-slate-300 text-slate-600 hover:bg-slate-50",
                )}
                onClick={() => onUpdate({ dueMode: "DATE" })}
                type="button"
              >
                Date de référence
              </button>
            </div>
            {draft.dueMode === "DAY" ? (
              <FieldLabel htmlFor="cost-due-day">
                <span className="sr-only">Jour d’échéance</span>
                <input
                  className={cn(fieldClassName, "mt-2 w-full")}
                  id="cost-due-day"
                  max="31"
                  min="1"
                  onChange={(event) => onUpdate({ dueDay: event.target.value })}
                  placeholder="Ex. 5"
                  type="number"
                  value={draft.dueDay}
                />
              </FieldLabel>
            ) : (
              <FieldLabel htmlFor="cost-due-date">
                <span className="sr-only">Date d’échéance</span>
                <input
                  className={cn(fieldClassName, "mt-2 w-full")}
                  id="cost-due-date"
                  onChange={(event) => onUpdate({ dueDate: event.target.value })}
                  type="date"
                  value={draft.dueDate}
                />
              </FieldLabel>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldLabel htmlFor="cost-start-date">
              Début
              <input
                className={fieldClassName}
                id="cost-start-date"
                onChange={(event) => onUpdate({ startDate: event.target.value })}
                type="date"
                value={draft.startDate}
              />
            </FieldLabel>
            <FieldLabel htmlFor="cost-end-date">
              Fin <span className="font-normal text-slate-400">(facultative)</span>
              <input
                className={fieldClassName}
                id="cost-end-date"
                onChange={(event) => onUpdate({ endDate: event.target.value })}
                type="date"
                value={draft.endDate}
              />
            </FieldLabel>
          </div>

          <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
            <FieldLabel htmlFor="cost-reminder">
              Rappel avant
              <div className="flex">
                <input
                  className={cn(fieldClassName, "w-full")}
                  id="cost-reminder"
                  max="365"
                  min="0"
                  onChange={(event) =>
                    onUpdate({ reminderDaysBefore: event.target.value })
                  }
                  type="number"
                  value={draft.reminderDaysBefore}
                />
                <span className="flex h-10 items-center border border-l-0 border-slate-300 bg-slate-50 px-3 text-sm text-slate-500">
                  jours
                </span>
              </div>
            </FieldLabel>
            <label className="flex cursor-pointer items-center gap-3 border border-slate-300 px-3 py-2 text-sm text-slate-700">
              <input
                checked={draft.isActive}
                className="size-4 accent-[#00365a]"
                onChange={(event) => onUpdate({ isActive: event.target.checked })}
                type="checkbox"
              />
              Charge active
            </label>
          </div>

          <FieldLabel htmlFor="cost-comment">
            Commentaire <span className="font-normal text-slate-400">(facultatif)</span>
            <textarea
              className={textAreaClassName}
              id="cost-comment"
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

export function ChargesFixesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const financeQuery = useQuery({
    queryFn: getFinanceSnapshot,
    queryKey: ["finance-snapshot"],
  });
  const [draft, setDraft] = useState<FixedCostDraft | null>(null);

  const invalidateFinance = () =>
    queryClient.invalidateQueries({ queryKey: ["finance-snapshot"] });

  const saveMutation = useMutation({
    mutationFn: async (nextDraft: FixedCostDraft) => {
      if (!user) {
        throw new Error("Connecte-toi pour enregistrer une charge.");
      }

      const amount = parseAmount(nextDraft.amount);
      const dueDay = Number(nextDraft.dueDay);
      const reminderDaysBefore = Number(nextDraft.reminderDaysBefore);
      const resolvedDueDay = nextDraft.dueMode === "DAY" ? dueDay : null;
      const resolvedDueDate = nextDraft.dueMode === "DATE" ? nextDraft.dueDate : null;

      if (!nextDraft.name.trim() || !amount || !nextDraft.startDate) {
        throw new Error("Renseigne le nom, le montant et la date de début.");
      }

      if (
        (nextDraft.dueMode === "DAY" && (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31)) ||
        (nextDraft.dueMode === "DATE" && !nextDraft.dueDate)
      ) {
        throw new Error("Renseigne une échéance valide.");
      }

      if (
        !Number.isInteger(reminderDaysBefore) ||
        reminderDaysBefore < 0 ||
        reminderDaysBefore > 365
      ) {
        throw new Error("Le rappel doit être compris entre 0 et 365 jours.");
      }

      if (nextDraft.endDate && nextDraft.endDate < nextDraft.startDate) {
        throw new Error("La date de fin ne peut pas précéder la date de début.");
      }

      const payload = {
        amount,
        category: nextDraft.category.trim(),
        comment: nextDraft.comment.trim(),
        dueDate: resolvedDueDate,
        dueDay: resolvedDueDay,
        endDate: nextDraft.endDate || null,
        isActive: nextDraft.isActive,
        name: nextDraft.name.trim(),
        recurrence: nextDraft.recurrence,
        reminderDaysBefore,
        startDate: nextDraft.startDate,
      };

      if (nextDraft.id) {
        await updateFixedCost({ ...payload, id: nextDraft.id });
      } else {
        await createFixedCost({ ...payload, userId: user.id });
      }
    },
    onSuccess: async () => {
      setDraft(null);
      await invalidateFinance();
    },
  });
  const toggleMutation = useMutation({
    mutationFn: async (cost: FixedCost) =>
      updateFixedCost({ ...cost, isActive: !cost.isActive }),
    onSuccess: invalidateFinance,
  });
  const deleteMutation = useMutation({
    mutationFn: deleteFixedCost,
    onSuccess: invalidateFinance,
  });

  const monthlyTotal = useMemo(
    () =>
      (financeQuery.data?.fixedCosts ?? [])
        .filter((cost) => cost.isActive)
        .reduce(
          (total, cost) => total + getMonthlyEquivalent(cost.amount, cost.recurrence),
          0,
        ),
    [financeQuery.data?.fixedCosts],
  );

  if (financeQuery.isPending) {
    return (
      <PageCanvas title="Charges fixes">
        <div className="mt-5 h-72 animate-pulse border border-slate-200 bg-white" />
      </PageCanvas>
    );
  }

  if (financeQuery.isError || !financeQuery.data) {
    return (
      <PageCanvas title="Charges fixes">
        <div className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Impossible de charger les charges fixes. Vérifie que la migration a bien
          été appliquée, puis réessaie.
        </div>
      </PageCanvas>
    );
  }

  return (
    <PageCanvas title="Charges fixes">
      <div className="mt-2 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <p className="max-w-3xl text-sm leading-6 text-slate-500">
          Coûts récurrents de l’entreprise, indépendants des chantiers. Ils sont
          mensualisés ici et n’ajoutent pas encore de mouvements automatiques à la
          trésorerie.
        </p>
        <button
          className="flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 bg-seno-700 px-4 text-sm font-medium text-white transition-colors hover:bg-seno-800"
          onClick={() => {
            saveMutation.reset();
            setDraft(createDraft());
          }}
          type="button"
        >
          <Plus aria-hidden="true" className="size-4" />
          Nouvelle charge
        </button>
      </div>

      <section className="mt-5 max-w-sm">
        <FinanceCard
          icon={Landmark}
          label="Charges fixes mensualisées"
          note={`${financeQuery.data.fixedCosts.filter((cost) => cost.isActive).length} charge${financeQuery.data.fixedCosts.filter((cost) => cost.isActive).length > 1 ? "s" : ""} active${financeQuery.data.fixedCosts.filter((cost) => cost.isActive).length > 1 ? "s" : ""}`}
          tone="outgoing"
          value={formatCurrency(monthlyTotal)}
        />
      </section>

      <FinancePanel className="mt-5" title="Charges récurrentes">
        <div className="overflow-x-auto">
          <table className="min-w-[940px] w-full border-collapse text-left">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] tracking-[0.1em] text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Charge</th>
                <th className="px-4 py-3 font-semibold">Catégorie</th>
                <th className="px-4 py-3 text-right font-semibold">Montant TTC</th>
                <th className="px-4 py-3 font-semibold">Fréquence</th>
                <th className="px-4 py-3 font-semibold">Prochaine échéance</th>
                <th className="px-4 py-3 font-semibold">Rappel</th>
                <th className="px-4 py-3 font-semibold">Actif</th>
                <th className="w-20 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {financeQuery.data.fixedCosts.map((cost) => {
                const nextDueDate = getRecurringDueDate({
                  dueDate: cost.dueDate,
                  dueDay: cost.dueDay,
                  recurrence: cost.recurrence,
                  referenceDate: new Date(),
                  startDate: cost.startDate,
                });
                const nextDueIso = nextDueDate.toISOString().slice(0, 10);

                return (
                  <tr
                    className={cn(
                      "transition-colors hover:bg-slate-50",
                      !cost.isActive && "bg-slate-50/70 opacity-55",
                    )}
                    key={cost.id}
                  >
                    <td className="max-w-75 px-4 py-3">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {cost.name}
                      </p>
                      {cost.comment ? (
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {cost.comment}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {cost.category || "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-800">
                      {formatCurrency(cost.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {recurrenceLabels[cost.recurrence]}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDate(nextDueIso)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {cost.reminderDaysBefore === 0
                        ? "Aucun"
                        : `${cost.reminderDaysBefore} j avant`}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        aria-label={`${cost.isActive ? "Désactiver" : "Activer"} ${cost.name}`}
                        className={cn(
                          "relative h-6 w-11 cursor-pointer border transition-colors",
                          cost.isActive
                            ? "border-seno-700 bg-seno-700"
                            : "border-slate-300 bg-slate-100",
                        )}
                        disabled={toggleMutation.isPending}
                        onClick={() => toggleMutation.mutate(cost)}
                        type="button"
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 size-4 bg-white shadow-sm transition-transform",
                            cost.isActive ? "translate-x-5" : "translate-x-0.5",
                          )}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          aria-label={`Modifier ${cost.name}`}
                          className="grid size-8 cursor-pointer place-items-center border border-slate-300 text-slate-600 hover:bg-slate-50"
                          onClick={() => {
                            saveMutation.reset();
                            setDraft(createDraft(cost));
                          }}
                          type="button"
                        >
                          <Pencil aria-hidden="true" className="size-3.5" />
                        </button>
                        <button
                          aria-label={`Supprimer ${cost.name}`}
                          className="grid size-8 cursor-pointer place-items-center border border-red-200 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (window.confirm(`Supprimer la charge « ${cost.name} » ?`)) {
                              deleteMutation.mutate(cost.id);
                            }
                          }}
                          type="button"
                        >
                          <Trash2 aria-hidden="true" className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {financeQuery.data.fixedCosts.length === 0 ? (
                <tr>
                  <td className="p-0" colSpan={8}>
                    <FinanceEmpty
                      detail="Ajoute tes coûts récurrents pour anticiper les échéances et mesurer leur poids mensuel."
                      title="Aucune charge fixe"
                    />
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </FinancePanel>

      {toggleMutation.isError || deleteMutation.isError ? (
        <p className="mt-3 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {(() => {
            const mutationError = toggleMutation.error ?? deleteMutation.error;
            return mutationError instanceof Error
              ? mutationError.message
              : "La charge n’a pas pu être mise à jour.";
          })()}
        </p>
      ) : null}

      {draft ? (
        <FixedCostDrawer
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
