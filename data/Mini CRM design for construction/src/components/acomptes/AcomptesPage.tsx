import { useState } from "react";
import { CheckCircle2, Clock, AlertCircle, Receipt, Pencil, X, Check } from "lucide-react";
import { INITIAL_CHANTIERS } from "../chantiers/chantierData";
import type { StatutAcompte } from "../chantiers/chantierTypes";
import { STATUT_ACOMPTE_LABELS, STATUT_ACOMPTE_STYLE } from "../chantiers/chantierTypes";

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

type Filtre = "tous" | StatutAcompte;

interface AcompteFlat {
  id: number;
  chantierId: number;
  chantierNom: string;
  clientNom: string;
  libelle: string;
  montant: number;
  statut: StatutAcompte;
  dateAppelPrevue?: string;
  dateRelance?: string;
}

function getAllAcomptes(): AcompteFlat[] {
  return INITIAL_CHANTIERS.flatMap((c) =>
    c.acomptes.map((a) => ({
      id: a.id,
      chantierId: c.id,
      chantierNom: c.nom,
      clientNom: c.clientNom,
      libelle: a.libelle,
      montant: a.montant,
      statut: a.statut,
      dateAppelPrevue: a.dateAppelPrevue,
      dateRelance: a.dateRelance,
    }))
  );
}

const STATUT_ICON: Record<StatutAcompte, React.ElementType> = {
  a_appeler: AlertCircle,
  appele: Clock,
  encaisse: CheckCircle2,
};

const ACOMPTE_STATUTS: StatutAcompte[] = ["a_appeler", "appele", "encaisse"];

const TODAY = "2026-09-15";
const isOverdue = (a: AcompteFlat) =>
  a.statut === "a_appeler" && !!a.dateAppelPrevue && a.dateAppelPrevue < TODAY;

export default function AcomptesPage() {
  const [filtre, setFiltre] = useState<Filtre>("a_appeler");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    libelle: string; montant: string; statut: StatutAcompte; dateAppelPrevue: string; dateRelance: string;
  }>({ libelle: "", montant: "", statut: "a_appeler", dateAppelPrevue: "", dateRelance: "" });

  // Re-derive on every render so mutations to INITIAL_CHANTIERS are reflected
  const allAcomptes = getAllAcomptes();

  const filtered = filtre === "tous" ? allAcomptes : allAcomptes.filter((a) => a.statut === filtre);

  const totalAAP = allAcomptes.filter((a) => a.statut === "a_appeler").reduce((s, a) => s + a.montant, 0);
  const totalAppele = allAcomptes.filter((a) => a.statut === "appele").reduce((s, a) => s + a.montant, 0);
  const totalEncaisse = allAcomptes.filter((a) => a.statut === "encaisse").reduce((s, a) => s + a.montant, 0);

  const FILTRES: { key: Filtre; label: string; count: number }[] = [
    { key: "a_appeler", label: "À appeler", count: allAcomptes.filter((a) => a.statut === "a_appeler").length },
    { key: "appele", label: "Appelé", count: allAcomptes.filter((a) => a.statut === "appele").length },
    { key: "encaisse", label: "Encaissé", count: allAcomptes.filter((a) => a.statut === "encaisse").length },
    { key: "tous", label: "Tous", count: allAcomptes.length },
  ];

  const openEdit = (a: AcompteFlat) => {
    setEditingId(a.id);
    setEditForm({
      libelle: a.libelle,
      montant: String(a.montant),
      statut: a.statut,
      dateAppelPrevue: a.dateAppelPrevue ?? "",
      dateRelance: a.dateRelance ?? "",
    });
  };

  const saveEdit = () => {
    if (editingId === null) return;
    const montant = parseFloat(editForm.montant.replace(",", "."));
    if (isNaN(montant) || !editForm.libelle.trim()) return;
    for (const chantier of INITIAL_CHANTIERS) {
      const idx = chantier.acomptes.findIndex((a) => a.id === editingId);
      if (idx !== -1) {
        chantier.acomptes[idx] = {
          ...chantier.acomptes[idx],
          libelle: editForm.libelle.trim(),
          montant,
          statut: editForm.statut,
          dateAppelPrevue: editForm.dateAppelPrevue || undefined,
          dateRelance: editForm.dateRelance || undefined,
        };
        break;
      }
    }
    setEditingId(null);
  };

  const [, forceRender] = useState(0);
  const commitEdit = () => { saveEdit(); forceRender((n) => n + 1); };
  const quickStatus = (a: AcompteFlat, statut: StatutAcompte) => {
    for (const chantier of INITIAL_CHANTIERS) {
      const idx = chantier.acomptes.findIndex((ac) => ac.id === a.id);
      if (idx !== -1) { chantier.acomptes[idx].statut = statut; break; }
    }
    forceRender((n) => n + 1);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4F5F7]">
      <div className="max-w-screen-xl mx-auto px-6 py-6 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight flex items-center gap-2">
            <Receipt size={18} className="text-[#00365A]" />
            Acomptes à appeler
          </h1>
          <p className="text-sm text-gray-400 mt-1">Suivi des acomptes par chantier — CRUD depuis la fiche chantier (Aperçu)</p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-px bg-gray-200 border border-gray-200">
          <div className="bg-white px-5 py-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">À appeler</p>
            <p className="font-mono text-2xl font-medium text-amber-700">{fmt(totalAAP)}</p>
            <p className="text-xs text-gray-400 mt-1">{allAcomptes.filter((a) => a.statut === "a_appeler").length} acompte(s)</p>
          </div>
          <div className="bg-white px-5 py-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Appelé — en attente</p>
            <p className="font-mono text-2xl font-medium text-blue-700">{fmt(totalAppele)}</p>
            <p className="text-xs text-gray-400 mt-1">{allAcomptes.filter((a) => a.statut === "appele").length} acompte(s)</p>
          </div>
          <div className="bg-white px-5 py-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Encaissé</p>
            <p className="font-mono text-2xl font-medium text-emerald-700">{fmt(totalEncaisse)}</p>
            <p className="text-xs text-gray-400 mt-1">{allAcomptes.filter((a) => a.statut === "encaisse").length} acompte(s)</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-px bg-gray-200 border border-gray-200 w-fit">
          {FILTRES.map(({ key, label, count }) => (
            <button key={key} onClick={() => setFiltre(key)}
              className={`px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${filtre === key ? "bg-[#00365A] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
              {label}
              <span className={`ml-1.5 font-mono ${filtre === key ? "text-white/70" : "text-gray-400"}`}>{count}</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-36 whitespace-nowrap">Statut</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-56">Chantier / Client</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Libellé</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Montant</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-36 whitespace-nowrap">Date d'appel</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 whitespace-nowrap">Relance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((a) => {
                const Icon = STATUT_ICON[a.statut];
                const overdue = isOverdue(a);
                const isEditingThis = editingId === a.id;

                return (
                  <tr key={a.id} onClick={() => openEdit(a)} className={`hover:bg-gray-50 transition-colors cursor-pointer group ${isEditingThis ? "bg-gray-100" : ""}`}>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${STATUT_ACOMPTE_STYLE[a.statut]}`}>
                          <Icon size={12} />
                          {STATUT_ACOMPTE_LABELS[a.statut]}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900 text-xs leading-tight max-w-[220px] truncate">{a.chantierNom}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{a.clientNom}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 text-xs whitespace-nowrap">{a.libelle}</td>
                    <td className="px-5 py-3.5 text-right font-mono font-medium text-gray-900 whitespace-nowrap">{fmt(a.montant)}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`font-mono text-xs ${overdue ? "text-red-600 font-semibold" : "text-gray-600"}`}>
                        {fmtDate(a.dateAppelPrevue)}
                      </span>
                      {overdue && <span className="ml-1.5 text-xs text-red-500 font-medium">En retard</span>}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-400 whitespace-nowrap">{fmtDate(a.dateRelance)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-gray-400">Aucun acompte dans ce filtre.</div>
          )}
        </div>
      </div>

      {/* Slide-over Edit Form */}
      {editingId !== null && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40 transition-opacity backdrop-blur-sm" onClick={() => setEditingId(null)} />
          <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Modifier l'acompte</h2>
              <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"><X size={20} /></button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Libellé</label>
                <input type="text" value={editForm.libelle} onChange={e => setEditForm(f => ({ ...f, libelle: e.target.value }))}
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-[#00365A] focus:border-[#00365A]" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (€)</label>
                <input type="text" value={editForm.montant} onChange={e => setEditForm(f => ({ ...f, montant: e.target.value }))}
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-[#00365A] focus:border-[#00365A]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select value={editForm.statut} onChange={e => setEditForm(f => ({ ...f, statut: e.target.value as StatutAcompte }))}
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded-md cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#00365A] focus:border-[#00365A]">
                  {ACOMPTE_STATUTS.map(s => <option key={s} value={s}>{STATUT_ACOMPTE_LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'appel prévue</label>
                <input type="date" value={editForm.dateAppelPrevue} onChange={e => setEditForm(f => ({ ...f, dateAppelPrevue: e.target.value }))}
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-[#00365A] focus:border-[#00365A]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de relance</label>
                <input type="date" value={editForm.dateRelance} onChange={e => setEditForm(f => ({ ...f, dateRelance: e.target.value }))}
                  className="w-full border border-gray-300 px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-[#00365A] focus:border-[#00365A]" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setEditingId(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer">Annuler</button>
              <button onClick={commitEdit} className="px-4 py-2 text-sm font-medium text-white bg-[#00365A] hover:bg-[#002640] rounded-md flex items-center gap-2 transition-colors cursor-pointer">
                <Check size={16} /> Enregistrer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
