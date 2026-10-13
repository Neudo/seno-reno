import { useState } from "react";
import { useNavigate } from "react-router";
import { useRoutine } from "../../context/RoutineContext";
import {
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  GripVertical,
  RotateCcw,
  Zap,
} from "lucide-react";
import type { RoutineSection, RoutineItem } from "../routine/routineData";
import { DEFAULT_SECTIONS } from "../routine/routineData";

// ── Color palette ──────────────────────────────────────────────────────────────

const COLORS = [
  "#00365A", "#1D4ED8", "#166534", "#6B21A8",
  "#B45309", "#0369A1", "#7C3AED", "#BE185D", "#B91C1C",
  "#0F766E", "#92400E", "#1E3A5F",
];

// ── Inline text edit ───────────────────────────────────────────────────────────

function InlineEdit({
  value,
  onSave,
  className = "",
}: {
  value: string;
  onSave: (v: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) onSave(trimmed);
    else setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 flex-1">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") { setDraft(value); setEditing(false); }
          }}
          className={`flex-1 text-sm px-2 py-1 border border-[#00365A] focus:outline-none bg-white ${className}`}
        />
        <button onClick={commit} className="p-1 text-[#00365A] hover:bg-green-50 cursor-pointer">
          <Check size={13} />
        </button>
        <button onClick={() => { setDraft(value); setEditing(false); }} className="p-1 text-gray-400 hover:bg-gray-100 cursor-pointer">
          <X size={13} />
        </button>
      </div>
    );
  }

  return (
    <span
      className={`flex-1 text-sm cursor-pointer hover:text-[#00365A] group-hover:underline decoration-dashed underline-offset-2 ${className}`}
      onClick={() => setEditing(true)}
      title="Cliquer pour modifier"
    >
      {value}
    </span>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────

// ── Main component ─────────────────────────────────────────────────────────────

export default function RoutineSettingsPage() {
  const { sections, setSections } = useRoutine();
  const navigate = useNavigate();
  const onBack = () => navigate("/routine");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionColor, setNewSectionColor] = useState(COLORS[0]);
  const [addingSection, setAddingSection] = useState(false);
  const [newItemInputs, setNewItemInputs] = useState<Record<string, string>>({});
  const [addingItemTo, setAddingItemTo] = useState<string | null>(null);

  // ── Section mutations ────────────────────────────────────────────────────────

  const addSection = () => {
    const title = newSectionTitle.trim().toUpperCase();
    if (!title) return;
    setSections((prev) => [
      ...prev,
      { id: `sec-${Date.now()}`, title, color: newSectionColor, items: [] },
    ]);
    setNewSectionTitle("");
    setNewSectionColor(COLORS[0]);
    setAddingSection(false);
  };

  const deleteSection = (id: string) =>
    setSections((prev) => prev.filter((s) => s.id !== id));

  const renameSection = (id: string, title: string) =>
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: title.toUpperCase() } : s))
    );

  const recolorSection = (id: string, color: string) =>
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, color } : s)));

  const moveSection = (id: string, dir: -1 | 1) => {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  // ── Item mutations ───────────────────────────────────────────────────────────

  const addItem = (sectionId: string) => {
    const label = newItemInputs[sectionId]?.trim();
    if (!label) return;
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, items: [...s.items, { id: `item-${Date.now()}`, label }] }
          : s
      )
    );
    setNewItemInputs((prev) => ({ ...prev, [sectionId]: "" }));
    setAddingItemTo(null);
  };

  const deleteItem = (sectionId: string, itemId: string) =>
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, items: s.items.filter((i) => i.id !== itemId) } : s
      )
    );

  const renameItem = (sectionId: string, itemId: string, label: string) =>
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, label } : i)) }
          : s
      )
    );

  const moveItem = (sectionId: string, itemId: string, dir: -1 | 1) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const items = [...s.items];
        const idx = items.findIndex((i) => i.id === itemId);
        const swap = idx + dir;
        if (swap < 0 || swap >= items.length) return s;
        [items[idx], items[swap]] = [items[swap], items[idx]];
        return { ...s, items };
      })
    );
  };

  const resetToDefault = () => {
    if (window.confirm("Réinitialiser la routine par défaut ? Toutes vos modifications seront perdues.")) {
      setSections(DEFAULT_SECTIONS);
    }
  };

  const totalSections = sections.length;
  const totalItems = sections.reduce((acc, s) => acc + s.items.filter((i) => !i.auto).length, 0);

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4F5F7]">
      <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">

        {/* Page header */}
        <div className="bg-white border border-gray-200 px-5 py-4 flex items-start justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900">
              Personnalisation de la routine
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {totalSections} catégorie{totalSections > 1 ? "s" : ""} · {totalItems} tâche{totalItems > 1 ? "s" : ""} permanente{totalItems > 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={resetToDefault}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-300 px-3 py-1.5 transition-colors cursor-pointer font-medium"
            >
              <RotateCcw size={11} />
              Réinitialiser
            </button>
            <button
              onClick={onBack}
              className="text-xs px-4 py-1.5 bg-[#00365A] text-white hover:bg-[#004A7A] transition-colors cursor-pointer font-medium"
            >
              ← Retour à la routine
            </button>
          </div>
        </div>

        {/* Sections list */}
        {sections.map((section, sIdx) => {
          const manualItems = section.items.filter((i) => !i.auto);
          const autoItems = section.items.filter((i) => i.auto);
          const isAddingHere = addingItemTo === section.id;

          return (
            <div key={section.id} className="bg-white border border-gray-200 overflow-hidden">
              {/* Section header */}
              <div
                className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100"
                style={{ borderLeft: `3px solid ${section.color}` }}
              >
                {/* Reorder */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    onClick={() => moveSection(section.id, -1)}
                    disabled={sIdx === 0}
                    className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    onClick={() => moveSection(section.id, 1)}
                    disabled={sIdx === sections.length - 1}
                    className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronDown size={12} />
                  </button>
                </div>

                {/* Color picker */}
                <div className="relative shrink-0 group/color">
                  <div
                    className="w-4 h-4 border border-white/40 shadow-sm cursor-pointer"
                    style={{ background: section.color }}
                    title="Changer la couleur"
                  />
                  <div className="absolute top-6 left-0 z-20 hidden group-hover/color:flex flex-wrap gap-1 bg-white border border-gray-200 shadow-lg p-2 w-36">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => recolorSection(section.id, c)}
                        className={`w-5 h-5 cursor-pointer border-2 transition-transform hover:scale-110 ${
                          section.color === c ? "border-gray-700" : "border-transparent"
                        }`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Title (inline edit) */}
                <div className="flex-1 flex items-center group">
                  <InlineEdit
                    value={section.title}
                    onSave={(v) => renameSection(section.id, v)}
                    className="font-bold tracking-widest"
                  />
                </div>

                {/* Item count */}
                <span className="font-mono text-xs text-gray-400 shrink-0">
                  {manualItems.length} tâche{manualItems.length > 1 ? "s" : ""}
                </span>

                {/* Delete section */}
                <button
                  onClick={() => {
                    if (window.confirm(`Supprimer la catégorie "${section.title}" et toutes ses tâches ?`))
                      deleteSection(section.id);
                  }}
                  className="shrink-0 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Supprimer la catégorie"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Manual items */}
              <div className="divide-y divide-gray-50">
                {manualItems.map((item, iIdx) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 group hover:bg-gray-50 transition-colors">
                    {/* Reorder item */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        onClick={() => moveItem(section.id, item.id, -1)}
                        disabled={iIdx === 0}
                        className="p-0.5 text-gray-200 hover:text-gray-500 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <ChevronUp size={11} />
                      </button>
                      <button
                        onClick={() => moveItem(section.id, item.id, 1)}
                        disabled={iIdx === manualItems.length - 1}
                        className="p-0.5 text-gray-200 hover:text-gray-500 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <ChevronDown size={11} />
                      </button>
                    </div>

                    <GripVertical size={13} className="text-gray-200 shrink-0" />

                    <div className="flex-1 flex items-center group/edit">
                      <InlineEdit
                        value={item.label}
                        onSave={(v) => renameItem(section.id, item.id, v)}
                      />
                    </div>

                    <button
                      onClick={() => deleteItem(section.id, item.id)}
                      className="shrink-0 p-1.5 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}

              </div>

              {/* Add item */}
              <div className="px-4 py-2.5 border-t border-gray-50">
                {isAddingHere ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      type="text"
                      value={newItemInputs[section.id] ?? ""}
                      onChange={(e) =>
                        setNewItemInputs((prev) => ({ ...prev, [section.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addItem(section.id);
                        if (e.key === "Escape") setAddingItemTo(null);
                      }}
                      placeholder="Intitulé de la tâche…"
                      className="flex-1 text-sm px-2.5 py-1.5 border border-[#00365A] bg-white focus:outline-none text-gray-800 placeholder-gray-400"
                    />
                    <button
                      onClick={() => addItem(section.id)}
                      className="text-xs px-3 py-1.5 bg-[#00365A] text-white hover:bg-[#004A7A] transition-colors cursor-pointer font-medium"
                    >
                      Ajouter
                    </button>
                    <button
                      onClick={() => setAddingItemTo(null)}
                      className="text-xs px-3 py-1.5 border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingItemTo(section.id)}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#00365A] transition-colors cursor-pointer py-0.5"
                  >
                    <Plus size={12} />
                    Ajouter une tâche permanente
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Add section */}
        {addingSection ? (
          <div className="bg-white border border-[#00365A] px-5 py-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-700">Nouvelle catégorie</p>
            <div className="flex items-center gap-3">
              <input
                autoFocus
                type="text"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addSection();
                  if (e.key === "Escape") setAddingSection(false);
                }}
                placeholder="Nom de la catégorie…"
                className="flex-1 text-sm px-3 py-2 border border-gray-200 focus:border-[#00365A] focus:outline-none bg-white"
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Couleur</p>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewSectionColor(c)}
                    className={`w-6 h-6 cursor-pointer border-2 transition-transform hover:scale-110 ${
                      newSectionColor === c ? "border-gray-700 scale-110" : "border-transparent"
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={addSection}
                className="text-xs px-4 py-1.5 bg-[#00365A] text-white hover:bg-[#004A7A] transition-colors cursor-pointer font-medium"
              >
                Créer la catégorie
              </button>
              <button
                onClick={() => setAddingSection(false)}
                className="text-xs px-4 py-1.5 border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingSection(true)}
            className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-gray-300 text-sm text-gray-400 hover:border-[#00365A] hover:text-[#00365A] transition-colors cursor-pointer bg-white"
          >
            <Plus size={14} />
            Ajouter une catégorie
          </button>
        )}
      </div>
    </div>
  );
}
