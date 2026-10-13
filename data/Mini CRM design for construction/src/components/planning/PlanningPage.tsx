import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useNavigate } from "react-router";
import { INITIAL_CHANTIERS } from "../chantiers/chantierData";
import { STATUT_CHANTIER_LABELS, STATUT_CHANTIER_STYLE } from "../chantiers/chantierTypes";
import type { Chantier } from "../chantiers/chantierTypes";

const NAVY = "#00365A";

const STATUS_BAR: Record<string, string> = {
  en_cours: "bg-[#00365A] text-white",
  en_attente: "bg-gray-300 text-gray-700",
  en_pause: "bg-amber-400 text-white",
  termine: "bg-emerald-500 text-white",
  annule: "bg-red-300 text-white",
};

const STATUS_BAR_BG: Record<string, string> = {
  en_cours: NAVY,
  en_attente: "#9ca3af",
  en_pause: "#f59e0b",
  termine: "#10b981",
  annule: "#ef4444",
};

const STATUS_BADGE_BG: Record<string, string> = {
  en_cours: "rgba(0,54,90,0.08)",
  en_attente: "rgba(156,163,175,0.12)",
  en_pause: "rgba(245,158,11,0.10)",
  termine: "rgba(16,185,129,0.10)",
  annule: "rgba(239,68,68,0.08)",
};

const STATUS_BADGE_TEXT: Record<string, string> = {
  en_cours: "#00365A",
  en_attente: "#6b7280",
  en_pause: "#92400e",
  termine: "#065f46",
  annule: "#991b1b",
};

const STATUS_BADGE_SUB: Record<string, string> = {
  en_cours: "#4a7fa0",
  en_attente: "#9ca3af",
  en_pause: "#b45309",
  termine: "#34d399",
  annule: "#f87171",
};

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function parseDate(s?: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  d.setHours(0, 0, 0, 0);
  return isNaN(d.getTime()) ? null : d;
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfMonth(year: number, month: number) {
  return new Date(year, month, 1);
}

// Returns Monday-based week start for a given date
function getWeekStart(d: Date) {
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function fmtShort(d: Date) {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

interface EventBar {
  chantier: Chantier;
  col: number;   // 0–6
  span: number;  // 1–7
  lane: number;
  startsThisWeek: boolean;
  endsThisWeek: boolean;
}

function getEventsForWeek(chantiers: Chantier[], weekStart: Date): EventBar[] {
  const weekEnd = addDays(weekStart, 6);
  weekEnd.setHours(23, 59, 59);

  const active = chantiers.filter((c) => {
    const s = parseDate(c.dateDebutPrevue);
    const e = parseDate(c.dateFinPrevue);
    if (!s || !e) return false;
    return s <= weekEnd && e >= weekStart;
  });

  // Assign lanes greedily
  const lanes: Date[] = []; // lane end dates
  return active.map((c) => {
    const s = parseDate(c.dateDebutPrevue)!;
    const e = parseDate(c.dateFinPrevue)!;
    const clampStart = s < weekStart ? weekStart : s;
    const clampEnd = e > weekEnd ? weekEnd : e;
    const col = Math.round((clampStart.getTime() - weekStart.getTime()) / 86400000);
    const span = Math.round((clampEnd.getTime() - clampStart.getTime()) / 86400000) + 1;

    let lane = lanes.findIndex((lEnd) => lEnd < clampStart);
    if (lane === -1) lane = lanes.length;
    lanes[lane] = clampEnd;

    return {
      chantier: c,
      col,
      span,
      lane,
      startsThisWeek: s >= weekStart,
      endsThisWeek: e <= weekEnd,
    };
  });
}

interface TooltipState {
  chantier: Chantier;
  x: number;
  y: number;
}

export default function PlanningPage() {
  const navigate = useNavigate();
  const onOpenChantier = (id: number) => navigate(`/chantiers?selected=${id}`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const chantiers = INITIAL_CHANTIERS;

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

  const monthStart = startOfMonth(year, month);
  const gridStart = getWeekStart(monthStart);

  // Build 6 weeks
  const weeks: Date[] = [];
  for (let i = 0; i < 6; i++) weeks.push(addDays(gridStart, i * 7));

  const monthLabel = new Date(year, month, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  // Mobile: chantiers active this month
  const monthEnd = new Date(year, month + 1, 0);
  monthEnd.setHours(23, 59, 59);
  const activeThisMonth = chantiers
    .filter((c) => {
      const s = parseDate(c.dateDebutPrevue);
      const e = parseDate(c.dateFinPrevue);
      if (!s || !e) return false;
      return s <= monthEnd && e >= monthStart;
    })
    .sort((a, b) => (parseDate(a.dateDebutPrevue)?.getTime() ?? 0) - (parseDate(b.dateDebutPrevue)?.getTime() ?? 0));

  const handleBarHover = (e: React.MouseEvent, c: Chantier) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ chantier: c, x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const MAX_LANES_VISIBLE = 3;

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto bg-[#F4F5F7] relative">
      <div className="max-w-6xl mx-auto p-6 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold text-gray-800 capitalize">{monthLabel}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={goToday}
              className="text-xs font-medium px-3 py-1.5 border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 rounded-sm transition-colors cursor-pointer"
            >
              Aujourd'hui
            </button>
            <button
              onClick={prevMonth}
              className="w-7 h-7 flex items-center justify-center border border-gray-300 bg-white hover:bg-gray-50 rounded-sm cursor-pointer transition-colors"
            >
              <ChevronLeft size={14} className="text-gray-600" />
            </button>
            <button
              onClick={nextMonth}
              className="w-7 h-7 flex items-center justify-center border border-gray-300 bg-white hover:bg-gray-50 rounded-sm cursor-pointer transition-colors"
            >
              <ChevronRight size={14} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Desktop calendar */}
        <div className="hidden md:block bg-white border border-gray-200 rounded-sm overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAY_LABELS.map((d) => (
              <div key={d} className="py-2 text-center text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                {d}
              </div>
            ))}
          </div>

          {/* Week rows */}
          {weeks.map((weekStart, wi) => {
            const events = getEventsForWeek(chantiers, weekStart);
            const maxLane = events.reduce((m, e) => Math.max(m, e.lane), -1);
            const rowHeight = 44 + Math.min(maxLane + 1, MAX_LANES_VISIBLE) * 44 + 8;
            const overflow = maxLane >= MAX_LANES_VISIBLE;

            return (
              <div key={wi} className="relative border-b border-gray-100 last:border-b-0" style={{ height: rowHeight }}>
                {/* Day cells */}
                <div className="grid grid-cols-7 absolute inset-0">
                  {Array.from({ length: 7 }).map((_, di) => {
                    const day = addDays(weekStart, di);
                    const isToday = isSameDay(day, today);
                    const isCurrentMonth = day.getMonth() === month;
                    const isWeekend = di >= 5;
                    return (
                      <div
                        key={di}
                        className={`border-r border-gray-100 last:border-r-0 ${isWeekend ? "bg-gray-50/60" : ""}`}
                      >
                        <div className="flex items-start justify-end px-2 pt-1.5" style={{ margin: 0, height: 36, paddingTop: 6, paddingRight: 8, paddingBottom: 0, paddingLeft: 8 }}>
                          <span
                            className={`text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full
                              ${isToday ? "bg-[#00365A] text-white" : isCurrentMonth ? "text-gray-700" : "text-gray-300"}`}
                          >
                            {day.getDate()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Event bars */}
                <div className="absolute inset-0 pointer-events-none" style={{ top: 36 }}>
                  {events.map(({ chantier: c, col, span, lane, startsThisWeek, endsThisWeek }) => {
                    if (lane >= MAX_LANES_VISIBLE) return null;
                    const pct = (n: number) => `${(n / 7) * 100}%`;
                    return (
                      <div
                        key={c.id}
                        className="absolute pointer-events-auto cursor-pointer group"
                        style={{
                          left: `calc(${pct(col)} + 4px)`,
                          width: `calc(${pct(span)} - 8px)`,
                          top: lane * 44,
                          height: 40,
                        }}
                        onClick={() => onOpenChantier(c.id)}
                        onMouseMove={(e) => handleBarHover(e, c)}
                        onMouseLeave={() => setTooltip(null)}
                      >
                        <div
                          className="h-full flex flex-col justify-center overflow-hidden whitespace-nowrap select-none transition-opacity group-hover:opacity-90"
                          style={{
                            paddingLeft: startsThisWeek ? "8px" : "10px",
                            paddingRight: endsThisWeek ? "8px" : "10px",
                            background: STATUS_BADGE_BG[c.statut] || "rgba(0,54,90,0.1)",
                            borderLeft: startsThisWeek ? `3px solid ${STATUS_BAR_BG[c.statut] || NAVY}` : "none",
                            borderRight: endsThisWeek ? `3px solid ${STATUS_BAR_BG[c.statut] || NAVY}` : "none",
                            borderRadius: `${startsThisWeek ? "3px" : "0"} ${endsThisWeek ? "3px" : "0"} ${endsThisWeek ? "3px" : "0"} ${startsThisWeek ? "3px" : "0"}`,
                          }}
                        >
                          <span className="truncate text-[11px] font-semibold leading-tight" style={{ color: STATUS_BADGE_TEXT[c.statut] || NAVY }}>{c.nom}</span>
                          {span >= 3 && (
                            <span className="truncate text-[10px] leading-tight hidden lg:block" style={{ color: STATUS_BADGE_SUB[c.statut] || "#64748b" }}>{c.clientNom}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {overflow && (
                    <div
                      className="absolute text-[10px] text-gray-400 font-medium"
                      style={{ bottom: 4, right: 8 }}
                    >
                      +{events.filter(e => e.lane >= MAX_LANES_VISIBLE).length}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile: chronological list */}
        <div className="md:hidden bg-white border border-gray-200 rounded-sm divide-y divide-gray-100">
          {activeThisMonth.length === 0 && (
            <div className="p-6 text-center">
              <Calendar size={24} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">Aucun chantier ce mois-ci</p>
            </div>
          )}
          {activeThisMonth.map((c) => {
            const s = parseDate(c.dateDebutPrevue);
            const e = parseDate(c.dateFinPrevue);
            return (
              <button
                key={c.id}
                onClick={() => onOpenChantier(c.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: STATUS_BAR_BG[c.statut] }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{c.nom}</p>
                  <p className="text-xs text-gray-400 truncate">{c.clientNom}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {s ? fmtShort(s) : "—"} → {e ? fmtShort(e) : "—"}
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-medium shrink-0 ${STATUT_CHANTIER_STYLE[c.statut]}`}>
                  {STATUT_CHANTIER_LABELS[c.statut]}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-50 bg-white border border-gray-200 shadow-lg rounded-sm p-3 w-56 pointer-events-none"
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
        >
          <p className="text-xs font-semibold text-gray-800 mb-1 leading-snug">{tooltip.chantier.nom}</p>
          <p className="text-xs text-gray-500 mb-2">{tooltip.chantier.clientNom}</p>
          <div className="space-y-0.5 text-[11px] text-gray-500">
            <p>{tooltip.chantier.adresse}</p>
            <p className="pt-1">
              {parseDate(tooltip.chantier.dateDebutPrevue) ? fmtDate(parseDate(tooltip.chantier.dateDebutPrevue)!) : "—"}
              {" → "}
              {parseDate(tooltip.chantier.dateFinPrevue) ? fmtDate(parseDate(tooltip.chantier.dateFinPrevue)!) : "—"}
            </p>
          </div>
          <span className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded font-medium ${STATUT_CHANTIER_STYLE[tooltip.chantier.statut]}`}>
            {STATUT_CHANTIER_LABELS[tooltip.chantier.statut]}
          </span>
        </div>
      )}
    </div>
  );
}
