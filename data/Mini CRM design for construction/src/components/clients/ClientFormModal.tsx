import { useState } from "react";
import { X } from "lucide-react";
import type { Client, ClientType, SourceClient } from "./clientTypes";
import { SOURCE_CLIENT_LABELS } from "./clientTypes";

type FormData = Omit<Client, "id" | "chantiers" | "documents" | "dateCreation" | "archive">;

interface Props {
  onClose: () => void;
  onSave: (data: FormData) => void;
  initialData?: Partial<FormData>;
  title?: string;
}

const EMPTY: FormData = {
  type: "personne",
  prenom: "",
  nom: "",
  societe: "",
  contactPrincipal: "",
  email: "",
  telephone: "",
  adresse: "",
  codePostal: "",
  ville: "",
  source: "recommandation",
  sourceDetail: "",
  notes: "",
  oneDriveUrl: "",
};

export default function ClientFormModal({ onClose, onSave, initialData, title }: Props) {
  const [form, setForm] = useState<FormData>({ ...EMPTY, ...initialData });

  const set = (field: keyof FormData, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSave = () => {
    const isPersonne = form.type === "personne";
    if (isPersonne && !form.prenom && !form.nom) return;
    if (!isPersonne && !form.societe) return;
    onSave({
      ...form,
      prenom: form.prenom || undefined,
      nom: form.nom || undefined,
      societe: form.societe || undefined,
      contactPrincipal: form.contactPrincipal || undefined,
      adresse: form.adresse || undefined,
      codePostal: form.codePostal || undefined,
      ville: form.ville || undefined,
      sourceDetail: form.sourceDetail || undefined,
      notes: form.notes || undefined,
      oneDriveUrl: form.oneDriveUrl || undefined,
    });
  };

  const isPersonne = form.type === "personne";

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
      <div className="bg-white rounded-sm shadow-xl w-[560px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-sm font-semibold text-gray-800">{title ?? "Nouveau client"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Type toggle */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-2">Type de client</label>
            <div className="flex gap-2">
              {(["personne", "societe"] as ClientType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={`flex-1 py-2 text-sm font-medium rounded-sm border transition-colors cursor-pointer ${
                    form.type === t
                      ? "bg-[#00365A] text-white border-[#00365A]"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {t === "personne" ? "Personne" : "Société"}
                </button>
              ))}
            </div>
          </div>

          {/* Identité */}
          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Identité</legend>
            <div className="grid grid-cols-2 gap-3">
              {isPersonne ? (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Prénom *</label>
                    <input type="text" value={form.prenom ?? ""} onChange={(e) => set("prenom", e.target.value)}
                      className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1">Nom *</label>
                    <input type="text" value={form.nom ?? ""} onChange={(e) => set("nom", e.target.value)}
                      className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Société <span className="text-gray-400">(optionnelle)</span></label>
                    <input type="text" value={form.societe ?? ""} onChange={(e) => set("societe", e.target.value)}
                      className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Nom de la société *</label>
                    <input type="text" value={form.societe ?? ""} onChange={(e) => set("societe", e.target.value)}
                      className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Contact principal</label>
                    <input type="text" value={form.contactPrincipal ?? ""} onChange={(e) => set("contactPrincipal", e.target.value)}
                      placeholder="Prénom Nom"
                      className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
                  </div>
                </>
              )}
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
                <label className="text-xs font-medium text-gray-500 block mb-1">Adresse</label>
                <input type="text" value={form.adresse ?? ""} onChange={(e) => set("adresse", e.target.value)}
                  className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Code postal</label>
                <input type="text" value={form.codePostal ?? ""} onChange={(e) => set("codePostal", e.target.value)}
                  className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Ville</label>
                <input type="text" value={form.ville ?? ""} onChange={(e) => set("ville", e.target.value)}
                  className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
              </div>
            </div>
          </fieldset>

          {/* Origine */}
          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Origine</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Source</label>
                <select value={form.source} onChange={(e) => set("source", e.target.value as SourceClient)}
                  className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm cursor-pointer">
                  {Object.entries(SOURCE_CLIENT_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Détail <span className="text-gray-400">(optionnel)</span></label>
                <input type="text" value={form.sourceDetail ?? ""} onChange={(e) => set("sourceDetail", e.target.value)}
                  placeholder="Ex. : via M. Dupont"
                  className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
              </div>
            </div>
          </fieldset>

          {/* Notes + OneDrive */}
          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Notes & historique</legend>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Notes</label>
                <textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)}
                  rows={3} placeholder="Informations utiles sur ce client…"
                  className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm resize-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">
                  Lien OneDrive historique <span className="text-gray-400">(ancien dossier)</span>
                </label>
                <input type="url" value={form.oneDriveUrl ?? ""} onChange={(e) => set("oneDriveUrl", e.target.value)}
                  placeholder="https://onedrive.live.com/…"
                  className="w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm" />
              </div>
            </div>
          </fieldset>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
          <button onClick={onClose}
            className="text-sm px-4 py-1.5 border border-gray-200 rounded-sm text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
            Annuler
          </button>
          <button onClick={handleSave}
            className="text-sm px-4 py-1.5 bg-[#00365A] text-white rounded-sm hover:bg-[#004d80] cursor-pointer transition-colors font-medium">
            Ajouter le client
          </button>
        </div>
      </div>
    </div>
  );
}
