import { useState } from "react";
import {
  ArrowLeft,
  Plus,
  X,
  MapPin,
  User,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  FileText,
  Pencil,
  Trash2,
  Receipt,
} from "lucide-react";
import type {
  Chantier,
  Acompte,
  StatutAcompte,
  Commande,
  SousTraitant,
  PlusMoinsValue,
  DocumentChantier,
  StatutCommande,
  StatutPaiement,
  TypePMV,
  StatutPMV,
  CategorieDocument,
} from "./chantierTypes";
import {
  STATUT_CHANTIER_LABELS,
  STATUT_CHANTIER_STYLE,
  STATUT_COMMANDE_LABELS,
  STATUT_COMMANDE_STYLE,
  STATUT_PAIEMENT_LABELS,
  STATUT_PAIEMENT_STYLE,
  STATUT_PMV_LABELS,
  STATUT_PMV_STYLE,
  STATUT_ACOMPTE_LABELS,
  STATUT_ACOMPTE_STYLE,
  CATEGORIE_DOCUMENT_LABELS,
  calcCaPrevisionnel,
  calcCaReel,
  calcCoutsPrevisionnels,
  calcCoutsReels,
  pct,
} from "./chantierTypes";
import {
  getNextCommandeId,
  getNextSTId,
  getNextPMVId,
  getNextDocId,
  getNextAcompteId,
} from "./chantierData";
import { ACHATS_LISTE, getNextAchatId } from "../achats/achatsData";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";

type Tab = "apercu" | "commandes" | "sous_traitants" | "pmv" | "documents" | "finances";

const TABS: { id: Tab; label: string }[] = [
  { id: "apercu", label: "Aperçu" },
  { id: "commandes", label: "Commandes & achats" },
  { id: "sous_traitants", label: "Sous-traitants" },
  { id: "pmv", label: "Plus / moins-values" },
  { id: "documents", label: "Documents" },
  { id: "finances", label: "Finances" },
];

const fmt = (n: number) => n.toLocaleString("fr-FR") + " €";
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—";

// ─── Aperçu ────────────────────────────────────────────────────────────────

const ACOMPTE_STATUTS: StatutAcompte[] = ["a_appeler", "appele", "encaisse"];

const defaultRelance = () => {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
};

function AcomptesCard({ c, onUpdate }: { c: Chantier; onUpdate: (ch: Chantier) => void }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Acompte | null>(null);
  const [form, setForm] = useState({ libelle: "", montant: "", statut: "a_appeler" as StatutAcompte, dateAppelPrevue: "", dateRelance: defaultRelance() });

  const openAdd = () => {
    setEditing(null);
    setForm({ libelle: "", montant: "", statut: "a_appeler", dateAppelPrevue: "", dateRelance: defaultRelance() });
    setShowModal(true);
  };

  const openEdit = (a: Acompte) => {
    setEditing(a);
    setForm({ libelle: a.libelle, montant: String(a.montant), statut: a.statut, dateAppelPrevue: a.dateAppelPrevue ?? "", dateRelance: a.dateRelance ?? defaultRelance() });
    setShowModal(true);
  };

  const handleSave = () => {
    const montant = parseFloat(form.montant.replace(",", "."));
    if (!form.libelle.trim() || isNaN(montant)) return;
    const entry: Acompte = {
      id: editing?.id ?? getNextAcompteId(),
      libelle: form.libelle.trim(),
      montant,
      statut: form.statut,
      dateAppelPrevue: form.dateAppelPrevue || undefined,
      dateRelance: form.dateRelance || undefined,
    };
    const acomptes = editing
      ? c.acomptes.map((a) => (a.id === editing.id ? entry : a))
      : [...c.acomptes, entry];
    onUpdate({ ...c, acomptes });
    setShowModal(false);
  };

  const remove = (id: number) => onUpdate({ ...c, acomptes: c.acomptes.filter((a) => a.id !== id) });

  const totalAAppeler = c.acomptes.filter((a) => a.statut === "a_appeler").reduce((s, a) => s + a.montant, 0);

  return (
    <div className="bg-white border border-gray-200 rounded-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Receipt size={13} className="text-violet-500" />
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Acomptes</h3>
          {totalAAppeler > 0 && (
            <span className="font-mono text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-sm border border-amber-200">
              {fmt(totalAAppeler)} à appeler
            </span>
          )}
        </div>
        <button onClick={openAdd} className="flex items-center gap-1 text-xs text-[#00365A] hover:underline cursor-pointer">
          <Plus size={11} /> Ajouter
        </button>
      </div>

      {c.acomptes.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Aucun acompte défini.</p>
      ) : (
        <div className="space-y-2">
          {c.acomptes.map((a) => (
            <div key={a.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0 group">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{a.libelle}</p>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {a.dateAppelPrevue && (
                    <span className="text-xs text-gray-400 font-mono">{fmtDate(a.dateAppelPrevue)}</span>
                  )}
                  {a.dateRelance && a.statut === "a_appeler" && (
                    <span className="text-xs text-gray-400">Relance : {fmtDate(a.dateRelance)}</span>
                  )}
                </div>
              </div>
              <span className="font-mono text-sm font-semibold text-gray-800 flex-shrink-0">{fmt(a.montant)}</span>
              <span className={`text-xs px-2 py-0.5 rounded-sm font-medium flex-shrink-0 ${STATUT_ACOMPTE_STYLE[a.statut]}`}>
                {STATUT_ACOMPTE_LABELS[a.statut]}
              </span>
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button onClick={() => openEdit(a)} className="text-gray-400 hover:text-[#00365A] cursor-pointer"><Pencil size={12} /></button>
                <button onClick={() => remove(a.id)} className="text-gray-400 hover:text-red-500 cursor-pointer"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-sm shadow-xl w-[420px]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">{editing ? "Modifier l'acompte" : "Ajouter un acompte"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={16} /></button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Libellé *</label>
                <input type="text" value={form.libelle} onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))} placeholder="Ex. : Acompte 30% à la commande" className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Montant (€) *</label>
                  <input type="text" value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))} placeholder="Ex. : 12 600" className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Statut</label>
                  <select value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value as StatutAcompte }))} className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm cursor-pointer">
                    {ACOMPTE_STATUTS.map(s => <option key={s} value={s}>{STATUT_ACOMPTE_LABELS[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Date d'appel prévue</label>
                  <input type="date" value={form.dateAppelPrevue} onChange={e => setForm(f => ({ ...f, dateAppelPrevue: e.target.value }))} className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Date de relance</label>
                  <input type="date" value={form.dateRelance} onChange={e => setForm(f => ({ ...f, dateRelance: e.target.value }))} className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="text-sm px-4 py-1.5 border border-gray-200 rounded-sm text-gray-600 hover:bg-gray-50 cursor-pointer">Annuler</button>
              <button onClick={handleSave} className="text-sm px-4 py-1.5 bg-[#00365A] text-white rounded-sm hover:bg-[#004d80] cursor-pointer font-medium">
                {editing ? "Enregistrer" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AperçuTab({ c, onTabChange, onUpdate }: { c: Chantier; onTabChange: (t: Tab) => void; onUpdate: (ch: Chantier) => void }) {
  const ca = calcCaPrevisionnel(c);
  const couts = calcCoutsPrevisionnels(c);
  const marge = ca - couts;
  const cmdEnAttente = c.commandes.filter((co) => co.statutCommande === "a_commander").length;
  const stARegler = c.sousTraitants.filter((s) => s.statutPaiement !== "paye").length;
  const [margeMode, setMargeMode] = useState<"€" | "%">("€");

  const margeColor = marge >= 0 ? "text-emerald-600" : "text-red-600";
  const margeBorder = marge >= 0 ? "border-emerald-100" : "border-red-100";

  const kpis = [
    { label: "CA prévisionnel", value: fmt(ca), color: "text-[#00365A]", border: "border-blue-100" },
    { label: "Coûts prévisionnels", value: fmt(couts), color: "text-gray-700", border: "border-gray-100" },
  ];

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className={`bg-white border ${k.border} rounded-sm p-4`}>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">{k.label}</p>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
        {/* Marge card with toggle */}
        <div className={`bg-white border ${margeBorder} rounded-sm p-4 flex flex-col`}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Marge</p>
            <button
              onClick={() => setMargeMode(margeMode === "€" ? "%" : "€")}
              className="flex items-center gap-0.5 text-[10px] font-bold bg-gray-100 hover:bg-gray-200 rounded px-1.5 py-0.5 transition-colors text-gray-500"
            >
              <span className={margeMode === "€" ? "text-gray-800" : "text-gray-400"}>€</span>
              <span className="text-gray-300 mx-0.5">/</span>
              <span className={margeMode === "%" ? "text-gray-800" : "text-gray-400"}>%</span>
            </button>
          </div>
          <p className={`text-xl font-bold ${margeColor}`}>
            {margeMode === "€" ? fmt(marge) : pct(marge, ca)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-5">
        {/* Infos chantier */}
        <div className="bg-white border border-gray-200 rounded-sm p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Informations</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <User size={13} className="text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Client</p>
                <p className="text-gray-700 font-medium">{c.clientNom}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin size={13} className="text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Adresse</p>
                <p className="text-gray-700">{c.adresse}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar size={13} className="text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Période</p>
                <p className="text-gray-700">{fmtDate(c.dateDebutPrevue)} → {fmtDate(c.dateFinPrevue)}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Devis initial</p>
              <p className="text-gray-700 font-semibold">{fmt(c.montantDevisInitial)}</p>
            </div>
            {c.notes && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Notes</p>
                <p className="text-gray-600 leading-relaxed">{c.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Alertes */}
        <div className="bg-white border border-gray-200 rounded-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={13} className="text-amber-500" />
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">À surveiller</h3>
          </div>
          {cmdEnAttente === 0 && stARegler === 0 ? (
            <p className="text-sm text-gray-400 italic">Aucun élément en attente.</p>
          ) : (
            <div className="space-y-3">
              {cmdEnAttente > 0 && (
                <div
                  className="flex items-center justify-between text-sm py-2 border-b border-gray-50 cursor-pointer group"
                  onClick={() => onTabChange("commandes")}
                >
                  <span className="text-gray-600 group-hover:text-[#00365A] transition-colors">
                    {cmdEnAttente} commande{cmdEnAttente > 1 ? "s" : ""} à passer
                  </span>
                  <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-sm font-medium">À faire</span>
                </div>
              )}
              {stARegler > 0 && (
                <div
                  className="flex items-center justify-between text-sm py-2 cursor-pointer group"
                  onClick={() => onTabChange("sous_traitants")}
                >
                  <span className="text-gray-600 group-hover:text-[#00365A] transition-colors">
                    {stARegler} sous-traitant{stARegler > 1 ? "s" : ""} à régler
                  </span>
                  <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-sm font-medium">Paiement</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Acomptes */}
      <AcomptesCard c={c} onUpdate={onUpdate} />
    </div>
  );
}

// ─── Commandes ─────────────────────────────────────────────────────────────

const ACHAT_FORM_DEFAULT = {
  titre: "", quantite: "", fournisseur: "", montantEstime: "", ajouterListe: true,
};

function CommandesTab({ c, onUpdate }: { c: Chantier; onUpdate: (ch: Chantier) => void }) {
  const [showModal, setShowModal] = useState(false);
  const [showAchatModal, setShowAchatModal] = useState(false);
  const [achatForm, setAchatForm] = useState(ACHAT_FORM_DEFAULT);
  const [form, setForm] = useState({
    titre: "", fournisseur: "", description: "", montantPrevisionnel: "",
    statutCommande: "a_commander" as StatutCommande,
    dateCommande: "", dateLivraisonPrevue: "",
    statutPaiement: "non_paye" as StatutPaiement,
    datePaiementPrevue: "", commentaire: "",
  });

  const handleAddAchat = () => {
    if (!achatForm.titre.trim()) return;
    const montant = achatForm.montantEstime
      ? parseFloat(achatForm.montantEstime.replace(",", "."))
      : undefined;
    if (achatForm.ajouterListe) {
      ACHATS_LISTE.push({
        id: getNextAchatId(),
        titre: achatForm.titre.trim(),
        quantite: achatForm.quantite || undefined,
        fournisseur: achatForm.fournisseur || undefined,
        montantEstime: montant && !isNaN(montant) ? montant : undefined,
        chantierId: c.id,
        chantierNom: c.nom,
        checked: false,
        dateAjout: new Date().toISOString().slice(0, 10),
      });
    }
    setAchatForm(ACHAT_FORM_DEFAULT);
    setShowAchatModal(false);
  };

  const totalPrev = c.commandes.filter(co => co.statutCommande !== "annule").reduce((s, co) => s + co.montantPrevisionnel, 0);
  const totalReel = c.commandes.filter(co => co.statutCommande !== "annule").reduce((s, co) => s + (co.montantReel ?? co.montantPrevisionnel), 0);

  const handleAdd = () => {
    const montant = parseFloat(form.montantPrevisionnel.replace(",", "."));
    if (!form.titre || isNaN(montant)) return;
    onUpdate({
      ...c,
      commandes: [...c.commandes, {
        id: getNextCommandeId(),
        titre: form.titre,
        fournisseur: form.fournisseur,
        description: form.description || undefined,
        montantPrevisionnel: montant,
        statutCommande: form.statutCommande,
        dateCommande: form.dateCommande || undefined,
        dateLivraisonPrevue: form.dateLivraisonPrevue || undefined,
        statutPaiement: form.statutPaiement,
        datePaiementPrevue: form.datePaiementPrevue || undefined,
        commentaire: form.commentaire || undefined,
      }],
    });
    setShowModal(false);
    setForm({ titre: "", fournisseur: "", description: "", montantPrevisionnel: "", statutCommande: "a_commander", dateCommande: "", dateLivraisonPrevue: "", statutPaiement: "non_paye", datePaiementPrevue: "", commentaire: "" });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-100 rounded-sm p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Total prévisionnel</p>
          <p className="text-lg font-bold text-gray-700">{fmt(totalPrev)}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-sm p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Total réel</p>
          <p className="text-lg font-bold text-gray-700">{fmt(totalReel)}</p>
        </div>
        <div className={`bg-white border rounded-sm p-4 ${totalReel > totalPrev ? "border-red-100" : "border-emerald-100"}`}>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Écart</p>
          <p className={`text-lg font-bold ${totalReel > totalPrev ? "text-red-600" : "text-emerald-600"}`}>
            {totalReel > totalPrev ? "+" : ""}{fmt(totalReel - totalPrev)}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={() => setShowAchatModal(true)} className="flex items-center gap-2 border border-[#00365A] text-[#00365A] text-sm font-medium px-4 py-1.5 rounded-sm hover:bg-[#00365A]/5 transition-colors cursor-pointer">
          <Plus size={14} /> Ajouter un achat
        </button>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-[#00365A] text-white text-sm font-medium px-4 py-1.5 rounded-sm hover:bg-[#004d80] transition-colors cursor-pointer">
          <Plus size={14} /> Ajouter une commande
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-sm overflow-x-auto">
        <table className="min-w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Commande</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Fournisseur</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Statut</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Prévu</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Réel</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Livraison</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Paiement</th>
            </tr>
          </thead>
          <tbody>
            {c.commandes.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-gray-400 py-10 text-sm">Aucune commande.</td></tr>
            ) : c.commandes.map((co) => (
              <tr key={co.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{co.titre}</p>
                  {co.description && <p className="text-xs text-gray-400">{co.description}</p>}
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{co.fournisseur}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-sm font-medium ${STATUT_COMMANDE_STYLE[co.statutCommande]}`}>
                    {STATUT_COMMANDE_LABELS[co.statutCommande]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-700">{fmt(co.montantPrevisionnel)}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {co.montantReel != null ? (
                    <span className={co.montantReel > co.montantPrevisionnel ? "text-red-600 font-medium" : "text-gray-700"}>
                      {fmt(co.montantReel)}
                    </span>
                  ) : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(co.dateLivraisonPrevue)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-sm font-medium ${STATUT_PAIEMENT_STYLE[co.statutPaiement]}`}>
                    {STATUT_PAIEMENT_LABELS[co.statutPaiement]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAchatModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-sm shadow-xl w-[420px]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Ajouter un achat</h2>
              <button onClick={() => setShowAchatModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={16} /></button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Article *</label>
                <input type="text" value={achatForm.titre} onChange={e => setAchatForm(f => ({ ...f, titre: e.target.value }))} placeholder="Ex. : Enduit de finition" className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Quantité</label>
                  <input type="text" value={achatForm.quantite} onChange={e => setAchatForm(f => ({ ...f, quantite: e.target.value }))} placeholder="Ex. : 3 sacs" className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Montant estimé (€)</label>
                  <input type="text" value={achatForm.montantEstime} onChange={e => setAchatForm(f => ({ ...f, montantEstime: e.target.value }))} placeholder="Ex. : 80" className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Fournisseur</label>
                <input type="text" value={achatForm.fournisseur} onChange={e => setAchatForm(f => ({ ...f, fournisseur: e.target.value }))} placeholder="Ex. : Tout Faire Auxerre" className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={achatForm.ajouterListe}
                  onChange={e => setAchatForm(f => ({ ...f, ajouterListe: e.target.checked }))}
                  className="w-4 h-4 accent-[#00365A] cursor-pointer"
                />
                <span className="text-sm text-gray-700">Ajouter dans la liste de courses</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowAchatModal(false)} className="text-sm px-4 py-1.5 border border-gray-200 rounded-sm text-gray-600 hover:bg-gray-50 cursor-pointer">Annuler</button>
              <button onClick={handleAddAchat} className="text-sm px-4 py-1.5 bg-[#00365A] text-white rounded-sm hover:bg-[#004d80] cursor-pointer font-medium">Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-sm shadow-xl w-[520px] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-sm font-semibold text-gray-800">Ajouter une commande</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={16} /></button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500 block mb-1">Titre *</label>
                  <input type="text" value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Fournisseur</label>
                  <input type="text" value={form.fournisseur} onChange={e => setForm(f => ({ ...f, fournisseur: e.target.value }))} className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Montant prévisionnel *</label>
                  <input type="text" value={form.montantPrevisionnel} onChange={e => setForm(f => ({ ...f, montantPrevisionnel: e.target.value }))} placeholder="Ex. : 3500" className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Statut commande</label>
                  <select value={form.statutCommande} onChange={e => setForm(f => ({ ...f, statutCommande: e.target.value as StatutCommande }))} className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm cursor-pointer">
                    {Object.entries(STATUT_COMMANDE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Statut paiement</label>
                  <select value={form.statutPaiement} onChange={e => setForm(f => ({ ...f, statutPaiement: e.target.value as StatutPaiement }))} className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm cursor-pointer">
                    {Object.entries(STATUT_PAIEMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Date commande</label>
                  <input type="date" value={form.dateCommande} onChange={e => setForm(f => ({ ...f, dateCommande: e.target.value }))} className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Livraison prévue</label>
                  <input type="date" value={form.dateLivraisonPrevue} onChange={e => setForm(f => ({ ...f, dateLivraisonPrevue: e.target.value }))} className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm resize-none" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="text-sm px-4 py-1.5 border border-gray-200 rounded-sm text-gray-600 hover:bg-gray-50 cursor-pointer">Annuler</button>
              <button onClick={handleAdd} className="text-sm px-4 py-1.5 bg-[#00365A] text-white rounded-sm hover:bg-[#004d80] cursor-pointer font-medium">Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sous-traitants ─────────────────────────────────────────────────────────

function SousTraitantsTab({ c, onUpdate }: { c: Chantier; onUpdate: (ch: Chantier) => void }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ entreprise: "", prestation: "", montantPrevisionnel: "", montantReel: "", montantPaye: "", echeance: "", statutPaiement: "non_paye" as StatutPaiement, commentaire: "" });

  const totalPrev = c.sousTraitants.reduce((s, st) => s + st.montantPrevisionnel, 0);
  const totalReel = c.sousTraitants.reduce((s, st) => s + (st.montantReel ?? st.montantPrevisionnel), 0);
  const totalPaye = c.sousTraitants.reduce((s, st) => s + st.montantPaye, 0);
  const resteTotal = totalReel - totalPaye;

  const handleAdd = () => {
    const prev = parseFloat(form.montantPrevisionnel.replace(",", "."));
    if (!form.entreprise || isNaN(prev)) return;
    onUpdate({
      ...c,
      sousTraitants: [...c.sousTraitants, {
        id: getNextSTId(),
        entreprise: form.entreprise,
        prestation: form.prestation,
        montantPrevisionnel: prev,
        montantReel: form.montantReel ? parseFloat(form.montantReel.replace(",", ".")) : undefined,
        montantPaye: form.montantPaye ? parseFloat(form.montantPaye.replace(",", ".")) : 0,
        echeance: form.echeance || undefined,
        statutPaiement: form.statutPaiement,
        commentaire: form.commentaire || undefined,
      }],
    });
    setShowModal(false);
    setForm({ entreprise: "", prestation: "", montantPrevisionnel: "", montantReel: "", montantPaye: "", echeance: "", statutPaiement: "non_paye", commentaire: "" });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total prévu", value: fmt(totalPrev), color: "text-gray-700" },
          { label: "Total réel", value: fmt(totalReel), color: totalReel > totalPrev ? "text-red-600" : "text-gray-700" },
          { label: "Total payé", value: fmt(totalPaye), color: "text-emerald-600" },
          { label: "Reste à payer", value: fmt(resteTotal), color: resteTotal > 0 ? "text-amber-600" : "text-gray-400" },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-gray-100 rounded-sm p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">{k.label}</p>
            <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-[#00365A] text-white text-sm font-medium px-4 py-1.5 rounded-sm hover:bg-[#004d80] transition-colors cursor-pointer">
          <Plus size={14} /> Ajouter un sous-traitant
        </button>
      </div>

      <div className="space-y-3">
        {c.sousTraitants.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-sm flex flex-col items-center py-12 gap-2">
            <p className="text-sm text-gray-400">Aucun sous-traitant pour ce chantier.</p>
          </div>
        ) : c.sousTraitants.map((st) => {
          const reste = (st.montantReel ?? st.montantPrevisionnel) - st.montantPaye;
          return (
            <div key={st.id} className="bg-white border border-gray-200 rounded-sm p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-semibold text-gray-800">{st.entreprise}</p>
                  <p className="text-sm text-gray-500">{st.prestation}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-sm font-medium shrink-0 ${STATUT_PAIEMENT_STYLE[st.statutPaiement]}`}>
                  {STATUT_PAIEMENT_LABELS[st.statutPaiement]}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Prévisionnel</p>
                  <p className="font-medium text-gray-700">{fmt(st.montantPrevisionnel)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Réel</p>
                  <p className={`font-medium ${st.montantReel && st.montantReel > st.montantPrevisionnel ? "text-red-600" : "text-gray-700"}`}>
                    {st.montantReel != null ? fmt(st.montantReel) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Payé</p>
                  <p className="font-medium text-emerald-600">{fmt(st.montantPaye)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Reste</p>
                  <p className={`font-medium ${reste > 0 ? "text-amber-600" : "text-gray-400"}`}>{fmt(reste)}</p>
                </div>
              </div>
              {(st.echeance || st.commentaire) && (
                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400 space-y-0.5">
                  {st.echeance && <p>Échéance : {fmtDate(st.echeance)}</p>}
                  {st.commentaire && <p>{st.commentaire}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-sm shadow-xl w-[480px] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-sm font-semibold text-gray-800">Ajouter un sous-traitant</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={16} /></button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500 block mb-1">Entreprise / artisan *</label>
                  <input type="text" value={form.entreprise} onChange={e => setForm(f => ({ ...f, entreprise: e.target.value }))} className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500 block mb-1">Prestation</label>
                  <input type="text" value={form.prestation} onChange={e => setForm(f => ({ ...f, prestation: e.target.value }))} className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Montant prévisionnel *</label>
                  <input type="text" value={form.montantPrevisionnel} onChange={e => setForm(f => ({ ...f, montantPrevisionnel: e.target.value }))} className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Montant réel</label>
                  <input type="text" value={form.montantReel} onChange={e => setForm(f => ({ ...f, montantReel: e.target.value }))} className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Montant payé</label>
                  <input type="text" value={form.montantPaye} onChange={e => setForm(f => ({ ...f, montantPaye: e.target.value }))} className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Statut paiement</label>
                  <select value={form.statutPaiement} onChange={e => setForm(f => ({ ...f, statutPaiement: e.target.value as StatutPaiement }))} className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm cursor-pointer">
                    {Object.entries(STATUT_PAIEMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Échéance</label>
                  <input type="date" value={form.echeance} onChange={e => setForm(f => ({ ...f, echeance: e.target.value }))} className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500 block mb-1">Commentaire</label>
                  <textarea value={form.commentaire} onChange={e => setForm(f => ({ ...f, commentaire: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm resize-none" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="text-sm px-4 py-1.5 border border-gray-200 rounded-sm text-gray-600 hover:bg-gray-50 cursor-pointer">Annuler</button>
              <button onClick={handleAdd} className="text-sm px-4 py-1.5 bg-[#00365A] text-white rounded-sm hover:bg-[#004d80] cursor-pointer font-medium">Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Plus / Moins-values ────────────────────────────────────────────────────

function PMVTab({ c, onUpdate }: { c: Chantier; onUpdate: (ch: Chantier) => void }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ libelle: "", description: "", type: "plus_value" as TypePMV, montant: "", statut: "proposee" as StatutPMV, date: new Date().toISOString().slice(0, 10) });

  const acceptees = c.plusMoinsValues.filter(p => p.statut === "acceptee");
  const pv = acceptees.filter(p => p.type === "plus_value").reduce((s, p) => s + p.montant, 0);
  const mv = acceptees.filter(p => p.type === "moins_value").reduce((s, p) => s + p.montant, 0);
  const caFinal = c.montantDevisInitial + pv - mv;

  const handleAdd = () => {
    const montant = parseFloat(form.montant.replace(",", "."));
    if (!form.libelle || isNaN(montant)) return;
    onUpdate({
      ...c,
      plusMoinsValues: [...c.plusMoinsValues, {
        id: getNextPMVId(),
        libelle: form.libelle,
        description: form.description || undefined,
        type: form.type,
        montant,
        statut: form.statut,
        date: form.date,
      }],
    });
    setShowModal(false);
    setForm({ libelle: "", description: "", type: "plus_value", montant: "", statut: "proposee", date: new Date().toISOString().slice(0, 10) });
  };

  return (
    <div className="space-y-4">
      {/* Synthèse CA */}
      <div className="bg-white border border-gray-200 rounded-sm p-5">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Impact sur le CA</h3>
        <div className="space-y-2 text-sm max-w-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Devis initial</span>
            <span className="font-semibold text-gray-700">{fmt(c.montantDevisInitial)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-600 flex items-center gap-1"><TrendingUp size={13} /> Plus-values</span>
            <span className="font-semibold text-emerald-600">+{fmt(pv)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-red-500 flex items-center gap-1"><TrendingDown size={13} /> Moins-values</span>
            <span className="font-semibold text-red-500">−{fmt(mv)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-100">
            <span className="font-semibold text-gray-700">CA prévisionnel</span>
            <span className="font-bold text-[#00365A]">{fmt(caFinal)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-[#00365A] text-white text-sm font-medium px-4 py-1.5 rounded-sm hover:bg-[#004d80] transition-colors cursor-pointer">
          <Plus size={14} /> Ajouter un élément
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-sm overflow-x-auto">
        <table className="min-w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Libellé</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Type</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Montant</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Statut</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Date</th>
            </tr>
          </thead>
          <tbody>
            {c.plusMoinsValues.length === 0 ? (
              <tr><td colSpan={5} className="text-center text-gray-400 py-10 text-sm">Aucune plus/moins-value.</td></tr>
            ) : c.plusMoinsValues.map((p) => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{p.libelle}</p>
                  {p.description && <p className="text-xs text-gray-400">{p.description}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold flex items-center gap-1 ${p.type === "plus_value" ? "text-emerald-600" : "text-red-500"}`}>
                    {p.type === "plus_value" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {p.type === "plus_value" ? "Plus-value" : "Moins-value"}
                  </span>
                </td>
                <td className={`px-4 py-3 text-right font-semibold tabular-nums ${p.type === "plus_value" ? "text-emerald-600" : "text-red-500"}`}>
                  {p.type === "plus_value" ? "+" : "−"}{fmt(p.montant)}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-sm font-medium ${STATUT_PMV_STYLE[p.statut]}`}>
                    {STATUT_PMV_LABELS[p.statut]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(p.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-sm shadow-xl w-[440px]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Ajouter une plus / moins-value</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={16} /></button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Libellé *</label>
                <input type="text" value={form.libelle} onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))} className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as TypePMV }))} className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm cursor-pointer">
                    <option value="plus_value">Plus-value</option>
                    <option value="moins_value">Moins-value</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Montant (€) *</label>
                  <input type="text" value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))} placeholder="Ex. : 2500" className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Statut</label>
                  <select value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value as StatutPMV }))} className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm cursor-pointer">
                    {Object.entries(STATUT_PMV_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="text-sm px-4 py-1.5 border border-gray-200 rounded-sm text-gray-600 hover:bg-gray-50 cursor-pointer">Annuler</button>
              <button onClick={handleAdd} className="text-sm px-4 py-1.5 bg-[#00365A] text-white rounded-sm hover:bg-[#004d80] cursor-pointer font-medium">Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Documents ──────────────────────────────────────────────────────────────

function DocumentsChantierTab({ c, onUpdate }: { c: Chantier; onUpdate: (ch: Chantier) => void }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nom: "", categorie: "autre" as CategorieDocument, taille: "" });

  const byCategorie = Object.keys(CATEGORIE_DOCUMENT_LABELS) as CategorieDocument[];
  const grouped = byCategorie
    .map((cat) => ({ cat, docs: c.documents.filter((d) => d.categorie === cat) }))
    .filter((g) => g.docs.length > 0);

  const handleAdd = () => {
    if (!form.nom) return;
    onUpdate({
      ...c,
      documents: [...c.documents, {
        id: getNextDocId(),
        nom: form.nom,
        categorie: form.categorie,
        dateAjout: new Date().toISOString().slice(0, 10),
        taille: form.taille || undefined,
      }],
    });
    setShowModal(false);
    setForm({ nom: "", categorie: "autre", taille: "" });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-[#00365A] text-white text-sm font-medium px-4 py-1.5 rounded-sm hover:bg-[#004d80] transition-colors cursor-pointer">
          <Plus size={14} /> Ajouter un document
        </button>
      </div>

      {c.documents.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-sm flex flex-col items-center py-14 gap-2">
          <FileText size={22} className="text-gray-300" />
          <p className="text-sm text-gray-400">Aucun document pour ce chantier.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ cat, docs }) => (
            <div key={cat} className="bg-white border border-gray-200 rounded-sm">
              <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">{CATEGORIE_DOCUMENT_LABELS[cat]}</h3>
              </div>
              <div>
                {docs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-gray-400 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">{doc.nom}</p>
                        <p className="text-xs text-gray-400">{doc.taille && `${doc.taille} · `}Ajouté le {fmtDate(doc.dateAjout)}</p>
                      </div>
                    </div>
                    <button className="text-xs text-[#00365A] hover:underline cursor-pointer">Ouvrir</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-sm shadow-xl w-[400px]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Ajouter un document</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={16} /></button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Nom du document *</label>
                <input type="text" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Catégorie</label>
                <select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value as CategorieDocument }))} className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm cursor-pointer">
                  {Object.entries(CATEGORIE_DOCUMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="text-sm px-4 py-1.5 border border-gray-200 rounded-sm text-gray-600 hover:bg-gray-50 cursor-pointer">Annuler</button>
              <button onClick={handleAdd} className="text-sm px-4 py-1.5 bg-[#00365A] text-white rounded-sm hover:bg-[#004d80] cursor-pointer font-medium">Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Finances ───────────────────────────────────────────────────────────────

const NAVY = "#00365A";
const NAVY_LIGHT = "#e8f0f5";
const SLATE = "#64748b";

function fmtK(n: number) {
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(0) + " k€";
  return n.toFixed(0) + " €";
}

function FinancesChantierTab({ c }: { c: Chantier }) {
  const caPrev = calcCaPrevisionnel(c);
  const caReel = calcCaReel(c);
  const coutsPrev = calcCoutsPrevisionnels(c);
  const coutsReels = calcCoutsReels(c);
  const margePrev = caPrev - coutsPrev;
  const margeReelle = caReel - coutsReels;

  const cmdPrev = c.commandes.filter(co => co.statutCommande !== "annule").reduce((s, co) => s + co.montantPrevisionnel, 0);
  const cmdReel = c.commandes.filter(co => co.statutCommande !== "annule").reduce((s, co) => s + (co.montantReel ?? co.montantPrevisionnel), 0);
  const stPrev = c.sousTraitants.reduce((s, st) => s + st.montantPrevisionnel, 0);
  const stReel = c.sousTraitants.reduce((s, st) => s + (st.montantReel ?? st.montantPrevisionnel), 0);

  const pvAcceptees = c.plusMoinsValues.filter(p => p.statut === "acceptee" && p.type === "plus_value").reduce((s, p) => s + p.montant, 0);
  const mvAcceptees = c.plusMoinsValues.filter(p => p.statut === "acceptee" && p.type === "moins_value").reduce((s, p) => s + p.montant, 0);

  // Chart 1 — Vue synthèse : CA / Coûts / Marge (prév vs réel)
  const synthData = [
    { name: "CA", prev: caPrev, reel: caReel },
    { name: "Coûts", prev: coutsPrev, reel: coutsReels },
    { name: "Marge", prev: margePrev, reel: margeReelle },
  ];

  // Chart 2 — Décomposition coûts (horizontal)
  const coutsData = [
    { name: "Commandes", prev: cmdPrev, reel: cmdReel },
    { name: "Sous-traitants", prev: stPrev, reel: stReel },
  ];

  // Chart 3 — Waterfall CA : devis → +PV → -MV → CA final
  const waterfallData = [
    { name: "Devis initial", value: c.montantDevisInitial, color: NAVY },
    { name: "Plus-values", value: pvAcceptees, color: "#059669" },
    { name: "Moins-values", value: -mvAcceptees, color: "#dc2626" },
    { name: "CA prévisionnel", value: caPrev, color: NAVY },
  ];

  const marginColor = (v: number) => v >= 0 ? "#059669" : "#dc2626";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-200 rounded shadow-md px-3 py-2 text-xs space-y-1">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.fill || p.color }} />
            <span className="text-gray-500">{p.name}</span>
            <span className="font-semibold text-gray-800 ml-auto pl-4">{fmt(p.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Marge prév.", value: margePrev, sub: pct(margePrev, caPrev) },
          { label: "Marge réelle", value: margeReelle, sub: pct(margeReelle, caReel) },
          { label: "Écart marge", value: margeReelle - margePrev, sub: "vs prévisionnel" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-sm px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
              <p className={`text-lg font-bold mt-0.5 ${value >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(value)}</p>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded ${value >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{sub}</span>
          </div>
        ))}
      </div>

      {/* Chart 1 — Synthèse prév vs réel */}
      <div className="bg-white border border-gray-200 rounded-sm p-5">
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-4">CA · Coûts · Marge — Prévisionnel vs Réel</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={synthData} barCategoryGap="30%" barGap={4}>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: SLATE }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtK} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={52} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="prev" name="Prévisionnel" radius={[3, 3, 0, 0]} maxBarSize={48}>
              {synthData.map((d, i) => (
                <Cell key={i} fill={i === 2 ? (d.prev >= 0 ? "#bbf7d0" : "#fecaca") : NAVY_LIGHT} />
              ))}
              <LabelList dataKey="prev" position="top" formatter={fmtK} style={{ fontSize: 10, fill: SLATE }} />
            </Bar>
            <Bar dataKey="reel" name="Réel" radius={[3, 3, 0, 0]} maxBarSize={48}>
              {synthData.map((d, i) => (
                <Cell key={i} fill={i === 2 ? marginColor(d.reel) : NAVY} />
              ))}
              <LabelList dataKey="reel" position="top" formatter={fmtK} style={{ fontSize: 10, fill: "#374151", fontWeight: 600 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2 justify-center">
          <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: NAVY_LIGHT }} />Prévisionnel</span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: NAVY }} />Réel</span>
        </div>
      </div>

      {/* Chart 2 — Décomposition coûts */}
      <div className="bg-white border border-gray-200 rounded-sm p-5">
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Décomposition des coûts</h3>
        <div className="flex items-center gap-4 mb-4">
          <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: NAVY_LIGHT, border: `1px solid #c0d4e0` }} />Prévisionnel</span>
          <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: NAVY }} />Réel</span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart
            layout="vertical"
            data={coutsData}
            barCategoryGap="30%"
            barGap={3}
            margin={{ left: 0, right: 64, top: 0, bottom: 0 }}
          >
            <CartesianGrid horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" tickFormatter={fmtK} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#374151", fontWeight: 500 }} axisLine={false} tickLine={false} width={120} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="prev" name="Prévisionnel" radius={[0, 3, 3, 0]} maxBarSize={18} fill={NAVY_LIGHT}>
              <LabelList dataKey="prev" position="right" formatter={fmtK} style={{ fontSize: 10, fill: "#94a3b8" }} />
            </Bar>
            <Bar dataKey="reel" name="Réel" radius={[0, 3, 3, 0]} maxBarSize={18} fill={NAVY}>
              <LabelList dataKey="reel" position="right" formatter={fmtK} style={{ fontSize: 11, fill: "#374151", fontWeight: 600 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {/* Écarts */}
        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-3">
          {[
            { label: "Commandes & achats", prev: cmdPrev, reel: cmdReel },
            { label: "Sous-traitants", prev: stPrev, reel: stReel },
            { label: "Total coûts", prev: coutsPrev, reel: coutsReels },
          ].map(({ label, prev, reel }) => {
            const ecart = reel - prev;
            return (
              <div key={label} className="text-center">
                <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
                <p className={`text-sm font-bold ${ecart > 0 ? "text-red-600" : ecart < 0 ? "text-emerald-600" : "text-gray-400"}`}>
                  {ecart > 0 ? "+" : ""}{fmtK(ecart)}
                </p>
                <p className="text-[10px] text-gray-400">écart</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart 3 — Waterfall CA */}
      {(pvAcceptees > 0 || mvAcceptees > 0) && (
        <div className="bg-white border border-gray-200 rounded-sm p-5">
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-4">Construction du CA prévisionnel</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={waterfallData} barCategoryGap="25%">
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: SLATE }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtK} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={52} />
              <Tooltip formatter={(v: number) => fmt(Math.abs(v))} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={56}>
                {waterfallData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
                <LabelList dataKey="value" position="top" formatter={(v: number) => (v < 0 ? "−" : v === caPrev || v === c.montantDevisInitial ? "" : "+") + fmtK(Math.abs(v))} style={{ fontSize: 10, fill: "#374151", fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─── Shell ──────────────────────────────────────────────────────────────────

interface Props {
  chantier: Chantier;
  onBack: () => void;
  onUpdate: (c: Chantier) => void;
}

export default function ChantierDetail({ chantier, onBack, onUpdate }: Props) {
  const [tab, setTab] = useState<Tab>("apercu");

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 pt-4 pb-0 shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 cursor-pointer transition-colors mb-3">
          <ArrowLeft size={13} /> Retour aux chantiers
        </button>
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-gray-900">{chantier.nom}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-sm font-medium ${STATUT_CHANTIER_STYLE[chantier.statut]}`}>
                {STATUT_CHANTIER_LABELS[chantier.statut]}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">{chantier.clientNom} · {chantier.adresse}</p>
          </div>
        </div>
        <nav className="flex gap-0 mt-3">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                tab === id
                  ? "border-[#00365A] text-[#00365A]"
                  : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === "apercu" && <AperçuTab c={chantier} onTabChange={setTab} onUpdate={onUpdate} />}
        {tab === "commandes" && <CommandesTab c={chantier} onUpdate={onUpdate} />}
        {tab === "sous_traitants" && <SousTraitantsTab c={chantier} onUpdate={onUpdate} />}
        {tab === "pmv" && <PMVTab c={chantier} onUpdate={onUpdate} />}
        {tab === "documents" && <DocumentsChantierTab c={chantier} onUpdate={onUpdate} />}
        {tab === "finances" && <FinancesChantierTab c={chantier} />}
      </div>
    </div>
  );
}
