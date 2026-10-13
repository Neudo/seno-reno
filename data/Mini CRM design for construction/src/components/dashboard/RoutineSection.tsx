import { useState } from "react";
import { CheckSquare, Square, MoreHorizontal, ExternalLink } from "lucide-react";

type BadgeType = "today" | "late" | "followup" | "verify";

interface RoutineItem {
  id: number;
  type: string;
  title: string;
  entity: string;
  detail: string;
  badge: BadgeType;
  badgeLabel: string;
  action: string;
}

const BADGE_STYLES: Record<BadgeType, string> = {
  today: "bg-blue-50 text-blue-700 border border-blue-200",
  late: "bg-red-50 text-red-700 border border-red-200",
  followup: "bg-amber-50 text-amber-700 border border-amber-200",
  verify: "bg-gray-100 text-gray-600 border border-gray-200",
};

const ITEMS: RoutineItem[] = [
  {
    id: 1,
    type: "Devis",
    title: "Relancer le devis DEV-2026-0074",
    entity: "Philippe Garnier — Migennes",
    detail: "Électricité mise aux normes — 6 800 € TTC — 19 j. sans réponse",
    badge: "late",
    badgeLabel: "En retard",
    action: "Relancer",
  },
  {
    id: 2,
    type: "Sous-traitant",
    title: "Régler acompte — Plomberie Fontaine",
    entity: "Chantier Renard — Auxerre",
    detail: "4 000 € — échéance aujourd'hui",
    badge: "today",
    badgeLabel: "Aujourd'hui",
    action: "Régler",
  },
  {
    id: 3,
    type: "Facturation",
    title: "Envoyer la facture d'acompte 30%",
    entity: "Extension Bernard — Auxerre",
    detail: "Acompte 30% — 18 600 €",
    badge: "today",
    badgeLabel: "Aujourd'hui",
    action: "Envoyer",
  },
  {
    id: 4,
    type: "Livraison",
    title: "Vérifier la livraison parquet chêne",
    entity: "Appart T3 quai Marine — SCI Les Rives",
    detail: "BL n°PB-2026-1142 — Parquet Bourgogne",
    badge: "verify",
    badgeLabel: "À vérifier",
    action: "Confirmer",
  },
  {
    id: 5,
    type: "Devis",
    title: "Envoyer le devis DEV-2026-0069",
    entity: "Guy Lefebvre — Moutiers-en-Puisaye",
    detail: "Plomberie complète — 7 400 € TTC — finalisé le 25/08",
    badge: "followup",
    badgeLabel: "À envoyer",
    action: "Envoyer",
  },
];

export default function RoutineSection() {
  const [done, setDone] = useState<Set<number>>(new Set());

  const toggle = (id: number) =>
    setDone((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const remaining = ITEMS.filter((i) => !done.has(i.id)).length;

  return (
    <div className="bg-white border border-gray-200">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Routine du jour</h2>
          {remaining > 0 && (
            <span className="font-mono text-xs bg-[#00365A] text-white px-2 py-0.5">{remaining}</span>
          )}
        </div>
        <span className="text-xs text-gray-400">
          {done.size}/{ITEMS.length} traité{done.size !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="divide-y divide-gray-100">
        {ITEMS.map((item) => {
          const isDone = done.has(item.id);
          return (
            <div
              key={item.id}
              className={`flex items-start gap-4 px-5 py-3.5 group transition-colors ${isDone ? "bg-gray-50 opacity-50" : "hover:bg-gray-50"}`}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggle(item.id)}
                className="mt-0.5 shrink-0 text-gray-300 hover:text-[#00365A] transition-colors cursor-pointer"
              >
                {isDone ? (
                  <CheckSquare size={16} className="text-[#00365A]" />
                ) : (
                  <Square size={16} />
                )}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                  <span className="text-xs font-mono text-gray-400 shrink-0">{item.type}</span>
                  <span className={`text-xs px-1.5 py-0.5 font-medium ${BADGE_STYLES[item.badge]}`}>
                    {item.badgeLabel}
                  </span>
                </div>
                <p className={`text-sm font-medium mt-1 leading-snug ${isDone ? "line-through text-gray-400" : "text-gray-900"}`}>
                  {item.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  <span className="text-[#00365A] font-medium">{item.entity}</span>
                  {" — "}
                  {item.detail}
                </p>
              </div>

              {/* Action */}
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-xs px-2.5 py-1.5 bg-[#00365A] text-white hover:bg-[#004A7A] transition-colors cursor-pointer font-medium">
                  {item.action}
                </button>
                <button className="p-1.5 hover:bg-gray-100 transition-colors cursor-pointer">
                  <MoreHorizontal size={14} className="text-gray-400" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
