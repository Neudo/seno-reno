import { useState } from "react";
import {
  Plus,
  Search,
  CheckCircle2,
  X,
  Pencil,
  Trash2,
  CalendarDays,
  Building2,
  ArrowLeft,
} from "lucide-react";
import { INITIAL_CHANTIERS } from "../chantiers/chantierData";

// ─── Types ───────────────────────────────────────────────────────────────────

type TypeDepense = "avance" | "note_frais";
type Affectation = "chantier" | "entreprise";
type StatutDepense = "a_rembourser" | "rembourse";

interface Depense {
  id: number;
  date: string;
  type: TypeDepense;
  libelle: string;
  montant: number;
  commentaire?: string;
  affectation: Affectation;
  chantierId?: number;
  chantierNom?: string;
  affectationLibelle?: string;
  statut: StatutDepense;
  dateRemboursementPrevu?: string;
  dateRemboursement?: string;
}

const TYPE_LABELS: Record<TypeDepense, string> = {
  avance: "Avance personnelle",
  note_frais: "Note de frais",
};

const STATUT_STYLE: Record<StatutDepense, string> = {
  a_rembourser: "bg-orange-50 text-orange-700 border border-orange-200",
  rembourse: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

// ─── Data ────────────────────────────────────────────────────────────────────

const INITIAL_DEPENSES: Depense[] = [
  {
    id: 1,
    date: "2026-08-25",
    type: "avance",
    libelle: "Bricomarché — visserie inox + consommables",
    montant: 187.40,
    commentaire: "Visserie inox pour carrelage SDB + disques meuleuse",
    affectation: "chantier",
    chantierId: 23,
    chantierNom: "Réfection salle de bain — Arnould, Sens",
    statut: "a_rembourser",
    dateRemboursementPrevu: "2026-09-10",
  },
  {
    id: 2,
    date: "2026-08-22",
    type: "avance",
    libelle: "Tout Faire Auxerre — enduits + produits",
    montant: 341.60,
    commentaire: "Complément stock enduits et primaires façade",
    affectation: "chantier",
    chantierId: 4,
    chantierNom: "Rénovation longère — Aubert, Saint-Fargeau",
    statut: "a_rembourser",
    dateRemboursementPrevu: "2026-09-05",
  },
  {
    id: 3,
    date: "2026-08-19",
    type: "note_frais",
    libelle: "Super U — fournitures bureau",
    montant: 57.98,
    commentaire: "Papier, stylos, classeurs pour le bureau",
    affectation: "entreprise",
    affectationLibelle: "Fournitures bureau",
    statut: "a_rembourser",
    dateRemboursementPrevu: "2026-09-01",
  },
  {
    id: 4,
    date: "2026-08-16",
    type: "avance",
    libelle: "Weldom Auxerre — peinture acrylique",
    montant: 214.80,
    commentaire: "Peinture Toupret blanc mat — 4 seaux 15 L",
    affectation: "chantier",
    chantierId: 8,
    chantierNom: "Rénovation appart T3 — SCI Les Rives, Auxerre",
    statut: "a_rembourser",
    dateRemboursementPrevu: "2026-09-01",
  },
  {
    id: 5,
    date: "2026-08-12",
    type: "note_frais",
    libelle: "Péage A6 — aller-retour Joigny",
    montant: 18.60,
    commentaire: "Déplacement réunion chantier Chabrier",
    affectation: "chantier",
    chantierId: 16,
    chantierNom: "Rénovation intérieure — Chabrier, Joigny",
    statut: "a_rembourser",
    dateRemboursementPrevu: "2026-09-01",
  },
  {
    id: 6,
    date: "2026-08-08",
    type: "avance",
    libelle: "Würth — outillage consommable",
    montant: 189.50,
    commentaire: "Lames scie circulaire + perçage + vissage",
    affectation: "entreprise",
    affectationLibelle: "Matériel entreprise",
    statut: "rembourse",
    dateRemboursement: "2026-08-20",
  },
  {
    id: 7,
    date: "2026-07-30",
    type: "note_frais",
    libelle: "Restaurant — déjeuner client Renard",
    montant: 74.00,
    commentaire: "Déjeuner de travail pour signature devis maison",
    affectation: "entreprise",
    affectationLibelle: "Frais commerciaux",
    statut: "rembourse",
    dateRemboursement: "2026-08-15",
  },
  {
    id: 8,
    date: "2026-07-18",
    type: "avance",
    libelle: "Bricomarché Toucy — visserie + chevilles",
    montant: 92.30,
    commentaire: "Consommables chantier toiture Moreau",
    affectation: "chantier",
    chantierId: 14,
    chantierNom: "Réfection toiture ardoise — Moreau, Toucy",
    statut: "rembourse",
    dateRemboursement: "2026-08-01",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

let nextId = 9;
const fmt = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const fmtDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
    : "—";

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent }: {
  label: string; value: string; sub?: string; accent?: "orange" | "emerald" | "default";
}) {
  const color = accent === "orange" ? "text-orange-600" : accent === "emerald" ? "text-emerald-600" : "text-gray-800";
  return (
    <div className="bg-white border border-gray-200 rounded-sm px-5 py-4">
      <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{label}</p>
      <p className={`text-xl font-semibold font-mono tabular-nums ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Rembours modal ───────────────────────────────────────────────────────────

function RemboursModal({ depense, onConfirm, onClose }: {
  depense: Depense; onConfirm: (date: string) => void; onClose: () => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
      <div className="bg-white rounded-sm shadow-xl w-[400px]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Marquer comme remboursé</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={15} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-gray-600">
            <span className="font-medium">{depense.libelle}</span> — {fmt(depense.montant)}
          </p>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Date de remboursement</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm focus:outline-none focus:border-[#00365A]" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
          <button onClick={onClose} className="text-sm px-4 py-1.5 border border-gray-200 rounded-sm text-gray-600 hover:bg-gray-50">Annuler</button>
          <button onClick={() => onConfirm(date)}
            className="text-sm px-4 py-1.5 bg-emerald-600 text-white rounded-sm hover:bg-emerald-700 font-medium flex items-center gap-1.5">
            <CheckCircle2 size={13} /> Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail drawer ────────────────────────────────────────────────────────────

function DetailDrawer({ depense, onClose, onEdit, onDelete, onRembourser }: {
  depense: Depense;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRembourser: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white w-[380px] h-full shadow-2xl border-l border-gray-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0"><X size={15} /></button>
            <h3 className="text-sm font-semibold text-gray-800 truncate">{depense.libelle}</h3>
          </div>
          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-sm font-medium ${STATUT_STYLE[depense.statut]}`}>
            {depense.statut === "a_rembourser" ? "À rembourser" : "Remboursé"}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <DetailRow label="Date de dépense" value={fmtDate(depense.date)} />
          <DetailRow label="Type" value={TYPE_LABELS[depense.type]} />
          <DetailRow label="Montant" value={<span className="font-mono font-semibold text-gray-900">{fmt(depense.montant)}</span>} />

          <DetailRow
            label="Affectation"
            value={
              depense.affectation === "chantier" && depense.chantierNom ? (
                <span className="flex items-center gap-1.5 text-sm text-gray-700">
                  <Building2 size={13} className="text-gray-400" />
                  {depense.chantierNom}
                </span>
              ) : (
                depense.affectationLibelle || "Entreprise"
              )
            }
          />

          {depense.dateRemboursementPrevu && depense.statut === "a_rembourser" && (
            <DetailRow
              label="Remboursement prévu"
              value={
                <span className="flex items-center gap-1 text-sm text-orange-600">
                  <CalendarDays size={13} />
                  {fmtDate(depense.dateRemboursementPrevu)}
                </span>
              }
            />
          )}

          {depense.statut === "rembourse" && depense.dateRemboursement && (
            <DetailRow
              label="Remboursé le"
              value={
                <span className="flex items-center gap-1 text-sm text-emerald-600">
                  <CheckCircle2 size={13} />
                  {fmtDate(depense.dateRemboursement)}
                </span>
              }
            />
          )}

          {depense.commentaire && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Commentaire</p>
              <p className="text-sm text-gray-700 leading-relaxed">{depense.commentaire}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="shrink-0 border-t border-gray-100 px-5 py-4 space-y-2">
          {depense.statut === "a_rembourser" && (
            <button
              onClick={onRembourser}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-sm hover:bg-emerald-700 transition-colors"
            >
              <CheckCircle2 size={14} />
              Marquer comme remboursé
            </button>
          )}
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-1.5 border border-gray-200 text-gray-600 text-sm rounded-sm hover:bg-gray-50 transition-colors"
            >
              <Pencil size={13} /> Modifier
            </button>
            <button
              onClick={onDelete}
              className="flex items-center justify-center gap-1.5 px-4 py-1.5 border border-red-200 text-red-500 text-sm rounded-sm hover:bg-red-50 transition-colors"
            >
              <Trash2 size={13} /> Supprimer
            </button>
          </div>
        </div>
      </div>
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

// ─── Form modal ───────────────────────────────────────────────────────────────

type FormData = {
  date: string; type: TypeDepense; libelle: string; montant: string;
  commentaire: string; affectation: Affectation; chantierId: number | null;
  affectationLibelle: string; dateRemboursementPrevu: string;
};

const EMPTY_FORM: FormData = {
  date: new Date().toISOString().slice(0, 10),
  type: "avance", libelle: "", montant: "", commentaire: "",
  affectation: "chantier", chantierId: null, affectationLibelle: "",
  dateRemboursementPrevu: "",
};

function DepenseFormModal({ initial, onClose, onSave }: {
  initial?: Depense; onClose: () => void; onSave: (data: FormData) => void;
}) {
  const [form, setForm] = useState<FormData>(
    initial ? {
      date: initial.date, type: initial.type, libelle: initial.libelle,
      montant: String(initial.montant), commentaire: initial.commentaire ?? "",
      affectation: initial.affectation, chantierId: initial.chantierId ?? null,
      affectationLibelle: initial.affectationLibelle ?? "",
      dateRemboursementPrevu: initial.dateRemboursementPrevu ?? "",
    } : EMPTY_FORM
  );
  const [chantierSearch, setChantierSearch] = useState(initial?.chantierNom ?? "");
  const [chantierOpen, setChantierOpen] = useState(false);

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) => setForm((f) => ({ ...f, [k]: v }));

  const filteredChantiers = INITIAL_CHANTIERS.filter((c) =>
    `${c.nom} ${c.clientNom}`.toLowerCase().includes(chantierSearch.toLowerCase())
  );
  const selectedChantier = INITIAL_CHANTIERS.find((c) => c.id === form.chantierId);
  const canSave = form.libelle.trim() && Number(form.montant) > 0 &&
    (form.affectation === "entreprise" || form.chantierId !== null);

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
      <div className="bg-white rounded-sm shadow-xl w-[520px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-sm font-semibold text-gray-800">
            {initial ? "Modifier la dépense" : "Ajouter une dépense"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Date + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Date *</label>
              <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)}
                className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm focus:outline-none focus:border-[#00365A]" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Type *</label>
              <select value={form.type} onChange={(e) => set("type", e.target.value as TypeDepense)}
                className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm cursor-pointer focus:outline-none focus:border-[#00365A]">
                <option value="avance">Avance personnelle</option>
                <option value="note_frais">Note de frais</option>
              </select>
            </div>
          </div>

          {/* Libellé */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Libellé / fournisseur *</label>
            <input type="text" value={form.libelle} onChange={(e) => set("libelle", e.target.value)}
              placeholder="Ex. : Bricomarché, Super U…"
              className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm focus:outline-none focus:border-[#00365A]" />
          </div>

          {/* Montant + Date remboursement prévu */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Montant (€) *</label>
              <input type="number" min="0" step="0.01" value={form.montant}
                onChange={(e) => set("montant", e.target.value)} placeholder="0,00"
                className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-[#00365A]" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">
                Remboursement prévu <span className="text-gray-300">(optionnel)</span>
              </label>
              <input type="date" value={form.dateRemboursementPrevu}
                onChange={(e) => set("dateRemboursementPrevu", e.target.value)}
                className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm focus:outline-none focus:border-[#00365A]" />
            </div>
          </div>

          {/* Affectation */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-2">Affectation *</label>
            <div className="flex gap-2">
              {(["chantier", "entreprise"] as Affectation[]).map((a) => (
                <button key={a} type="button" onClick={() => set("affectation", a)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm border transition-colors ${
                    form.affectation === a ? "bg-[#00365A] text-white border-[#00365A]" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}>
                  {a === "chantier" ? <Building2 size={13} /> : null}
                  {a === "chantier" ? "Chantier" : "Entreprise"}
                </button>
              ))}
            </div>
          </div>

          {/* Chantier picker */}
          {form.affectation === "chantier" && (
            <div className="relative">
              <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">Chantier *</label>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={selectedChantier ? `${selectedChantier.nom} — ${selectedChantier.clientNom}` : chantierSearch}
                  onFocus={() => { setChantierSearch(""); set("chantierId", null); setChantierOpen(true); }}
                  onChange={(e) => { setChantierSearch(e.target.value); set("chantierId", null); setChantierOpen(true); }}
                  placeholder="Rechercher un chantier…"
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-[#00365A]"
                />
                {chantierOpen && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-sm shadow-lg z-20 max-h-48 overflow-y-auto">
                    {filteredChantiers.length === 0 ? (
                      <p className="text-sm text-gray-400 px-3 py-2">Aucun chantier trouvé.</p>
                    ) : (
                      filteredChantiers.map((c) => (
                        <button key={c.id} type="button"
                          onClick={() => { set("chantierId", c.id); setChantierSearch(c.nom); setChantierOpen(false); }}
                          className="w-full text-left px-3 py-2.5 hover:bg-blue-50 text-sm border-b border-gray-50 last:border-0">
                          <p className="font-medium text-gray-800">{c.nom}</p>
                          <p className="text-xs text-gray-400">{c.clientNom}</p>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {form.chantierId && (
                <button type="button" onClick={() => { set("chantierId", null); setChantierSearch(""); }}
                  className="mt-1 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                  <X size={10} /> Changer de chantier
                </button>
              )}
            </div>
          )}

          {/* Affectation libre */}
          {form.affectation === "entreprise" && (
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">
                Objet <span className="text-gray-400">(optionnel)</span>
              </label>
              <input type="text" value={form.affectationLibelle}
                onChange={(e) => set("affectationLibelle", e.target.value)}
                placeholder="Ex. : Fournitures bureau, Matériel entreprise…"
                className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm focus:outline-none focus:border-[#00365A]" />
            </div>
          )}

          {/* Commentaire */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-400 block mb-1">
              Commentaire <span className="text-gray-400">(optionnel)</span>
            </label>
            <textarea value={form.commentaire} onChange={(e) => set("commentaire", e.target.value)}
              rows={2} placeholder="Détail, contexte…"
              className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#00365A]" />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
          <button onClick={onClose} className="text-sm px-4 py-1.5 border border-gray-200 rounded-sm text-gray-600 hover:bg-gray-50">Annuler</button>
          <button disabled={!canSave} onClick={() => canSave && onSave(form)}
            className="text-sm px-4 py-1.5 bg-[#00365A] text-white rounded-sm hover:bg-[#004d80] disabled:opacity-40 font-medium">
            {initial ? "Enregistrer" : "Ajouter la dépense"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type FilterStatut = "tous" | "a_rembourser" | "rembourse";

export default function RemboursementsPage() {
  const [depenses, setDepenses] = useState<Depense[]>(INITIAL_DEPENSES);
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState<FilterStatut>("tous");
  const [filterType, setFilterType] = useState<"" | TypeDepense>("");
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editDepense, setEditDepense] = useState<Depense | null>(null);
  const [remboursDepense, setRemboursDepense] = useState<Depense | null>(null);

  const selected = depenses.find((d) => d.id === selectedId) ?? null;

  const aRembourser = depenses.filter((d) => d.statut === "a_rembourser");
  const rembourse = depenses.filter((d) => d.statut === "rembourse");
  const totalARembourser = aRembourser.reduce((s, d) => s + d.montant, 0);
  const totalRembourse = rembourse.reduce((s, d) => s + d.montant, 0);

  const filtered = depenses.filter((d) => {
    if (filterStatut !== "tous" && d.statut !== filterStatut) return false;
    if (filterType && d.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      if (![d.libelle, d.chantierNom ?? "", d.affectationLibelle ?? "", d.commentaire ?? ""]
        .join(" ").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const buildDepense = (form: FormData, existing?: Depense): Depense => {
    const chantier = INITIAL_CHANTIERS.find((c) => c.id === form.chantierId);
    return {
      ...(existing ?? { id: nextId++, statut: "a_rembourser" as StatutDepense }),
      date: form.date, type: form.type,
      libelle: form.libelle.trim(), montant: Number(form.montant),
      commentaire: form.commentaire.trim() || undefined,
      affectation: form.affectation,
      chantierId: form.chantierId ?? undefined,
      chantierNom: chantier?.nom,
      affectationLibelle: form.affectation === "entreprise" ? form.affectationLibelle.trim() || undefined : undefined,
      dateRemboursementPrevu: form.dateRemboursementPrevu || undefined,
      derniereAction: existing?.dateRemboursement,
    } as Depense;
  };

  const handleAdd = (form: FormData) => {
    setDepenses((prev) => [buildDepense(form), ...prev]);
    setShowForm(false);
  };

  const handleEdit = (form: FormData) => {
    if (!editDepense) return;
    setDepenses((prev) => prev.map((d) => d.id === editDepense.id ? buildDepense(form, editDepense) : d));
    setEditDepense(null);
    setSelectedId(null);
  };

  const handleRembourse = (date: string) => {
    if (!remboursDepense) return;
    setDepenses((prev) => prev.map((d) =>
      d.id === remboursDepense.id ? { ...d, statut: "rembourse", dateRemboursement: date } : d
    ));
    setRemboursDepense(null);
    setSelectedId(null);
  };

  const handleDelete = (id: number) => {
    setDepenses((prev) => prev.filter((d) => d.id !== id));
    setSelectedId(null);
  };

  const FILTER_TABS = [
    { id: "tous" as FilterStatut, label: "Tous", count: depenses.length },
    { id: "a_rembourser" as FilterStatut, label: "À rembourser", count: aRembourser.length },
    { id: "rembourse" as FilterStatut, label: "Remboursés", count: rembourse.length },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="px-6 py-4 bg-white border-b border-gray-100 shrink-0 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <KpiCard label="À rembourser" value={fmt(totalARembourser)}
            sub={`${aRembourser.length} dépense${aRembourser.length > 1 ? "s" : ""} en attente`} accent="orange" />
          <KpiCard label="Déjà remboursé" value={fmt(totalRembourse)}
            sub={`${rembourse.length} dépense${rembourse.length > 1 ? "s" : ""}`} accent="emerald" />
          <KpiCard label="Total avancé" value={fmt(totalARembourser + totalRembourse)}
            sub="Toutes périodes confondues" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Rechercher une dépense…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-[#00365A] transition-colors" />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as "" | TypeDepense)}
            className="text-sm border border-gray-200 bg-white rounded-sm px-3 py-1.5 text-gray-600 cursor-pointer">
            <option value="">Tous les types</option>
            <option value="avance">Avance personnelle</option>
            <option value="note_frais">Note de frais</option>
          </select>
          <button onClick={() => setShowForm(true)}
            className="ml-auto flex items-center gap-2 bg-[#00365A] text-white text-sm font-medium px-4 py-1.5 rounded-sm hover:bg-[#004d80] transition-colors whitespace-nowrap">
            <Plus size={14} /> Ajouter une dépense
          </button>
        </div>

        <div className="flex items-center gap-1">
          {FILTER_TABS.map((t) => (
            <button key={t.id} onClick={() => setFilterStatut(t.id)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-sm transition-colors ${
                filterStatut === t.id ? "bg-[#00365A] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}>
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-sm font-semibold ${
                filterStatut === t.id ? "bg-white/20 text-white" : "bg-white text-gray-500"
              }`}>{t.count}</span>
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
                {["Date", "Type", "Libellé / fournisseur", "Montant", "Affectation", "Remb. prévu", "Statut"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-12 text-sm">Aucune dépense correspondante.</td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} onClick={() => setSelectedId(d.id)}
                    className={`border-b border-gray-50 cursor-pointer hover:bg-blue-50/40 transition-colors ${selectedId === d.id ? "bg-blue-50/50" : ""}`}>
                    <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(d.date)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{TYPE_LABELS[d.type]}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{d.libelle}</p>
                      {d.commentaire && <p className="text-xs text-gray-400 truncate max-w-[200px]">{d.commentaire}</p>}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold tabular-nums text-gray-800">{fmt(d.montant)}</td>
                    <td className="px-4 py-3">
                      {d.affectation === "chantier" && d.chantierNom ? (
                        <span className="flex items-center gap-1 text-xs text-gray-600">
                          <Building2 size={11} className="text-gray-400 shrink-0" />{d.chantierNom}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">{d.affectationLibelle || "Entreprise"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {d.dateRemboursementPrevu && d.statut === "a_rembourser" ? (
                        <span className="flex items-center gap-1 text-xs text-orange-500">
                          <CalendarDays size={11} />{fmtDate(d.dateRemboursementPrevu)}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-sm font-medium ${STATUT_STYLE[d.statut]}`}>
                        {d.statut === "a_rembourser" ? "À rembourser" : "Remboursé"}
                      </span>
                      {d.statut === "rembourse" && d.dateRemboursement && (
                        <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                          <CalendarDays size={9} />{fmtDate(d.dateRemboursement)}
                        </p>
                      )}
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
        <DetailDrawer
          depense={selected}
          onClose={() => setSelectedId(null)}
          onEdit={() => { setEditDepense(selected); setSelectedId(null); }}
          onDelete={() => handleDelete(selected.id)}
          onRembourser={() => setRemboursDepense(selected)}
        />
      )}

      {/* Modals */}
      {showForm && <DepenseFormModal onClose={() => setShowForm(false)} onSave={handleAdd} />}
      {editDepense && <DepenseFormModal initial={editDepense} onClose={() => setEditDepense(null)} onSave={handleEdit} />}
      {remboursDepense && (
        <RemboursModal depense={remboursDepense} onConfirm={handleRembourse} onClose={() => setRemboursDepense(null)} />
      )}
    </div>
  );
}
