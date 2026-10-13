import { useState } from "react";
import { Plus, X, Trash2, Mail, Phone, Lightbulb, Pencil, UserCheck } from "lucide-react";
import ClientFormModal from "./ClientFormModal";
import { INITIAL_CLIENTS, getNextClientId } from "./clientData";
import type { Client } from "./clientTypes";

interface IdeeProspect {
  id: number;
  titre: string;
  description?: string;
  email?: string;
  tel?: string;
  dateAjout: string;
}

let nextId = 10;

const INITIAL: IdeeProspect[] = [
  {
    id: 1,
    titre: "Boulangerie Dupré — Sens",
    description: "Rénovation complète du local commercial. Contact pris via salon de l'habitat.",
    email: "dupre.boulangerie@gmail.com",
    tel: "06 12 34 56 78",
    dateAjout: "2026-09-05",
  },
  {
    id: 2,
    titre: "Maison de retraite Les Glycines — Auxerre",
    description: "Extension bâtiment B — 200 m². À contacter après les travaux Bernard.",
    dateAjout: "2026-09-10",
  },
  {
    id: 3,
    titre: "M. Renaudin — Tonnerre",
    email: "p.renaudin@orange.fr",
    tel: "07 89 01 23 45",
    dateAjout: "2026-09-12",
  },
];

const EMPTY_FORM = { titre: "", description: "", email: "", tel: "" };

export default function IdeeProspectsTab() {
  const [items, setItems] = useState<IdeeProspect[]>(INITIAL);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [convertingItem, setConvertingItem] = useState<IdeeProspect | null>(null);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (item: IdeeProspect) => {
    setEditingId(item.id);
    setForm({
      titre: item.titre,
      description: item.description ?? "",
      email: item.email ?? "",
      tel: item.tel ?? "",
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.titre.trim()) return;
    if (editingId !== null) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingId
            ? {
                ...i,
                titre: form.titre.trim(),
                description: form.description || undefined,
                email: form.email || undefined,
                tel: form.tel || undefined,
              }
            : i
        )
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: nextId++,
          titre: form.titre.trim(),
          description: form.description || undefined,
          email: form.email || undefined,
          tel: form.tel || undefined,
          dateAjout: new Date().toISOString().slice(0, 10),
        },
      ]);
    }
    setShowModal(false);
  };

  const remove = (id: number) => setItems((prev) => prev.filter((i) => i.id !== id));

  const handleConvert = (data: Omit<Client, "id" | "chantiers" | "documents" | "dateCreation" | "archive">) => {
    const newClient: Client = {
      ...data,
      id: getNextClientId(),
      chantiers: [],
      documents: [],
      dateCreation: new Date().toISOString().slice(0, 10),
      archive: false,
    };
    INITIAL_CLIENTS.unshift(newClient);
    if (convertingItem) remove(convertingItem.id);
    setConvertingItem(null);
  };

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4F5F7]">
      <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Lightbulb size={15} className="text-amber-400" />
              Idées prospects
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {items.length} idée{items.length > 1 ? "s" : ""} enregistrée{items.length > 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-[#00365A] text-white text-sm font-medium px-4 py-1.5 hover:bg-[#004d80] transition-colors cursor-pointer"
          >
            <Plus size={14} /> Ajouter une idée
          </button>
        </div>

        {/* List */}
        {items.length === 0 ? (
          <div className="bg-white border border-gray-200 px-5 py-12 text-center text-sm text-gray-400">
            Aucune idée prospect pour l'instant.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 px-5 py-4 flex items-start gap-4 group hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-gray-900">{item.titre}</p>
                    <span className="text-xs text-gray-300 font-mono">{fmtDate(item.dateAjout)}</span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.description}</p>
                  )}
                  {(item.email || item.tel) && (
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      {item.email && (
                        <a
                          href={`mailto:${item.email}`}
                          className="flex items-center gap-1 text-xs text-[#00365A] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Mail size={11} />
                          {item.email}
                        </a>
                      )}
                      {item.tel && (
                        <a
                          href={`tel:${item.tel}`}
                          className="flex items-center gap-1 text-xs text-[#00365A] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone size={11} />
                          {item.tel}
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={() => setConvertingItem(item)}
                    title="Convertir en client"
                    className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 cursor-pointer transition-colors border border-emerald-200 hover:border-emerald-400 px-2 py-0.5"
                  >
                    <UserCheck size={11} />
                    Convertir
                  </button>
                  <button
                    onClick={() => openEdit(item)}
                    className="text-gray-400 hover:text-[#00365A] cursor-pointer transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => remove(item.id)}
                    className="text-gray-400 hover:text-red-500 cursor-pointer transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal conversion en client */}
      {convertingItem && (
        <ClientFormModal
          title={`Convertir "${convertingItem.titre}" en client`}
          initialData={{
            email: convertingItem.email ?? "",
            telephone: convertingItem.tel ?? "",
            notes: [
              convertingItem.titre,
              convertingItem.description,
            ].filter(Boolean).join("\n"),
            source: "prospect_converti",
          }}
          onClose={() => setConvertingItem(null)}
          onSave={handleConvert}
        />
      )}

      {/* Modal ajout / édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white shadow-xl w-[440px]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">
                {editingId !== null ? "Modifier l'idée" : "Nouvelle idée prospect"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">
                  Titre <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.titre}
                  onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
                  placeholder="Ex. : M. Renaudin — Tonnerre"
                  className="w-full border border-gray-200 px-3 py-1.5 text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Notes, contexte, source du contact…"
                  rows={3}
                  className="w-full border border-gray-200 px-3 py-1.5 text-sm resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="contact@email.fr"
                    className="w-full border border-gray-200 px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={form.tel}
                    onChange={(e) => setForm((f) => ({ ...f, tel: e.target.value }))}
                    placeholder="06 12 34 56 78"
                    className="w-full border border-gray-200 px-3 py-1.5 text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowModal(false)}
                className="text-sm px-4 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={!form.titre.trim()}
                className="text-sm px-4 py-1.5 bg-[#00365A] text-white hover:bg-[#004d80] cursor-pointer font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {editingId !== null ? "Enregistrer" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
