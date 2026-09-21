import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import type {
  CashMovement,
  FixedCostRecurrence,
} from "@/features/finances/api/finance-api";
import { cn } from "@/shared/lib/utils";

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

const monthFormatter = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
});

export const recurrenceLabels: Record<FixedCostRecurrence, string> = {
  MONTHLY: "Mensuelle",
  QUARTERLY: "Trimestrielle",
  SEMIANNUAL: "Semestrielle",
  YEARLY: "Annuelle",
};

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return dateFormatter.format(new Date(`${value}T12:00:00`));
}

export function getMonthLabel(date: Date) {
  const label = monthFormatter.format(date);
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

export function getTodayIso() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function addMonths(date: Date, count: number) {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

export function getMonthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const toIso = (value: Date) => {
    const offset = value.getTimezoneOffset() * 60_000;
    return new Date(value.getTime() - offset).toISOString().slice(0, 10);
  };

  return { end: toIso(end), start: toIso(start) };
}

export function isDateInRange(value: string, start: string, end: string) {
  return value >= start && value <= end;
}

export function parseAmount(value: string) {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function getCashStatusLabel(movement: CashMovement) {
  if (movement.status === "CANCELLED") {
    return "Annulé";
  }

  if (movement.status === "COMPLETED") {
    return movement.direction === "INCOME" ? "Encaissé" : "Payé";
  }

  if (movement.expectedDate < getTodayIso()) {
    return "En retard";
  }

  return movement.direction === "INCOME" ? "À encaisser" : "À régler";
}

export function CashStatusBadge({ movement }: { movement: CashMovement }) {
  const label = getCashStatusLabel(movement);
  const className =
    label === "Encaissé" || label === "Payé"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : label === "En retard"
        ? "border-red-200 bg-red-50 text-red-700"
        : label === "Annulé"
          ? "border-slate-200 bg-slate-50 text-slate-500"
          : movement.direction === "INCOME"
            ? "border-seno-100 bg-seno-50 text-seno-700"
            : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <span
      className={cn(
        "inline-flex border px-2 py-1 text-[11px] font-medium whitespace-nowrap",
        className,
      )}
    >
      {label}
    </span>
  );
}

export function CashMovementKindLabel({ movement }: { movement: CashMovement }) {
  if (movement.kind === "PERSONAL_REIMBURSEMENT") {
    return "Remboursement PE";
  }

  return "Mouvement manuel";
}

export function FinanceCard({
  icon: Icon,
  label,
  note,
  tone = "default",
  value,
}: {
  icon: LucideIcon;
  label: string;
  note: string;
  tone?: "default" | "income" | "outgoing";
  value: string;
}) {
  return (
    <article className="border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.1em] text-slate-500 uppercase">
          {label}
        </p>
        <span
          className={cn(
            "grid size-8 place-items-center border",
            tone === "income" && "border-emerald-200 bg-emerald-50 text-emerald-700",
            tone === "outgoing" && "border-amber-200 bg-amber-50 text-amber-800",
            tone === "default" && "border-seno-100 bg-seno-50 text-seno-700",
          )}
        >
          <Icon aria-hidden="true" className="size-4" />
        </span>
      </div>
      <p className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{note}</p>
    </article>
  );
}

export function FinancePanel({
  children,
  className,
  title,
  trailing,
}: {
  children: ReactNode;
  className?: string;
  title: string;
  trailing?: ReactNode;
}) {
  return (
    <section className={cn("border border-slate-200 bg-white", className)}>
      <header className="flex min-h-15 items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 sm:px-5">
        <h2 className="font-semibold tracking-[-0.02em] text-slate-900">{title}</h2>
        {trailing}
      </header>
      {children}
    </section>
  );
}

export function FinanceEmpty({
  detail,
  title,
}: {
  detail: string;
  title: string;
}) {
  return (
    <div className="px-5 py-12 text-center">
      <p className="text-sm font-medium text-slate-800">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
        {detail}
      </p>
    </div>
  );
}

export function FinanceDrawer({
  children,
  onClose,
  title,
}: {
  children: ReactNode;
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
              FINANCES
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
            ×
          </button>
        </header>
        {children}
      </aside>
    </div>
  );
}

export function FieldLabel({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      className="grid gap-1.5 text-sm font-medium text-slate-700"
      htmlFor={htmlFor}
    >
      {children}
    </label>
  );
}

export const fieldClassName =
  "h-10 border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15";

export const textAreaClassName =
  "min-h-28 resize-y border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15";

export function getMonthlyEquivalent(
  amount: number,
  recurrence: FixedCostRecurrence,
) {
  const divisor =
    recurrence === "MONTHLY"
      ? 1
      : recurrence === "QUARTERLY"
        ? 3
        : recurrence === "SEMIANNUAL"
          ? 6
          : 12;

  return amount / divisor;
}

export function getRecurringDueDate({
  dueDate,
  dueDay,
  recurrence,
  referenceDate,
  startDate,
}: {
  dueDate: string | null;
  dueDay: number | null;
  recurrence: FixedCostRecurrence;
  referenceDate: Date;
  startDate: string;
}) {
  const reference = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  const base = dueDate
    ? new Date(`${dueDate}T12:00:00`)
    : new Date(`${startDate}T12:00:00`);
  const interval =
    recurrence === "MONTHLY"
      ? 1
      : recurrence === "QUARTERLY"
        ? 3
        : recurrence === "SEMIANNUAL"
          ? 6
          : 12;
  const day = dueDay ?? base.getDate();
  const candidate = new Date(base.getFullYear(), base.getMonth(), 1);

  while (candidate < new Date(reference.getFullYear(), reference.getMonth(), 1)) {
    candidate.setMonth(candidate.getMonth() + interval);
  }

  const getOccurrence = (month: Date) =>
    new Date(
      month.getFullYear(),
      month.getMonth(),
      Math.min(day, new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()),
    );

  let occurrence = getOccurrence(candidate);
  while (occurrence < reference) {
    candidate.setMonth(candidate.getMonth() + interval);
    occurrence = getOccurrence(candidate);
  }

  return occurrence;
}
