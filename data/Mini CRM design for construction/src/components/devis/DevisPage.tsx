import { useState, useRef } from "react";
import { useSearchParams } from "react-router";
import {
  Search,
  Upload,
  ChevronRight,
  AlertTriangle,
  Clock,
} from "lucide-react";
import type { Devis, StatutDevis } from "./devisTypes";
import {
  STATUT_LABELS,
  STATUT_STYLE,
  fmtMontant,
  fmtDate,
  relanceLabel,
} from "./devisTypes";
import { INITIAL_DEVIS } from "./devisData";
import DevisDetail from "./DevisDetail";
import ImportDevisModal from "./ImportDevisModal";
import CreateChantierModal from "./CreateChantierModal";

const FILTER_TABS: { label: string; value: StatutDevis | "tous" | "action" }[] = [
  { label: "Tous", value: "tous" },
  { label: "À envoyer", value: "a-envoyer" },
  { label: "À relancer", value: "a-relancer" },
  { label: "En discussion", value: "en-discussion" },
  { label: "Signés", value: "signe" },
  { label: "Refusés", value: "refuse" },
];

export default function DevisPage() {
  const [searchParams] = useSearchParams();
  const [devis, setDevis] = useState<Devis[]>(INITIAL_DEVIS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatutDevis | "tous" | "action">(
    (searchParams.get("filtre") as StatutDevis) || "tous"
  );
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [createChantierDevis, setCreateChantierDevis] = useState<Devis | null>(null);

  const selected = devis.find((d) => d.id === selectedId) ?? null;

  if (selected) {
    return (
      <DevisDetail
        devis={selected}
        onBack={() => setSelectedId(null)}
        onUpdate={(updated) =>
          setDevis((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
        }
        onCreateChantier={(d) => {
          setSelectedId(null);
          setCreateChantierDevis(d);
        }}
      />
    );
  }

  const filtered = devis.filter((d) => {
    if (filter !== "tous" && d.statut !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        ![d.numero, d.client, d.adresse, d.projet]
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
        return false;
    }
    return true;
  });

  const counts: Record<string, number> = { tous: devis.length };
  FILTER_TABS.forEach((t) => {
    if (t.value !== "tous" && t.value !== "action") {
      counts[t.value] = devis.filter((d) => d.statut === t.value).length;
    }
  });

  const needActionCount = devis.filter((d) => {
    if (d.statut === "a-envoyer" || d.statut === "a-relancer") return true;
    if (d.prochaineRelance) {
      const { urgent } = relanceLabel(d.prochaineRelance);
      return urgent;
    }
    return false;
  }).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="px-6 py-4 bg-white border-b border-gray-100 shrink-0 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Rechercher un devis, client, projet…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-[#00365A] transition-colors"
            />
          </div>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-1.5 bg-[#00365A] text-white text-sm font-medium rounded-sm hover:bg-[#004A7A] transition-colors shrink-0"
          >
            <Upload size={14} />
            Importer un devis
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {FILTER_TABS.map((tab) => {
            const count =
              tab.value === "tous"
                ? counts.tous
                : counts[tab.value] ?? 0;
            const active = filter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-sm whitespace-nowrap transition-colors ${
                  active
                    ? "bg-[#00365A] text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {tab.label}
                <span
                  className={`text-[10px] px-1 rounded-full ${
                    active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
          {needActionCount > 0 && (
            <button
              onClick={() => {}}
              className="ml-2 flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-sm text-orange-600 bg-orange-50 border border-orange-200 whitespace-nowrap"
            >
              <AlertTriangle size={11} />
              {needActionCount} action{needActionCount > 1 ? "s" : ""} requise{needActionCount > 1 ? "s" : ""}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center bg-white border border-gray-200 rounded-sm">
            <p className="text-sm text-gray-400">Aucun devis trouvé</p>
            <button
              onClick={() => setShowImport(true)}
              className="mt-3 text-xs text-[#00365A] underline underline-offset-2"
            >
              Importer un devis
            </button>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[780px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {[
                  "N° Devis",
                  "Client",
                  "Projet / chantier",
                  "Montant TTC",
                  "Statut",
                  "Dernière action",
                  "Prochaine relance",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((d) => {
                const { label: relLabel, urgent } = relanceLabel(d.prochaineRelance);
                const needsAttention =
                  d.statut === "a-envoyer" ||
                  d.statut === "a-relancer" ||
                  (urgent && d.statut !== "signe" && d.statut !== "refuse");

                return (
                  <tr
                    key={d.id}
                    onClick={() => setSelectedId(d.id)}
                    className={`cursor-pointer hover:bg-blue-50/40 transition-colors group ${
                      needsAttention ? "bg-orange-50/30" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap">
                      {d.numero}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                      {d.client}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[220px] truncate">
                      {d.projet}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-800 whitespace-nowrap tabular-nums">
                      {fmtMontant(d.montantTTC)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-sm text-[11px] font-medium ${STATUT_STYLE[d.statut]}`}
                      >
                        {STATUT_LABELS[d.statut]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {d.derniereAction ?? "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {d.prochaineRelance ? (
                        <span
                          className={`flex items-center gap-1 text-xs font-medium ${
                            urgent
                              ? "text-orange-600"
                              : "text-gray-500"
                          }`}
                        >
                          {urgent && <Clock size={11} />}
                          {relLabel}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight
                        size={14}
                        className="text-gray-300 group-hover:text-[#00365A] transition-colors"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {showImport && (
        <ImportDevisModal
          onClose={() => setShowImport(false)}
          onImport={(d) => {
            setDevis((prev) => [
              { ...d, id: Date.now(), interactions: [] },
              ...prev,
            ]);
            setShowImport(false);
          }}
        />
      )}

      {createChantierDevis && (
        <CreateChantierModal
          devis={createChantierDevis}
          onClose={() => setCreateChantierDevis(null)}
          onConfirm={() => setCreateChantierDevis(null)}
        />
      )}
    </div>
  );
}
