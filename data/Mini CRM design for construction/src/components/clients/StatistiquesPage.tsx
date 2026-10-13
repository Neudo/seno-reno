import { useState, useMemo } from "react";
import { AlertTriangle, Clock, Bell } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from "recharts";
import { INITIAL_PROSPECTS } from "./prospectData";
import { SOURCE_LABELS, STATUT_LABELS } from "./types";
import type { StatutProspect, SourceProspect } from "./types";

// ─── Period ──────────────────────────────────────────────────────────────────

type Period = "mois" | "3mois" | "6mois" | "annee" | "annee_prec" | "custom";

const PERIOD_LABELS: Record<Period, string> = {
  mois: "Ce mois",
  "3mois": "3 derniers mois",
  "6mois": "6 derniers mois",
  annee: "Cette année",
  annee_prec: "Année précédente",
  custom: "Période personnalisée",
};

function getPeriodRange(period: Period, today: Date, customStart: string, customEnd: string): [Date, Date] {
  const y = today.getFullYear();
  const m = today.getMonth();
  switch (period) {
    case "mois": return [new Date(y, m, 1), today];
    case "3mois": { const s = new Date(today); s.setMonth(s.getMonth() - 3); return [s, today]; }
    case "6mois": { const s = new Date(today); s.setMonth(s.getMonth() - 6); return [s, today]; }
    case "annee": return [new Date(y, 0, 1), today];
    case "annee_prec": return [new Date(y - 1, 0, 1), new Date(y - 1, 11, 31)];
    case "custom": {
      const s = customStart ? new Date(customStart) : new Date(y, 0, 1);
      const e = customEnd ? new Date(customEnd) : today;
      return [s, e];
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const NAVY = "#00365A";
const TEAL = "#0d7a8a";

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

const ACTIVE_STATUTS: StatutProspect[] = ["nouveau", "a_contacter", "contacte", "a_relancer", "en_discussion"];

// ─── Tooltip custom ──────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 shadow-md rounded-sm px-3 py-2 text-xs space-y-1 min-w-[140px]">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.fill || p.color }} />
            <span className="text-gray-500">{p.name}</span>
          </div>
          <span className="font-semibold text-gray-800">{p.value}{p.unit ?? ""}</span>
        </div>
      ))}
      {payload[0]?.payload?.prospects && payload[0]?.payload?.convertis && (
        <div className="pt-1 border-t border-gray-100 text-gray-500">
          {payload[0].payload.prospects} prospects · {payload[0].payload.convertis} convertis
        </div>
      )}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

type TabId = "origines" | "conversion" | "statuts";

export default function StatistiquesPage() {
  const [period, setPeriod] = useState<Period>("6mois");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [kpiMode, setKpiMode] = useState<"brut" | "pct">("brut");
  const [activeTab, setActiveTab] = useState<TabId>("origines");

  const today = useMemo(() => { const d = new Date(); d.setHours(23, 59, 59); return d; }, []);
  const [rangeStart, rangeEnd] = useMemo(
    () => getPeriodRange(period, today, customStart, customEnd),
    [period, today, customStart, customEnd]
  );

  const allProspects = INITIAL_PROSPECTS;

  const filtered = useMemo(
    () => allProspects.filter((p) => {
      const d = new Date(p.dateCreation);
      return d >= rangeStart && d <= rangeEnd;
    }),
    [allProspects, rangeStart, rangeEnd]
  );

  // ── KPI ─────────────────────────────────────────────────────────────────────
  const total = filtered.length;
  const convertis = filtered.filter((p) => p.statut === "converti").length;
  const tauxConversion = total > 0 ? (convertis / total) * 100 : 0;

  // ── Funnel ──────────────────────────────────────────────────────────────────
  const funnelSteps = [
    { label: "Prospects", count: total },
    { label: "Contactés", count: filtered.filter((p) => p.interactions.length > 0 || p.statut !== "nouveau").length },
    { label: "En discussion", count: filtered.filter((p) => ["en_discussion", "converti"].includes(p.statut)).length },
    { label: "Convertis", count: convertis },
  ];

  // ── Bar chart tabs ───────────────────────────────────────────────────────────
  const originesData = useMemo(() => {
    const counts: Partial<Record<SourceProspect, number>> = {};
    for (const p of filtered) counts[p.source] = (counts[p.source] ?? 0) + 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([source, count]) => ({ name: SOURCE_LABELS[source as SourceProspect] ?? source, value: count }));
  }, [filtered]);

  const conversionData = useMemo(() => {
    const bySource: Record<string, { total: number; conv: number }> = {};
    for (const p of filtered) {
      const src = SOURCE_LABELS[p.source] ?? p.source;
      if (!bySource[src]) bySource[src] = { total: 0, conv: 0 };
      bySource[src].total++;
      if (p.statut === "converti") bySource[src].conv++;
    }
    return Object.entries(bySource)
      .filter(([, v]) => v.total > 0)
      .sort((a, b) => b[1].conv / b[1].total - a[1].conv / a[1].total)
      .map(([name, v]) => ({
        name,
        value: Math.round((v.conv / v.total) * 100),
        prospects: v.total,
        convertis: v.conv,
      }));
  }, [filtered]);

  const statutsData = useMemo(() => {
    const counts: Partial<Record<StatutProspect, number>> = {};
    for (const p of filtered) counts[p.statut] = (counts[p.statut] ?? 0) + 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([statut, count]) => ({
        name: STATUT_LABELS[statut as StatutProspect] ?? statut,
        value: count,
      }));
  }, [filtered]);

  const chartData = activeTab === "origines" ? originesData
    : activeTab === "conversion" ? conversionData
    : statutsData;

  const chartUnit = activeTab === "conversion" ? "%" : "";

  // ── Suivi (tous prospects actifs) ────────────────────────────────────────────
  const todayDate = new Date(); todayDate.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date(todayDate); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const actifs = allProspects.filter((p) => ACTIVE_STATUTS.includes(p.statut));

  const relancesEnRetard = actifs.filter(
    (p) => p.prochaineRelance && new Date(p.prochaineRelance) < todayDate
  ).length;

  const sansProchaineRelance = actifs.filter((p) => !p.prochaineRelance).length;

  const sansInteraction = actifs.filter((p) => {
    if (!p.interactions.length) return true;
    const lastDate = p.interactions.reduce((max, i) => {
      const d = new Date(i.date);
      return d > max ? d : max;
    }, new Date(0));
    return lastDate < thirtyDaysAgo;
  }).length;

  // ── Évolution dans le temps ───────────────────────────────────────────────────
  const evolutionData = useMemo(() => {
    const months: Record<string, { crees: number; convertis: number }> = {};
    const cursor = new Date(rangeStart);
    cursor.setDate(1);
    while (cursor <= rangeEnd) {
      months[monthKey(cursor)] = { crees: 0, convertis: 0 };
      cursor.setMonth(cursor.getMonth() + 1);
    }
    for (const p of filtered) {
      const k = monthKey(new Date(p.dateCreation));
      if (months[k]) months[k].crees++;
      if (p.statut === "converti") {
        const k2 = monthKey(new Date(p.dateCreation));
        if (months[k2]) months[k2].convertis++;
      }
    }
    return Object.entries(months).map(([key, v]) => ({
      label: monthLabel(key),
      crees: v.crees,
      convertis: v.convertis,
    }));
  }, [filtered, rangeStart, rangeEnd]);

  const TABS: { id: TabId; label: string }[] = [
    { id: "origines", label: "Origines" },
    { id: "conversion", label: "Conversion par source" },
    { id: "statuts", label: "Statuts" },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4F5F7]">
      <div className="max-w-5xl mx-auto p-6 space-y-5">

        {/* Period filter */}
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-xs px-3 py-1.5 rounded-sm border font-medium transition-colors cursor-pointer ${
                period === p
                  ? "bg-[#00365A] text-white border-[#00365A]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
          {period === "custom" && (
            <div className="flex items-center gap-2 ml-1">
              <input
                type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                className="text-xs border border-gray-200 rounded-sm px-2 py-1.5 bg-white"
              />
              <span className="text-xs text-gray-400">→</span>
              <input
                type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                className="text-xs border border-gray-200 rounded-sm px-2 py-1.5 bg-white"
              />
            </div>
          )}
        </div>

        {/* Top row: KPI + Funnel */}
        <div className="grid grid-cols-[200px_1fr] gap-4">

          {/* KPI card */}
          <div className="bg-white border border-gray-200 rounded-sm p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Vue d'ensemble</p>
              <button
                onClick={() => setKpiMode(m => m === "brut" ? "pct" : "brut")}
                className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-500 transition-colors cursor-pointer"
              >
                {kpiMode === "brut" ? "%" : "#"}
              </button>
            </div>
            <div className="space-y-4 flex-1">
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5">Prospects</p>
                <p className="text-3xl font-bold text-[#00365A]">
                  {kpiMode === "brut" ? total : "100 %"}
                </p>
              </div>
              <div className="w-full h-px bg-gray-100" />
              <div>
                <p className="text-[10px] text-gray-400 mb-0.5">Convertis</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {kpiMode === "brut" ? convertis : `${tauxConversion.toFixed(1).replace(".", ",")} %`}
                </p>
              </div>
            </div>
          </div>

          {/* Funnel */}
          <div className="bg-white border border-gray-200 rounded-br-sm p-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-5">Funnel de conversion</p>
            <div className="flex items-stretch gap-0 h-24">
              {funnelSteps.map((step, i) => {
                const pctWidth = funnelSteps[0].count > 0 ? (step.count / funnelSteps[0].count) * 100 : 0;
                const isLast = i === funnelSteps.length - 1;
                return (
                  <div key={step.label} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end justify-center" style={{ height: 56 }}>
                      <div
                        className="w-full rounded-tr-sm transition-all"
                        style={{
                          height: `${Math.max(pctWidth, 8)}%`,
                          background: isLast ? "#059669" : `rgba(0,54,90,${0.15 + i * 0.22})`,
                        }}
                      />
                    </div>
                    <p className="text-lg font-bold text-gray-800">{step.count}</p>
                    <p className="text-[10px] text-gray-400 text-center leading-tight">{step.label}</p>
                    {i < funnelSteps.length - 1 && (
                      <div className="absolute" />
                    )}
                  </div>
                );
              })}
            </div>
            {funnelSteps[0].count > 0 && (
              <p className="text-xs text-gray-400 mt-3 text-right">
                Taux de conversion global : <span className="font-semibold text-emerald-600">{tauxConversion.toFixed(1).replace(".", ",")} %</span>
              </p>
            )}
          </div>
        </div>

        {/* Analyse commerciale */}
        <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-5 py-3 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === id
                    ? "border-[#00365A] text-[#00365A]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {chartData.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-8 text-center">Aucune donnée sur cette période.</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(chartData.length * 44, 120)}>
                <BarChart layout="vertical" data={chartData} margin={{ left: 0, right: 56, top: 0, bottom: 0 }} barCategoryGap="30%">
                  <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}${chartUnit}`}
                    domain={activeTab === "conversion" ? [0, 100] : undefined}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#374151" }}
                    axisLine={false}
                    tickLine={false}
                    width={130}
                  />
                  <Tooltip content={(props: any) => {
                    const { active, payload, label } = props;
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload;
                    return (
                      <div className="bg-white border border-gray-200 shadow-md rounded-sm px-3 py-2 text-xs min-w-[160px]">
                        <p className="font-semibold text-gray-800 mb-1">{label}</p>
                        <p className="text-[#00365A] font-bold">{payload[0].value}{chartUnit}</p>
                        {activeTab === "conversion" && d?.prospects && (
                          <div className="mt-1 pt-1 border-t border-gray-100 text-gray-500 space-y-0.5">
                            <p>{d.prospects} prospect{d.prospects > 1 ? "s" : ""}</p>
                            <p>{d.convertis} converti{d.convertis > 1 ? "s" : ""}</p>
                          </div>
                        )}
                      </div>
                    );
                  }} />
                  <Bar dataKey="value" name={activeTab === "conversion" ? "Taux" : "Nombre"} fill={NAVY} radius={[0, 3, 3, 0]} maxBarSize={28} label={{ position: "right", formatter: (v: number) => `${v}${chartUnit}`, fontSize: 11, fill: "#374151", fontWeight: 600 }} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bottom row: Suivi + Évolution */}
        <div className="grid grid-cols-[280px_1fr] gap-4">

          {/* Suivi */}
          <div className="bg-white border border-gray-200 rounded-sm p-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-4">Suivi — tous prospects actifs</p>
            <div className="space-y-3">
              <div className={`flex items-start gap-3 p-3 rounded-sm ${relancesEnRetard > 0 ? "bg-red-50" : "bg-gray-50"}`}>
                <AlertTriangle size={14} className={`shrink-0 mt-0.5 ${relancesEnRetard > 0 ? "text-red-500" : "text-gray-300"}`} />
                <div>
                  <p className={`text-sm font-bold ${relancesEnRetard > 0 ? "text-red-600" : "text-gray-400"}`}>
                    {relancesEnRetard} relance{relancesEnRetard > 1 ? "s" : ""} en retard
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Date de relance dépassée</p>
                </div>
              </div>

              <div className={`flex items-start gap-3 p-3 rounded-sm ${sansProchaineRelance > 0 ? "bg-amber-50" : "bg-gray-50"}`}>
                <Bell size={14} className={`shrink-0 mt-0.5 ${sansProchaineRelance > 0 ? "text-amber-500" : "text-gray-300"}`} />
                <div>
                  <p className={`text-sm font-bold ${sansProchaineRelance > 0 ? "text-amber-600" : "text-gray-400"}`}>
                    {sansProchaineRelance} sans prochaine relance
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Aucune relance planifiée</p>
                </div>
              </div>

              <div className={`flex items-start gap-3 p-3 rounded-sm ${sansInteraction > 0 ? "bg-orange-50" : "bg-gray-50"}`}>
                <Clock size={14} className={`shrink-0 mt-0.5 ${sansInteraction > 0 ? "text-orange-400" : "text-gray-300"}`} />
                <div>
                  <p className={`text-sm font-bold ${sansInteraction > 0 ? "text-orange-600" : "text-gray-400"}`}>
                    {sansInteraction} sans interaction récente
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Aucune interaction depuis 30 j.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Évolution */}
          <div className="bg-white border border-gray-200 rounded-sm p-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-4">Évolution sur la période</p>
            {evolutionData.length < 2 ? (
              <p className="text-sm text-gray-400 italic py-8 text-center">Période trop courte pour afficher l'évolution.</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={evolutionData} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={24} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Line type="monotone" dataKey="crees" name="Créés" stroke={NAVY} strokeWidth={2} dot={{ r: 3, fill: NAVY }} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="convertis" name="Convertis" stroke="#059669" strokeWidth={2} dot={{ r: 3, fill: "#059669" }} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
