import { useState } from "react";
import { useSearchParams } from "react-router";
import { Plus, ChevronLeft, ChevronRight, X } from "lucide-react";
import { INITIAL_CHANTIERS } from "../chantiers/chantierData";

type MouvementType =
  | "encaissement_client"
  | "paiement_sous_traitant"
  | "commande_fournisseur"
  | "charge_fixe"
  | "depense"
  | "manuel";

type MouvementStatut = "prévu" | "à_régler" | "encaissé" | "payé" | "en_retard" | "annulé";

interface Mouvement {
  id: number;
  datePrevue: string;
  dateReelle?: string;
  libelle: string;
  type: MouvementType;
  chantier?: string;
  montant: number;
  statut: MouvementStatut;
}

const TYPE_LABELS: Record<MouvementType, string> = {
  encaissement_client: "Encaissement client",
  paiement_sous_traitant: "Paiement sous-traitant",
  commande_fournisseur: "Commande fournisseur",
  charge_fixe: "Charge fixe",
  depense: "Dépense",
  manuel: "Mouvement manuel",
};

const STATUT_LABELS: Record<MouvementStatut, string> = {
  prévu: "Prévu",
  à_régler: "À régler",
  encaissé: "Encaissé",
  payé: "Payé",
  en_retard: "En retard",
  annulé: "Annulé",
};

const STATUT_STYLE: Record<MouvementStatut, string> = {
  prévu: "bg-gray-100 text-gray-600",
  à_régler: "bg-amber-100 text-amber-700",
  encaissé: "bg-emerald-100 text-emerald-700",
  payé: "bg-emerald-100 text-emerald-700",
  en_retard: "bg-red-100 text-red-700",
  annulé: "bg-gray-100 text-gray-400 line-through",
};

const INITIAL_MOUVEMENTS: Mouvement[] = [
  { id: 1, datePrevue: "2026-08-05", libelle: "Assurance décennale", type: "charge_fixe", montant: -890, statut: "payé" },
  { id: 2, datePrevue: "2026-08-10", dateReelle: "2026-08-10", libelle: "Acompte client 30% — Rénovation maison Dupont", type: "encaissement_client", chantier: "Jean Dupont — CH01", montant: 12600, statut: "encaissé" },
  { id: 3, datePrevue: "2026-08-15", dateReelle: "2026-08-15", libelle: "Acompte client 30% — Extension Moreau, Toucy", type: "encaissement_client", chantier: "Robert Moreau — CH13", montant: 20400, statut: "encaissé" },
  { id: 4, datePrevue: "2026-08-20", libelle: "Paiement ST — Plomberie Fontaine — acompte Renard", type: "paiement_sous_traitant", chantier: "Nathalie Renard — CH20", montant: -4000, statut: "à_régler" },
  { id: 5, datePrevue: "2026-08-25", libelle: "Commande kit ossature bois — Piveteaubois", type: "commande_fournisseur", chantier: "Pascal Bernard — CH06", montant: -18000, statut: "prévu" },
  { id: 6, datePrevue: "2026-08-30", libelle: "Financement véhicule utilitaire", type: "charge_fixe", montant: -480, statut: "prévu" },
  { id: 7, datePrevue: "2026-09-01", libelle: "Acompte client 30% — Longère Aubert, Saint-Fargeau", type: "encaissement_client", chantier: "Marie-Claire Aubert — CH04", montant: 23400, statut: "en_retard" },
  { id: 8, datePrevue: "2026-09-05", libelle: "Paiement ST — Charpente Puisaye — Longère Aubert", type: "paiement_sous_traitant", chantier: "Marie-Claire Aubert — CH04", montant: -6000, statut: "prévu" },
  { id: 9, datePrevue: "2026-09-10", libelle: "Acompte client 30% — Appart T3 SCI Les Rives", type: "encaissement_client", chantier: "SCI Les Rives de l'Yonne — CH08", montant: 11400, statut: "prévu" },
  { id: 10, datePrevue: "2026-09-15", libelle: "URSSAF trimestrielle", type: "charge_fixe", montant: -2140, statut: "prévu" },
  { id: 11, datePrevue: "2026-09-20", libelle: "Achat outillage divers", type: "depense", montant: -380, statut: "prévu" },
];

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const EMPTY_FORM = {
  datePrevue: "",
  libelle: "",
  type: "manuel" as MouvementType,
  chantier: "",
  montant: "",
  statut: "prévu" as MouvementStatut,
};

export default function TresoreriePage() {
  const [searchParams] = useSearchParams();
  const [year, setYear] = useState(2026);
  const [monthIdx, setMonthIdx] = useState(7); // août = index 7
  const [filterType, setFilterType] = useState<MouvementType | "">((searchParams.get("type") as MouvementType) || "");
  const [filterStatut, setFilterStatut] = useState<MouvementStatut | "">((searchParams.get("statut") as MouvementStatut) || "");
  const [mouvements, setMouvements] = useState<Mouvement[]>(INITIAL_MOUVEMENTS);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [nextId, setNextId] = useState(12);

  const prevMonth = () => {
    if (monthIdx === 0) { setMonthIdx(11); setYear(y => y - 1); }
    else setMonthIdx(m => m - 1);
  };
  const nextMonth = () => {
    if (monthIdx === 11) { setMonthIdx(0); setYear(y => y + 1); }
    else setMonthIdx(m => m + 1);
  };

  const filtered = mouvements.filter((m) => {
    if (filterType && m.type !== filterType) return false;
    if (filterStatut && m.statut !== filterStatut) return false;
    return true;
  });

  const entrees = filtered.filter(m => m.montant > 0 && m.statut !== "annulé").reduce((s, m) => s + m.montant, 0);
  const sorties = filtered.filter(m => m.montant < 0 && m.statut !== "annulé").reduce((s, m) => s + m.montant, 0);
  const solde = entrees + sorties;

  const fmt = (n: number) => {
    const abs = Math.abs(n).toLocaleString("fr-FR", { minimumFractionDigits: 0 });
    if (n > 0) return `+${abs} €`;
    if (n < 0) return `−${abs} €`;
    return "0 €";
  };

  const handleAdd = () => {
    const montantNum = parseFloat(form.montant.replace(",", "."));
    if (!form.datePrevue || !form.libelle || isNaN(montantNum)) return;
    const isEncaissement = ["encaissement_client", "manuel"].includes(form.type) && montantNum > 0;
    const finalMontant = form.type === "encaissement_client" ? Math.abs(montantNum) : -Math.abs(montantNum);
    const adjusted = form.type === "manuel" ? montantNum : finalMontant;
    setMouvements(prev => [...prev, {
      id: nextId,
      datePrevue: form.datePrevue,
      libelle: form.libelle,
      type: form.type,
      chantier: form.chantier || undefined,
      montant: adjusted,
      statut: form.statut,
    }]);
    setNextId(n => n + 1);
    setShowModal(false);
    setForm(EMPTY_FORM);
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer rounded-sm transition-colors">
            <ChevronLeft size={14} />
          </button>
          <span className="text-sm font-semibold text-gray-700 w-36 text-center">
            {MONTHS[monthIdx]} {year}
          </span>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer rounded-sm transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Filters */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as MouvementType | "")}
            className="text-sm border border-gray-200 bg-white rounded-sm px-3 py-1.5 text-gray-600 cursor-pointer"
          >
            <option value="">Tous les types</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value as MouvementStatut | "")}
            className="text-sm border border-gray-200 bg-white rounded-sm px-3 py-1.5 text-gray-600 cursor-pointer"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(STATUT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#00365A] text-white text-sm font-medium px-4 py-1.5 rounded-sm hover:bg-[#004d80] transition-colors cursor-pointer"
          >
            <Plus size={14} />
            Ajouter un mouvement
          </button>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-emerald-100 rounded-sm p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Entrées</p>
          <p className="text-xl font-bold text-emerald-600">{fmt(entrees)}</p>
        </div>
        <div className="bg-white border border-red-100 rounded-sm p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Sorties</p>
          <p className="text-xl font-bold text-red-600">{fmt(sorties)}</p>
        </div>
        <div className={`bg-white border rounded-sm p-4 ${solde >= 0 ? "border-blue-100" : "border-red-100"}`}>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Solde prévisionnel</p>
          <p className={`text-xl font-bold ${solde >= 0 ? "text-[#00365A]" : "text-red-600"}`}>{fmt(solde)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-sm overflow-x-auto">
        <table className="min-w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400 w-28">Date prévue</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400 w-24">Date réelle</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Libellé</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400 w-44">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400 w-28">Chantier</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400 w-28">Montant</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400 w-28">Statut</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-400 py-12 text-sm">
                  Aucun mouvement pour cette période.
                </td>
              </tr>
            ) : (
              filtered
                .sort((a, b) => a.datePrevue.localeCompare(b.datePrevue))
                .map((m) => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600 tabular-nums">
                      {new Date(m.datePrevue).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-gray-400 tabular-nums text-xs">
                      {m.dateReelle ? new Date(m.dateReelle).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{m.libelle}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{TYPE_LABELS[m.type]}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{m.chantier || "—"}</td>
                    <td className={`px-4 py-3 text-right font-semibold tabular-nums ${m.montant > 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {fmt(m.montant)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-sm font-medium ${STATUT_STYLE[m.statut]}`}>
                        {STATUT_LABELS[m.statut]}
                      </span>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>


      {/* Add modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-sm shadow-xl w-[480px] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-gray-800">Ajouter un mouvement manuel</h2>
              <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Date prévue *</label>
                  <input type="date" value={form.datePrevue} onChange={e => setForm(f => ({ ...f, datePrevue: e.target.value }))}
                    className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Type *</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as MouvementType }))}
                    className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm cursor-pointer">
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Libellé *</label>
                <input type="text" value={form.libelle} onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))}
                  placeholder="Ex. : Achat matériaux divers"
                  className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Montant * <span className="text-gray-400">(+ entrée / − sortie)</span></label>
                  <input type="text" value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))}
                    placeholder="Ex. : +5000 ou -1200"
                    className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Chantier</label>
                  <select value={form.chantier} onChange={e => setForm(f => ({ ...f, chantier: e.target.value }))}
                    className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm cursor-pointer bg-white">
                    <option value="">— Optionnel —</option>
                    {INITIAL_CHANTIERS.map(c => (
                      <option key={c.id} value={`${c.clientNom} — CH${String(c.id).padStart(2, "0")}`}>
                        {c.clientNom} — {c.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Statut</label>
                <select value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value as MouvementStatut }))}
                  className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm cursor-pointer">
                  {Object.entries(STATUT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}
                className="text-sm px-4 py-1.5 border border-gray-200 rounded-sm text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                Annuler
              </button>
              <button onClick={handleAdd}
                className="text-sm px-4 py-1.5 bg-[#00365A] text-white rounded-sm hover:bg-[#004d80] cursor-pointer transition-colors font-medium">
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
