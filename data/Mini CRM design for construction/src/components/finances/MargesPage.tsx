import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { INITIAL_CHANTIERS } from "../chantiers/chantierData";
import {
  calcCaPrevisionnel,
  calcCoutsPrevisionnels,
  calcCoutsReels,
} from "../chantiers/chantierTypes";
import type { Chantier } from "../chantiers/chantierTypes";

// ─── Palette ──────────────────────────────────────────────────────────────────
// Two categorical series, SENO identity.
// Validated pair: ΔL* ≥ 30, distinguishable under deuteranopia.
const C_PREVI = "#94A3B8";   // slate-400 — prévisionnelle (recessive)
const C_ACTU  = "#00365A";   // SENO navy — actualisée (dominant)
const C_NEG   = "#DC2626";   // red-600 — negative margin indicator

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = new Date();
const fmtE = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €";
const fmtPct = (n: number) => (isNaN(n) || !isFinite(n) ? "—" : n.toFixed(1) + " %");
const fmtShort = (nom: string) => nom.length > 24 ? nom.slice(0, 22) + "…" : nom;

function margePct(marge: number, ca: number): number {
  return ca > 0 ? (marge / ca) * 100 : 0;
}

function chantiersInPeriod(
  chantiers: Chantier[],
  filter: FilterPeriod,
  custom: { from: string; to: string }
): Chantier[] {
  // Only non-annulé chantiers with a devis initial > 0
  const base = chantiers.filter(
    (c) => c.statut !== "annule" && c.montantDevisInitial > 0
  );
  if (filter === "all") return base;

  let from: Date, to: Date;
  if (filter === "custom") {
    from = custom.from ? new Date(custom.from) : new Date(0);
    to   = custom.to   ? new Date(custom.to)   : new Date(9999, 0);
  } else if (filter === "month") {
    from = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
    to   = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0);
  } else if (filter === "prev_month") {
    from = new Date(TODAY.getFullYear(), TODAY.getMonth() - 1, 1);
    to   = new Date(TODAY.getFullYear(), TODAY.getMonth(), 0);
  } else {
    // year
    from = new Date(TODAY.getFullYear(), 0, 1);
    to   = new Date(TODAY.getFullYear(), 11, 31);
  }

  return base.filter((c) => {
    const start = c.dateDebutPrevue ? new Date(c.dateDebutPrevue) : null;
    const end   = c.dateFinPrevue   ? new Date(c.dateFinPrevue)   : null;
    if (!start && !end) return true;
    if (!start) return end! >= from;
    if (!end)   return start <= to;
    return start <= to && end >= from;
  });
}

// ─── Types ───────────────────────────────────────────────────────────────────

type FilterPeriod = "month" | "prev_month" | "year" | "all" | "custom";
type DisplayMode = "montant" | "taux";

interface ChantierRow {
  id: number;
  nom: string;
  clientNom: string;
  ca: number;
  coutsPrevi: number;
  coutsReels: number;
  margePrevi: number;
  margeActu: number;
  tauxPrevi: number;
  tauxActu: number;
  ecart: number;
}

function buildRows(chantiers: Chantier[]): ChantierRow[] {
  return chantiers.map((c) => {
    const ca       = calcCaPrevisionnel(c);
    const cPrevi   = calcCoutsPrevisionnels(c);
    const cReels   = calcCoutsReels(c);
    const mPrevi   = c.montantDevisInitial - cPrevi;
    const mActu    = ca - cReels;
    return {
      id: c.id,
      nom: c.nom,
      clientNom: c.clientNom,
      ca,
      coutsPrevi: cPrevi,
      coutsReels: cReels,
      margePrevi: mPrevi,
      margeActu: mActu,
      tauxPrevi: margePct(mPrevi, c.montantDevisInitial),
      tauxActu: margePct(mActu, ca),
      ecart: mActu - mPrevi,
    };
  });
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color }: {
  label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-sm px-5 py-4">
      <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{label}</p>
      <p className={`text-xl font-semibold font-mono tabular-nums ${color ?? "text-gray-900"}`}>{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label, mode }: {
  active?: boolean; payload?: any[]; label?: string; mode: DisplayMode;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as ChantierRow;
  if (!d) return null;
  const ecartPositif = d.ecart >= 0;
  return (
    <div className="bg-white border border-gray-200 rounded-sm shadow-xl px-4 py-3 text-xs min-w-[220px]">
      <p className="font-semibold text-gray-900 mb-1 leading-snug">{d.nom}</p>
      <p className="text-gray-400 mb-3">{d.clientNom}</p>
      <div className="space-y-1.5">
        <Row label="CA actualisé" value={fmtE(d.ca)} />
        <Row label="Coûts réels" value={fmtE(d.coutsReels)} />
        <div className="border-t border-gray-100 my-1.5" />
        <Row
          label="Marge prévisionnelle"
          value={mode === "montant" ? fmtE(d.margePrevi) : fmtPct(d.tauxPrevi)}
          dot={C_PREVI}
        />
        <Row
          label="Marge actualisée"
          value={mode === "montant" ? fmtE(d.margeActu) : fmtPct(d.tauxActu)}
          dot={C_ACTU}
        />
        <div className="border-t border-gray-100 my-1.5" />
        <Row
          label="Écart"
          value={(ecartPositif ? "+" : "") + (mode === "montant" ? fmtE(d.ecart) : fmtPct(margePct(d.ecart, d.ca)))}
          valueClass={ecartPositif ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}
        />
      </div>
    </div>
  );
}

function Row({ label, value, dot, valueClass }: {
  label: string; value: string; dot?: string; valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-gray-500">
        {dot && <span className="inline-block w-2 h-2 rounded-sm shrink-0" style={{ background: dot }} />}
        {label}
      </span>
      <span className={`font-mono tabular-nums ${valueClass ?? "text-gray-800"}`}>{value}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS: { value: FilterPeriod; label: string }[] = [
  { value: "month",      label: "Mois courant" },
  { value: "prev_month", label: "Mois précédent" },
  { value: "year",       label: "Année en cours" },
  { value: "all",        label: "Tous les chantiers" },
  { value: "custom",     label: "Période personnalisée" },
];

export default function MargesPage() {
  const [period, setPeriod] = useState<FilterPeriod>("year");
  const [mode, setMode] = useState<DisplayMode>("montant");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const chantiers = useMemo(
    () => chantiersInPeriod(INITIAL_CHANTIERS, period, { from: customFrom, to: customTo }),
    [period, customFrom, customTo]
  );
  const rows = useMemo(() => buildRows(chantiers), [chantiers]);

  // KPIs
  const totalCA    = rows.reduce((s, r) => s + r.ca, 0);
  const totalCouts = rows.reduce((s, r) => s + r.coutsReels, 0);
  const totalMarge = totalCA - totalCouts;
  const tauxGlobal = margePct(totalMarge, totalCA);

  // Chart data
  const chartData = rows.map((r) => ({
    ...r,
    label: fmtShort(r.nom),
    barPrevi: mode === "montant" ? Math.max(r.margePrevi, 0) : Math.max(r.tauxPrevi, 0),
    barActu:  mode === "montant" ? Math.max(r.margeActu,  0) : Math.max(r.tauxActu,  0),
  }));

  const chartHeight = Math.max(280, rows.length * 52 + 40);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-0 bg-white border border-gray-200 rounded-sm overflow-hidden">
          {PERIOD_OPTIONS.filter((o) => o.value !== "custom").map((o) => (
            <button
              key={o.value}
              onClick={() => setPeriod(o.value)}
              className={`px-3 py-1.5 text-xs font-medium border-r border-gray-200 last:border-0 transition-colors ${
                period === o.value
                  ? "bg-[#00365A] text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {o.label}
            </button>
          ))}
          <button
            onClick={() => setPeriod("custom")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              period === "custom" ? "bg-[#00365A] text-white" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            Personnalisée
          </button>
        </div>

        {period === "custom" && (
          <div className="flex items-center gap-2">
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
              className="text-xs border border-gray-200 rounded-sm px-2.5 py-1.5 focus:outline-none focus:border-[#00365A]" />
            <span className="text-gray-400 text-xs">→</span>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
              className="text-xs border border-gray-200 rounded-sm px-2.5 py-1.5 focus:outline-none focus:border-[#00365A]" />
          </div>
        )}

        {/* Mode switch */}
        <div className="ml-auto flex items-center gap-0 bg-white border border-gray-200 rounded-sm overflow-hidden">
          <button onClick={() => setMode("montant")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${mode === "montant" ? "bg-[#00365A] text-white" : "text-gray-500 hover:bg-gray-50"}`}>
            Montant €
          </button>
          <button onClick={() => setMode("taux")}
            className={`px-3 py-1.5 text-xs font-medium border-l border-gray-200 transition-colors ${mode === "taux" ? "bg-[#00365A] text-white" : "text-gray-500 hover:bg-gray-50"}`}>
            Taux %
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="CA total" value={fmtE(totalCA)} />
        <KpiCard label="Coûts directs" value={fmtE(totalCouts)} />
        <KpiCard
          label="Marge brute"
          value={fmtE(totalMarge)}
          color={totalMarge >= 0 ? "text-emerald-600" : "text-red-600"}
        />
        <KpiCard
          label="Taux de marge global"
          value={fmtPct(tauxGlobal)}
          sub={`sur ${rows.length} chantier${rows.length > 1 ? "s" : ""}`}
          color={tauxGlobal >= 20 ? "text-emerald-600" : tauxGlobal >= 10 ? "text-amber-600" : "text-red-600"}
        />
      </div>

      {/* Bar chart */}
      {rows.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-sm flex items-center justify-center h-48">
          <p className="text-sm text-gray-400">Aucun chantier sur cette période.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-sm px-4 pt-5 pb-4">
          <div className="flex items-center justify-between mb-4 px-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Comparaison des marges par chantier
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ background: C_PREVI }} />
                Prévisionnelle
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ background: C_ACTU }} />
                Actualisée
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 60, left: 8, bottom: 0 }}
              barCategoryGap="28%"
              barGap={3}
            >
              <CartesianGrid horizontal={false} stroke="#F1F5F9" strokeDasharray="0" />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  mode === "montant"
                    ? v >= 1000 ? `${(v / 1000).toFixed(0)} k€` : `${v} €`
                    : `${v.toFixed(0)} %`
                }
              />
              <YAxis
                type="category"
                dataKey="label"
                width={180}
                tick={{ fontSize: 11, fill: "#475569" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<CustomTooltip mode={mode} />}
                cursor={{ fill: "#F8FAFC" }}
              />
              <Bar dataKey="barPrevi" name="Prévisionnelle" fill={C_PREVI} radius={[0, 3, 3, 0]} maxBarSize={14} />
              <Bar dataKey="barActu"  name="Actualisée"    fill={C_ACTU}  radius={[0, 3, 3, 0]} maxBarSize={14}
                label={{
                  position: "right",
                  formatter: (v: number) =>
                    mode === "montant"
                      ? v >= 1000 ? `${(v / 1000).toFixed(0)} k€` : `${v} €`
                      : `${v.toFixed(1)} %`,
                  fontSize: 10,
                  fill: "#64748B",
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detailed table */}
      <div className="bg-white border border-gray-200 rounded-sm overflow-x-auto">
        <table className="min-w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {["Chantier", "Client", "CA actualisé", "Achats", "Sous-traitants", "Marge prév.", "Marge actualisée", "Taux", "Écart"].map((h) => (
                <th key={h} className={`px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400 ${h === "Chantier" || h === "Client" ? "text-left" : "text-right"}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center text-gray-400 py-12 text-sm">
                  Aucun chantier sur cette période.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const ecartPositif = r.ecart >= 0;
                const achats = r.coutsReels; // simplified — full breakdown later
                const achatsCmds = INITIAL_CHANTIERS.find(c => c.id === r.id)?.commandes
                  .filter(c => c.statutCommande !== "annule")
                  .reduce((s, c) => s + (c.montantReel ?? c.montantPrevisionnel), 0) ?? 0;
                const achatsST = INITIAL_CHANTIERS.find(c => c.id === r.id)?.sousTraitants
                  .reduce((s, st) => s + (st.montantReel ?? st.montantPrevisionnel), 0) ?? 0;

                return (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{r.nom}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.clientNom}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-gray-800">{fmtE(r.ca)}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-gray-500 text-xs">{fmtE(achatsCmds)}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-gray-500 text-xs">{fmtE(achatsST)}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-gray-500">{fmtE(r.margePrevi)}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-gray-800">{fmtE(r.margeActu)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs font-semibold ${r.tauxActu >= 20 ? "text-emerald-600" : r.tauxActu >= 10 ? "text-amber-600" : "text-red-600"}`}>
                        {fmtPct(r.tauxActu)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs font-semibold font-mono tabular-nums px-1.5 py-0.5 rounded-sm ${
                        ecartPositif
                          ? "text-emerald-700 bg-emerald-50"
                          : "text-red-700 bg-red-50"
                      }`}>
                        {ecartPositif ? "+" : ""}{fmtE(r.ecart)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {rows.length > 1 && (
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td className="px-4 py-3 text-xs font-semibold text-gray-600">Total</td>
                <td />
                <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-gray-800">{fmtE(totalCA)}</td>
                <td colSpan={2} />
                <td className="px-4 py-3 text-right font-mono tabular-nums text-gray-500 font-semibold">
                  {fmtE(rows.reduce((s, r) => s + r.margePrevi, 0))}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-gray-900">{fmtE(totalMarge)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-xs font-bold ${tauxGlobal >= 20 ? "text-emerald-600" : tauxGlobal >= 10 ? "text-amber-600" : "text-red-600"}`}>
                    {fmtPct(tauxGlobal)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-xs font-semibold font-mono tabular-nums px-1.5 py-0.5 rounded-sm ${
                    totalMarge - rows.reduce((s, r) => s + r.margePrevi, 0) >= 0
                      ? "text-emerald-700 bg-emerald-50"
                      : "text-red-700 bg-red-50"
                  }`}>
                    {(() => {
                      const e = totalMarge - rows.reduce((s, r) => s + r.margePrevi, 0);
                      return (e >= 0 ? "+" : "") + fmtE(e);
                    })()}
                  </span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
