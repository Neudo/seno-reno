import { useState } from "react";
import { Plus, Search, Users, X, ChevronRight, Megaphone } from "lucide-react";

type Canal =
  | "instagram"
  | "linkedin"
  | "facebook"
  | "flyers"
  | "panneaux"
  | "bouche_a_oreille"
  | "campagne_locale"
  | "reseau_pro"
  | "autre";

type StatutAction = "active" | "terminee" | "en_pause" | "planifiee";

interface ActionCom {
  id: number;
  nom: string;
  canal: Canal;
  periode?: string;
  statut: StatutAction;
  commentaire?: string;
  contactsIds: number[];
}

const CANAL_LABELS: Record<Canal, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  flyers: "Distribution de flyers",
  panneaux: "Panneaux / affichage",
  bouche_a_oreille: "Bouche à oreille",
  campagne_locale: "Campagne locale",
  reseau_pro: "Réseau professionnel",
  autre: "Autre",
};

const CANAL_ICON: Record<Canal, string> = {
  instagram: "📸",
  linkedin: "💼",
  facebook: "👥",
  flyers: "📄",
  panneaux: "🪧",
  bouche_a_oreille: "🗣️",
  campagne_locale: "📣",
  reseau_pro: "🤝",
  autre: "•",
};

const STATUT_LABELS: Record<StatutAction, string> = {
  active: "Active",
  terminee: "Terminée",
  en_pause: "En pause",
  planifiee: "Planifiée",
};

const STATUT_STYLE: Record<StatutAction, string> = {
  active: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  terminee: "bg-gray-100 text-gray-500 border border-gray-200",
  en_pause: "bg-amber-50 text-amber-700 border border-amber-200",
  planifiee: "bg-blue-50 text-blue-700 border border-blue-200",
};

const INITIAL_ACTIONS: ActionCom[] = [
  {
    id: 1,
    nom: "Instagram — campagne été 2026",
    canal: "instagram",
    periode: "Juil. – Août 2026",
    statut: "active",
    commentaire: "Publications régulières de chantiers en cours. Stories avant/après.",
    contactsIds: [1, 2, 3, 4, 5, 6, 7, 8],
  },
  {
    id: 2,
    nom: "LinkedIn — présence entreprise",
    canal: "linkedin",
    periode: "En continu",
    statut: "active",
    commentaire: "Partage de réalisations et témoignages clients.",
    contactsIds: [9, 10],
  },
  {
    id: 3,
    nom: "Flyers — zone Auxerre / Sens",
    canal: "flyers",
    periode: "Juin 2026",
    statut: "terminee",
    commentaire: "2 000 flyers distribués dans les boîtes aux lettres. Retours faibles.",
    contactsIds: [11],
  },
  {
    id: 4,
    nom: "Réseau professionnel BTP",
    canal: "reseau_pro",
    periode: "En continu",
    statut: "active",
    commentaire: "Recommandations entre artisans, architectes et bureaux d'études.",
    contactsIds: [12, 13, 14],
  },
];

const ALL_CANAUX = Object.keys(CANAL_LABELS) as Canal[];
const ALL_STATUTS = Object.keys(STATUT_LABELS) as StatutAction[];

export default function CommunicationTab() {
  const [actions, setActions] = useState<ActionCom[]>(INITIAL_ACTIONS);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState<StatutAction | "">("");
  const [filterCanal, setFilterCanal] = useState<Canal | "">("");
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selected = actions.find((a) => a.id === selectedId) ?? null;

  const filtered = actions.filter((a) => {
    if (filterStatut && a.statut !== filterStatut) return false;
    if (filterCanal && a.canal !== filterCanal) return false;
    if (search) {
      const q = search.toLowerCase();
      if (![a.nom, a.commentaire ?? ""].join(" ").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const addAction = (data: Omit<ActionCom, "id" | "contactsIds">) => {
    setActions((prev) => [{ ...data, id: Date.now(), contactsIds: [] }, ...prev]);
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
            placeholder="Rechercher une action, un canal…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-[#00365A] transition-colors"
          />
        </div>
        <select
          value={filterCanal}
          onChange={(e) => setFilterCanal(e.target.value as Canal | "")}
          className="text-sm border border-gray-200 bg-white rounded-sm px-3 py-1.5 text-gray-600 cursor-pointer"
        >
          <option value="">Tous les canaux</option>
          {ALL_CANAUX.map((c) => (
            <option key={c} value={c}>{CANAL_LABELS[c]}</option>
          ))}
        </select>
        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value as StatutAction | "")}
          className="text-sm border border-gray-200 bg-white rounded-sm px-3 py-1.5 text-gray-600 cursor-pointer"
        >
          <option value="">Tous les statuts</option>
          {ALL_STATUTS.map((s) => (
            <option key={s} value={s}>{STATUT_LABELS[s]}</option>
          ))}
        </select>
        <button
          onClick={() => setShowForm(true)}
          className="ml-auto flex items-center gap-2 bg-[#00365A] text-white text-sm font-medium px-4 py-1.5 rounded-sm hover:bg-[#004d80] transition-colors whitespace-nowrap"
        >
          <Plus size={14} />
          Ajouter une action
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="bg-white border border-gray-200 rounded-sm overflow-x-auto">
          <table className="min-w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {["Action", "Canal", "Période", "Statut", "Contacts générés", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-12 text-sm">
                    Aucune action de communication enregistrée.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => setSelectedId(a.id === selectedId ? null : a.id)}
                    className="border-b border-gray-50 cursor-pointer hover:bg-blue-50/40 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{a.nom}</p>
                      {a.commentaire && (
                        <p className="text-xs text-gray-400 truncate max-w-[240px]">{a.commentaire}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-sm text-gray-600">
                        <span>{CANAL_ICON[a.canal]}</span>
                        <span className="text-xs">{CANAL_LABELS[a.canal]}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {a.periode ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-sm font-medium ${STATUT_STYLE[a.statut]}`}>
                        {STATUT_LABELS[a.statut]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                        <Users size={11} className="text-gray-400" />
                        {a.contactsIds.length} contact{a.contactsIds.length !== 1 ? "s" : ""}
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

      {/* Detail drawer */}
      {selected && (
        <div
          className="fixed inset-0 z-40 flex justify-end"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedId(null); }}
        >
          <div className="bg-white w-[400px] h-full shadow-2xl border-l border-gray-200 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-lg">{CANAL_ICON[selected.canal]}</span>
                <h3 className="text-sm font-semibold text-gray-800 truncate">{selected.nom}</h3>
              </div>
              <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-gray-600 shrink-0">
                <X size={15} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <DetailRow label="Canal" value={CANAL_LABELS[selected.canal]} />
              <DetailRow label="Période" value={selected.periode ?? "—"} />
              <DetailRow
                label="Statut"
                value={
                  <span className={`text-xs px-2 py-0.5 rounded-sm font-medium ${STATUT_STYLE[selected.statut]}`}>
                    {STATUT_LABELS[selected.statut]}
                  </span>
                }
              />
              {selected.commentaire && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Description</p>
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
                    {selected.contactsIds.length} contact{selected.contactsIds.length > 1 ? "s" : ""} lié{selected.contactsIds.length > 1 ? "s" : ""} à cette action.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <ActionFormModal onClose={() => setShowForm(false)} onSave={addAction} />
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

function ActionFormModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: Omit<ActionCom, "id" | "contactsIds">) => void;
}) {
  const [form, setForm] = useState<{
    nom: string;
    canal: Canal;
    periode: string;
    statut: StatutAction;
    commentaire: string;
  }>({
    nom: "",
    canal: "instagram",
    periode: "",
    statut: "active",
    commentaire: "",
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const canSave = form.nom.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
      <div className="bg-white rounded-sm shadow-xl w-[480px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-sm font-semibold text-gray-800">Nouvelle action de communication</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Nom de l'action *</label>
            <input
              type="text"
              value={form.nom}
              onChange={(e) => set("nom", e.target.value)}
              placeholder="Ex. : Instagram — campagne automne 2026"
              className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm focus:outline-none focus:border-[#00365A]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Canal</label>
              <select
                value={form.canal}
                onChange={(e) => set("canal", e.target.value as Canal)}
                className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm cursor-pointer"
              >
                {ALL_CANAUX.map((c) => (
                  <option key={c} value={c}>{CANAL_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Statut</label>
              <select
                value={form.statut}
                onChange={(e) => set("statut", e.target.value as StatutAction)}
                className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm cursor-pointer"
              >
                {ALL_STATUTS.map((s) => (
                  <option key={s} value={s}>{STATUT_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-500 block mb-1">Période <span className="text-gray-400">(optionnelle)</span></label>
              <input
                type="text"
                value={form.periode}
                onChange={(e) => set("periode", e.target.value)}
                placeholder="Ex. : Juil. – Sept. 2026 ou En continu"
                className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm focus:outline-none focus:border-[#00365A]"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Description / objectifs</label>
            <textarea
              value={form.commentaire}
              onChange={(e) => set("commentaire", e.target.value)}
              rows={3}
              placeholder="Détail de l'action, objectifs, résultats attendus…"
              className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#00365A]"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
          <button onClick={onClose} className="text-sm px-4 py-1.5 border border-gray-200 rounded-sm text-gray-600 hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={() => canSave && onSave({ ...form, periode: form.periode || undefined, commentaire: form.commentaire || undefined })}
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
