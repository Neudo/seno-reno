import { Zap, AlertTriangle, Clock, CreditCard, FileText, ShoppingCart, PhoneCall } from "lucide-react";

type Priorite = "critique" | "haute" | "normale";

interface ActionUrgente {
  id: number;
  priorite: Priorite;
  categorie: string;
  titre: string;
  detail: string;
  echeance?: string;
  lien?: string;
}

const ACTIONS: ActionUrgente[] = [
  {
    id: 1,
    priorite: "critique",
    categorie: "Paiement en retard",
    titre: "Acompte client non encaissé — Marie-Claire Aubert",
    detail: "Acompte 40% longère Saint-Fargeau · 31 200 € · Prévu le 10/09/2026 · 5 jours de retard",
    echeance: "2026-09-10",
  },
  {
    id: 2,
    priorite: "critique",
    categorie: "Sous-traitant",
    titre: "Facture Plomberie Fontaine à régler — Renard",
    detail: "Acompte ST plomberie complète · 4 000 € · Échéance dépassée",
    echeance: "2026-09-05",
  },
  {
    id: 3,
    priorite: "haute",
    categorie: "Commande",
    titre: "Bois charpente à commander — Renard",
    detail: "Livraison prévue le 15/09 · Piveteaubois · 8 000 € · Chantier démarré le 07/09",
    echeance: "2026-09-15",
  },
  {
    id: 4,
    priorite: "haute",
    categorie: "Devis à relancer",
    titre: "Devis Garnier sans réponse depuis 19 jours",
    detail: "Isolation combles perdus Migennes · 9 600 € · Envoyé le 26/08/2026",
    echeance: "2026-09-26",
  },
  {
    id: 5,
    priorite: "haute",
    categorie: "Acompte à appeler",
    titre: "Appel d'acompte 40% à émettre — Michel Chabrier",
    detail: "Rénovation intérieure Joigny · 21 600 € · Date d'appel prévue le 01/09/2026",
    echeance: "2026-09-01",
  },
  {
    id: 6,
    priorite: "haute",
    categorie: "Acompte à appeler",
    titre: "Solde 70% à facturer — Frédéric Arnould",
    detail: "Réfection SDB Sens · 9 520 € · Réception chantier prévue le 26/09/2026",
    echeance: "2026-09-26",
  },
  {
    id: 7,
    priorite: "normale",
    categorie: "Chantier",
    titre: "Chantier Vasseur en pause depuis 3 mois",
    detail: "Ravalement façade Saint-Fargeau · Reprise prévue octobre · Traitement hydrofuge à planifier",
  },
  {
    id: 8,
    priorite: "normale",
    categorie: "Devis à relancer",
    titre: "Devis Thibaut sans réponse depuis 5 jours",
    detail: "Relance à prévoir cette semaine · Montant non précisé",
    echeance: "2026-09-20",
  },
];

const PRIORITE_CONFIG: Record<
  Priorite,
  { label: string; barColor: string; badgeClass: string; icon: React.ElementType }
> = {
  critique: {
    label: "Critique",
    barColor: "bg-red-500",
    badgeClass: "bg-red-50 text-red-700 border border-red-200",
    icon: AlertTriangle,
  },
  haute: {
    label: "Haute",
    barColor: "bg-amber-400",
    badgeClass: "bg-amber-50 text-amber-700 border border-amber-200",
    icon: Clock,
  },
  normale: {
    label: "Normale",
    barColor: "bg-gray-300",
    badgeClass: "bg-gray-100 text-gray-600 border border-gray-200",
    icon: Zap,
  },
};

const CATEGORIE_ICON: Record<string, React.ElementType> = {
  "Paiement en retard": CreditCard,
  "Sous-traitant": CreditCard,
  "Commande": ShoppingCart,
  "Devis à relancer": FileText,
  "Acompte à appeler": PhoneCall,
  "Chantier": AlertTriangle,
};

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

const isOverdue = (s?: string) => s && new Date(s) < new Date("2026-09-15");

const GROUPES: { priorite: Priorite; label: string }[] = [
  { priorite: "critique", label: "Critique" },
  { priorite: "haute", label: "Priorité haute" },
  { priorite: "normale", label: "À traiter" },
];

export default function UrgentPage() {
  const countCritique = ACTIONS.filter((a) => a.priorite === "critique").length;
  const countHaute = ACTIONS.filter((a) => a.priorite === "haute").length;
  const countNormale = ACTIONS.filter((a) => a.priorite === "normale").length;

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4F5F7]">
      <div className="max-w-screen-lg mx-auto px-6 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight flex items-center gap-2">
            <Zap size={18} className="text-amber-400 fill-amber-400" />
            Urgent
          </h1>
          <p className="text-sm text-gray-400 mt-1">Actions critiques à traiter en priorité</p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-px bg-gray-200 border border-gray-200">
          <div className="bg-white px-5 py-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Critique</p>
            <p className="font-mono text-2xl font-medium text-red-600">{countCritique}</p>
          </div>
          <div className="bg-white px-5 py-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Priorité haute</p>
            <p className="font-mono text-2xl font-medium text-amber-600">{countHaute}</p>
          </div>
          <div className="bg-white px-5 py-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">À traiter</p>
            <p className="font-mono text-2xl font-medium text-gray-500">{countNormale}</p>
          </div>
        </div>

        {/* Grouped actions */}
        {GROUPES.map(({ priorite, label }) => {
          const cfg = PRIORITE_CONFIG[priorite];
          const items = ACTIONS.filter((a) => a.priorite === priorite);
          if (items.length === 0) return null;
          return (
            <div key={priorite} className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-0.5">
                {label}
              </p>
              <div className="space-y-px">
                {items.map((action) => {
                  const CatIcon = CATEGORIE_ICON[action.categorie] ?? Zap;
                  const overdue = isOverdue(action.echeance);
                  return (
                    <div
                      key={action.id}
                      className="bg-white border border-gray-200 flex items-stretch hover:bg-gray-50 transition-colors group cursor-default"
                    >
                      {/* Priority bar */}
                      <div className={`w-1 shrink-0 ${cfg.barColor}`} />

                      {/* Content */}
                      <div className="flex items-center gap-4 px-5 py-4 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <CatIcon size={15} className="text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span
                              className={`text-xs font-medium px-1.5 py-0.5 ${cfg.badgeClass}`}
                            >
                              {action.categorie}
                            </span>
                            {overdue && (
                              <span className="text-xs font-semibold text-red-600">
                                En retard
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-gray-900 leading-tight">
                            {action.titre}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{action.detail}</p>
                        </div>

                        {/* Echeance */}
                        {action.echeance && (
                          <div className="text-right flex-shrink-0 ml-4">
                            <p className="text-xs text-gray-400">Échéance</p>
                            <p
                              className={`font-mono text-sm font-medium ${
                                overdue ? "text-red-600" : "text-gray-700"
                              }`}
                            >
                              {fmtDate(action.echeance)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
