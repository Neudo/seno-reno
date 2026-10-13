import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Pencil, Plus, Search, Trash2, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";

import { useAuth } from "@/features/auth/context/AuthProvider";
import {
  createPersonalExpense,
  deletePersonalExpense,
  getFinanceSnapshot,
  personalExpenseTypes,
  reimbursePersonalExpense,
  updatePersonalExpense,
  type PersonalExpense,
  type PersonalExpenseType,
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
  getTodayIso,
  parseAmount,
  textAreaClassName,
} from "@/features/finances/components/finance-ui";
import { PageCanvas } from "@/shared/components/app-shell/PageCanvas";
import { cn } from "@/shared/lib/utils";

type PersonalExpenseDraft = {
  amount: string;
  comment: string;
  expenseDate: string;
  id: string | null;
  label: string;
  plannedReimbursementDate: string;
  supplier: string;
  type: PersonalExpenseType;
};

function createDraft(expense?: PersonalExpense): PersonalExpenseDraft {
  return {
    amount: expense ? String(expense.amount) : "",
    comment: expense?.comment ?? "",
    expenseDate: expense?.expenseDate ?? getTodayIso(),
    id: expense?.id ?? null,
    label: expense?.label ?? "",
    plannedReimbursementDate: expense?.plannedReimbursementDate ?? "",
    supplier: expense?.supplier ?? "",
    type: expense?.type ?? "PERSONAL_ADVANCE",
  };
}

const typeLabels: Record<PersonalExpenseType, string> = {
  EXPENSE_REPORT: "Note de frais",
  PERSONAL_ADVANCE: "Avance personnelle",
};

const emptyExpenses: PersonalExpense[] = [];

function PersonalExpenseDrawer({
  draft,
  errorMessage,
  isSaving,
  onClose,
  onSave,
  onUpdate,
}: {
  draft: PersonalExpenseDraft;
  errorMessage: string | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: () => void;
  onUpdate: (patch: Partial<PersonalExpenseDraft>) => void;
}) {
  return (
    <FinanceDrawer
      onClose={onClose}
      title={draft.id ? "Modifier la dépense" : "Ajouter une dépense"}
    >
      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid gap-5">
          <FieldLabel htmlFor="expense-type">
            Type
            <select
              className={fieldClassName}
              id="expense-type"
              onChange={(event) =>
                onUpdate({ type: event.target.value as PersonalExpenseType })
              }
              value={draft.type}
            >
              {personalExpenseTypes.map((type) => (
                <option key={type} value={type}>
                  {typeLabels[type]}
                </option>
              ))}
            </select>
          </FieldLabel>

          <FieldLabel htmlFor="expense-label">
            Libellé
            <input
              className={fieldClassName}
              id="expense-label"
              maxLength={180}
              onChange={(event) => onUpdate({ label: event.target.value })}
              placeholder="Ex. Achat de fournitures"
              value={draft.label}
            />
          </FieldLabel>

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldLabel htmlFor="expense-supplier">
              Fournisseur <span className="font-normal text-slate-400">(facultatif)</span>
              <input
                className={fieldClassName}
                id="expense-supplier"
                maxLength={180}
                onChange={(event) => onUpdate({ supplier: event.target.value })}
                placeholder="Ex. Point P"
                value={draft.supplier}
              />
            </FieldLabel>
            <FieldLabel htmlFor="expense-amount">
              Montant TTC
              <input
                className={fieldClassName}
                id="expense-amount"
                inputMode="decimal"
                onChange={(event) => onUpdate({ amount: event.target.value })}
                placeholder="0,00"
                value={draft.amount}
              />
            </FieldLabel>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldLabel htmlFor="expense-date">
              Date de dépense
              <input
                className={fieldClassName}
                id="expense-date"
                onChange={(event) => onUpdate({ expenseDate: event.target.value })}
                type="date"
                value={draft.expenseDate}
              />
            </FieldLabel>
            <FieldLabel htmlFor="planned-reimbursement-date">
              Remboursement prévu <span className="font-normal text-slate-400">(facultatif)</span>
              <input
                className={fieldClassName}
                id="planned-reimbursement-date"
                onChange={(event) =>
                  onUpdate({ plannedReimbursementDate: event.target.value })
                }
                type="date"
                value={draft.plannedReimbursementDate}
              />
            </FieldLabel>
          </div>

          <div className="border border-seno-100 bg-seno-50 px-3 py-2.5 text-sm leading-5 text-seno-900">
            Affectation : entreprise. Le rattachement à un chantier sera disponible
            lorsque les chantiers seront gérés dans l’application.
          </div>

          <FieldLabel htmlFor="expense-comment">
            Commentaire <span className="font-normal text-slate-400">(facultatif)</span>
            <textarea
              className={textAreaClassName}
              id="expense-comment"
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

function ReimbursementDrawer({
  errorMessage,
  expense,
  isSaving,
  onClose,
  onSave,
}: {
  errorMessage: string | null;
  expense: PersonalExpense;
  isSaving: boolean;
  onClose: () => void;
  onSave: (date: string) => void;
}) {
  const [date, setDate] = useState(getTodayIso());

  return (
    <FinanceDrawer onClose={onClose} title="Enregistrer le remboursement">
      <div className="flex-1 overflow-y-auto p-5">
        <p className="text-sm leading-6 text-slate-600">
          Le remboursement créera automatiquement une sortie dans la trésorerie.
        </p>
        <div className="mt-5 border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-medium text-slate-800">{expense.label}</p>
          <p className="mt-1 text-sm text-slate-500">{formatCurrency(expense.amount)}</p>
        </div>
        <FieldLabel htmlFor="reimbursement-date">
          <span className="mt-5">Date de remboursement</span>
          <input
            className={fieldClassName}
            id="reimbursement-date"
            min={expense.expenseDate}
            onChange={(event) => setDate(event.target.value)}
            type="date"
            value={date}
          />
        </FieldLabel>
        {errorMessage ? (
          <p className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
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
          disabled={isSaving || !date}
          onClick={() => onSave(date)}
          type="button"
        >
          {isSaving ? "Enregistrement…" : "Confirmer"}
        </button>
      </footer>
    </FinanceDrawer>
  );
}

export function RemboursementsPePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const financeQuery = useQuery({
    queryFn: getFinanceSnapshot,
    queryKey: ["finance-snapshot"],
  });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | PersonalExpenseType>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "REIMBURSED">(
    "ALL",
  );
  const [draft, setDraft] = useState<PersonalExpenseDraft | null>(null);
  const [expenseToReimburse, setExpenseToReimburse] = useState<PersonalExpense | null>(
    null,
  );

  const invalidateFinance = () =>
    queryClient.invalidateQueries({ queryKey: ["finance-snapshot"] });
  const saveMutation = useMutation({
    mutationFn: async (nextDraft: PersonalExpenseDraft) => {
      if (!user) {
        throw new Error("Connectez-vous pour enregistrer une dépense.");
      }

      const amount = parseAmount(nextDraft.amount);
      if (!nextDraft.label.trim() || !amount || !nextDraft.expenseDate) {
        throw new Error("Renseignez le libellé, le montant et la date de dépense.");
      }

      if (
        nextDraft.plannedReimbursementDate &&
        nextDraft.plannedReimbursementDate < nextDraft.expenseDate
      ) {
        throw new Error("Le remboursement prévu ne peut pas précéder la dépense.");
      }

      const payload = {
        amount,
        comment: nextDraft.comment.trim(),
        expenseDate: nextDraft.expenseDate,
        label: nextDraft.label.trim(),
        plannedReimbursementDate: nextDraft.plannedReimbursementDate || null,
        supplier: nextDraft.supplier.trim(),
        type: nextDraft.type,
      };

      if (nextDraft.id) {
        await updatePersonalExpense({ ...payload, id: nextDraft.id });
      } else {
        await createPersonalExpense({ ...payload, userId: user.id });
      }
    },
    onSuccess: async () => {
      setDraft(null);
      await invalidateFinance();
    },
  });
  const reimbursementMutation = useMutation({
    mutationFn: reimbursePersonalExpense,
    onSuccess: async () => {
      setExpenseToReimburse(null);
      await invalidateFinance();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deletePersonalExpense,
    onSuccess: invalidateFinance,
  });

  const expenses = financeQuery.data?.personalExpenses;
  const visibleExpenses = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("fr-FR");

    return (expenses ?? emptyExpenses).filter((expense) => {
      const matchesType = typeFilter === "ALL" || expense.type === typeFilter;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "PENDING" ? !expense.reimbursedAt : Boolean(expense.reimbursedAt));
      const haystack = `${expense.label} ${expense.supplier} ${expense.comment}`.toLocaleLowerCase(
        "fr-FR",
      );

      return matchesType && matchesStatus && haystack.includes(normalizedSearch);
    });
  }, [expenses, search, statusFilter, typeFilter]);
  const pendingTotal = (expenses ?? emptyExpenses)
    .filter((expense) => !expense.reimbursedAt)
    .reduce((total, expense) => total + expense.amount, 0);
  const reimbursedTotal = (expenses ?? emptyExpenses)
    .filter((expense) => expense.reimbursedAt)
    .reduce((total, expense) => total + expense.amount, 0);

  if (financeQuery.isPending) {
    return (
      <PageCanvas title="Remboursements PE">
        <div className="mt-5 h-72 animate-pulse border border-slate-200 bg-white" />
      </PageCanvas>
    );
  }

  if (financeQuery.isError || !financeQuery.data || !expenses) {
    return (
      <PageCanvas title="Remboursements PE">
        <div className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Impossible de charger les remboursements. Vérifiez que la migration a bien
          été appliquée, puis réessayez.
        </div>
      </PageCanvas>
    );
  }

  return (
    <PageCanvas title="Remboursements PE">
      <div className="mt-2 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <p className="max-w-3xl text-sm leading-6 text-slate-500">
          Suivi des dépenses avancées personnellement pour l’entreprise. Un
          remboursement validé est reporté automatiquement en trésorerie.
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
          Ajouter une dépense
        </button>
      </div>

      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        <FinanceCard
          icon={WalletCards}
          label="À rembourser"
          note={`${expenses.filter((expense) => !expense.reimbursedAt).length} dépense${expenses.filter((expense) => !expense.reimbursedAt).length > 1 ? "s" : ""} en attente`}
          tone="outgoing"
          value={formatCurrency(pendingTotal)}
        />
        <FinanceCard
          icon={Check}
          label="Déjà remboursé"
          note={`${expenses.filter((expense) => expense.reimbursedAt).length} dépense${expenses.filter((expense) => expense.reimbursedAt).length > 1 ? "s" : ""} réglée${expenses.filter((expense) => expense.reimbursedAt).length > 1 ? "s" : ""}`}
          tone="income"
          value={formatCurrency(reimbursedTotal)}
        />
        <FinanceCard
          icon={WalletCards}
          label="Total avancé"
          note="Depuis la mise en place du suivi"
          value={formatCurrency(pendingTotal + reimbursedTotal)}
        />
      </section>

      <FinancePanel className="mt-5" title="Dépenses personnelles">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            />
            <input
              aria-label="Rechercher une dépense personnelle"
              className="h-10 w-full border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Libellé, fournisseur ou commentaire…"
              value={search}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <select
              aria-label="Filtrer par type"
              className="h-10 border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
              onChange={(event) =>
                setTypeFilter(event.target.value as "ALL" | PersonalExpenseType)
              }
              value={typeFilter}
            >
              <option value="ALL">Tous les types</option>
              {personalExpenseTypes.map((type) => (
                <option key={type} value={type}>
                  {typeLabels[type]}
                </option>
              ))}
            </select>
            <select
              aria-label="Filtrer par statut"
              className="h-10 border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
              onChange={(event) =>
                setStatusFilter(event.target.value as "ALL" | "PENDING" | "REIMBURSED")
              }
              value={statusFilter}
            >
              <option value="ALL">Tous les statuts</option>
              <option value="PENDING">À rembourser</option>
              <option value="REIMBURSED">Remboursés</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1020px] w-full border-collapse text-left">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] tracking-[0.1em] text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Libellé / fournisseur</th>
                <th className="px-4 py-3 text-right font-semibold">Montant TTC</th>
                <th className="px-4 py-3 font-semibold">Affectation</th>
                <th className="px-4 py-3 font-semibold">Remb. prévu</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="w-40 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleExpenses.map((expense) => {
                const isReimbursed = Boolean(expense.reimbursedAt);
                return (
                  <tr className="transition-colors hover:bg-slate-50" key={expense.id}>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDate(expense.expenseDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {typeLabels[expense.type]}
                    </td>
                    <td className="max-w-80 px-4 py-3">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {expense.label}
                      </p>
                      {expense.supplier ? (
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {expense.supplier}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-800">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">Entreprise</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatDate(expense.plannedReimbursementDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex border px-2 py-1 text-[11px] font-medium whitespace-nowrap",
                          isReimbursed
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-amber-200 bg-amber-50 text-amber-800",
                        )}
                      >
                        {isReimbursed
                          ? `Remboursé le ${formatDate(expense.reimbursedAt)}`
                          : "À rembourser"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {!isReimbursed ? (
                        <div className="flex justify-end gap-1">
                          <button
                            className="h-8 cursor-pointer border border-seno-700 bg-seno-700 px-2.5 text-xs font-medium text-white hover:bg-seno-800"
                            onClick={() => {
                              reimbursementMutation.reset();
                              setExpenseToReimburse(expense);
                            }}
                            type="button"
                          >
                            Rembourser
                          </button>
                          <button
                            aria-label={`Modifier ${expense.label}`}
                            className="grid size-8 cursor-pointer place-items-center border border-slate-300 text-slate-600 hover:bg-slate-50"
                            onClick={() => {
                              saveMutation.reset();
                              setDraft(createDraft(expense));
                            }}
                            type="button"
                          >
                            <Pencil aria-hidden="true" className="size-3.5" />
                          </button>
                          <button
                            aria-label={`Supprimer ${expense.label}`}
                            className="grid size-8 cursor-pointer place-items-center border border-red-200 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={deleteMutation.isPending}
                            onClick={() => {
                              if (window.confirm(`Supprimer la dépense « ${expense.label} » ?`)) {
                                deleteMutation.mutate(expense.id);
                              }
                            }}
                            type="button"
                          >
                            <Trash2 aria-hidden="true" className="size-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="block text-right text-xs text-slate-400">Verrouillé</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {visibleExpenses.length === 0 ? (
                <tr>
                  <td className="p-0" colSpan={8}>
                    <FinanceEmpty
                      detail={
                        search || typeFilter !== "ALL" || statusFilter !== "ALL"
                          ? "Aucune dépense ne correspond aux filtres."
                          : "Ajoutez une dépense avancée personnellement pour suivre son remboursement."
                      }
                      title="Aucune dépense personnelle"
                    />
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </FinancePanel>

      {deleteMutation.isError ? (
        <p className="mt-3 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {deleteMutation.error instanceof Error
            ? deleteMutation.error.message
            : "La dépense n’a pas pu être supprimée."}
        </p>
      ) : null}

      {draft ? (
        <PersonalExpenseDrawer
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

      {expenseToReimburse ? (
        <ReimbursementDrawer
          errorMessage={
            reimbursementMutation.isError && reimbursementMutation.error instanceof Error
              ? reimbursementMutation.error.message
              : null
          }
          expense={expenseToReimburse}
          isSaving={reimbursementMutation.isPending}
          onClose={() => setExpenseToReimburse(null)}
          onSave={(reimbursementDate) =>
            reimbursementMutation.mutate({
              id: expenseToReimburse.id,
              reimbursementDate,
            })
          }
        />
      ) : null}
    </PageCanvas>
  );
}
