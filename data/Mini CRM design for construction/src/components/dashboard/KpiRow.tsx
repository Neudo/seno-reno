import { HardHat, FileText, CreditCard, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router";

const KPIS = [
  {
    icon: HardHat,
    label: "Chantiers en cours",
    value: "9",
    sub: "2 se terminent ce mois-ci",
    color: "#00365A",
    href: "/chantiers?statut=en_cours",
  },
  {
    icon: FileText,
    label: "Devis à relancer",
    value: "2",
    sub: "Garnier (19 j.) · Thibaut (5 j.)",
    color: "#B45309",
    alert: true,
    href: "/devis?filtre=a-relancer",
  },
  {
    icon: CreditCard,
    label: "Paiements à effectuer",
    value: "5",
    sub: "14 800 €",
    color: "#B91C1C",
    alert: true,
    href: "/finances/tresorerie?statut=%C3%A0_r%C3%A9gler",
  },
  {
    icon: TrendingUp,
    label: "Encaissements attendus",
    value: "42 500 €",
    sub: "Sur les 30 prochains jours",
    color: "#166534",
    href: "/finances/tresorerie?type=encaissement_client",
  },
];

export default function KpiRow() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200 border border-gray-200">
      {KPIS.map(({ icon: Icon, label, value, sub, color, alert, href }) => (
        <div
          key={label}
          onClick={() => navigate(href)}
          className="bg-white px-5 py-4 flex flex-col gap-2 group hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
            <Icon size={14} style={{ color }} className="opacity-60" />
          </div>
          <div className="font-mono text-2xl font-medium tracking-tight" style={{ color }}>
            {value}
          </div>
          <div className={`text-xs ${alert ? "text-amber-700 font-medium" : "text-gray-400"}`}>
            {sub}
          </div>
        </div>
      ))}
    </div>
  );
}
