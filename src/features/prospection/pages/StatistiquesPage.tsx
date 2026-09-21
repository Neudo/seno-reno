import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  UsersRound,
} from "lucide-react";
import { useState } from "react";

import {
  type ProspectRecord,
  getClientProspectingSnapshot,
  sourceKinds,
} from "@/features/clients-prospects/api/client-prospecting-api";
import {
  prospectStatusLabels,
  sourceLabels,
} from "@/features/clients-prospects/components/client-prospecting-ui";
import { useAuth } from "@/features/auth/context/AuthProvider";
import { PageCanvas } from "@/shared/components/app-shell/PageCanvas";
import { cn } from "@/shared/lib/utils";

type Period =
  | "CURRENT_MONTH"
  | "LAST_3_MONTHS"
  | "LAST_6_MONTHS"
  | "CURRENT_YEAR"
  | "LAST_YEAR"
  | "CUSTOM";
type Breakdown = "SOURCES" | "CONVERSION" | "STATUSES";
type MetricMode = "COUNT" | "PERCENTAGE";

const periods: Array<{ id: Period; label: string }> = [
  { id: "CURRENT_MONTH", label: "Ce mois" },
  { id: "LAST_3_MONTHS", label: "3 derniers mois" },
  { id: "LAST_6_MONTHS", label: "6 derniers mois" },
  { id: "CURRENT_YEAR", label: "Cette année" },
  { id: "LAST_YEAR", label: "Année précédente" },
  { id: "CUSTOM", label: "Période personnalisée" },
];

function toDateKey(value: string) {
  return value.slice(0, 10);
}

function subtractMonths(date: Date, count: number) {
  const result = new Date(date);
  result.setMonth(result.getMonth() - count);
  return result;
}

function getStartDate(period: Period, now: Date, customStart: string) {
  if (period === "CUSTOM") return customStart || null;
  if (period === "CURRENT_MONTH")
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  if (period === "LAST_3_MONTHS")
    return toDateKey(subtractMonths(now, 3).toISOString());
  if (period === "LAST_6_MONTHS")
    return toDateKey(subtractMonths(now, 6).toISOString());
  if (period === "CURRENT_YEAR") return `${now.getFullYear()}-01-01`;
  return `${now.getFullYear() - 1}-01-01`;
}

function getEndDate(period: Period, now: Date, customEnd: string) {
  if (period === "CUSTOM") return customEnd || null;
  if (period === "LAST_YEAR") return `${now.getFullYear() - 1}-12-31`;
  return toDateKey(now.toISOString());
}

function isInRange(
  prospect: ProspectRecord,
  start: string | null,
  end: string | null,
) {
  const date = toDateKey(prospect.createdAt);
  return (!start || date >= start) && (!end || date <= end);
}

function MetricCard({
  description,
  icon,
  label,
  value,
}: {
  description: string;
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <article className="border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">
          {label}
        </p>
        <span className="text-seno-700">{icon}</span>
      </div>
      <p className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </article>
  );
}

export function StatistiquesPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("CURRENT_MONTH");
  const [breakdown, setBreakdown] = useState<Breakdown>("SOURCES");
  const [metricMode, setMetricMode] = useState<MetricMode>("COUNT");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const snapshotQuery = useQuery({
    enabled: Boolean(user),
    queryFn: getClientProspectingSnapshot,
    queryKey: ["clients-prospects", user?.id],
  });

  const now = new Date();
  const today = toDateKey(now.toISOString());
  const start = getStartDate(period, now, customStart);
  const end = getEndDate(period, now, customEnd);
  const data = snapshotQuery.data;
  const prospects = (data?.prospects ?? []).filter((prospect) =>
    isInRange(prospect, start, end),
  );
  const converted = prospects.filter(
    (prospect) => prospect.status === "CONVERTED" || prospect.convertedClientId,
  );
  const contacted = prospects.filter((prospect) =>
    ["CONTACTED", "TO_FOLLOW_UP", "IN_DISCUSSION", "CONVERTED"].includes(
      prospect.status,
    ),
  );
  const inDiscussion = prospects.filter(
    (prospect) =>
      prospect.status === "IN_DISCUSSION" || prospect.status === "CONVERTED",
  );
  const conversionRate = prospects.length
    ? Math.round((converted.length / prospects.length) * 100)
    : 0;
  const contactedRate = prospects.length
    ? Math.round((contacted.length / prospects.length) * 100)
    : 0;
  const discussionRate = prospects.length
    ? Math.round((inDiscussion.length / prospects.length) * 100)
    : 0;
  const overdue = prospects.filter(
    (prospect) =>
      prospect.status !== "CLOSED" &&
      prospect.status !== "CONVERTED" &&
      Boolean(prospect.nextFollowUpAt && prospect.nextFollowUpAt < today),
  );
  const withoutFollowUp = prospects.filter(
    (prospect) =>
      prospect.status !== "CLOSED" &&
      prospect.status !== "CONVERTED" &&
      !prospect.nextFollowUpAt,
  );
  const noInteraction = prospects.filter((prospect) => {
    if (!prospect.lastInteractionAt) return true;
    const date = new Date(prospect.lastInteractionAt);
    const threshold = new Date(now);
    threshold.setDate(threshold.getDate() - 21);
    return date < threshold;
  });

  const sourceRows = sourceKinds
    .map((source) => {
      const sourceProspects = prospects.filter(
        (prospect) => prospect.sourceKind === source,
      );
      const sourceConverted = sourceProspects.filter(
        (prospect) =>
          prospect.status === "CONVERTED" || prospect.convertedClientId,
      );
      return {
        id: source,
        label: sourceLabels[source],
        value:
          breakdown === "CONVERSION"
            ? sourceProspects.length
              ? Math.round(
                  (sourceConverted.length / sourceProspects.length) * 100,
                )
              : 0
            : sourceProspects.length,
      };
    })
    .filter((entry) => entry.value > 0);
  const statusRows = Object.entries(prospectStatusLabels)
    .map(([status, label]) => ({
      id: status,
      label,
      value: prospects.filter((prospect) => prospect.status === status).length,
    }))
    .filter((entry) => entry.value > 0);
  const chartRows = breakdown === "STATUSES" ? statusRows : sourceRows;
  const chartMax = Math.max(1, ...chartRows.map((entry) => entry.value));

  if (snapshotQuery.isPending) {
    return (
      <PageCanvas title="Statistiques">
        <div className="mt-5 h-96 animate-pulse border border-slate-200 bg-white" />
      </PageCanvas>
    );
  }
  if (snapshotQuery.isError || !data || !user) {
    return (
      <PageCanvas title="Statistiques">
        <p className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Impossible de charger les statistiques. Vérifie la migration puis
          réessaie.
        </p>
      </PageCanvas>
    );
  }

  return (
    <PageCanvas title="Statistiques">
      <div className="mt-2 flex flex-col gap-4 border-b border-slate-200 pb-5 xl:flex-row xl:items-end xl:justify-between">
        <p className="max-w-2xl text-sm leading-6 text-slate-500">
          Lecture en temps réel de la prospection et des conversions, à partir
          des contacts saisis.
        </p>
        <div className="flex flex-wrap gap-2">
          {periods.map((entry) => (
            <button
              className={cn(
                "cursor-pointer border px-3 py-2 text-xs font-medium transition-colors",
                period === entry.id
                  ? "border-seno-700 bg-seno-700 text-white"
                  : "border-slate-300 text-slate-600 hover:bg-slate-50",
              )}
              key={entry.id}
              onClick={() => setPeriod(entry.id)}
              type="button"
            >
              {entry.label}
            </button>
          ))}
        </div>
      </div>

      {period === "CUSTOM" ? (
        <div className="mt-4 flex flex-col gap-3 border border-slate-200 bg-white p-4 sm:flex-row sm:items-end">
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Du
            <input
              className="h-10 border border-slate-300 px-3 text-sm"
              onChange={(event) => setCustomStart(event.target.value)}
              type="date"
              value={customStart}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Au
            <input
              className="h-10 border border-slate-300 px-3 text-sm"
              onChange={(event) => setCustomEnd(event.target.value)}
              type="date"
              value={customEnd}
            />
          </label>
        </div>
      ) : null}

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">
            Vue d’ensemble
          </p>
          <div className="flex border border-slate-300">
            {(
              [
                ["COUNT", "Nombre"],
                ["PERCENTAGE", "%"],
              ] as Array<[MetricMode, string]>
            ).map(([id, label]) => (
              <button
                className={cn(
                  "cursor-pointer px-3 py-2 text-xs font-medium",
                  metricMode === id
                    ? "bg-seno-700 text-white"
                    : "text-slate-600 hover:bg-slate-50",
                )}
                key={id}
                onClick={() => setMetricMode(id)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            description="contacts créés sur la période"
            icon={<UsersRound aria-hidden="true" className="size-5" />}
            label="Prospects"
            value={metricMode === "COUNT" ? prospects.length : "100 %"}
          />
          <MetricCard
            description="passés au statut client"
            icon={<CheckCircle2 aria-hidden="true" className="size-5" />}
            label="Convertis"
            value={
              metricMode === "COUNT" ? converted.length : `${conversionRate} %`
            }
          />
          <MetricCard
            description="prospects contactés"
            icon={<BarChart3 aria-hidden="true" className="size-5" />}
            label="Contactés"
            value={
              metricMode === "COUNT" ? contacted.length : `${contactedRate} %`
            }
          />
          <MetricCard
            description="contacts en discussion active"
            icon={<ArrowRight aria-hidden="true" className="size-5" />}
            label="En discussion"
            value={
              metricMode === "COUNT"
                ? inDiscussion.length
                : `${discussionRate} %`
            }
          />
        </div>
      </section>

      <section className="mt-5 border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">
              Tunnel de conversion
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-slate-900">
              Du premier contact au client
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            {prospects.length
              ? `${conversionRate} % de conversion`
              : "En attente de données"}
          </p>
        </div>
        <div className="grid gap-px bg-slate-200 md:grid-cols-4">
          {[
            ["Prospects", prospects.length],
            ["Contactés", contacted.length],
            ["En discussion", inDiscussion.length],
            ["Convertis", converted.length],
          ].map(([label, value], index) => (
            <div className="relative bg-white p-5" key={label as string}>
              <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">
                {label}
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-900">
                {value}
              </p>
              {index < 3 ? (
                <ArrowRight
                  aria-hidden="true"
                  className="absolute top-1/2 right-[-10px] z-10 hidden size-5 -translate-y-1/2 bg-[#f7f8f9] text-slate-400 md:block"
                />
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
        <section className="border border-slate-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">
                Répartition
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-slate-900">
                Origines et qualification
              </h2>
            </div>
            <div className="flex border border-slate-300">
              {(
                [
                  ["SOURCES", "Origines"],
                  ["CONVERSION", "Conversion par source"],
                  ["STATUSES", "Statuts"],
                ] as Array<[Breakdown, string]>
              ).map(([id, label]) => (
                <button
                  className={cn(
                    "cursor-pointer px-2.5 py-2 text-xs font-medium",
                    breakdown === id
                      ? "bg-seno-700 text-white"
                      : "text-slate-600 hover:bg-slate-50",
                  )}
                  key={id}
                  onClick={() => setBreakdown(id)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {chartRows.length ? (
            <div className="grid gap-4 p-5">
              {chartRows.map((row) => (
                <div
                  className="grid grid-cols-[minmax(110px,0.45fr)_minmax(0,1fr)_44px] items-center gap-3"
                  key={row.id}
                >
                  <p
                    className="truncate text-sm text-slate-600"
                    title={row.label}
                  >
                    {row.label}
                  </p>
                  <div className="h-7 bg-slate-100">
                    <div
                      className="h-full bg-seno-700"
                      style={{
                        width: `${Math.max(4, (row.value / chartMax) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-right text-sm font-semibold text-slate-800">
                    {breakdown === "CONVERSION" ? `${row.value} %` : row.value}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid min-h-60 place-items-center p-6 text-center">
              <p className="text-sm text-slate-500">
                Aucune donnée pour cette période.
              </p>
            </div>
          )}
        </section>

        <section className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-4">
            <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">
              À surveiller
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-slate-900">
              Relances à traiter
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              {
                icon: "OVERDUE",
                label: "Relances en retard",
                value: overdue.length,
              },
              {
                icon: "FOLLOW_UP",
                label: "Sans prochaine relance",
                value: withoutFollowUp.length,
              },
              {
                icon: "INTERACTION",
                label: "Sans interaction récente",
                value: noInteraction.length,
              },
            ].map((item) => (
              <div
                className="flex items-center justify-between gap-3 p-4"
                key={item.label}
              >
                <div className="flex items-center gap-3">
                  {item.icon === "OVERDUE" ? (
                    <AlertTriangle
                      aria-hidden="true"
                      className="size-4 text-red-600"
                    />
                  ) : (
                    <Clock3
                      aria-hidden="true"
                      className={
                        item.icon === "FOLLOW_UP"
                          ? "size-4 text-amber-600"
                          : "size-4 text-slate-500"
                      }
                    />
                  )}
                  <p className="text-sm text-slate-700">{item.label}</p>
                </div>
                <span
                  className={cn(
                    "min-w-7 px-2 py-1 text-center text-xs font-semibold",
                    item.value
                      ? "bg-slate-100 text-slate-800"
                      : "bg-slate-50 text-slate-400",
                  )}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageCanvas>
  );
}
