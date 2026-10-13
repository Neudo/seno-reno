import { useState } from "react";
import { useNavigate } from "react-router";
import { useRoutine } from "../../context/RoutineContext";
import {
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  Zap,
  Plus,
  Trash2,
  RotateCcw,
  Settings2,
} from "lucide-react";
import type { RoutineSection, RoutineItem } from "./routineData";

// ── Sub-components ─────────────────────────────────────────────────────────────

function AutoBadge({ tag, urgent }: { tag: string; urgent?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 font-medium border shrink-0 ${
        urgent
          ? "bg-red-50 text-red-700 border-red-200"
          : "bg-[#E8F0F6] text-[#00365A] border-[#00365A]/20"
      }`}
    >
      <Zap size={9} />
      {tag}
    </span>
  );
}

interface ItemRowProps {
  item: RoutineItem;
  checked: boolean;
  onToggle: () => void;
  onDelete?: () => void;
}

function ItemRow({ item, checked, onToggle, onDelete }: ItemRowProps) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 group transition-colors ${
        checked ? "opacity-40" : "hover:bg-gray-50"
      } ${item.auto && !checked ? "bg-blue-50/30" : ""}`}
    >
      <button
        onClick={onToggle}
        className="shrink-0 text-gray-300 hover:text-[#00365A] transition-colors cursor-pointer mt-px"
      >
        {checked ? (
          <CheckSquare size={15} className="text-[#00365A]" />
        ) : (
          <Square size={15} />
        )}
      </button>

      <span
        className={`flex-1 text-sm leading-snug ${
          checked
            ? "line-through text-gray-400"
            : item.autoUrgent
            ? "text-gray-900 font-medium"
            : "text-gray-800"
        }`}
      >
        {item.label}
      </span>

      <div className="flex items-center gap-2 shrink-0">
        {item.auto && item.autoTag && !checked && (
          <AutoBadge tag={item.autoTag} urgent={item.autoUrgent} />
        )}
        {item.custom && onDelete && (
          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all cursor-pointer"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────

// ── Main component ─────────────────────────────────────────────────────────────

export default function RoutinePage() {
  const { sections, setSections } = useRoutine();
  const navigate = useNavigate();
  const onGoToSettings = () => navigate("/routine/parametres");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [newItemInputs, setNewItemInputs] = useState<Record<string, string>>({});
  const [addingTo, setAddingTo] = useState<string | null>(null);

  const toggleItem = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleSection = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleSectionCheck = (section: RoutineSection) => {
    const ids = section.items.map((i) => i.id);
    const allChecked = ids.every((id) => checked.has(id));
    setChecked((prev) => {
      const next = new Set(prev);
      if (allChecked) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const addItem = (sectionId: string) => {
    const label = newItemInputs[sectionId]?.trim();
    if (!label) return;
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, items: [...s.items, { id: `custom-${Date.now()}`, label, custom: true }] }
          : s
      )
    );
    setNewItemInputs((prev) => ({ ...prev, [sectionId]: "" }));
    setAddingTo(null);
  };

  const deleteItem = (sectionId: string, itemId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, items: s.items.filter((i) => i.id !== itemId) } : s
      )
    );
    setChecked((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  };

  const resetAll = () => setChecked(new Set());

  const totalItems = sections.reduce((acc, s) => acc + s.items.length, 0);
  const doneCount = checked.size;
  const pct = totalItems > 0 ? Math.round((doneCount / totalItems) * 100) : 0;
  const autoUrgentCount = sections
    .flatMap((s) => s.items)
    .filter((i) => i.auto && i.autoUrgent && !checked.has(i.id)).length;

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4F5F7]">
      <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">

        {/* Progress header */}
        <div className="bg-white border border-gray-200 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="font-mono text-2xl font-semibold text-[#00365A]">{pct}%</span>
              <span className="text-sm text-gray-500 ml-2">de la routine complétée</span>
              <span className="font-mono text-sm text-gray-400 ml-1">({doneCount}/{totalItems})</span>
            </div>
            <div className="flex items-center gap-2">
              {autoUrgentCount > 0 && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2.5 py-1.5">
                  <Zap size={11} />
                  {autoUrgentCount} action{autoUrgentCount > 1 ? "s" : ""} urgente{autoUrgentCount > 1 ? "s" : ""}
                </span>
              )}
              <button
                onClick={resetAll}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#00365A] border border-gray-200 hover:border-[#00365A] px-3 py-1.5 transition-colors cursor-pointer font-medium"
              >
                <RotateCcw size={11} />
                Réinitialiser
              </button>
              <button
                onClick={onGoToSettings}
                className="flex items-center gap-1.5 text-xs text-[#00365A] border border-[#00365A] px-3 py-1.5 hover:bg-[#00365A] hover:text-white transition-colors cursor-pointer font-medium"
              >
                <Settings2 size={11} />
                Personnaliser
              </button>
            </div>
          </div>
          <div className="w-full bg-gray-100 h-1.5">
            <div
              className="h-full bg-[#00365A] transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Sections */}
        {sections.map((section) => {
          const isCollapsed = collapsed.has(section.id);
          const sectionDone = section.items.filter((i) => checked.has(i.id)).length;
          const sectionTotal = section.items.length;
          const allDone = sectionDone === sectionTotal;
          const isAddingHere = addingTo === section.id;

          return (
            <div key={section.id} className="bg-white border border-gray-200 overflow-hidden">
              {/* Section header */}
              <div
                className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                style={{ borderLeft: `3px solid ${section.color}` }}
              >
                <button
                  onClick={() => toggleSectionCheck(section)}
                  className="shrink-0 transition-colors cursor-pointer"
                  title={allDone ? "Tout décocher" : "Tout cocher"}
                >
                  {allDone ? (
                    <CheckSquare size={15} className="text-[#00365A]" />
                  ) : sectionDone > 0 ? (
                    <CheckSquare size={15} className="text-gray-300" />
                  ) : (
                    <Square size={15} className="text-gray-300" />
                  )}
                </button>

                <button
                  onClick={() => toggleSection(section.id)}
                  className="flex-1 flex items-center gap-3 text-left cursor-pointer"
                >
                  <span className="text-xs font-bold tracking-widest text-gray-700 uppercase">
                    {section.title}
                  </span>
                  <span
                    className="font-mono text-xs px-1.5 py-0.5 font-medium"
                    style={{
                      color: allDone ? "#166534" : section.color,
                      background: allDone ? "#F0FDF4" : `${section.color}12`,
                      border: `1px solid ${allDone ? "#BBF7D0" : `${section.color}30`}`,
                    }}
                  >
                    {sectionDone}/{sectionTotal}
                  </span>
                </button>

                <button onClick={() => toggleSection(section.id)} className="cursor-pointer shrink-0">
                  {isCollapsed ? (
                    <ChevronDown size={14} className="text-gray-400" />
                  ) : (
                    <ChevronUp size={14} className="text-gray-400" />
                  )}
                </button>
              </div>

              {/* Items */}
              {!isCollapsed && (
                <>
                  <div className="divide-y divide-gray-50">
                    {section.items.map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        checked={checked.has(item.id)}
                        onToggle={() => toggleItem(item.id)}
                        onDelete={item.custom ? () => deleteItem(section.id, item.id) : undefined}
                      />
                    ))}
                  </div>

                  <div className="px-4 py-2 border-t border-gray-50">
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
                            if (e.key === "Escape") setAddingTo(null);
                          }}
                          placeholder="Nouvelle tâche…"
                          className="flex-1 text-sm px-2.5 py-1.5 border border-[#00365A] bg-white focus:outline-none text-gray-800 placeholder-gray-400"
                        />
                        <button
                          onClick={() => addItem(section.id)}
                          className="text-xs px-3 py-1.5 bg-[#00365A] text-white hover:bg-[#004A7A] transition-colors cursor-pointer font-medium"
                        >
                          Ajouter
                        </button>
                        <button
                          onClick={() => setAddingTo(null)}
                          className="text-xs px-3 py-1.5 border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingTo(section.id)}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#00365A] transition-colors cursor-pointer py-1"
                      >
                        <Plus size={12} />
                        Ajouter une tâche
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
