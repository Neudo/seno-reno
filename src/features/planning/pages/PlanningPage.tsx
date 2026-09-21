import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { useAuth } from "@/features/auth/context/AuthProvider";
import {
  getChantierSnapshot,
  type ChantierRecord,
  type ChantierStatus,
} from "@/features/chantiers/api/chantiers-api";
import { PageCanvas } from "@/shared/components/app-shell/PageCanvas";
import { cn } from "@/shared/lib/utils";

const weekdays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const eventTone: Record<ChantierStatus, string> = {
  CANCELLED: "border-slate-200 bg-slate-50 text-slate-500",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  IN_PROGRESS: "border-sky-200 bg-sky-50 text-sky-700",
  PAUSED: "border-amber-200 bg-amber-50 text-amber-800",
  PENDING: "border-violet-200 bg-violet-50 text-violet-700",
};

function atStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addMonths(date: Date, count: number) {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const firstVisibleDay = new Date(
    month.getFullYear(),
    month.getMonth(),
    1 - mondayOffset,
  );

  return Array.from(
    { length: 42 },
    (_, index) =>
      new Date(
        firstVisibleDay.getFullYear(),
        firstVisibleDay.getMonth(),
        firstVisibleDay.getDate() + index,
      ),
  );
}

function getMonthLabel(date: Date) {
  const label = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(date);

  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function getEndDate(chantier: ChantierRecord): string {
  return (
    chantier.actualEndDate ??
    chantier.plannedEndDate ??
    chantier.plannedStartDate ??
    ""
  );
}

function isScheduledOn(chantier: ChantierRecord, date: Date) {
  if (!chantier.plannedStartDate) {
    return false;
  }

  const isoDate = toIsoDate(date);
  const endDate = getEndDate(chantier);
  return isoDate >= chantier.plannedStartDate && isoDate <= endDate;
}

function overlapsMonth(chantier: ChantierRecord, visibleMonth: Date) {
  if (!chantier.plannedStartDate) {
    return false;
  }

  const monthStart = toIsoDate(
    new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1),
  );
  const monthEnd = toIsoDate(
    new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0),
  );
  const endDate = getEndDate(chantier);

  return chantier.plannedStartDate <= monthEnd && endDate >= monthStart;
}

function statusLabel(status: ChantierStatus) {
  switch (status) {
    case "IN_PROGRESS":
      return "En cours";
    case "PENDING":
      return "En attente";
    case "PAUSED":
      return "En pause";
    case "COMPLETED":
      return "Terminé";
    case "CANCELLED":
      return "Annulé";
  }
}

export function PlanningPage() {
  const { user } = useAuth();
  const today = atStartOfDay(new Date());
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const snapshotQuery = useQuery({
    enabled: Boolean(user),
    queryFn: getChantierSnapshot,
    queryKey: ["chantiers", user?.id],
  });
  const monthDays = useMemo(() => getMonthDays(visibleMonth), [visibleMonth]);
  const scheduledChantiers = useMemo(
    () =>
      (snapshotQuery.data?.chantiers ?? []).filter((chantier) =>
        overlapsMonth(chantier, visibleMonth),
      ),
    [snapshotQuery.data?.chantiers, visibleMonth],
  );
  const isCurrentMonth =
    visibleMonth.getFullYear() === today.getFullYear() &&
    visibleMonth.getMonth() === today.getMonth();

  if (snapshotQuery.isPending) {
    return (
      <PageCanvas title="Planning">
        <div className="mt-5 h-72 animate-pulse border border-slate-200 bg-white" />
      </PageCanvas>
    );
  }

  if (snapshotQuery.isError || !snapshotQuery.data || !user) {
    return (
      <PageCanvas title="Planning">
        <p className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Impossible de charger le planning. Vérifie la migration des chantiers,
          puis réessaie.
        </p>
      </PageCanvas>
    );
  }

  return (
    <PageCanvas title="Planning">
      <section className="mt-2 border border-slate-200 bg-white">
        <header className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">
              Vue mensuelle
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-900">
              {getMonthLabel(visibleMonth)}
            </h2>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              className="h-9 cursor-pointer border border-slate-300 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-default disabled:text-slate-400"
              disabled={isCurrentMonth}
              onClick={() =>
                setVisibleMonth(
                  new Date(today.getFullYear(), today.getMonth(), 1),
                )
              }
              type="button"
            >
              Aujourd’hui
            </button>
            <div className="flex border border-slate-300">
              <button
                aria-label="Mois précédent"
                className="grid size-9 cursor-pointer place-items-center border-r border-slate-300 text-slate-600 transition-colors hover:bg-slate-50"
                onClick={() => setVisibleMonth((month) => addMonths(month, -1))}
                type="button"
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
              </button>
              <button
                aria-label="Mois suivant"
                className="grid size-9 cursor-pointer place-items-center text-slate-600 transition-colors hover:bg-slate-50"
                onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
                type="button"
              >
                <ChevronRight aria-hidden="true" className="size-4" />
              </button>
            </div>
          </div>
        </header>

        <div className="hidden md:block">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {weekdays.map((weekday) => (
              <div
                className="px-3 py-2.5 text-center text-[11px] font-semibold tracking-[0.12em] text-slate-500 uppercase"
                key={weekday}
              >
                {weekday}
              </div>
            ))}
          </div>
          <div className="relative grid grid-cols-7">
            {monthDays.map((day, index) => {
              const isVisibleMonth = day.getMonth() === visibleMonth.getMonth();
              const isToday = isSameDay(day, today);
              const dayChantiers = scheduledChantiers.filter((chantier) =>
                isScheduledOn(chantier, day),
              );

              return (
                <div
                  className={cn(
                    "min-h-28 border-r border-b border-slate-200 p-2",
                    index % 7 === 6 && "border-r-0",
                  )}
                  key={day.toISOString()}
                >
                  <span
                    className={cn(
                      "grid size-6 place-items-center text-xs font-medium",
                      !isVisibleMonth && "text-slate-300",
                      isVisibleMonth && !isToday && "text-slate-600",
                      isToday && "bg-seno-700 text-white",
                    )}
                  >
                    {day.getDate()}
                  </span>
                  <div className="mt-1.5 grid gap-1">
                    {dayChantiers.slice(0, 2).map((chantier) => (
                      <span
                        className={cn(
                          "block truncate border px-1.5 py-1 text-[10px] font-medium",
                          eventTone[chantier.status],
                        )}
                        key={chantier.id}
                        title={chantier.name}
                      >
                        {chantier.name}
                      </span>
                    ))}
                    {dayChantiers.length > 2 ? (
                      <span className="text-[10px] font-medium text-slate-500">
                        +{dayChantiers.length - 2} chantier
                        {dayChantiers.length > 3 ? "s" : ""}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
            {scheduledChantiers.length === 0 ? (
              <div className="pointer-events-none absolute inset-0 grid place-items-center px-5">
                <div className="max-w-sm bg-white/95 px-6 py-5 text-center shadow-sm ring-1 ring-slate-200">
                  <CalendarDays
                    aria-hidden="true"
                    className="mx-auto size-6 text-seno-700"
                  />
                  <p className="mt-3 text-sm font-medium text-slate-800">
                    Aucun chantier à planifier ce mois-ci
                  </p>
                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    Renseigne les dates prévues dans un chantier pour le voir
                    ici.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="md:hidden">
          {scheduledChantiers.length ? (
            <ul className="divide-y divide-slate-100">
              {scheduledChantiers.map((chantier) => (
                <li className="px-5 py-4" key={chantier.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {chantier.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {chantier.clientName} ·{" "}
                        {formatDate(chantier.plannedStartDate!)}
                        {getEndDate(chantier) !== chantier.plannedStartDate
                          ? ` — ${formatDate(getEndDate(chantier))}`
                          : ""}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 border px-2 py-1 text-[11px] font-medium",
                        eventTone[chantier.status],
                      )}
                    >
                      {statusLabel(chantier.status)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid min-h-72 place-items-center px-5 py-12 text-center">
              <div className="max-w-xs">
                <CalendarDays
                  aria-hidden="true"
                  className="mx-auto size-7 text-seno-700"
                />
                <p className="mt-3 font-medium text-slate-800">
                  Aucun chantier à planifier
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  La liste chronologique reprend les dates des chantiers.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </PageCanvas>
  );
}
