import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

const CASHFLOW_DATA = [
  { semaine: "S35", encaissements: 12400, decaissements: 8200 },
  { semaine: "S36", encaissements: 8800, decaissements: 5400 },
  { semaine: "S37", encaissements: 9600, decaissements: 6100 },
  { semaine: "S38", encaissements: 7400, decaissements: 5150 },
];

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

interface SummaryRow {
  label: string;
  value: string;
  color: string;
  sign: string;
}

const SUMMARY: SummaryRow[] = [
  { label: "Encaissements prévus", value: "38 200 €", color: "#166534", sign: "+" },
  { label: "Décaissements prévus", value: "24 850 €", color: "#B91C1C", sign: "−" },
  { label: "Solde prévisionnel", value: "13 350 €", color: "#00365A", sign: "+" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 px-3 py-2.5 shadow text-xs">
      <p className="font-semibold text-gray-700 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.fill }} className="font-mono">
          {p.name} : {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function FinancesSection() {
  return (
    <div className="bg-white border border-gray-200">
      <div className="px-5 py-3.5 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Trésorerie à venir</h2>
        <p className="text-xs text-gray-400 mt-0.5">30 prochains jours</p>
      </div>

      <div className="px-5 py-4 grid grid-cols-3 gap-px bg-gray-100 mb-4 border-b border-gray-100">
        {SUMMARY.map(({ label, value, color, sign }) => (
          <div key={label} className="bg-white px-4 py-3">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="font-mono text-lg font-semibold" style={{ color }}>
              {sign}{value}
            </p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="px-5 pb-4">
        <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">Par semaine</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={CASHFLOW_DATA} barGap={2} barCategoryGap="30%">
            <CartesianGrid vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="semaine"
              tick={{ fontSize: 11, fill: "#9CA3AF", fontFamily: "DM Mono, monospace" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#9CA3AF", fontFamily: "DM Mono, monospace" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              width={36}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F8FAFC" }} />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "#6B7280", paddingTop: 8 }}
              iconType="square"
              iconSize={8}
            />
            <Bar dataKey="encaissements" name="Encaissements" fill="#166534" radius={0} />
            <Bar dataKey="decaissements" name="Décaissements" fill="#B91C1C" radius={0} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
