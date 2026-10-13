import { useState } from "react";
import { X } from "lucide-react";
import type { Prospect, StatutProspect, PrioriteProspect, SourceProspect } from "./types";
import { STATUT_LABELS, PRIORITE_LABELS, SOURCE_LABELS } from "./types";

type FormData = Omit<Prospect, "id" | "interactions" | "dateCreation"> & { commentaire?: string };

interface Props {
  onClose: () => void;
  onSave: (data: FormData) => void;
}

const EMPTY: FormData = {
  prenom: "",
  nom: "",
  societe: "",
  email: "",
  telephone: "",
  localisation: "",
  statut: "nouveau",
  priorite: "moyenne",
  source: "site_internet",
  sourceDetail: "",
  prochaineRelance: "",
  commentaire: "",
};

export default function ProspectFormModal({ onClose, onSave }: Props) {
  const [form, setForm] = useState<FormData>(EMPTY);

  const set = (field: keyof FormData, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSave = () => {
    if (!form.prenom.trim() && !form.nom.trim()) return;
    onSave({
      ...form,
      societe: form.societe || undefined,
      sourceDetail: form.sourceDetail || undefined,
      prochaineRelance: form.prochaineRelance || undefined,
      commentaire: form.commentaire || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
      <div className="bg-white rounded-sm shadow-xl w-[560px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-sm font-semibold text-gray-800">Nouveau contact</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Identité */}
          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Identité</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Prénom *</label>
                <input type="text" value={form.prenom} onChange={(e) => set("prenom", e.target.value)}
                  className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Nom *</label>
                <input type="text" value={form.nom} onChange={(e) => set("nom", e.target.value)}
                  className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500 block mb-1">Société <span className="text-gray-400">(optionnelle)</span></label>
                <input type="text" value={form.societe} onChange={(e) => set("societe", e.target.value)}
                  className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
              </div>
            </div>
          </fieldset>

          {/* Coordonnées */}
          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Coordonnées</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                  className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Téléphone</label>
                <input type="tel" value={form.telephone} onChange={(e) => set("telephone", e.target.value)}
                  className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500 block mb-1">Localisation</label>
                <input type="text" value={form.localisation} onChange={(e) => set("localisation", e.target.value)}
                  placeholder="Ville, code postal"
                  className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
              </div>
            </div>
          </fieldset>

          {/* Qualification */}
          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Qualification</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Statut</label>
                <select value={form.statut} onChange={(e) => set("statut", e.target.value as StatutProspect)}
                  className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm cursor-pointer">
                  {Object.entries(STATUT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Priorité</label>
                <select value={form.priorite} onChange={(e) => set("priorite", e.target.value as PrioriteProspect)}
                  className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm cursor-pointer">
                  {Object.entries(PRIORITE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Source</label>
                <select value={form.source} onChange={(e) => set("source", e.target.value as SourceProspect)}
                  className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm cursor-pointer">
                  {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Détail source <span className="text-gray-400">(optionnel)</span></label>
                <input type="text" value={form.sourceDetail} onChange={(e) => set("sourceDetail", e.target.value)}
                  placeholder="Ex. : Client Dupont"
                  className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500 block mb-1">Prochaine relance</label>
                <input type="date" value={form.prochaineRelance} onChange={(e) => set("prochaineRelance", e.target.value)}
                  className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
              </div>
            </div>
          </fieldset>

          {/* Commentaire */}
          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Commentaire initial</legend>
            <textarea
              value={form.commentaire}
              onChange={(e) => set("commentaire", e.target.value)}
              rows={3}
              placeholder="Contexte du projet, budget estimé, remarques…"
              className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm resize-none"
            />
          </fieldset>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
          <button onClick={onClose}
            className="text-sm px-4 py-1.5 border border-gray-200 rounded-sm text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
            Annuler
          </button>
          <button onClick={handleSave}
            className="text-sm px-4 py-1.5 bg-[#00365A] text-white rounded-sm hover:bg-[#004d80] cursor-pointer transition-colors font-medium">
            Ajouter le contact
          </button>
        </div>
      </div>
    </div>
  );
}
