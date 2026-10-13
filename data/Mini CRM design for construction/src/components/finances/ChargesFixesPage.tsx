import { useState } from "react";
import { Plus, X, Pencil, ToggleLeft, ToggleRight, Bell } from "lucide-react";

type Frequence = "mensuelle" | "trimestrielle" | "annuelle" | "ponctuelle";
type Categorie = "cotisations" | "assurances" | "vehicules" | "honoraires" | "salaires" | "abonnements" | "fournisseurs" | "autre";

interface Charge {
  id: number;
  nom: string;
  montant: number;
  frequence: Frequence;
  echeance: string;
  categorie: Categorie;
  dateDebut: string;
  dateFin?: string;
  commentaire?: string;
  rappelJours: number;
  actif: boolean;
}

const FREQ_LABELS: Record<Frequence, string> = {
  mensuelle: "Mensuelle",
  trimestrielle: "Trimestrielle",
  annuelle: "Annuelle",
  ponctuelle: "Ponctuelle",
};

const CAT_LABELS: Record<Categorie, string> = {
  cotisations: "Cotisations",
  assurances: "Assurances",
  vehicules: "Véhicules",
  honoraires: "Honoraires",
  salaires: "Salaires",
  abonnements: "Abonnements",
  fournisseurs: "Fournisseurs",
  autre: "Autre",
};

const CAT_STYLE: Record<Categorie, string> = {
  cotisations: "bg-purple-100 text-purple-700",
  assurances: "bg-blue-100 text-blue-700",
  vehicules: "bg-cyan-100 text-cyan-700",
  honoraires: "bg-indigo-100 text-indigo-700",
  salaires: "bg-rose-100 text-rose-700",
  abonnements: "bg-yellow-100 text-yellow-700",
  fournisseurs: "bg-orange-100 text-orange-700",
  autre: "bg-gray-100 text-gray-600",
};

const INITIAL_CHARGES: Charge[] = [
  { id: 1, nom: "URSSAF — cotisations sociales", montant: 3760, frequence: "trimestrielle", echeance: "5", categorie: "cotisations", dateDebut: "2024-01-01", rappelJours: 5, actif: true },
  { id: 2, nom: "Assurance décennale", montant: 890, frequence: "mensuelle", echeance: "5", categorie: "assurances", dateDebut: "2024-01-01", rappelJours: 3, actif: true },
  { id: 3, nom: "Assurance RC Pro", montant: 210, frequence: "mensuelle", echeance: "10", categorie: "assurances", dateDebut: "2024-01-01", rappelJours: 3, actif: true },
  { id: 4, nom: "Financement véhicule utilitaire", montant: 480, frequence: "mensuelle", echeance: "30", categorie: "vehicules", dateDebut: "2023-06-01", dateFin: "2028-06-01", rappelJours: 3, actif: true },
  { id: 5, nom: "Comptable — honoraires mensuels", montant: 320, frequence: "mensuelle", echeance: "28", categorie: "honoraires", dateDebut: "2024-01-01", rappelJours: 5, actif: true },
  { id: 6, nom: "Microsoft 365 Business", montant: 54, frequence: "mensuelle", echeance: "15", categorie: "abonnements", dateDebut: "2024-03-01", rappelJours: 0, actif: true },
  { id: 7, nom: "Téléphonie professionnelle", montant: 78, frequence: "mensuelle", echeance: "20", categorie: "abonnements", dateDebut: "2024-01-01", rappelJours: 0, actif: true },
  { id: 8, nom: "Logiciel de devis", montant: 49, frequence: "mensuelle", echeance: "1", categorie: "abonnements", dateDebut: "2025-01-01", rappelJours: 0, actif: false },
];

const EMPTY_FORM = {
  nom: "",
  montant: "",
  frequence: "mensuelle" as Frequence,
  echeance: "",
  categorie: "autre" as Categorie,
  dateDebut: "",
  dateFin: "",
  commentaire: "",
  rappelJours: "3",
};

export default function ChargesFixesPage() {
  const [charges, setCharges] = useState<Charge[]>(INITIAL_CHARGES);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [nextId, setNextId] = useState(9);

  const totalMensuel = charges
    .filter(c => c.actif)
    .reduce((sum, c) => {
      if (c.frequence === "mensuelle") return sum + c.montant;
      if (c.frequence === "trimestrielle") return sum + c.montant / 3;
      if (c.frequence === "annuelle") return sum + c.montant / 12;
      return sum;
    }, 0);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (c: Charge) => {
    setEditId(c.id);
    setForm({
      nom: c.nom,
      montant: c.montant.toString(),
      frequence: c.frequence,
      echeance: c.echeance,
      categorie: c.categorie,
      dateDebut: c.dateDebut,
      dateFin: c.dateFin || "",
      commentaire: c.commentaire || "",
      rappelJours: c.rappelJours.toString(),
    });
    setShowModal(true);
  };

  const handleSave = () => {
    const montantNum = parseFloat(form.montant.replace(",", "."));
    if (!form.nom || isNaN(montantNum)) return;
    const rappel = parseInt(form.rappelJours) || 0;
    if (editId !== null) {
      setCharges(prev => prev.map(c => c.id === editId ? {
        ...c, nom: form.nom, montant: montantNum, frequence: form.frequence,
        echeance: form.echeance, categorie: form.categorie, dateDebut: form.dateDebut,
        dateFin: form.dateFin || undefined, commentaire: form.commentaire || undefined,
        rappelJours: rappel,
      } : c));
    } else {
      setCharges(prev => [...prev, {
        id: nextId, nom: form.nom, montant: montantNum, frequence: form.frequence,
        echeance: form.echeance, categorie: form.categorie, dateDebut: form.dateDebut,
        dateFin: form.dateFin || undefined, commentaire: form.commentaire || undefined,
        rappelJours: rappel, actif: true,
      }]);
      setNextId(n => n + 1);
    }
    setShowModal(false);
    setForm(EMPTY_FORM);
  };

  const toggleActif = (id: number) => {
    setCharges(prev => prev.map(c => c.id === id ? { ...c, actif: !c.actif } : c));
  };

  const fmt = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 0 }) + " €";

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 mt-0.5">
            Total mensuel estimé (charges actives) :{" "}
            <span className="font-semibold text-[#00365A]">{fmt(Math.round(totalMensuel))}</span>
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#00365A] text-white text-sm font-medium px-4 py-1.5 rounded-sm hover:bg-[#004d80] transition-colors cursor-pointer"
        >
          <Plus size={14} />
          Nouvelle charge
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-sm overflow-x-auto">
        <table className="min-w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Charge</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400 w-28">Catégorie</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400 w-24">Montant</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400 w-32">Fréquence</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400 w-32">Prochaine échéance</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400 w-20">Rappel</th>
              <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400 w-20">Actif</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {charges.map((c) => (
              <tr key={c.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${!c.actif ? "opacity-50" : ""}`}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{c.nom}</p>
                  {c.commentaire && <p className="text-xs text-gray-400 mt-0.5">{c.commentaire}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-sm font-medium ${CAT_STYLE[c.categorie]}`}>
                    {CAT_LABELS[c.categorie]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-gray-700">
                  {fmt(c.montant)}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{FREQ_LABELS[c.frequence]}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {c.echeance ? `Le ${c.echeance} du mois` : "—"}
                </td>
                <td className="px-4 py-3">
                  {c.rappelJours > 0 ? (
                    <span className="flex items-center gap-1 text-xs text-amber-600">
                      <Bell size={11} />
                      {c.rappelJours} j. avant
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleActif(c.id)} className="cursor-pointer">
                    {c.actif
                      ? <ToggleRight size={20} className="text-[#00365A]" />
                      : <ToggleLeft size={20} className="text-gray-300" />
                    }
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => openEdit(c)} className="text-gray-300 hover:text-gray-600 cursor-pointer transition-colors">
                    <Pencil size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-sm shadow-xl w-[540px] p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-gray-800">
                {editId ? "Modifier la charge" : "Nouvelle charge fixe"}
              </h2>
              <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Nom de la charge *</label>
                <input type="text" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Ex. : URSSAF, assurance décennale…"
                  className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Montant (€) *</label>
                  <input type="text" value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))}
                    placeholder="Ex. : 890"
                    className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Fréquence *</label>
                  <select value={form.frequence} onChange={e => setForm(f => ({ ...f, frequence: e.target.value as Frequence }))}
                    className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm cursor-pointer">
                    {Object.entries(FREQ_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Catégorie</label>
                  <select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value as Categorie }))}
                    className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm cursor-pointer">
                    {Object.entries(CAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Jour ou date d'échéance</label>
                  <input type="text" value={form.echeance} onChange={e => setForm(f => ({ ...f, echeance: e.target.value }))}
                    placeholder="Ex. : 5, 15, 30"
                    className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Date de début</label>
                  <input type="date" value={form.dateDebut} onChange={e => setForm(f => ({ ...f, dateDebut: e.target.value }))}
                    className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Date de fin <span className="text-gray-400">(optionnelle)</span></label>
                  <input type="date" value={form.dateFin} onChange={e => setForm(f => ({ ...f, dateFin: e.target.value }))}
                    className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Rappel avant échéance (jours)</label>
                <input type="number" min="0" max="30" value={form.rappelJours} onChange={e => setForm(f => ({ ...f, rappelJours: e.target.value }))}
                  className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
                <p className="text-xs text-gray-400 mt-1">0 = aucun rappel</p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Commentaire</label>
                <textarea value={form.commentaire} onChange={e => setForm(f => ({ ...f, commentaire: e.target.value }))}
                  rows={2} placeholder="Note interne optionnelle"
                  className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm resize-none" />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}
                className="text-sm px-4 py-1.5 border border-gray-200 rounded-sm text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                Annuler
              </button>
              <button onClick={handleSave}
                className="text-sm px-4 py-1.5 bg-[#00365A] text-white rounded-sm hover:bg-[#004d80] cursor-pointer transition-colors font-medium">
                {editId ? "Enregistrer" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
