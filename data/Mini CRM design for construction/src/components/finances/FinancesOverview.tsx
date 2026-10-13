import { TrendingUp, TrendingDown, Minus, AlertTriangle, Calendar } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const KPI_CARDS = [
  {
    label: "À encaisser",
    value: "48 700 €",
    sub: "3 échéances clients",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    icon: TrendingUp,
    iconColor: "text-emerald-500",
  },
  {
    label: "À régler",
    value: "31 250 €",
    sub: "5 paiements prévus",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100",
    icon: TrendingDown,
    iconColor: "text-red-500",
  },
  {
    label: "Solde prévisionnel",
    value: "+17 450 €",
    sub: "Août 2026",
    color: "text-[#00365A]",
    bg: "bg-blue-50",
    border: "border-blue-100",
    icon: Minus,
    iconColor: "text-[#00365A]",
  },
  {
    label: "Charges fixes du mois",
    value: "6 340 €",
    sub: "Dont 1 à venir dans 3 j.",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-100",
    icon: Calendar,
    iconColor: "text-orange-500",
  },
];

const TRESORERIE_MOIS = [
  { mois: "Août 2026", montant: 17300 },
  { mois: "Septembre 2026", montant: 8200 },
  { mois: "Octobre 2026", montant: -12500 },
];

const A_SURVEILLER = [
  {
    type: "encaissement",
    label: "Acompte client — Chantier Dupont",
    date: "28 août 2026",
    montant: "+18 000 €",
    statut: "À encaisser",
    statut_color: "bg-blue-100 text-blue-700",
  },
  {
    type: "décaissement",
    label: "Paiement sous-traitant — Électricité Martin",
    date: "30 août 2026",
    montant: "−7 800 €",
    statut: "À régler",
    statut_color: "bg-amber-100 text-amber-700",
  },
  {
    type: "charge",
    label: "URSSAF — cotisations T3",
    date: "5 septembre 2026",
    montant: "−3 760 €",
    statut: "Prévu",
    statut_color: "bg-gray-100 text-gray-600",
  },
  {
    type: "encaissement",
    label: "Solde client — Chantier Rousseau",
    date: "15 septembre 2026",
    montant: "+30 700 €",
    statut: "En retard",
    statut_color: "bg-red-100 text-red-700",
  },
];

function formatMontant(n: number) {
  const abs = Math.abs(n).toLocaleString("fr-FR");
  return n >= 0 ? `+${abs} €` : `−${Math.abs(n).toLocaleString("fr-FR")} €`;
}

export default function FinancesOverview() {
  return (
    <div className="p-6 space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        {KPI_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white border border-gray-200 rounded-sm p-5 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  {card.label}
                </span>
                <span className={`w-7 h-7 flex items-center justify-center rounded-sm ${card.bg}`}>
                  <Icon size={14} className={card.iconColor} />
                </span>
              </div>
              <div>
                <p className={`text-2xl font-bold tracking-tight ${card.color}`}>{card.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trésorerie prochains mois — full width */}
      <div className="bg-white border border-gray-200 rounded-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-widest mb-5">
          Trésorerie des prochains mois
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={TRESORERIE_MOIS} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="tresoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00365A" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#00365A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="mois"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#9ca3af" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)} k€`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const val = payload[0].value as number;
                const positive = val >= 0;
                return (
                  <div className="bg-white border border-gray-200 rounded-sm shadow-sm px-3 py-2 text-xs">
                    <p className="text-gray-500 mb-0.5">{payload[0].payload.mois}</p>
                    <p className={`font-semibold ${positive ? "text-emerald-600" : "text-red-600"}`}>
                      {formatMontant(val)}
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="montant"
              stroke="#00365A"
              strokeWidth={2}
              fill="url(#tresoGradient)"
              dot={{ r: 4, fill: "#00365A", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#00365A" }}
            />
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-400 mt-3">
          Solde prévisionnel basé sur les encaissements et décaissements planifiés.
        </p>
      </div>

      {/* À surveiller */}
      <div className="bg-white border border-gray-200 rounded-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={14} className="text-amber-500 shrink-0" />
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-widest">
            À surveiller
          </h2>
        </div>
        <div className="space-y-3">
          {A_SURVEILLER.map((item, i) => (
            <div key={i} className="flex flex-col gap-1 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm text-gray-700 leading-snug">{item.label}</span>
                <span className={`text-xs font-semibold shrink-0 ${item.type === "encaissement" ? "text-emerald-600" : "text-red-600"}`}>
                  {item.montant}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{item.date}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-sm font-medium ${item.statut_color}`}>
                  {item.statut}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
