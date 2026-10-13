import { useNavigate } from "react-router";
import { ArrowRight, ShoppingCart, Banknote, Receipt } from "lucide-react";
import { INITIAL_CHANTIERS } from "../chantiers/chantierData";
import { ACOMPTES_DATA } from "../acomptes/acomptesData";

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

function useCommandesStats() {
  const commandesAP = INITIAL_CHANTIERS.flatMap((c) =>
    c.commandes
      .filter((cmd) => cmd.statutCommande === "a_commander")
      .map((cmd) => ({ ...cmd, chantierId: c.id, chantierNom: c.nom }))
  );
  const total = commandesAP.reduce((s, c) => s + c.montantPrevisionnel, 0);
  const chantiersCount = new Set(commandesAP.map((c) => c.chantierId)).size;
  return { count: commandesAP.length, total, chantiersCount };
}

function useAcomptesStats() {
  const today = new Date("2026-09-15");
  const fin = new Date("2026-10-15");
  const urgents = ACOMPTES_DATA.filter((a) => {
    if (a.statut !== "a_appeler") return false;
    const d = new Date(a.dateAppelPrevue);
    return d >= today && d <= fin;
  });
  const total = urgents.reduce((s, a) => s + a.montant, 0);
  return { count: urgents.length, total };
}

interface QuickCard {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  mainValue: string;
  detail: string;
  actionLabel: string;
  href: string;
  accentColor: string;
  bgAccent: string;
}

export default function QuickAccessSection() {
  const navigate = useNavigate();
  const cmd = useCommandesStats();
  const acp = useAcomptesStats();

  const cards: QuickCard[] = [
    {
      id: "tresorerie",
      icon: Banknote,
      title: "Trésorerie",
      subtitle: "Solde prévisionnel 30 j.",
      mainValue: "+13 350 €",
      detail: "38 200 € encaissements · 24 850 € décaissements",
      actionLabel: "Voir la trésorerie",
      href: "/finances/tresorerie",
      accentColor: "#166534",
      bgAccent: "#F0FDF4",
    },
    {
      id: "commandes",
      icon: ShoppingCart,
      title: "Commandes à passer",
      subtitle: `${cmd.chantiersCount} chantier${cmd.chantiersCount > 1 ? "s" : ""} concerné${cmd.chantiersCount > 1 ? "s" : ""}`,
      mainValue: `${cmd.count} article${cmd.count > 1 ? "s" : ""}`,
      detail: `Montant prévisionnel : ${fmt(cmd.total)}`,
      actionLabel: "Voir les commandes",
      href: "/commandes",
      accentColor: "#B45309",
      bgAccent: "#FFFBEB",
    },
    {
      id: "acomptes",
      icon: Receipt,
      title: "Acomptes à appeler",
      subtitle: "30 prochains jours",
      mainValue: `${acp.count} acompte${acp.count > 1 ? "s" : ""}`,
      detail: `À facturer : ${fmt(acp.total)}`,
      actionLabel: "Voir les acomptes",
      href: "/acomptes",
      accentColor: "#7C3AED",
      bgAccent: "#F5F3FF",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-200 border border-gray-200">
      {cards.map(
        ({ id, icon: Icon, title, subtitle, mainValue, detail, actionLabel, href, accentColor, bgAccent }) => (
          <button
            key={id}
            onClick={() => navigate(href)}
            className="bg-white text-left px-5 py-4 flex flex-col gap-3 hover:bg-gray-50 transition-colors group cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                  style={{ background: bgAccent }}
                >
                  <Icon size={15} style={{ color: accentColor }} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900 uppercase tracking-wider leading-none">
                    {title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-gray-300 group-hover:text-gray-500 transition-colors mt-1 flex-shrink-0"
              />
            </div>

            <div>
              <p className="font-mono text-2xl font-medium tracking-tight" style={{ color: accentColor }}>
                {mainValue}
              </p>
              <p className="text-xs text-gray-400 mt-1">{detail}</p>
            </div>

            <div
              className="text-xs font-medium flex items-center gap-1 transition-colors"
              style={{ color: accentColor }}
            >
              {actionLabel}
              <ArrowRight size={11} />
            </div>
          </button>
        )
      )}
    </div>
  );
}
