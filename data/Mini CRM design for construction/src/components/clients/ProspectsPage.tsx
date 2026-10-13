import { useState } from "react";
import { Plus, Search, Copy, Check, Phone, Mail, ChevronUp, ChevronDown } from "lucide-react";
import type { Prospect, StatutProspect, PrioriteProspect, SourceProspect } from "./types";
import {
  STATUT_LABELS,
  STATUT_STYLE,
  PRIORITE_LABELS,
  PRIORITE_STYLE,
  SOURCE_LABELS,
} from "./types";
import { INITIAL_PROSPECTS, getNextProspectId, getNextInteractionId } from "./prospectData";
import ProspectDrawer from "./ProspectDrawer";
import ProspectFormModal from "./ProspectFormModal";

type QuickView = "tous" | "a_traiter" | "en_retard" | "sans_relance";

const QUICK_VIEWS: { id: QuickView; label: string }[] = [
  { id: "tous", label: "Tous" },
  { id: "a_traiter", label: "À traiter" },
  { id: "en_retard", label: "En retard" },
  { id: "sans_relance", label: "Sans relance" },
];

const TODAY = new Date().toISOString().slice(0, 10);

function isOverdue(date?: string) {
  return !!date && date < TODAY;
}

function relanceSortKey(p: Prospect): string {
  if (!p.prochaineRelance) return "9999-12-31";
  return p.prochaineRelance;
}

function CopyBtn({ value, icon }: { value: string; icon: "mail" | "phone" }) {
  const [copied, setCopied] = useState(false);
  const handle = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const Icon = icon === "mail" ? Mail : Phone;
  return (
    <button
      onClick={handle}
      title={`Copier ${icon === "mail" ? "l'email" : "le téléphone"}`}
      className="group flex items-center gap-1 text-gray-400 hover:text-[#00365A] transition-colors cursor-pointer"
    >
      <Icon size={12} />
      {copied
        ? <Check size={11} className="text-emerald-500" />
        : <Copy size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      }
    </button>
  );
}

function fmtRelance(date?: string) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>(INITIAL_PROSPECTS);
  const [search, setSearch] = useState("");
  const [quickView, setQuickView] = useState<QuickView>("tous");
  const [filterStatut, setFilterStatut] = useState<StatutProspect | "">("");
  const [filterPriorite, setFilterPriorite] = useState<PrioriteProspect | "">("");
  const [filterSource, setFilterSource] = useState<SourceProspect | "">("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const selected = prospects.find((p) => p.id === selectedId) ?? null;

  const filtered = prospects
    .filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !`${p.prenom} ${p.nom} ${p.societe ?? ""} ${p.email} ${p.telephone} ${p.localisation}`.toLowerCase().includes(q)
        )
          return false;
      }
      if (filterStatut && p.statut !== filterStatut) return false;
      if (filterPriorite && p.priorite !== filterPriorite) return false;
      if (filterSource && p.source !== filterSource) return false;
      if (quickView === "a_traiter")
        return ["nouveau", "a_contacter", "a_relancer"].includes(p.statut);
      if (quickView === "en_retard")
        return isOverdue(p.prochaineRelance) && p.statut !== "converti" && p.statut !== "sans_suite";
      if (quickView === "sans_relance")
        return !p.prochaineRelance && p.statut !== "converti" && p.statut !== "sans_suite";
      return true;
    })
    .sort((a, b) => {
      // Overdue first, then by next relance asc, then no relance last
      const aOver = isOverdue(a.prochaineRelance) ? 0 : 1;
      const bOver = isOverdue(b.prochaineRelance) ? 0 : 1;
      if (aOver !== bOver) return aOver - bOver;
      return relanceSortKey(a).localeCompare(relanceSortKey(b));
    });

  const quickCounts: Record<QuickView, number> = {
    tous: prospects.length,
    a_traiter: prospects.filter((p) => ["nouveau", "a_contacter", "a_relancer"].includes(p.statut)).length,
    en_retard: prospects.filter((p) => isOverdue(p.prochaineRelance) && p.statut !== "converti" && p.statut !== "sans_suite").length,
    sans_relance: prospects.filter((p) => !p.prochaineRelance && p.statut !== "converti" && p.statut !== "sans_suite").length,
  };

  const handleUpdate = (updated: Prospect) => {
    setProspects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleConvert = (updated: Prospect) => {
    setProspects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelectedId(null);
  };

  const handleAdd = (p: Omit<Prospect, "id" | "interactions" | "dateCreation"> & { commentaire?: string }) => {
    const newP: Prospect = {
      ...p,
      id: getNextProspectId(),
      interactions: p.commentaire
        ? [{ id: getNextInteractionId(), date: TODAY, type: "note", commentaire: p.commentaire }]
        : [],
      dateCreation: TODAY,
    };
    setProspects((prev) => [newP, ...prev]);
    setShowForm(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="px-6 py-4 bg-white border-b border-gray-100 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative" style={{ minWidth: 150, maxWidth: 250, flex: "1 1 180px" }}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un contact…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-[#00365A] transition-colors"
            />
          </div>

          {/* Filters */}
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value as StatutProspect | "")}
            style={{ minWidth: 150 }}
            className="text-sm border border-gray-200 bg-white rounded-sm px-3 py-1.5 text-gray-600 cursor-pointer"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(STATUT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <select
            value={filterPriorite}
            onChange={(e) => setFilterPriorite(e.target.value as PrioriteProspect | "")}
            style={{ minWidth: 150 }}
            className="text-sm border border-gray-200 bg-white rounded-sm px-3 py-1.5 text-gray-600 cursor-pointer"
          >
            <option value="">Toutes les priorités</option>
            {Object.entries(PRIORITE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value as SourceProspect | "")}
            style={{ minWidth: 150 }}
            className="text-sm border border-gray-200 bg-white rounded-sm px-3 py-1.5 text-gray-600 cursor-pointer"
          >
            <option value="">Toutes les sources</option>
            {Object.entries(SOURCE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <button
            onClick={() => setShowForm(true)}
            className="ml-auto flex items-center gap-2 bg-[#00365A] text-white text-sm font-medium px-4 py-1.5 rounded-sm hover:bg-[#004d80] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus size={14} />
            Ajouter un prospect
          </button>
        </div>

        {/* Quick views */}
        <div className="flex items-center gap-1 mt-3">
          {QUICK_VIEWS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setQuickView(id)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-sm cursor-pointer transition-colors ${
                quickView === id
                  ? "bg-[#00365A] text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-sm font-semibold ${
                quickView === id ? "bg-white/20 text-white" : "bg-white text-gray-500"
              }`}>
                {quickCounts[id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="bg-white border border-gray-200 rounded-sm overflow-x-auto">
          <table className="min-w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Prospect</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Localisation</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Source</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Priorité</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Prochaine relance</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-12 text-sm">
                    Aucun prospect correspondant.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const overdue = isOverdue(p.prochaineRelance);
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className={`border-b border-gray-50 cursor-pointer transition-colors hover:bg-blue-50/40 ${
                        selectedId === p.id ? "bg-blue-50/60" : ""
                      }`}
                    >
                      {/* Prospect */}
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{p.prenom} {p.nom}</p>
                        {p.societe && <p className="text-xs text-gray-400">{p.societe}</p>}
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-600 font-mono text-xs">{p.email}</span>
                            <CopyBtn value={p.email} icon="mail" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-500 text-xs">{p.telephone}</span>
                            <CopyBtn value={p.telephone} icon="phone" />
                          </div>
                        </div>
                      </td>

                      {/* Localisation */}
                      <td className="px-4 py-3 text-gray-500 text-xs">{p.localisation}</td>

                      {/* Source */}
                      <td className="px-4 py-3 text-gray-500 text-xs">{SOURCE_LABELS[p.source]}</td>

                      {/* Statut */}
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-sm font-medium ${STATUT_STYLE[p.statut]}`}>
                          {STATUT_LABELS[p.statut]}
                        </span>
                      </td>

                      {/* Priorité */}
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${PRIORITE_STYLE[p.priorite]}`}>
                          ● {PRIORITE_LABELS[p.priorite]}
                        </span>
                      </td>

                      {/* Prochaine relance */}
                      <td className="px-4 py-3">
                        {p.prochaineRelance ? (
                          <span className={`text-xs font-medium flex items-center gap-1 ${overdue ? "text-red-600" : "text-gray-600"}`}>
                            {overdue ? <ChevronUp size={12} /> : <ChevronDown size={12} className="text-gray-400" />}
                            {fmtRelance(p.prochaineRelance)}
                            {overdue && <span className="text-red-400 font-normal">— en retard</span>}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300 italic">Non définie</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      <ProspectDrawer
        prospect={selected}
        onClose={() => setSelectedId(null)}
        onUpdate={handleUpdate}
        onConvert={handleConvert}
        nextInteractionId={getNextInteractionId}
      />

      {/* Form modal */}
      {showForm && (
        <ProspectFormModal
          onClose={() => setShowForm(false)}
          onSave={handleAdd}
        />
      )}
    </div>
  );
}
