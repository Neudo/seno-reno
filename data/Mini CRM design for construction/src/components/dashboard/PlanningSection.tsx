import { CalendarDays, ExternalLink } from "lucide-react";

const EVENTS = [
  {
    date: "28 août",
    dayOfWeek: "Ven",
    label: "Livraison parquet chêne",
    project: "SCI Les Rives — appart T3, quai de la Marine",
    type: "Livraison",
  },
  {
    date: "1er sept.",
    dayOfWeek: "Mar",
    label: "Démarrage chantier",
    project: "Extension bois — M. Bernard, Auxerre",
    type: "Démarrage chantier",
  },
  {
    date: "7 sept.",
    dayOfWeek: "Lun",
    label: "Démarrage chantier",
    project: "Maison ancienne — Mme Renard, Auxerre",
    type: "Démarrage chantier",
  },
  {
    date: "14 sept.",
    dayOfWeek: "Lun",
    label: "Démarrage salle de bain",
    project: "Thomas Petit — Appoigny",
    type: "Démarrage phase",
  },
  {
    date: "26 sept.",
    dayOfWeek: "Sam",
    label: "Fin prévisionnelle",
    project: "SDB Arnould — Sens",
    type: "Fin chantier",
  },
];

const TYPE_COLOR: Record<string, string> = {
  "Démarrage phase": "#00365A",
  "Livraison": "#B45309",
  "Démarrage chantier": "#166534",
  "Fin chantier": "#6B21A8",
  "Réunion": "#1D4ED8",
};

export default function PlanningSection() {
  return (
    <div className="bg-white border border-gray-200">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">À venir</h2>
        <button className="text-xs text-[#00365A] hover:underline cursor-pointer font-medium flex items-center gap-1">
          Planning complet <ExternalLink size={10} />
        </button>
      </div>

      <div className="divide-y divide-gray-100">
        {EVENTS.map((ev, i) => (
          <div key={i} className="flex items-start gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer group">
            {/* Date block */}
            <div className="shrink-0 w-14 text-center">
              <div className="text-xs text-gray-400 font-medium">{ev.dayOfWeek}</div>
              <div className="font-mono text-sm font-semibold text-gray-800 leading-tight mt-0.5">{ev.date}</div>
            </div>

            {/* Separator */}
            <div
              className="w-0.5 self-stretch mt-1 shrink-0"
              style={{ backgroundColor: TYPE_COLOR[ev.type] ?? "#CBD5E1", opacity: 0.5 }}
            />

            {/* Content */}
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 group-hover:text-[#00365A] transition-colors leading-snug">
                {ev.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{ev.project}</p>
              <span
                className="inline-block text-xs mt-1 px-1.5 py-0.5 font-medium"
                style={{
                  color: TYPE_COLOR[ev.type],
                  backgroundColor: `${TYPE_COLOR[ev.type]}12`,
                  border: `1px solid ${TYPE_COLOR[ev.type]}30`,
                }}
              >
                {ev.type}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
