import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CalendarDays, ChevronLeft, ChevronRight, List } from "lucide-react";
import { useMemo, useState } from "react";

import { useAuth } from "@/features/auth/context/AuthProvider";
import {
  getChantierSnapshot,
  type ChantierRecord,
  type ChantierStatus,
} from "@/features/chantiers/api/chantiers-api";
import { inputClassName } from "@/features/clients-prospects/components/client-prospecting-ui";
import {
  getMonthDays,
  getPlanningChantiers,
  isScheduledOn,
  overlapsMonth,
  toIsoDate,
} from "@/features/planning/lib/planning";
import { PageCanvas } from "@/shared/components/app-shell/PageCanvas";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

const weekdays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const statusTone: Record<ChantierStatus, string> = {
  CANCELLED: "border-slate-200 bg-slate-50 text-slate-500",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  IN_PROGRESS: "border-sky-200 bg-sky-50 text-sky-700",
  PAUSED: "border-amber-200 bg-amber-50 text-amber-800",
  PENDING: "border-violet-200 bg-violet-50 text-violet-700",
};

const statusLabels: Record<ChantierStatus, string> = {
  CANCELLED: "Annulé",
  COMPLETED: "Terminé",
  IN_PROGRESS: "En cours",
  PAUSED: "En pause",
  PENDING: "En attente",
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const monthFormatter = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
});

function formatDate(value: string | null) {
  return value
    ? dateFormatter.format(new Date(`${value}T12:00:00`))
    : "Non renseignée";
}

function getMonthLabel(date: Date) {
  const label = monthFormatter.format(date);
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

function PlanningEmptyState({ monthly = false }: { monthly?: boolean }) {
  return (
    <div
      role="status"
      className="border border-slate-200 bg-white px-5 py-8 text-center"
    >
      <CalendarDays
        aria-hidden="true"
        className="mx-auto size-6 text-seno-700"
      />
      <p className="mt-3 text-sm font-medium text-slate-800">
        {monthly
          ? "Aucun chantier planifié ce mois-ci"
          : "Aucun chantier à afficher"}
      </p>
      <p className="mt-1 text-sm text-slate-500">
        {monthly
          ? "Consultez un autre mois ou renseignez les dates prévues dans la fiche chantier."
          : "Créez un chantier ou sélectionnez un autre filtre pour consulter son planning."}
      </p>
    </div>
  );
}

function ChantierCards({ chantiers }: { chantiers: ChantierRecord[] }) {
  return (
    <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {chantiers.map((chantier) => (
        <li className="flex" key={chantier.id}>
          <Link
            className="flex min-w-0 w-full flex-col border border-slate-200 bg-white p-4 transition-colors hover:border-seno-700 hover:bg-slate-50/50 focus-visible:outline-2 focus-visible:outline-seno-700"
            params={{ chantierId: chantier.id }}
            to="/chantiers/$chantierId"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {chantier.name}
                </p>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {chantier.clientName}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 border px-2 py-1 text-[11px] font-medium",
                  statusTone[chantier.status],
                )}
              >
                {statusLabels[chantier.status]}
              </span>
            </div>
            <dl className="mt-auto grid grid-cols-2 gap-3 pt-5 text-xs">
              <div>
                <dt className="text-slate-500">Début prévu</dt>
                <dd className="mt-1 font-medium text-slate-800">
                  {formatDate(chantier.plannedStartDate)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">
                  {chantier.actualEndDate ? "Fin réelle" : "Fin prévue"}
                </dt>
                <dd className="mt-1 font-medium text-slate-800">
                  {formatDate(
                    chantier.actualEndDate ?? chantier.plannedEndDate,
                  )}
                </dd>
              </div>
            </dl>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function MonthCalendar({
  chantiers,
  month,
  onShowList,
  today,
}: {
  chantiers: ChantierRecord[];
  month: Date;
  onShowList: () => void;
  today: Date;
}) {
  const days = useMemo(() => getMonthDays(month), [month]);
  return (
    <div className="overflow-hidden border border-slate-200 bg-white">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {weekdays.map((weekday) => (
          <div
            className="py-2 text-center text-[10px] font-semibold tracking-[0.1em] text-slate-500 uppercase"
            key={weekday}
          >
            {weekday}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const isVisibleMonth = day.getMonth() === month.getMonth();
          const isToday = toIsoDate(day) === toIsoDate(today);
          const dayChantiers = chantiers.filter((chantier) =>
            isScheduledOn(chantier, day),
          );
          return (
            <div
              className={cn(
                "h-20 min-w-0 border-slate-200 px-1.5 py-1 xl:h-[5.5rem]",
                index % 7 !== 6 && "border-r",
                index < days.length - 7 && "border-b",
                !isVisibleMonth && "bg-slate-50/70",
              )}
              key={toIsoDate(day)}
            >
              <time
                className={cn(
                  "grid size-5 place-items-center text-[11px] font-medium",
                  !isVisibleMonth && "text-slate-400",
                  isVisibleMonth && !isToday && "text-slate-600",
                  isToday && "bg-seno-700 text-white",
                )}
                dateTime={toIsoDate(day)}
              >
                {day.getDate()}
              </time>
              <div className="mt-0.5 grid gap-0.5">
                {dayChantiers.slice(0, 2).map((chantier) => (
                  <Link
                    className={cn(
                      "block truncate border px-1 py-px text-[10px] leading-3.5 font-medium hover:brightness-95 focus-visible:outline-2 focus-visible:outline-seno-700",
                      statusTone[chantier.status],
                    )}
                    key={chantier.id}
                    params={{ chantierId: chantier.id }}
                    title={`${chantier.name} · ${statusLabels[chantier.status]}`}
                    to="/chantiers/$chantierId"
                  >
                    {chantier.name}
                  </Link>
                ))}
                {dayChantiers.length > 2 ? (
                  <button
                    aria-label="Afficher la liste des chantiers"
                    className="cursor-pointer text-left text-[10px] leading-3 text-slate-500 hover:text-seno-700"
                    onClick={onShowList}
                    type="button"
                  >
                    +{dayChantiers.length - 2} autre
                    {dayChantiers.length > 3 ? "s" : ""}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PlanningContent({
  chantiers,
}: {
  chantiers: ChantierRecord[];
}) {
  const [today] = useState(() => new Date(new Date().toDateString()));
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedChantierId, setSelectedChantierId] = useState("");
  const [view, setView] = useState<"CALENDAR" | "LIST">("CALENDAR");
  const filteredChantiers = useMemo(
    () => getPlanningChantiers(chantiers, selectedChantierId),
    [chantiers, selectedChantierId],
  );
  const scheduledChantiers = useMemo(
    () => getPlanningChantiers(chantiers, selectedChantierId, visibleMonth),
    [chantiers, selectedChantierId, visibleMonth],
  );
  const chantierOptions = useMemo(
    () =>
      [...chantiers].sort((left, right) =>
        left.name.localeCompare(right.name, "fr"),
      ),
    [chantiers],
  );
  const selectedChantier = chantiers.find(
    (chantier) => chantier.id === selectedChantierId,
  );
  const isCurrentMonth =
    visibleMonth.getFullYear() === today.getFullYear() &&
    visibleMonth.getMonth() === today.getMonth();
  const shownCount =
    view === "CALENDAR" ? scheduledChantiers.length : filteredChantiers.length;

  function selectChantier(id: string) {
    setSelectedChantierId(id);
    const chantier = chantiers.find((item) => item.id === id);
    if (chantier?.plannedStartDate && !overlapsMonth(chantier, visibleMonth)) {
      const startDate = new Date(`${chantier.plannedStartDate}T12:00:00`);
      setVisibleMonth(
        new Date(startDate.getFullYear(), startDate.getMonth(), 1),
      );
    }
  }

  return (
    <PageCanvas title="Planning">
      <section className="max-w-6xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 p-4">
          <div className="grid w-full gap-1.5 sm:w-80">
            <label
              className="text-xs font-medium text-slate-600"
              htmlFor="planning-chantier"
            >
              Chantier
            </label>
            <select
              className={inputClassName}
              id="planning-chantier"
              onChange={(event) => selectChantier(event.target.value)}
              value={selectedChantierId}
            >
              <option value="">Tous les chantiers</option>
              {chantierOptions.map((chantier) => (
                <option key={chantier.id} value={chantier.id}>
                  {chantier.name}
                </option>
              ))}
            </select>
          </div>
          <div
            aria-label="Affichage du planning"
            className="flex border border-slate-300"
            role="group"
          >
            {(["CALENDAR", "LIST"] as const).map((mode) => (
              <button
                aria-pressed={view === mode}
                className={cn(
                  "flex h-9 cursor-pointer items-center gap-2 px-3 text-sm font-medium transition-colors",
                  view === mode
                    ? "bg-seno-700 text-white"
                    : "text-slate-600 hover:bg-slate-50",
                )}
                key={mode}
                onClick={() => setView(mode)}
                type="button"
              >
                {mode === "CALENDAR" ? (
                  <CalendarDays aria-hidden="true" className="size-4" />
                ) : (
                  <List aria-hidden="true" className="size-4" />
                )}
                {mode === "CALENDAR" ? "Calendrier" : "Liste"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold tracking-[0.12em] text-slate-500 uppercase">
              {selectedChantier ? selectedChantier.name : "Planning global"}
            </p>
            <h2 className="mt-0.5 text-lg font-semibold tracking-[-0.02em] text-slate-900">
              {view === "CALENDAR"
                ? getMonthLabel(visibleMonth)
                : "Liste des chantiers"}
            </h2>
          </div>
          {view === "CALENDAR" ? (
            <div className="flex items-center gap-2">
              <Button
                disabled={isCurrentMonth}
                onClick={() =>
                  setVisibleMonth(
                    new Date(today.getFullYear(), today.getMonth(), 1),
                  )
                }
                variant="outline"
              >
                Aujourd’hui
              </Button>
              <div className="flex">
                <Button
                  aria-label="Mois précédent"
                  className="border-r-0"
                  onClick={() =>
                    setVisibleMonth(
                      (month) =>
                        new Date(month.getFullYear(), month.getMonth() - 1, 1),
                    )
                  }
                  size="icon"
                  variant="outline"
                >
                  <ChevronLeft aria-hidden="true" />
                </Button>
                <Button
                  aria-label="Mois suivant"
                  onClick={() =>
                    setVisibleMonth(
                      (month) =>
                        new Date(month.getFullYear(), month.getMonth() + 1, 1),
                    )
                  }
                  size="icon"
                  variant="outline"
                >
                  <ChevronRight aria-hidden="true" />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
        <div className="px-4 pb-4">
          {view === "LIST" ? (
            filteredChantiers.length ? (
              <ChantierCards chantiers={filteredChantiers} />
            ) : (
              <PlanningEmptyState />
            )
          ) : (
            <>
              <div className="hidden md:block">
                <MonthCalendar
                  chantiers={scheduledChantiers}
                  month={visibleMonth}
                  onShowList={() => setView("LIST")}
                  today={today}
                />
              </div>
              <div className="md:hidden">
                {scheduledChantiers.length ? (
                  <ChantierCards chantiers={scheduledChantiers} />
                ) : null}
              </div>
              {scheduledChantiers.length === 0 ? (
                <div className="mt-3">
                  <PlanningEmptyState monthly />
                </div>
              ) : null}
            </>
          )}
          <p aria-live="polite" className="mt-3 text-xs text-slate-500">
            {shownCount} chantier{shownCount > 1 ? "s" : ""}
            {view === "CALENDAR" ? " sur ce mois" : ""}
          </p>
        </div>
      </section>
    </PageCanvas>
  );
}

export function PlanningPage() {
  const { user } = useAuth();
  const snapshotQuery = useQuery({
    enabled: Boolean(user),
    queryFn: getChantierSnapshot,
    queryKey: ["chantiers", user?.id],
  });

  if (snapshotQuery.isPending) {
    return (
      <PageCanvas title="Planning">
        <p role="status" className="text-sm text-slate-500">
          Chargement du planning…
        </p>
      </PageCanvas>
    );
  }

  if (snapshotQuery.isError) {
    return (
      <PageCanvas title="Planning">
        <div
          role="alert"
          className="border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p>Impossible de charger le planning.</p>
          <Button
            className="mt-3"
            onClick={() => void snapshotQuery.refetch()}
            variant="outline"
          >
            Réessayer
          </Button>
        </div>
      </PageCanvas>
    );
  }

  return <PlanningContent chantiers={snapshotQuery.data?.chantiers ?? []} />;
}
