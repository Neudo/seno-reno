import { AlertTriangle, ExternalLink } from "lucide-react";

interface Chantier {
  id: number;
  name: string;
  client: string;
  progress: number;
  endDate: string;
  margin: number;
  status: "En cours" | "En retard" | "Termine";
  warning?: string;
}

const CHANTIERS: Chantier[] = [
  {
    id: 1,
    name: "Auxerre — Rénovation maison ancienne",
    client: "Jean Dupont",
    progress: 52,
    endDate: "28 nov. 2026",
    margin: 38.4,
    status: "En cours",
    warning: undefined,
  },
  {
    id: 4,
    name: "Saint-Fargeau — Rénovation longère",
    client: "Marie-Claire Aubert",
    progress: 68,
    endDate: "18 déc. 2026",
    margin: 36.8,
    status: "En cours",
    warning: "Commande menuiseries extérieures en attente",
  },
  {
    id: 13,
    name: "Toucy — Extension ossature bois",
    client: "Robert Moreau",
    progress: 38,
    endDate: "27 nov. 2026",
    margin: 35.1,
    status: "En cours",
    warning: "Acompte intermédiaire à recevoir",
  },
];

const STATUS_STYLES = {
  "En cours": "bg-blue-50 text-blue-700 border border-blue-200",
  "En retard": "bg-red-50 text-red-700 border border-red-200",
  "Termine": "bg-green-50 text-green-700 border border-green-200",
};

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full bg-gray-100 h-1.5" title={`${value}%`}>
      <div
        className="h-full bg-[#00365A] transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default function ChantiersSection() {
  return (
    <div className="bg-white border border-gray-200">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Chantiers à surveiller</h2>
        <button className="text-xs text-[#00365A] hover:underline cursor-pointer font-medium flex items-center gap-1">
          Tous les chantiers <ExternalLink size={10} />
        </button>
      </div>

      <div className="divide-y divide-gray-100">
        {CHANTIERS.map((c) => (
          <div key={c.id} className="px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer group">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 group-hover:text-[#00365A] transition-colors">{c.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{c.client}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 shrink-0 font-medium ${STATUS_STYLES[c.status]}`}>
                {c.status}
              </span>
            </div>

            {/* Progress */}
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Avancement</span>
                <span className="font-mono font-medium text-gray-700">{c.progress}%</span>
              </div>
              <ProgressBar value={c.progress} />
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
              <span>Fin prévue : <span className="text-gray-700 font-medium">{c.endDate}</span></span>
              <span>Marge : <span className="font-mono font-medium text-gray-700">{c.margin}%</span></span>
            </div>

            {/* Warning */}
            {c.warning && (
              <div className="flex items-center gap-1.5 mt-2.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5">
                <AlertTriangle size={11} className="shrink-0" />
                {c.warning}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
