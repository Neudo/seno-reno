import {
  Home,
  Users,
  UserRound,
  TrendingUp,
  FileText,
  HardHat,
  CalendarDays,
  BarChart2,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  Wallet,
  Receipt,
  PieChart,
  RefreshCw,
  Wrench,
  FileOutput,
  ShoppingBasket,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { NavLink, useLocation } from "react-router";

const CLIENTS_SUB = [
  { icon: UserRound, label: "Clients", path: "/clients/liste" },
  { icon: Users, label: "Prospection", path: "/clients/prospects" },
  { icon: TrendingUp, label: "Statistiques", path: "/clients/statistiques" },
];

const FINANCES_SUB = [
  { icon: LayoutDashboard, label: "Vue d'ensemble", path: "/finances/overview" },
  { icon: Wallet, label: "Trésorerie", path: "/finances/tresorerie" },
  { icon: Receipt, label: "Charges fixes", path: "/finances/charges" },
  { icon: PieChart, label: "Marges", path: "/finances/marges" },
  { icon: RefreshCw, label: "Remboursements PE", path: "/finances/remboursements" },
];

const OUTILS_SUB = [
  { icon: Database, label: "Base de prix", path: "/outils/base-prix" },
  { icon: FileOutput, label: "Génération BDC", path: "/outils/bdc" },
];

const NAV_ITEMS_TOP = [
  { icon: ShoppingBasket, label: "Achats", path: "/achats" },
];

const NAV_ITEMS = [
  { icon: Home, label: "Accueil", path: "/" },
  { icon: ClipboardList, label: "Routine", path: "/routine" },
  { icon: Users, label: "Clients & prospects", path: "/clients", sub: CLIENTS_SUB },
  { icon: FileText, label: "Devis", path: "/devis" },
  { icon: HardHat, label: "Chantiers", path: "/chantiers" },
  { icon: CalendarDays, label: "Planning", path: "/planning" },
  { icon: BarChart2, label: "Finances", path: "/finances", sub: FINANCES_SUB },
  { icon: Wrench, label: "Outils", path: "/outils", sub: OUTILS_SUB },
];

function SubItems({ items, collapsed }: { items: typeof CLIENTS_SUB; collapsed: boolean }) {
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1 py-1">
        {items.map(({ path, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `w-1.5 h-1.5 rounded-full cursor-pointer transition-colors ${isActive ? "bg-white" : "bg-white/30 hover:bg-white/60"}`
            }
            title={label}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="pb-1">
      {items.map(({ icon: Icon, label, path }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `w-full flex items-center gap-2.5 pl-10 pr-4 py-2 text-left text-xs transition-colors cursor-pointer border-l-2 ${
              isActive
                ? "border-white/60 text-white font-medium bg-white/10"
                : "border-transparent text-white/45 hover:text-white/80 hover:bg-white/5"
            }`
          }
        >
          <Icon size={13} className="shrink-0" />
          <span className="whitespace-nowrap">{label}</span>
        </NavLink>
      ))}
    </div>
  );
}

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();

  return (
    <aside
      className="flex flex-col h-full bg-[#00365A] text-white transition-all duration-200 relative shrink-0"
      style={{ width: collapsed ? 56 : 220 }}
    >
      {/* Logo area */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10" style={{ minHeight: 64 }}>
        <div className="flex items-center justify-center w-8 h-8 bg-white shrink-0">
          <span className="text-[#00365A] font-bold text-xs tracking-tight">SR</span>
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold tracking-wide whitespace-nowrap overflow-hidden">
            SENO Rénovation
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {/* Urgent */}
        <div className="px-3 pb-3">
          <NavLink
            to="/urgent"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 w-full font-semibold text-sm transition-all cursor-pointer border ${
                isActive
                  ? "bg-amber-400 text-[#00365A] border-amber-400"
                  : "bg-amber-400/15 text-amber-300 border-amber-400/25 hover:bg-amber-400 hover:text-[#00365A] hover:border-amber-400"
              }`
            }
            title={collapsed ? "Urgent" : undefined}
          >
            <Zap size={14} className="shrink-0 fill-current" />
            {!collapsed && <span className="whitespace-nowrap tracking-wide uppercase text-xs">Urgent</span>}
          </NavLink>
        </div>

        {/* Achats */}
        {NAV_ITEMS_TOP.map(({ icon: Icon, label, path }) => {
          const active = pathname.startsWith(path);
          return (
            <NavLink
              key={path}
              to={path}
              className={() =>
                `w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors cursor-pointer border-l-2 ${
                  active
                    ? "bg-white/15 text-white font-medium border-white"
                    : "text-white/60 hover:bg-white/8 hover:text-white border-transparent"
                }`
              }
              title={collapsed ? label : undefined}
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && <span className="whitespace-nowrap flex-1">{label}</span>}
            </NavLink>
          );
        })}

        {/* Séparateur */}
        <div className="mx-4 my-2 border-t border-white/10" />

        {NAV_ITEMS.map(({ icon: Icon, label, path, sub }) => {
          const isExact = path === "/";
          const active = isExact ? pathname === "/" : pathname.startsWith(path);

          return (
            <div key={path}>
              <NavLink
                to={sub ? sub[0].path : path}
                end={isExact}
                className={() =>
                  `w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors cursor-pointer border-l-2 ${
                    active
                      ? "bg-white/15 text-white font-medium border-white"
                      : "text-white/60 hover:bg-white/8 hover:text-white border-transparent"
                  }`
                }
                title={collapsed ? label : undefined}
              >
                <Icon size={16} className="shrink-0" />
                {!collapsed && <span className="whitespace-nowrap flex-1">{label}</span>}
                {!collapsed && sub && (
                  <ChevronDown
                    size={13}
                    className={`shrink-0 transition-transform duration-200 ${active ? "rotate-0 text-white/70" : "-rotate-90 text-white/30"}`}
                  />
                )}
              </NavLink>

              {sub && active && <SubItems items={sub} collapsed={collapsed} />}
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/10">
        <NavLink
          to="/parametres"
          className={({ isActive }) =>
            `w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors border-l-2 cursor-pointer ${
              isActive
                ? "bg-white/15 text-white font-medium border-white"
                : "text-white/60 hover:text-white hover:bg-white/8 border-transparent"
            }`
          }
          title={collapsed ? "Paramètres" : undefined}
        >
          <Settings size={16} className="shrink-0" />
          {!collapsed && <span>Paramètres</span>}
        </NavLink>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-16 w-6 h-6 bg-white border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50 z-10 shadow-sm"
        title={collapsed ? "Ouvrir le menu" : "Réduire le menu"}
      >
        {collapsed ? (
          <ChevronRight size={12} className="text-[#00365A]" />
        ) : (
          <ChevronLeft size={12} className="text-[#00365A]" />
        )}
      </button>
    </aside>
  );
}
