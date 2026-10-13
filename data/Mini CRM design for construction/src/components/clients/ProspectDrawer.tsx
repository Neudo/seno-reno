import { useState } from "react";
import {
  X,
  Copy,
  Check,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Plus,
  UserCheck,
  ChevronDown,
} from "lucide-react";
import type { Prospect, TypeInteraction } from "./types";
import {
  STATUT_LABELS,
  STATUT_STYLE,
  PRIORITE_LABELS,
  PRIORITE_STYLE,
  SOURCE_LABELS,
  TYPE_INTERACTION_LABELS,
  TYPE_INTERACTION_ICON,
} from "./types";

interface Props {
  prospect: Prospect | null;
  onClose: () => void;
  onUpdate: (p: Prospect) => void;
  onConvert: (p: Prospect) => void;
  nextInteractionId: () => number;
}

const EMPTY_INTERACTION = {
  type: "appel" as TypeInteraction,
  date: new Date().toISOString().slice(0, 10),
  commentaire: "",
  prochaineRelance: "",
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      className="ml-1 text-gray-300 hover:text-[#00365A] transition-colors cursor-pointer"
      title="Copier"
    >
      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
    </button>
  );
}

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function isOverdue(date?: string) {
  if (!date) return false;
  return new Date(date) < new Date(new Date().toISOString().slice(0, 10));
}

export default function ProspectDrawer({ prospect, onClose, onUpdate, onConvert, nextInteractionId }: Props) {
  const [showAddInteraction, setShowAddInteraction] = useState(false);
  const [form, setForm] = useState(EMPTY_INTERACTION);
  const [showConvertConfirm, setShowConvertConfirm] = useState(false);

  if (!prospect) return null;

  const handleAddInteraction = () => {
    if (!form.commentaire.trim()) return;
    const updated: Prospect = {
      ...prospect,
      interactions: [
        ...prospect.interactions,
        {
          id: nextInteractionId(),
          date: form.date,
          type: form.type,
          commentaire: form.commentaire,
          prochaineRelance: form.prochaineRelance || undefined,
        },
      ],
      prochaineRelance: form.prochaineRelance || prospect.prochaineRelance,
    };
    onUpdate(updated);
    setForm(EMPTY_INTERACTION);
    setShowAddInteraction(false);
  };

  const handleConvert = () => {
    const updated: Prospect = { ...prospect, statut: "converti", prochaineRelance: undefined };
    onConvert(updated);
    setShowConvertConfirm(false);
  };

  const sorted = [...prospect.interactions].sort((a, b) => b.date.localeCompare(a.date));
  const overdue = isOverdue(prospect.prochaineRelance);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[480px] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-800">
              {prospect.prenom} {prospect.nom}
            </h2>
            {prospect.societe && (
              <p className="text-sm text-gray-400 mt-0.5">{prospect.societe}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-sm font-medium ${STATUT_STYLE[prospect.statut]}`}>
                {STATUT_LABELS[prospect.statut]}
              </span>
              <span className={`text-xs font-semibold ${PRIORITE_STYLE[prospect.priorite]}`}>
                ● {PRIORITE_LABELS[prospect.priorite]}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer mt-0.5">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Coordonnées */}
          <section className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Coordonnées</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Mail size={13} className="text-gray-400 shrink-0" />
                <span className="font-mono text-xs">{prospect.email}</span>
                <CopyButton value={prospect.email} />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Phone size={13} className="text-gray-400 shrink-0" />
                <span>{prospect.telephone}</span>
                <CopyButton value={prospect.telephone} />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin size={13} className="text-gray-400 shrink-0" />
                <span>{prospect.localisation}</span>
              </div>
            </div>
          </section>

          {/* Infos */}
          <section className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Informations</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Source</p>
                <p className="text-sm text-gray-700">{SOURCE_LABELS[prospect.source]}</p>
                {prospect.sourceDetail && (
                  <p className="text-xs text-gray-400">{prospect.sourceDetail}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Prochaine relance</p>
                <p className={`text-sm font-medium ${overdue ? "text-red-600" : "text-gray-700"}`}>
                  {fmtDate(prospect.prochaineRelance)}
                  {overdue && <span className="ml-1 text-xs font-normal">(en retard)</span>}
                </p>
              </div>
              {prospect.commentaire && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-0.5">Note</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{prospect.commentaire}</p>
                </div>
              )}
            </div>
          </section>

          {/* Historique */}
          <section className="px-6 py-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Historique des interactions
              </h3>
              <button
                onClick={() => setShowAddInteraction((v) => !v)}
                className="flex items-center gap-1 text-xs font-medium text-[#00365A] hover:text-[#004d80] cursor-pointer transition-colors"
              >
                <Plus size={13} />
                Ajouter
                <ChevronDown size={12} className={`transition-transform ${showAddInteraction ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Add interaction form */}
            {showAddInteraction && (
              <div className="border border-gray-200 rounded-sm p-4 mb-4 bg-gray-50 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Type</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as TypeInteraction }))}
                      className="w-full border border-gray-200 bg-white rounded-sm px-2 py-1.5 text-sm cursor-pointer"
                    >
                      {Object.entries(TYPE_INTERACTION_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Date</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                      className="w-full border border-gray-200 bg-white rounded-sm px-2 py-1.5 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Commentaire *</label>
                  <textarea
                    value={form.commentaire}
                    onChange={(e) => setForm((f) => ({ ...f, commentaire: e.target.value }))}
                    rows={3}
                    placeholder="Résumé de l'interaction…"
                    className="w-full border border-gray-200 bg-white rounded-sm px-2 py-1.5 text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">
                    Prochaine relance <span className="text-gray-400">(optionnelle)</span>
                  </label>
                  <input
                    type="date"
                    value={form.prochaineRelance}
                    onChange={(e) => setForm((f) => ({ ...f, prochaineRelance: e.target.value }))}
                    className="w-full border border-gray-200 bg-white rounded-sm px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => { setShowAddInteraction(false); setForm(EMPTY_INTERACTION); }}
                    className="text-xs px-3 py-1.5 border border-gray-200 rounded-sm text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddInteraction}
                    className="text-xs px-3 py-1.5 bg-[#00365A] text-white rounded-sm hover:bg-[#004d80] cursor-pointer transition-colors font-medium"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            )}

            {/* Timeline */}
            {sorted.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Aucune interaction enregistrée.</p>
            ) : (
              <div className="relative pl-5 space-y-4">
                <div className="absolute left-1.5 top-2 bottom-2 w-px bg-gray-200" />
                {sorted.map((inter) => (
                  <div key={inter.id} className="relative">
                    <div className="absolute -left-3.5 top-1 w-2 h-2 rounded-full bg-[#00365A] border-2 border-white shadow-sm" />
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs">{TYPE_INTERACTION_ICON[inter.type]}</span>
                      <span className="text-xs font-semibold text-gray-700">
                        {TYPE_INTERACTION_LABELS[inter.type]}
                      </span>
                      <span className="text-xs text-gray-400">{fmtDate(inter.date)}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{inter.commentaire}</p>
                    {inter.prochaineRelance && (
                      <p className="text-xs text-[#00365A] mt-1 flex items-center gap-1">
                        <Calendar size={11} />
                        Relance prévue le {fmtDate(inter.prochaineRelance)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        {prospect.statut !== "converti" && prospect.statut !== "sans_suite" && (
          <div className="px-6 py-4 border-t border-gray-100 shrink-0">
            {showConvertConfirm ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-4">
                <p className="text-sm font-medium text-emerald-800 mb-1">Confirmer la conversion ?</p>
                <p className="text-xs text-emerald-600 mb-3">
                  Le prospect passera au statut "Converti en client". Son historique sera conservé.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowConvertConfirm(false)}
                    className="text-xs px-3 py-1.5 border border-emerald-200 bg-white rounded-sm text-gray-600 hover:bg-gray-50 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleConvert}
                    className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-sm hover:bg-emerald-700 cursor-pointer font-medium"
                  >
                    Confirmer la conversion
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowConvertConfirm(true)}
                className="w-full flex items-center justify-center gap-2 bg-[#00365A] text-white text-sm font-medium py-2.5 rounded-sm hover:bg-[#004d80] transition-colors cursor-pointer"
              >
                <UserCheck size={15} />
                Transformer en client
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
