import { useState } from "react";
import { ShoppingBasket, Plus, X, Check, Trash2 } from "lucide-react";
import { ACHATS_LISTE, getNextAchatId, type Achat } from "./achatsData";

type Filtre = "a_acheter" | "achetes" | "tous";

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

export default function AchatsPage() {
  const [items, setItems] = useState<Achat[]>(ACHATS_LISTE);
  const [filtre, setFiltre] = useState<Filtre>("a_acheter");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    titre: "",
    quantite: "",
    fournisseur: "",
    montantEstime: "",
  });

  const filtered =
    filtre === "a_acheter"
      ? items.filter((i) => !i.checked)
      : filtre === "achetes"
      ? items.filter((i) => i.checked)
      : items;

  const toggle = (id: number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i))
    );
    const idx = ACHATS_LISTE.findIndex((i) => i.id === id);
    if (idx !== -1) ACHATS_LISTE[idx].checked = !ACHATS_LISTE[idx].checked;
  };

  const remove = (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    const idx = ACHATS_LISTE.findIndex((i) => i.id === id);
    if (idx !== -1) ACHATS_LISTE.splice(idx, 1);
  };

  const handleAdd = () => {
    if (!form.titre.trim()) return;
    const montant = form.montantEstime
      ? parseFloat(form.montantEstime.replace(",", "."))
      : undefined;
    const newItem: Achat = {
      id: getNextAchatId(),
      titre: form.titre.trim(),
      quantite: form.quantite || undefined,
      fournisseur: form.fournisseur || undefined,
      montantEstime: montant && !isNaN(montant) ? montant : undefined,
      checked: false,
      dateAjout: new Date().toISOString().slice(0, 10),
    };
    ACHATS_LISTE.push(newItem);
    setItems([...ACHATS_LISTE]);
    setForm({ titre: "", quantite: "", fournisseur: "", montantEstime: "" });
    setShowForm(false);
  };

  const countAAcheter = items.filter((i) => !i.checked).length;
  const countAchetes = items.filter((i) => i.checked).length;
  const totalEstime = items
    .filter((i) => !i.checked && i.montantEstime)
    .reduce((s, i) => s + (i.montantEstime ?? 0), 0);

  const FILTRES: { key: Filtre; label: string; count: number }[] = [
    { key: "a_acheter", label: "À acheter", count: countAAcheter },
    { key: "achetes", label: "Achetés", count: countAchetes },
    { key: "tous", label: "Tous", count: items.length },
  ];

  // Group by chantier for the "à acheter" view
  const grouped: { label: string; items: Achat[] }[] = [];
  if (filtre !== "tous") {
    const withChantier = filtered.filter((i) => i.chantierId);
    const withoutChantier = filtered.filter((i) => !i.chantierId);
    const chantierMap: Record<number, { label: string; items: Achat[] }> = {};
    for (const item of withChantier) {
      if (!chantierMap[item.chantierId!]) {
        chantierMap[item.chantierId!] = {
          label: item.chantierNom ?? `Chantier #${item.chantierId}`,
          items: [],
        };
      }
      chantierMap[item.chantierId!].items.push(item);
    }
    grouped.push(...Object.values(chantierMap));
    if (withoutChantier.length > 0) {
      grouped.push({ label: "Divers", items: withoutChantier });
    }
  } else {
    grouped.push({ label: "Tous les articles", items: filtered });
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4F5F7]">
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight flex items-center gap-2">
              <ShoppingBasket size={18} className="text-[#00365A]" />
              Liste de courses
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Articles à acheter — chantiers et divers
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#00365A] text-white text-sm font-medium px-4 py-1.5 hover:bg-[#004d80] transition-colors cursor-pointer"
          >
            <Plus size={14} /> Ajouter un article
          </button>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-px bg-gray-200 border border-gray-200">
          <div className="bg-white px-5 py-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">À acheter</p>
            <p className="font-mono text-2xl font-medium text-[#00365A]">{countAAcheter}</p>
          </div>
          <div className="bg-white px-5 py-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Montant estimé</p>
            <p className="font-mono text-2xl font-medium text-amber-700">
              {totalEstime > 0 ? fmt(totalEstime) : "—"}
            </p>
          </div>
          <div className="bg-white px-5 py-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Achetés</p>
            <p className="font-mono text-2xl font-medium text-emerald-700">{countAchetes}</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-px bg-gray-200 border border-gray-200 w-fit">
          {FILTRES.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFiltre(key)}
              className={`px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${
                filtre === key
                  ? "bg-[#00365A] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label}
              <span
                className={`ml-1.5 font-mono ${filtre === key ? "text-white/70" : "text-gray-400"}`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Grouped list */}
        <div className="space-y-4">
          {grouped.length === 0 && (
            <div className="bg-white border border-gray-200 px-5 py-10 text-center text-sm text-gray-400">
              {filtre === "a_acheter"
                ? "Tout est acheté ! 🎉"
                : "Aucun article dans ce filtre."}
            </div>
          )}
          {grouped.map((group) => (
            <div key={group.label} className="bg-white border border-gray-200">
              {grouped.length > 1 && (
                <div className="px-5 py-2.5 border-b border-gray-100 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
                    {group.label}
                  </p>
                </div>
              )}
              <ul className="divide-y divide-gray-50">
                {group.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggle(item.id)}
                      className={`w-5 h-5 border-2 flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
                        item.checked
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-gray-300 hover:border-[#00365A]"
                      }`}
                    >
                      {item.checked && <Check size={11} className="text-white" strokeWidth={3} />}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium leading-tight ${
                          item.checked ? "line-through text-gray-400" : "text-gray-900"
                        }`}
                      >
                        {item.titre}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                        {item.quantite && <span>{item.quantite}</span>}
                        {item.fournisseur && (
                          <>
                            <span className="text-gray-200">·</span>
                            <span>{item.fournisseur}</span>
                          </>
                        )}
                      </p>
                    </div>

                    {/* Montant */}
                    {item.montantEstime && (
                      <span
                        className={`font-mono text-sm font-medium flex-shrink-0 ${
                          item.checked ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {fmt(item.montantEstime)}
                      </span>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => remove(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all cursor-pointer flex-shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Modal ajout */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white shadow-xl w-[420px]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Ajouter un article</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Article *</label>
                <input
                  type="text"
                  value={form.titre}
                  onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
                  placeholder="Ex. : Visserie inox 6×60 mm"
                  className="w-full border border-gray-200 px-3 py-1.5 text-sm"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Quantité</label>
                  <input
                    type="text"
                    value={form.quantite}
                    onChange={(e) => setForm((f) => ({ ...f, quantite: e.target.value }))}
                    placeholder="Ex. : 3 rouleaux"
                    className="w-full border border-gray-200 px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">
                    Montant estimé (€)
                  </label>
                  <input
                    type="text"
                    value={form.montantEstime}
                    onChange={(e) => setForm((f) => ({ ...f, montantEstime: e.target.value }))}
                    placeholder="Ex. : 150"
                    className="w-full border border-gray-200 px-3 py-1.5 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Fournisseur</label>
                <input
                  type="text"
                  value={form.fournisseur}
                  onChange={(e) => setForm((f) => ({ ...f, fournisseur: e.target.value }))}
                  placeholder="Ex. : Tout Faire Auxerre"
                  className="w-full border border-gray-200 px-3 py-1.5 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowForm(false)}
                className="text-sm px-4 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleAdd}
                className="text-sm px-4 py-1.5 bg-[#00365A] text-white hover:bg-[#004d80] cursor-pointer font-medium"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
