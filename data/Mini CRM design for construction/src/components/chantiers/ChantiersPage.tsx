import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { Plus, Search, HardHat } from "lucide-react";
import type { Chantier, StatutChantier } from "./chantierTypes";
import {
  STATUT_CHANTIER_LABELS,
  STATUT_CHANTIER_STYLE,
  calcCaPrevisionnel,
  calcCoutsPrevisionnels,
} from "./chantierTypes";
import { INITIAL_CHANTIERS } from "./chantierData";

const ALL_STATUTS = Object.keys(STATUT_CHANTIER_LABELS) as StatutChantier[];

const fmt = (n: number) => n.toLocaleString("fr-FR") + " €";

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function ChantiersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [chantiers, setChantiers] = useState<Chantier[]>(INITIAL_CHANTIERS);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState<StatutChantier | "">((searchParams.get("statut") as StatutChantier) || "");

  // Derived state from INITIAL_CHANTIERS so global updates reflect on re-mount
  const filtered = INITIAL_CHANTIERS.filter((c) => {
    if (filterStatut && c.statut !== filterStatut) return false;
    if (search && !c.nom.toLowerCase().includes(search.toLowerCase()) && !c.clientNom.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts: Record<string, number> = { tous: chantiers.length };
  ALL_STATUTS.forEach((s) => {
    counts[s] = chantiers.filter((c) => c.statut === s).length;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="px-6 py-4 bg-white border-b border-gray-100 shrink-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative" style={{ minWidth: 150, maxWidth: 280, flex: "1 1 200px" }}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un chantier…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-[#00365A] transition-colors"
            />
          </div>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value as StatutChantier | "")}
            style={{ minWidth: 150 }}
            className="text-sm border border-gray-200 bg-white rounded-sm px-3 py-1.5 text-gray-600 cursor-pointer"
          >
            <option value="">Tous les statuts ({counts.tous})</option>
            {ALL_STATUTS.map((s) => (
              <option key={s} value={s}>{STATUT_CHANTIER_LABELS[s]} ({counts[s]})</option>
            ))}
          </select>
          <button
            className="ml-auto flex items-center gap-2 bg-[#00365A] text-white text-sm font-medium px-4 py-1.5 rounded-sm hover:bg-[#004d80] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus size={14} />
            Nouveau chantier
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="bg-white border border-gray-200 rounded-sm overflow-x-auto">
          <table className="min-w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Chantier</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Adresse</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">CA prévi.</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Début</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Fin prévue</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <HardHat size={24} className="text-gray-300" />
                      <p className="text-sm text-gray-400">Aucun chantier trouvé.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const ca = calcCaPrevisionnel(c);
                  const couts = calcCoutsPrevisionnels(c);
                  const marge = ca - couts;
                  const margePct = ca ? ((marge / ca) * 100).toFixed(1) : null;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/chantiers/${c.id}`)}
                      className="border-b border-gray-50 cursor-pointer hover:bg-blue-50/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{c.nom}</p>
                        {margePct && (
                          <p className="text-xs text-gray-400">Marge : {margePct} %</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{c.clientNom}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-sm font-medium ${STATUT_CHANTIER_STYLE[c.statut]}`}>
                          {STATUT_CHANTIER_LABELS[c.statut]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[220px] truncate">{c.adresse}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-gray-700">{fmt(ca)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(c.dateDebutPrevue)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(c.dateFinPrevue)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
