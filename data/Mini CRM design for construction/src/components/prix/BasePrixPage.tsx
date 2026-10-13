import { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  Trash2,
  X,
  Filter,
  Check,
  Tag,
  Ruler,
  Euro,
  MessageSquare,
  Hash,
} from "lucide-react";
import {
  PRIX_DATA,
  CATEGORIES,
  CATEGORY_COLORS,
  type PrixItem,
  type Categorie,
} from "./prixData";

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmtPrice = (n: number | null): string => {
  if (n === null || n === 0) return "";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n);
};

const PriceDisplay = ({ n }: { n: number | null }) => {
  if (n === null) return <span className="text-gray-400 italic text-xs">À ajuster</span>;
  if (n === 0) return <span className="text-gray-400">—</span>;
  return <span className="font-mono">{fmtPrice(n)}</span>;
};

// ── Category multi-select dropdown ────────────────────────────────────────────

function CategoryFilter({
  selected,
  onChange,
}: {
  selected: Categorie[];
  onChange: (v: Categorie[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (cat: Categorie) =>
    onChange(selected.includes(cat) ? selected.filter((c) => c !== cat) : [...selected, cat]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-3 py-2 border text-sm transition-colors cursor-pointer ${
          selected.length > 0
            ? "border-[#00365A] bg-[#E8F0F6] text-[#00365A]"
            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
        }`}
      >
        <Filter size={13} />
        {selected.length === 0
          ? "Toutes les catégories"
          : selected.length === 1
          ? selected[0]
          : `${selected.length} catégories`}
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-30 w-72 bg-white border border-gray-200 shadow-lg">
          <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Catégories</span>
            <button
              onClick={() => onChange([])}
              className="text-xs text-[#00365A] hover:underline cursor-pointer font-medium"
            >
              Tout effacer
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {CATEGORIES.map((cat) => {
              const isSelected = selected.includes(cat);
              const color = CATEGORY_COLORS[cat];
              return (
                <button
                  key={cat}
                  onClick={() => toggle(cat)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="w-2.5 h-2.5 shrink-0" style={{ background: color }} />
                  <span className="flex-1 text-gray-700">{cat}</span>
                  {isSelected && <Check size={13} className="text-[#00365A] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Add modal ──────────────────────────────────────────────────────────────────

function AddModal({ onAdd, onClose }: { onAdd: (item: PrixItem) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<Omit<PrixItem, "id">>({
    code: 0,
    categorie: CATEGORIES[0],
    designation: "",
    unite: "u",
    pvht: null,
    commentaire: "",
  });

  const field = "flex flex-col gap-1";
  const label = "text-xs font-medium text-gray-500 uppercase tracking-wider";
  const input = "text-sm px-3 py-2 border border-gray-200 focus:border-[#00365A] focus:outline-none bg-white";

  const submit = () => {
    if (!draft.designation.trim()) return;
    onAdd({ ...draft, id: `new-${Date.now()}`, commentaire: draft.commentaire || undefined });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white border border-gray-200 shadow-xl w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">Nouvel élément</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 grid grid-cols-2 gap-4">
          <div className={field}>
            <label className={label}>Code</label>
            <input type="number" value={draft.code || ""} onChange={(e) => setDraft({ ...draft, code: Number(e.target.value) })} className={`${input} font-mono`} placeholder="Ex: 1205" />
          </div>
          <div className={field}>
            <label className={label}>Catégorie</label>
            <select value={draft.categorie} onChange={(e) => setDraft({ ...draft, categorie: e.target.value as Categorie })} className={`${input} text-xs`}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className={`${field} col-span-2`}>
            <label className={label}>Désignation</label>
            <textarea value={draft.designation} onChange={(e) => setDraft({ ...draft, designation: e.target.value })} className={`${input} resize-none`} rows={3} placeholder="Description détaillée de la prestation…" />
          </div>
          <div className={field}>
            <label className={label}>Unité</label>
            <input value={draft.unite} onChange={(e) => setDraft({ ...draft, unite: e.target.value })} className={input} placeholder="m², u, ens, ml…" />
          </div>
          <div className={field}>
            <label className={label}>PV HT (€)</label>
            <input type="number" value={draft.pvht ?? ""} onChange={(e) => setDraft({ ...draft, pvht: e.target.value === "" ? null : Number(e.target.value) })} className={`${input} font-mono`} placeholder="Laisser vide = À ajuster" />
          </div>
          <div className={`${field} col-span-2`}>
            <label className={label}>Commentaire</label>
            <input value={draft.commentaire ?? ""} onChange={(e) => setDraft({ ...draft, commentaire: e.target.value })} className={input} placeholder="Optionnel" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100">
          <button onClick={onClose} className="text-sm px-4 py-2 border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer transition-colors">Annuler</button>
          <button onClick={submit} disabled={!draft.designation.trim()} className="text-sm px-4 py-2 bg-[#00365A] text-white hover:bg-[#004A7A] cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium">
            Ajouter l'élément
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail / Edit Drawer ───────────────────────────────────────────────────────

interface DrawerProps {
  item: PrixItem;
  mode: "view" | "edit";
  onClose: () => void;
  onSave: (item: PrixItem) => void;
  onDelete: (id: string) => void;
  onEdit: () => void;
}

function ItemDrawer({ item, mode, onClose, onSave, onDelete, onEdit }: DrawerProps) {
  const [draft, setDraft] = useState<PrixItem>({ ...item });
  const color = CATEGORY_COLORS[item.categorie as Categorie] ?? "#9CA3AF";

  // Reset draft when item changes
  useEffect(() => { setDraft({ ...item }); }, [item]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const label = "text-xs font-semibold uppercase tracking-wider text-gray-400";
  const input = "w-full text-sm px-3 py-2 border border-gray-200 focus:border-[#00365A] focus:outline-none bg-white";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[420px] bg-white border-l border-gray-200 z-50 flex flex-col shadow-xl">

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0"
          style={{ borderLeft: `3px solid ${color}` }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-xs font-semibold text-gray-400">{item.code}</span>
            <span
              className="text-xs font-medium px-2 py-0.5 border"
              style={{ color, background: `${color}12`, borderColor: `${color}35` }}
            >
              {item.categorie}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {mode === "view" && (
              <>
                <button
                  onClick={onEdit}
                  className="p-2 text-gray-400 hover:text-[#00365A] hover:bg-[#E8F0F6] transition-colors cursor-pointer"
                  title="Modifier"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => { if (window.confirm("Supprimer cet élément ?")) { onDelete(item.id); onClose(); } }}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 cursor-pointer ml-1">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {mode === "view" ? (
            // ── View mode ──────────────────────────────────────────────────
            <div className="px-5 py-5 space-y-6">
              {/* Désignation */}
              <div>
                <p className={label}>Désignation</p>
                <p className="text-gray-900 text-sm leading-relaxed mt-2">{item.designation}</p>
              </div>

              <div className="w-full h-px bg-gray-100" />

              {/* KPI row */}
              <div className="grid grid-cols-2 gap-px bg-gray-200 border border-gray-200">
                <div className="bg-white px-4 py-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                    <Ruler size={11} />
                    Unité
                  </div>
                  <p className="font-mono text-lg font-light text-gray-800">{item.unite}</p>
                </div>
                <div className="bg-white px-4 py-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                    <Euro size={11} />
                    PV HT
                  </div>
                  {item.pvht === null ? (
                    <p className="text-sm italic text-gray-400">À ajuster</p>
                  ) : item.pvht === 0 ? (
                    <p className="text-sm text-gray-400">—</p>
                  ) : (
                    <p className="font-mono text-lg font-light text-gray-900">{fmtPrice(item.pvht)}</p>
                  )}
                </div>
              </div>

              {/* Commentaire */}
              {item.commentaire && (
                <div className="bg-amber-50 border border-amber-100 px-4 py-3">
                  <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold mb-1.5">
                    <MessageSquare size={11} />
                    Commentaire
                  </div>
                  <p className="text-sm text-amber-900 leading-relaxed">{item.commentaire}</p>
                </div>
              )}
            </div>
          ) : (
            // ── Edit mode ──────────────────────────────────────────────────
            <div className="px-5 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={label}>Code</label>
                  <input
                    type="number"
                    value={draft.code || ""}
                    onChange={(e) => setDraft({ ...draft, code: Number(e.target.value) })}
                    className={`${input} font-mono`}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={label}>Catégorie</label>
                  <select
                    value={draft.categorie}
                    onChange={(e) => setDraft({ ...draft, categorie: e.target.value as Categorie })}
                    className={`${input} text-xs`}
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={label}>Désignation</label>
                <textarea
                  value={draft.designation}
                  onChange={(e) => setDraft({ ...draft, designation: e.target.value })}
                  className={`${input} resize-none`}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={label}>Unité</label>
                  <input
                    value={draft.unite}
                    onChange={(e) => setDraft({ ...draft, unite: e.target.value })}
                    className={input}
                    placeholder="m², u, ens, ml…"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={label}>PV HT (€)</label>
                  <input
                    type="number"
                    value={draft.pvht ?? ""}
                    onChange={(e) =>
                      setDraft({ ...draft, pvht: e.target.value === "" ? null : Number(e.target.value) })
                    }
                    className={`${input} font-mono`}
                    placeholder="Vide = À ajuster"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={label}>Commentaire</label>
                <textarea
                  value={draft.commentaire ?? ""}
                  onChange={(e) => setDraft({ ...draft, commentaire: e.target.value || undefined })}
                  className={`${input} resize-none`}
                  rows={3}
                  placeholder="Optionnel"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {mode === "edit" && (
          <div className="shrink-0 border-t border-gray-100 px-5 py-4 flex items-center justify-end gap-2 bg-white">
            <button
              onClick={onClose}
              className="text-sm px-4 py-2 border border-gray-200 text-gray-500 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => { onSave(draft); onClose(); }}
              disabled={!draft.designation.trim()}
              className="text-sm px-5 py-2 bg-[#00365A] text-white hover:bg-[#004A7A] cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              Enregistrer
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

type SortKey = "code" | "categorie" | "designation" | "pvht";
type SortDir = "asc" | "desc";

export default function BasePrixPage() {
  const [items, setItems] = useState<PrixItem[]>(PRIX_DATA);
  const [search, setSearch] = useState("");
  const [selectedCats, setSelectedCats] = useState<Categorie[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "code", dir: "asc" });
  const [drawer, setDrawer] = useState<{ item: PrixItem; mode: "view" | "edit" } | null>(null);

  const toggleSort = (key: SortKey) => {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  };

  const filtered = useMemo(() => {
    let list = items;
    if (selectedCats.length > 0) list = list.filter((i) => selectedCats.includes(i.categorie as Categorie));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.designation.toLowerCase().includes(q) ||
          String(i.code).includes(q) ||
          i.categorie.toLowerCase().includes(q) ||
          (i.commentaire ?? "").toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sort.key === "code") cmp = a.code - b.code;
      else if (sort.key === "pvht") cmp = (a.pvht ?? -1) - (b.pvht ?? -1);
      else if (sort.key === "categorie") cmp = a.categorie.localeCompare(b.categorie, "fr");
      else if (sort.key === "designation") cmp = a.designation.localeCompare(b.designation, "fr");
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [items, search, selectedCats, sort]);

  const saveItem = (updated: PrixItem) =>
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));

  const deleteItem = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const addItem = (item: PrixItem) =>
    setItems((prev) => [...prev, item]);

  const SortIcon = ({ k }: { k: SortKey }) =>
    sort.key === k ? (
      sort.dir === "asc" ? <ChevronUp size={11} className="text-[#00365A]" /> : <ChevronDown size={11} className="text-[#00365A]" />
    ) : (
      <ChevronDown size={11} className="text-gray-300" />
    );

  const th = "px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-200 bg-gray-50 select-none cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap";

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-[#F4F5F7]">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 flex-wrap shrink-0">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par code, désignation, catégorie…"
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 focus:border-[#00365A] focus:outline-none bg-white"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 cursor-pointer">
              <X size={13} />
            </button>
          )}
        </div>

        <CategoryFilter selected={selectedCats} onChange={setSelectedCats} />
        <div className="flex-1" />

        <span className="text-xs text-gray-400 font-mono">
          {filtered.length} élément{filtered.length > 1 ? "s" : ""}
          {filtered.length !== items.length && ` / ${items.length}`}
        </span>

        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#00365A] text-white text-sm hover:bg-[#004A7A] transition-colors cursor-pointer font-medium"
        >
          <Plus size={14} />
          Ajouter
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className={th} onClick={() => toggleSort("code")}><span className="flex items-center gap-1">Code <SortIcon k="code" /></span></th>
              <th className={th} onClick={() => toggleSort("categorie")}><span className="flex items-center gap-1">Catégorie <SortIcon k="categorie" /></span></th>
              <th className={th} style={{ minWidth: 380 }} onClick={() => toggleSort("designation")}><span className="flex items-center gap-1">Désignation <SortIcon k="designation" /></span></th>
              <th className={th}>Unité</th>
              <th className={th} onClick={() => toggleSort("pvht")}><span className="flex items-center gap-1">PV HT <SortIcon k="pvht" /></span></th>
              <th className={th}>Commentaire</th>
              <th className={`${th} text-right`} />
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, idx) => {
              const color = CATEGORY_COLORS[item.categorie as Categorie] ?? "#9CA3AF";
              const isEven = idx % 2 === 0;
              const isActive = drawer?.item.id === item.id;

              return (
                <tr
                  key={item.id}
                  onClick={() => setDrawer({ item, mode: "view" })}
                  className={`border-b border-gray-100 transition-colors group cursor-pointer ${
                    isActive
                      ? "bg-[#E8F0F6]"
                      : isEven
                      ? "bg-white hover:bg-[#EEF4F8]"
                      : "bg-gray-50/60 hover:bg-[#EEF4F8]"
                  }`}
                >
                  {/* Code + color bar */}
                  <td className="pl-5 pr-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-0.5 h-5 shrink-0" style={{ background: color }} />
                      <span className="font-mono text-xs font-semibold text-gray-500">{item.code}</span>
                    </div>
                  </td>

                  {/* Catégorie */}
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 border"
                      style={{ color, background: `${color}12`, borderColor: `${color}35` }}
                    >
                      {item.categorie}
                    </span>
                  </td>

                  {/* Désignation */}
                  <td className="px-5 py-3 max-w-sm">
                    <span className="text-gray-800 text-sm leading-snug line-clamp-2">{item.designation}</span>
                  </td>

                  {/* Unité */}
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="font-mono text-xs bg-gray-100 text-gray-500 px-2 py-1">{item.unite}</span>
                  </td>

                  {/* PV HT */}
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <span className={`font-mono text-sm font-thin ${item.pvht && item.pvht > 0 ? "text-gray-900" : "text-gray-400"}`}>
                      <PriceDisplay n={item.pvht} />
                    </span>
                  </td>

                  {/* Commentaire */}
                  <td className="px-5 py-3 max-w-xs">
                    {item.commentaire && (
                      <span className="text-xs text-gray-400 italic line-clamp-1" title={item.commentaire}>
                        {item.commentaire}
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="pl-4 pr-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setDrawer({ item, mode: "edit" })}
                        className="p-1.5 text-gray-400 hover:text-[#00365A] hover:bg-[#E8F0F6] transition-colors cursor-pointer"
                        title="Modifier"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => { if (window.confirm("Supprimer cet élément ?")) deleteItem(item.id); }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                  Aucun élément ne correspond à votre recherche.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      {drawer && (
        <ItemDrawer
          item={drawer.item}
          mode={drawer.mode}
          onClose={() => setDrawer(null)}
          onSave={(updated) => { saveItem(updated); setDrawer(null); }}
          onDelete={(id) => { deleteItem(id); setDrawer(null); }}
          onEdit={() => setDrawer({ item: drawer.item, mode: "edit" })}
        />
      )}

      {/* Add modal */}
      {showAdd && <AddModal onAdd={addItem} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
