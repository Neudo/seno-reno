import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  WalletCards,
} from "lucide-react";
import { useMemo } from "react";

import { getFinanceSnapshot } from "@/features/finances/api/finance-api";
import {
  CashStatusBadge,
  FinanceCard,
  FinanceEmpty,
  FinancePanel,
  addMonths,
  formatCurrency,
  formatDate,
  getMonthLabel,
  getMonthRange,
  getMonthlyEquivalent,
  getTodayIso,
  isDateInRange,
} from "@/features/finances/components/finance-ui";
import { PageCanvas } from "@/shared/components/app-shell/PageCanvas";

export function FinancesOverviewPage() {
  const financeQuery = useQuery({
    queryFn: getFinanceSnapshot,
    queryKey: ["finance-snapshot"],
  });

  const summary = useMemo(() => {
    const snapshot = financeQuery.data;
    const today = new Date();
    const currentMonth = getMonthRange(today);
    const movements = (snapshot?.cashMovements ?? []).filter(
      (movement) =>
        movement.status !== "CANCELLED" &&
        isDateInRange(movement.expectedDate, currentMonth.start, currentMonth.end),
    );
    const pendingIncome = movements.filter(
      (movement) =>
        movement.direction === "INCOME" && movement.status === "PLANNED",
    );
    const pendingExpense = movements.filter(
      (movement) =>
        movement.direction === "EXPENSE" && movement.status === "PLANNED",
    );
    const forecastBalance = movements.reduce(
      (total, movement) =>
        total + (movement.direction === "INCOME" ? movement.amount : -movement.amount),
      0,
    );
    const monthlyFixedCosts = (snapshot?.fixedCosts ?? [])
      .filter((cost) => cost.isActive)
      .reduce(
        (total, cost) => total + getMonthlyEquivalent(cost.amount, cost.recurrence),
        0,
      );
    const attentionItems = [
      ...(snapshot?.cashMovements ?? [])
        .filter(
          (movement) =>
            movement.status === "PLANNED" && movement.expectedDate <= getTodayIso(),
        )
        .map((movement) => ({
          date: movement.expectedDate,
          id: `cash-${movement.id}`,
          kind: "Mouvement de trésorerie",
          label: movement.label,
          movement,
        })),
      ...(snapshot?.personalExpenses ?? [])
        .filter(
          (expense) =>
            !expense.reimbursedAt &&
            expense.plannedReimbursementDate &&
            expense.plannedReimbursementDate <= getTodayIso(),
        )
        .map((expense) => ({
          date: expense.plannedReimbursementDate!,
          id: `expense-${expense.id}`,
          kind: "Remboursement PE",
          label: expense.label,
          movement: null,
        })),
    ]
      .sort((left, right) => left.date.localeCompare(right.date))
      .slice(0, 5);

    const cashflow = Array.from({ length: 6 }, (_, index) => {
      const month = addMonths(new Date(today.getFullYear(), today.getMonth(), 1), index);
      const range = getMonthRange(month);
      const total = (snapshot?.cashMovements ?? [])
        .filter(
          (movement) =>
            movement.status !== "CANCELLED" &&
            isDateInRange(movement.expectedDate, range.start, range.end),
        )
        .reduce(
          (sum, movement) =>
            sum +
            (movement.direction === "INCOME" ? movement.amount : -movement.amount),
          0,
        );

      return { label: getMonthLabel(month), total };
    });

    return {
      attentionItems,
      cashflow,
      forecastBalance,
      monthlyFixedCosts,
      pendingExpense,
      pendingIncome,
    };
  }, [financeQuery.data]);

  if (financeQuery.isPending) {
    return (
      <PageCanvas title="Finances">
        <div className="mt-5 h-72 animate-pulse border border-slate-200 bg-white" />
      </PageCanvas>
    );
  }

  if (financeQuery.isError || !financeQuery.data) {
    return (
      <PageCanvas title="Finances">
        <div className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Impossible de charger les données financières. Vérifiez que la migration
          a bien été appliquée, puis réessayez.
        </div>
      </PageCanvas>
    );
  }

  const maxCashflow = Math.max(
    1,
    ...summary.cashflow.map((month) => Math.abs(month.total)),
  );
  const hasCashflow = summary.cashflow.some((month) => month.total !== 0);

  return (
    <PageCanvas title="Finances">
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
        Vue d’ensemble des mouvements de trésorerie, charges récurrentes et
        avances personnelles. Les marges de chantiers restent suivies à part.
      </p>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <FinanceCard
          icon={ArrowDownLeft}
          label="À encaisser"
          note={`${summary.pendingIncome.length} échéance${summary.pendingIncome.length > 1 ? "s" : ""} prévue${summary.pendingIncome.length > 1 ? "s" : ""} ce mois-ci`}
          tone="income"
          value={formatCurrency(
            summary.pendingIncome.reduce((total, movement) => total + movement.amount, 0),
          )}
        />
        <FinanceCard
          icon={ArrowUpRight}
          label="À régler"
          note={`${summary.pendingExpense.length} échéance${summary.pendingExpense.length > 1 ? "s" : ""} prévue${summary.pendingExpense.length > 1 ? "s" : ""} ce mois-ci`}
          tone="outgoing"
          value={formatCurrency(
            summary.pendingExpense.reduce((total, movement) => total + movement.amount, 0),
          )}
        />
        <FinanceCard
          icon={WalletCards}
          label="Solde prévisionnel"
          note="Mouvements prévus pour le mois en cours"
          value={formatCurrency(summary.forecastBalance)}
        />
        <FinanceCard
          icon={Landmark}
          label="Charges fixes mensualisées"
          note="Charges actives, ramenées au mois"
          tone="outgoing"
          value={formatCurrency(summary.monthlyFixedCosts)}
        />
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]">
        <FinancePanel title="Trésorerie des six prochains mois">
          {hasCashflow ? (
            <div className="grid min-h-72 grid-cols-6 gap-2 px-4 pb-4 pt-7 sm:gap-4 sm:px-6">
              {summary.cashflow.map((month) => {
                const height = Math.max(
                  8,
                  Math.round((Math.abs(month.total) / maxCashflow) * 100),
                );

                return (
                  <div className="flex min-w-0 flex-col justify-end" key={month.label}>
                    <div className="flex h-45 items-center justify-center border-b border-slate-200">
                      <span
                        className={
                          month.total >= 0
                            ? "w-full bg-seno-700"
                            : "w-full bg-amber-500"
                        }
                        style={{ height: `${height}%` }}
                        title={`${month.label} : ${formatCurrency(month.total)}`}
                      />
                    </div>
                    <p className="mt-3 truncate text-center text-[11px] font-medium text-slate-500">
                      {month.label.split(" ")[0]}
                    </p>
                    <p
                      className={
                        month.total >= 0
                          ? "mt-1 truncate text-center text-xs font-medium text-seno-700"
                          : "mt-1 truncate text-center text-xs font-medium text-amber-800"
                      }
                    >
                      {formatCurrency(month.total)}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <FinanceEmpty
              detail="Ajoutez un mouvement manuel ou enregistrez un remboursement pour visualiser les prévisions de trésorerie."
              title="Aucun mouvement à projeter"
            />
          )}
        </FinancePanel>

        <FinancePanel title="À surveiller">
          {summary.attentionItems.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {summary.attentionItems.map((item) => (
                <li className="px-4 py-3.5" key={item.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {item.label}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.kind} · Échéance {formatDate(item.date)}
                      </p>
                    </div>
                    {item.movement ? (
                      <CashStatusBadge movement={item.movement} />
                    ) : (
                      <span className="inline-flex border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium whitespace-nowrap text-amber-800">
                        À rembourser
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <FinanceEmpty
              detail="Les échéances arrivées à terme et les remboursements à traiter apparaîtront ici."
              title="Rien à signaler"
            />
          )}
        </FinancePanel>
      </div>

      <div className="mt-5 flex items-start gap-3 border border-seno-100 bg-seno-50 px-4 py-3 text-sm leading-6 text-seno-900">
        <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-seno-700" />
        <p>
          Les encaissements clients, commandes et paiements de sous-traitants
          alimenteront la trésorerie lorsqu’ils auront leur source métier dans
          l’application. Les mouvements manuels servent uniquement aux exceptions.
        </p>
      </div>
    </PageCanvas>
  );
}
