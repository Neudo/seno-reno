import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const currency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
const dateLabel = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
});
const date = (value: string) => dateLabel.format(new Date(`${value}T12:00:00`));

export default function DashboardCashflowChart({
  weeks,
}: {
  weeks: Array<{ date: string; income: number; outgoing: number }>;
}) {
  return (
    <div className="h-40 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={weeks} barGap={2} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke="#F1F5F9" />
          <XAxis
            dataKey="date"
            tickFormatter={date}
            tick={{
              fontSize: 11,
              fill: "#9CA3AF",
              fontFamily: "DM Mono, monospace",
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{
              fontSize: 10,
              fill: "#9CA3AF",
              fontFamily: "DM Mono, monospace",
            }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k`}
            width={36}
          />
          <Tooltip
            formatter={(value) => currency.format(Number(value))}
            labelFormatter={(value) => date(String(value))}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            iconType="square"
            iconSize={8}
          />
          <Bar dataKey="income" name="Encaissements" fill="#166534" />
          <Bar dataKey="outgoing" name="Décaissements" fill="#B91C1C" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
