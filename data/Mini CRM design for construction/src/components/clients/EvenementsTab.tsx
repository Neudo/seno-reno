import { useState } from "react";
import { Plus, Search, MapPin, CalendarDays, Users, X, ChevronRight } from "lucide-react";
import type { Evenement, TypeEvenement, StatutEvenement } from "./evenementTypes";
import {
  TYPE_EVENEMENT_LABELS,
  STATUT_EVENEMENT_LABELS,
  STATUT_EVENEMENT_STYLE,
  INITIAL_EVENEMENTS,
} from "./evenementTypes";

const TODAY = new Date().toISOString().slice(0, 10);

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const ALL_TYPES = Object.keys(TYPE_EVENEMENT_LABELS) as TypeEvenement[];
const ALL_STATUTS = Object.keys(STATUT_EVENEMENT_LABELS) as StatutEvenement[];

export default function EvenementsTab() {
  const [evenements, setEvenements] = useState<Evenement[]>(INITIAL_EVENEMENTS);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState<StatutEvenement | "">("");
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selected = evenements.find((e) => e.id === selectedId) ?? null;

  const filtered = evenements.filter((e) => {
    if (filterStatut && e.statut !== filterStatut) return false;
    if (search) {
      const q = search.toLowerCase();
      if (![e.nom, e.lieu, e.commentaire ?? ""].join(" ").toLowerCase().includes(q))
        return false;
    }
    return true;
  });

  const addEvenement = (data: Omit<Evenement, "id" | "contactsIds">) => {
    setEvenements((prev) => [
      { ...data, id: Date.now(), contactsIds: [] },
      ...prev,
    ]);
    setShowForm(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="px-6 py-4 bg-white border-b border-gray-100 shrink-0 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un événement, un lieu…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-[#00365A] transition-colors"
          />
        </div>
        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value as StatutEvenement | "")}
          className="text-sm border border-gray-200 bg-white rounded-sm px-3 py-1.5 text-gray-600 cursor-pointer"
        >
          <option value="">Tous les statuts</option>
          {ALL_STATUTS.map((s) => (
            <option key={s} value={s}>{STATUT_EVENEMENT_LABELS[s]}</option>
          ))}
        </select>
        <button
          onClick={() => setShowForm(true)}
          className="ml-auto flex items-center gap-2 bg-[#00365A] text-white text-sm font-medium px-4 py-1.5 rounded-sm hover:bg-[#004d80] transition-colors whitespace-nowrap"
        >
          <Plus size={14} />
          Ajouter un événement / lieu
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="bg-white border border-gray-200 rounded-sm overflow-x-auto">
          <table className="min-w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {["Nom", "Type", "Lieu", "Date", "Statut", "Contacts", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-12 text-sm">
                    Aucun événement ou lieu enregistré.
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => setSelectedId(e.id === selectedId ? null : e.id)}
                    className="border-b border-gray-50 cursor-pointer hover:bg-blue-50/40 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{e.nom}</p>
                      {e.commentaire && (
                        <p className="text-xs text-gray-400 truncate max-w-[220px]">{e.commentaire}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{TYPE_EVENEMENT_LABELS[e.type]}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin size={11} className="shrink-0" />
                        {e.lieu}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <CalendarDays size={11} className="shrink-0" />
                        {fmtDate(e.date)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-sm font-medium ${STATUT_EVENEMENT_STYLE[e.statut]}`}>
                        {STATUT_EVENEMENT_LABELS[e.statut]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                        <Users size={11} className="text-gray-400" />
                        {e.contactsIds.length} contact{e.contactsIds.length !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-[#00365A] transition-colors" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div
          className="fixed inset-0 z-40 flex justify-end"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedId(null); }}
        >
          <div className="bg-white w-[400px] h-full shadow-2xl border-l border-gray-200 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">{selected.nom}</h3>
              <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-gray-600">
                <X size={15} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <DetailRow label="Type" value={TYPE_EVENEMENT_LABELS[selected.type]} />
              <DetailRow label="Lieu" value={selected.lieu} />
              <DetailRow label="Date" value={fmtDate(selected.date)} />
              <DetailRow
                label="Statut"
                value={
                  <span className={`text-xs px-2 py-0.5 rounded-sm font-medium ${STATUT_EVENEMENT_STYLE[selected.statut]}`}>
                    {STATUT_EVENEMENT_LABELS[selected.statut]}
                  </span>
                }
              />
              {selected.commentaire && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Commentaire</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{selected.commentaire}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">
                  Contacts générés ({selected.contactsIds.length})
                </p>
                {selected.contactsIds.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Aucun contact lié pour l'instant.</p>
                ) : (
                  <p className="text-sm text-gray-600">
                    {selected.contactsIds.length} contact{selected.contactsIds.length > 1 ? "s" : ""} lié{selected.contactsIds.length > 1 ? "s" : ""} à cet événement.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <EvenementFormModal
          onClose={() => setShowForm(false)}
          onSave={addEvenement}
        />
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">{label}</p>
      <div className="text-sm text-gray-700">{value}</div>
    </div>
  );
}

function EvenementFormModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: Omit<Evenement, "id" | "contactsIds">) => void;
}) {
  const [form, setForm] = useState<{
    nom: string;
    type: TypeEvenement;
    lieu: string;
    date: string;
    statut: StatutEvenement;
    commentaire: string;
  }>({
    nom: "",
    type: "foire",
    lieu: "",
    date: "",
    statut: "prevu",
    commentaire: "",
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const canSave = form.nom.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
      <div className="bg-white rounded-sm shadow-xl w-[480px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-sm font-semibold text-gray-800">Nouvel événement / lieu</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Nom *</label>
            <input
              type="text"
              value={form.nom}
              onChange={(e) => set("nom", e.target.value)}
              placeholder="Ex. : Foire d'Auxerre 2026"
              className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm focus:outline-none focus:border-[#00365A]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value as TypeEvenement)}
                className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm cursor-pointer"
              >
                {ALL_TYPES.map((t) => (
                  <option key={t} value={t}>{TYPE_EVENEMENT_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Statut</label>
              <select
                value={form.statut}
                onChange={(e) => set("statut", e.target.value as StatutEvenement)}
                className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm cursor-pointer"
              >
                {ALL_STATUTS.map((s) => (
                  <option key={s} value={s}>{STATUT_EVENEMENT_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Lieu</label>
              <input
                type="text"
                value={form.lieu}
                onChange={(e) => set("lieu", e.target.value)}
                placeholder="Ville, département"
                className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm focus:outline-none focus:border-[#00365A]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Date <span className="text-gray-400">(optionnelle)</span></label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm focus:outline-none focus:border-[#00365A]"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Commentaire</label>
            <textarea
              value={form.commentaire}
              onChange={(e) => set("commentaire", e.target.value)}
              rows={3}
              placeholder="Objectifs, budget, remarques…"
              className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#00365A]"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
          <button onClick={onClose} className="text-sm px-4 py-1.5 border border-gray-200 rounded-sm text-gray-600 hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={() => canSave && onSave({ ...form, commentaire: form.commentaire || undefined, date: form.date || undefined })}
            disabled={!canSave}
            className="text-sm px-4 py-1.5 bg-[#00365A] text-white rounded-sm hover:bg-[#004d80] disabled:opacity-40 transition-colors font-medium"
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}
