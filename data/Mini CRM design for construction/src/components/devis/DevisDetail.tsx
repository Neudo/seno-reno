import { useState } from "react";
import {
  ArrowLeft,
  FileText,
  Copy,
  Phone,
  Mail,
  CalendarDays,
  Plus,
  Building2,
  CheckCircle2,
  Clock,
  ChevronDown,
} from "lucide-react";
import type { Devis, StatutDevis, TypeInteraction, Interaction } from "./devisTypes";
import {
  STATUT_LABELS,
  STATUT_STYLE,
  TYPE_INTERACTION_LABELS,
  TYPE_INTERACTION_ICON,
  fmtMontant,
  fmtDate,
  relanceLabel,
} from "./devisTypes";

const ALL_STATUTS = Object.keys(STATUT_LABELS) as StatutDevis[];
const ALL_TYPES = Object.keys(TYPE_INTERACTION_LABELS) as TypeInteraction[];

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      title={`Copier ${label}`}
      className="p-1 rounded text-gray-400 hover:text-[#00365A] hover:bg-blue-50 transition-colors"
    >
      {copied ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
    </button>
  );
}

export default function DevisDetail({
  devis,
  onBack,
  onUpdate,
  onCreateChantier,
}: {
  devis: Devis;
  onBack: () => void;
  onUpdate: (d: Devis) => void;
  onCreateChantier: (d: Devis) => void;
}) {
  const [showAddInteraction, setShowAddInteraction] = useState(false);
  const [newType, setNewType] = useState<TypeInteraction>("appel");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newComment, setNewComment] = useState("");
  const [newRelance, setNewRelance] = useState("");
  const [editStatut, setEditStatut] = useState(false);
  const [editRelance, setEditRelance] = useState(false);
  const [relanceInput, setRelanceInput] = useState(devis.prochaineRelance ?? "");

  const { label: relLabel, urgent } = relanceLabel(devis.prochaineRelance);

  const addInteraction = () => {
    if (!newComment.trim()) return;
    const interaction: Interaction = {
      id: Date.now(),
      date: newDate,
      type: newType,
      commentaire: newComment.trim(),
    };
    const updated: Devis = {
      ...devis,
      interactions: [interaction, ...devis.interactions],
      derniereAction: `${TYPE_INTERACTION_LABELS[newType]} le ${new Date(newDate).toLocaleDateString("fr-FR", { day: "numeric", month: "2-digit" })}`,
      prochaineRelance: newRelance || devis.prochaineRelance,
    };
    onUpdate(updated);
    setNewComment("");
    setNewRelance("");
    setShowAddInteraction(false);
  };

  const setStatut = (s: StatutDevis) => {
    onUpdate({ ...devis, statut: s });
    setEditStatut(false);
  };

  const saveRelance = () => {
    onUpdate({ ...devis, prochaineRelance: relanceInput || undefined });
    setEditRelance(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#F4F5F7]">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-100 shrink-0 flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#00365A] transition-colors"
        >
          <ArrowLeft size={15} />
          Retour
        </button>
        <div className="h-4 w-px bg-gray-200" />
        <span className="font-mono text-sm text-gray-700 font-medium">{devis.numero}</span>
        <span className="text-gray-300">·</span>
        <span className="text-sm text-gray-600">{devis.client}</span>
        <div className="flex-1" />
        {devis.statut === "signe" && !devis.chantierId && (
          <button
            onClick={() => onCreateChantier(devis)}
            className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-sm hover:bg-emerald-700 transition-colors"
          >
            <Building2 size={14} />
            Créer le chantier
          </button>
        )}
        {devis.chantierId && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium border border-emerald-200 bg-emerald-50 px-2.5 py-1 rounded-sm">
            <Building2 size={12} />
            Chantier lié #{devis.chantierId}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-3 gap-5">
          {/* Left column */}
          <div className="col-span-2 space-y-4">
            {/* Info card */}
            <div className="bg-white rounded-sm border border-gray-100 divide-y divide-gray-50">
              <div className="px-5 py-3.5 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Informations devis
                </h2>
                {devis.pdfNom && (
                  <button className="flex items-center gap-1.5 text-xs text-[#00365A] hover:underline">
                    <FileText size={12} />
                    Voir le PDF
                  </button>
                )}
              </div>
              <div className="px-5 py-4 grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <Field label="Numéro" value={devis.numero} mono />
                <Field label="Date" value={fmtDate(devis.date)} />
                <Field label="Client" value={devis.client} />
                <Field label="Montant HT" value={fmtMontant(devis.montantHT)} mono />
                <Field label="Projet" value={devis.projet} />
                <Field label="Montant TTC" value={fmtMontant(devis.montantTTC)} mono />
                <Field label="Adresse" value={devis.adresse} span2 />
              </div>
            </div>

            {/* Client contact */}
            <div className="bg-white rounded-sm border border-gray-100">
              <div className="px-5 py-3.5 border-b border-gray-50">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Contact client
                </h2>
              </div>
              <div className="px-5 py-4 flex gap-8">
                {devis.clientEmail && (
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-700">{devis.clientEmail}</span>
                    <CopyButton value={devis.clientEmail} label="email" />
                  </div>
                )}
                {devis.clientTel && (
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-700">{devis.clientTel}</span>
                    <CopyButton value={devis.clientTel} label="téléphone" />
                  </div>
                )}
              </div>
            </div>

            {/* Interactions */}
            <div className="bg-white rounded-sm border border-gray-100">
              <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Historique commercial
                </h2>
                <button
                  onClick={() => setShowAddInteraction((v) => !v)}
                  className="flex items-center gap-1 text-xs text-[#00365A] hover:underline"
                >
                  <Plus size={12} />
                  Ajouter
                </button>
              </div>

              {showAddInteraction && (
                <div className="px-5 py-4 border-b border-gray-50 bg-blue-50/30 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">
                        Type
                      </label>
                      <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as TypeInteraction)}
                        className="w-full text-sm border border-gray-200 rounded-sm px-2.5 py-1.5 bg-white"
                      >
                        {ALL_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {TYPE_INTERACTION_LABELS[t]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-sm px-2.5 py-1.5 bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">
                      Commentaire
                    </label>
                    <textarea
                      rows={2}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Détail de l'échange…"
                      className="w-full text-sm border border-gray-200 rounded-sm px-2.5 py-2 bg-white resize-none focus:outline-none focus:border-[#00365A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">
                      Définir une prochaine relance
                    </label>
                    <input
                      type="date"
                      value={newRelance}
                      onChange={(e) => setNewRelance(e.target.value)}
                      className="text-sm border border-gray-200 rounded-sm px-2.5 py-1.5 bg-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={addInteraction}
                      className="px-4 py-1.5 bg-[#00365A] text-white text-xs font-medium rounded-sm hover:bg-[#004A7A] transition-colors"
                    >
                      Enregistrer
                    </button>
                    <button
                      onClick={() => setShowAddInteraction(false)}
                      className="px-4 py-1.5 text-gray-500 text-xs rounded-sm hover:bg-gray-100"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              <div className="divide-y divide-gray-50">
                {devis.interactions.length === 0 && (
                  <p className="px-5 py-4 text-sm text-gray-400">
                    Aucune interaction enregistrée.
                  </p>
                )}
                {devis.interactions.map((inter) => (
                  <div key={inter.id} className="px-5 py-3.5 flex gap-3">
                    <span className="text-base leading-none mt-0.5 shrink-0">
                      {TYPE_INTERACTION_ICON[inter.type]}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-gray-700">
                          {TYPE_INTERACTION_LABELS[inter.type]}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {fmtDate(inter.date)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {inter.commentaire}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Statut */}
            <div className="bg-white rounded-sm border border-gray-100">
              <div className="px-4 py-3.5 border-b border-gray-50">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Statut commercial
                </h2>
              </div>
              <div className="px-4 py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-sm text-xs font-medium ${STATUT_STYLE[devis.statut]}`}
                  >
                    {STATUT_LABELS[devis.statut]}
                  </span>
                  <button
                    onClick={() => setEditStatut((v) => !v)}
                    className="text-xs text-gray-400 hover:text-[#00365A] flex items-center gap-0.5"
                  >
                    Modifier <ChevronDown size={11} />
                  </button>
                </div>
                {editStatut && (
                  <div className="space-y-1 pt-1">
                    {ALL_STATUTS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatut(s)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-sm text-xs transition-colors ${
                          devis.statut === s
                            ? "bg-[#00365A] text-white"
                            : "hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        {STATUT_LABELS[s]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Prochaine relance */}
            <div className="bg-white rounded-sm border border-gray-100">
              <div className="px-4 py-3.5 border-b border-gray-50">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Prochaine relance
                </h2>
              </div>
              <div className="px-4 py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`flex items-center gap-1.5 text-sm font-medium ${
                      urgent ? "text-orange-600" : devis.prochaineRelance ? "text-gray-700" : "text-gray-300"
                    }`}
                  >
                    {urgent && <Clock size={13} />}
                    {relLabel}
                  </span>
                  <button
                    onClick={() => setEditRelance((v) => !v)}
                    className="text-xs text-gray-400 hover:text-[#00365A] flex items-center gap-0.5"
                  >
                    Modifier <ChevronDown size={11} />
                  </button>
                </div>
                {editRelance && (
                  <div className="space-y-2 pt-1">
                    <input
                      type="date"
                      value={relanceInput}
                      onChange={(e) => setRelanceInput(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-sm px-2.5 py-1.5 bg-white focus:outline-none focus:border-[#00365A]"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveRelance}
                        className="px-3 py-1 bg-[#00365A] text-white text-xs rounded-sm hover:bg-[#004A7A]"
                      >
                        Valider
                      </button>
                      <button
                        onClick={() => setEditRelance(false)}
                        className="px-3 py-1 text-gray-400 text-xs rounded-sm hover:bg-gray-100"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Document */}
            {devis.pdfNom && (
              <div className="bg-white rounded-sm border border-gray-100 px-4 py-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  Document
                </h2>
                <button className="flex items-center gap-2 w-full px-3 py-2.5 border border-gray-200 rounded-sm hover:border-[#00365A] hover:bg-blue-50/30 transition-colors group">
                  <FileText size={14} className="text-[#00365A] shrink-0" />
                  <span className="text-xs text-gray-600 truncate group-hover:text-[#00365A]">
                    {devis.pdfNom}
                  </span>
                </button>
              </div>
            )}

            {/* Chantier signé CTA */}
            {devis.statut === "signe" && !devis.chantierId && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-sm px-4 py-4">
                <p className="text-xs text-emerald-700 font-medium mb-2">
                  Devis signé — prêt à démarrer
                </p>
                <p className="text-[11px] text-emerald-600 mb-3">
                  Créez le chantier en un clic avec toutes les données préremplies.
                </p>
                <button
                  onClick={() => onCreateChantier(devis)}
                  className="flex items-center gap-2 w-full justify-center px-3 py-2 bg-emerald-600 text-white text-xs font-medium rounded-sm hover:bg-emerald-700 transition-colors"
                >
                  <Building2 size={13} />
                  Créer le chantier
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  span2,
}: {
  label: string;
  value: string;
  mono?: boolean;
  span2?: boolean;
}) {
  return (
    <div className={span2 ? "col-span-2" : ""}>
      <dt className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">{label}</dt>
      <dd className={`text-gray-800 ${mono ? "font-mono text-sm" : "text-sm"}`}>{value}</dd>
    </div>
  );
}
