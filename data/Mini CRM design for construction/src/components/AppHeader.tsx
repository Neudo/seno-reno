import { Search, Bell, ChevronDown } from "lucide-react";
import { useLocation } from "react-router";

const ROUTE_TITLES: { match: (p: string) => boolean; title: string; sub?: string }[] = [
  { match: (p) => p === "/", title: "Bonjour Pierre-Emmanuel", sub: "Voici les éléments à surveiller aujourd'hui." },
  { match: (p) => p === "/routine/parametres", title: "Personnalisation de la routine", sub: "Paramètres › Routine quotidienne" },
  { match: (p) => p.startsWith("/routine"), title: "Routine du jour", sub: "Checklist quotidienne" },
  { match: (p) => p.startsWith("/clients"), title: "Clients & prospects" },
  { match: (p) => p.startsWith("/devis"), title: "Devis" },
  { match: (p) => p.startsWith("/chantiers"), title: "Chantiers" },
  { match: (p) => p.startsWith("/planning"), title: "Planning" },
  { match: (p) => p.startsWith("/finances"), title: "Finances" },
  { match: (p) => p.startsWith("/outils/base-prix"), title: "Base de prix" },
  { match: (p) => p.startsWith("/outils/bdc"), title: "Génération BDC" },
  { match: (p) => p.startsWith("/outils"), title: "Outils" },
  { match: (p) => p.startsWith("/parametres"), title: "Paramètres", sub: "Configuration de l'application" },
];

export default function AppHeader() {
  const { pathname } = useLocation();
  const match = ROUTE_TITLES.find((r) => r.match(pathname));
  const title = match?.title ?? "SENO Rénovation";
  const sub = match?.sub;

  return (
    <header className="flex items-center justify-between px-6 bg-white border-b border-gray-200 shrink-0" style={{ height: 64 }}>
      <div>
        <h1 className="text-base font-semibold text-gray-900 leading-tight">{title}</h1>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 hover:bg-gray-100 transition-colors cursor-pointer">
          <Bell size={16} className="text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <button className="flex items-center gap-2 pl-3 pr-2 py-1.5 hover:bg-gray-50 border border-gray-200 transition-colors cursor-pointer">
          <div className="w-6 h-6 bg-[#00365A] flex items-center justify-center">
            <span className="text-white text-xs font-semibold">PE</span>
          </div>
          <span className="text-sm text-gray-700 hidden md:block">P.-E. Martin</span>
          <ChevronDown size={12} className="text-gray-400" />
        </button>
      </div>
    </header>
  );
}
