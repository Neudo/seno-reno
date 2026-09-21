import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight,
  History,
  Percent,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/features/auth/context/AuthProvider";
import {
  applyPriceIncrease,
  createPriceCategory,
  createPriceItem,
  deletePriceItem,
  getPriceBase,
  getPriceItemHistory,
  priceItemTypes,
  updatePriceItem,
  type PriceBaseSnapshot,
  type PriceItem,
  type PriceItemType,
} from "@/features/prix/api/price-api";
import { PageCanvas } from "@/shared/components/app-shell/PageCanvas";
import { cn } from "@/shared/lib/utils";

type PriceDraft = {
  categoryName: string;
  code: string;
  comment: string;
  designation: string;
  id: string | null;
  includeInQuote: boolean;
  isActive: boolean;
  price: string;
  requiresAdjustment: boolean;
  type: PriceItemType;
  unit: string;
};

const typeLabels: Record<PriceItemType, string> = {
  COMMENT: "Commentaire",
  FIXED: "Forfait",
  PERCENTAGE: "Pourcentage",
  TO_ESTIMATE: "À chiffrer",
};

const priceFormatter = new Intl.NumberFormat("fr-FR", {
  currency: "EUR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency",
});

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function createDraft(item?: PriceItem, categoryName = ""): PriceDraft {
  return {
    categoryName,
    code: item?.code ?? "",
    comment: item?.comment ?? "",
    designation: item?.designation ?? "",
    id: item?.id ?? null,
    includeInQuote: item?.includeInQuote ?? true,
    isActive: item?.isActive ?? true,
    price: item?.price === null || item?.price === undefined ? "" : String(item.price),
    requiresAdjustment: item?.requiresAdjustment ?? false,
    type: item?.type ?? "FIXED",
    unit: item?.unit ?? "",
  };
}

function formatPrice(value: number | null, type: PriceItemType) {
  if (type === "TO_ESTIMATE") {
    return "À chiffrer";
  }

  if (value === null) {
    return "—";
  }

  return type === "PERCENTAGE"
    ? `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(value)} %`
    : priceFormatter.format(value);
}

function parsePrice(value: string) {
  if (!value.trim()) {
    return null;
  }

  const normalized = value.replace(/\s/g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function getFreshness(item: PriceItem) {
  if (item.requiresAdjustment) {
    return { className: "text-amber-700", label: "À ajuster" };
  }

  const elapsedDays =
    (Date.now() - new Date(item.updatedAt).getTime()) / (1000 * 60 * 60 * 24);

  return elapsedDays > 180
    ? { className: "text-slate-500", label: "À vérifier" }
    : { className: "text-emerald-700", label: "À jour" };
}

function PriceTypeBadge({ type }: { type: PriceItemType }) {
  return (
    <span
      className={cn(
        "inline-flex border px-2 py-1 text-[11px] font-medium",
        type === "FIXED" && "border-seno-700/20 bg-seno-50 text-seno-700",
        type === "PERCENTAGE" && "border-violet-200 bg-violet-50 text-violet-700",
        type === "TO_ESTIMATE" && "border-amber-200 bg-amber-50 text-amber-700",
        type === "COMMENT" && "border-slate-200 bg-slate-50 text-slate-600",
      )}
    >
      {typeLabels[type]}
    </span>
  );
}

function PriceDrawer({
  categories,
  draft,
  errorMessage,
  isSaving,
  onClose,
  onDelete,
  onSave,
  onUpdate,
}: {
  categories: PriceBaseSnapshot["categories"];
  draft: PriceDraft;
  errorMessage: string | null;
  isSaving: boolean;
  onClose: () => void;
  onDelete: () => void;
  onSave: () => void;
  onUpdate: (patch: Partial<PriceDraft>) => void;
}) {
  const historyQuery = useQuery({
    enabled: Boolean(draft.id),
    queryFn: () => getPriceItemHistory(draft.id!),
    queryKey: ["price-item-history", draft.id],
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Fermer la fiche"
        className="absolute inset-0 cursor-pointer bg-slate-950/35"
        onClick={onClose}
        type="button"
      />
      <aside
        aria-label={draft.id ? "Modifier une ligne de prix" : "Ajouter une ligne de prix"}
        className="relative flex h-[100dvh] w-full max-w-xl flex-col bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-seno-500">
              BASE DE PRIX
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-slate-900">
              {draft.id ? "Modifier la ligne" : "Nouvelle ligne"}
            </h2>
          </div>
          <button
            aria-label="Fermer"
            className="grid size-9 cursor-pointer place-items-center text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-[132px_1fr]">
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Code
              <input
                className="h-10 border border-slate-300 bg-white px-3 text-sm outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
                onChange={(event) => onUpdate({ code: event.target.value })}
                placeholder="Ex. PEI-001"
                required
                value={draft.code}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Catégorie
              <input
                className="h-10 border border-slate-300 bg-white px-3 text-sm outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
                list="price-categories"
                onChange={(event) => onUpdate({ categoryName: event.target.value })}
                placeholder="Ex. Peinture"
                required
                value={draft.categoryName}
              />
              <datalist id="price-categories">
                {categories.map((category) => (
                  <option key={category.id} value={category.name} />
                ))}
              </datalist>
            </label>
          </div>

          <label className="mt-4 grid gap-1.5 text-sm font-medium text-slate-700">
            Désignation
            <input
              className="h-10 border border-slate-300 bg-white px-3 text-sm outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
              onChange={(event) => onUpdate({ designation: event.target.value })}
              placeholder="Intitulé de la prestation"
              required
              value={draft.designation}
            />
          </label>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Type
              <select
                className="h-10 border border-slate-300 bg-white px-3 text-sm outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
                onChange={(event) =>
                  onUpdate({ type: event.target.value as PriceItemType })
                }
                value={draft.type}
              >
                {priceItemTypes.map((type) => (
                  <option key={type} value={type}>
                    {typeLabels[type]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Unité
              <input
                className="h-10 border border-slate-300 bg-white px-3 text-sm outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
                onChange={(event) => onUpdate({ unit: event.target.value })}
                placeholder="m², ml, u…"
                value={draft.unit}
              />
            </label>
          </div>

          <label className="mt-4 grid gap-1.5 text-sm font-medium text-slate-700">
            {draft.type === "PERCENTAGE" ? "Valeur (%)" : "Prix HT"}
            <input
              className="h-10 border border-slate-300 bg-white px-3 text-sm outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15 disabled:bg-slate-50"
              disabled={draft.type === "COMMENT" || draft.type === "TO_ESTIMATE"}
              inputMode="decimal"
              onChange={(event) => onUpdate({ price: event.target.value })}
              placeholder={draft.type === "PERCENTAGE" ? "0" : "0,00"}
              value={draft.price}
            />
          </label>

          <label className="mt-4 grid gap-1.5 text-sm font-medium text-slate-700">
            Note interne
            <textarea
              className="min-h-24 resize-y border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
              onChange={(event) => onUpdate({ comment: event.target.value })}
              placeholder="Précisions utiles pour l’équipe…"
              value={draft.comment}
            />
          </label>

          <div className="mt-5 grid gap-3 border-y border-slate-200 py-4">
            <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
              <input
                checked={draft.includeInQuote}
                className="size-4 accent-[#00365A]"
                onChange={(event) => onUpdate({ includeInQuote: event.target.checked })}
                type="checkbox"
              />
              Disponible pour le chiffrage
            </label>
            <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
              <input
                checked={draft.requiresAdjustment}
                className="size-4 accent-[#00365A]"
                onChange={(event) =>
                  onUpdate({ requiresAdjustment: event.target.checked })
                }
                type="checkbox"
              />
              Prix à ajuster / vérifier
            </label>
            <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
              <input
                checked={draft.isActive}
                className="size-4 accent-[#00365A]"
                onChange={(event) => onUpdate({ isActive: event.target.checked })}
                type="checkbox"
              />
              Ligne active
            </label>
          </div>

          {draft.id ? (
            <section className="mt-6">
              <div className="mb-3 flex items-center gap-2">
                <History aria-hidden="true" className="size-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Historique du prix
                </h3>
              </div>
              {historyQuery.isPending ? (
                <p className="text-sm text-slate-500">Chargement de l’historique…</p>
              ) : historyQuery.data?.length ? (
                <ol className="border-l border-slate-200 pl-4">
                  {historyQuery.data.map((entry) => (
                    <li className="pb-3 text-sm" key={entry.id}>
                      <p className="font-medium text-slate-800">
                        {entry.previousPrice === null
                          ? `Création · ${formatPrice(entry.nextPrice, draft.type)}`
                          : `${formatPrice(entry.previousPrice, draft.type)} → ${formatPrice(entry.nextPrice, draft.type)}`}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {dateFormatter.format(new Date(entry.changedAt))}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-slate-500">Aucun changement de prix.</p>
              )}
            </section>
          ) : null}
        </div>

        {errorMessage ? (
          <p
            className="mx-5 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        <footer className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
          {draft.id ? (
            <button
              className="flex cursor-pointer items-center gap-2 px-2 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
              disabled={isSaving}
              onClick={onDelete}
              type="button"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Supprimer
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button
              className="cursor-pointer border border-slate-300 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
              disabled={isSaving}
              onClick={onClose}
              type="button"
            >
              Annuler
            </button>
            <button
              className="cursor-pointer bg-seno-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-seno-800 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={
                isSaving ||
                !draft.code.trim() ||
                !draft.categoryName.trim() ||
                !draft.designation.trim()
              }
              onClick={onSave}
              type="button"
            >
              {isSaving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}

export function BasePrixPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [showInactive, setShowInactive] = useState(false);
  const [draft, setDraft] = useState<PriceDraft | null>(null);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkPercentage, setBulkPercentage] = useState("");
  const [bulkCategoryId, setBulkCategoryId] = useState("all");
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  const priceBaseQuery = useQuery({
    enabled: Boolean(user),
    queryFn: getPriceBase,
    queryKey: ["price-base", user?.id],
  });

  const invalidatePriceBase = async () => {
    await queryClient.invalidateQueries({ queryKey: ["price-base", user?.id] });
  };

  const saveMutation = useMutation({
    mutationFn: async (nextDraft: PriceDraft) => {
      if (!user || !priceBaseQuery.data) {
        throw new Error("Utilisateur non disponible.");
      }

      const price = parsePrice(nextDraft.price);
      if (
        nextDraft.price.trim() &&
        price === null &&
        nextDraft.type !== "COMMENT" &&
        nextDraft.type !== "TO_ESTIMATE"
      ) {
        throw new Error("Le prix doit être un nombre positif.");
      }

      const normalizedCategory = nextDraft.categoryName.trim();
      const category = priceBaseQuery.data.categories.find(
        (entry) =>
          entry.name.localeCompare(normalizedCategory, "fr", {
            sensitivity: "accent",
            usage: "search",
          }) === 0,
      );
      const resolvedCategory =
        category ??
        (await createPriceCategory({
          name: normalizedCategory,
          position: priceBaseQuery.data.categories.length,
          userId: user.id,
        }));

      const payload = {
        categoryId: resolvedCategory.id,
        code: nextDraft.code.trim(),
        comment: nextDraft.comment.trim(),
        designation: nextDraft.designation.trim(),
        includeInQuote: nextDraft.includeInQuote,
        isActive: nextDraft.isActive,
        price:
          nextDraft.type === "COMMENT" || nextDraft.type === "TO_ESTIMATE"
            ? null
            : price,
        requiresAdjustment: nextDraft.requiresAdjustment,
        type: nextDraft.type,
        unit: nextDraft.unit.trim(),
      };

      if (nextDraft.id) {
        await updatePriceItem({ ...payload, id: nextDraft.id });
      } else {
        await createPriceItem({ ...payload, userId: user.id });
      }
    },
    onSuccess: async () => {
      setDraft(null);
      await invalidatePriceBase();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePriceItem,
    onSuccess: async () => {
      setDraft(null);
      await invalidatePriceBase();
    },
  });

  const bulkMutation = useMutation({
    mutationFn: applyPriceIncrease,
    onSuccess: async (count) => {
      setBulkResult(
        `${count} ligne${count > 1 ? "s" : ""} forfaitaire${count > 1 ? "s" : ""} mise${count > 1 ? "s" : ""} à jour.`,
      );
      setBulkPercentage("");
      await invalidatePriceBase();
    },
  });

  if (priceBaseQuery.isPending) {
    return (
      <PageCanvas title="Base de prix">
        <div className="mt-5 h-64 animate-pulse border border-slate-200 bg-white" />
      </PageCanvas>
    );
  }

  if (priceBaseQuery.isError || !priceBaseQuery.data || !user) {
    return (
      <PageCanvas title="Base de prix">
        <div className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Impossible de charger la base de prix. Vérifie que la migration a bien
          été appliquée, puis réessaie.
        </div>
      </PageCanvas>
    );
  }

  const { categories, items } = priceBaseQuery.data;
  const normalizedSearch = search.trim().toLocaleLowerCase("fr-FR");
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const visibleItems = items.filter((item) => {
    const matchesCategory = categoryId === "all" || item.categoryId === categoryId;
    const matchesActive = showInactive || item.isActive;
    const haystack = `${item.code} ${item.designation} ${item.comment} ${categoryNames.get(item.categoryId) ?? ""}`.toLocaleLowerCase(
      "fr-FR",
    );
    return matchesCategory && matchesActive && haystack.includes(normalizedSearch);
  });

  const openItem = (item: PriceItem) => {
    saveMutation.reset();
    deleteMutation.reset();
    setDraft(createDraft(item, categoryNames.get(item.categoryId) ?? ""));
  };

  const submitBulkIncrease = () => {
    const percentage = parsePrice(bulkPercentage);
    if (percentage === null || percentage === 0) {
      return;
    }

    setBulkResult(null);
    bulkMutation.mutate({
      categoryId: bulkCategoryId === "all" ? null : bulkCategoryId,
      percentage,
    });
  };

  return (
    <PageCanvas title="Base de prix">
      <div className="mt-2 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <p className="max-w-2xl text-sm leading-6 text-slate-500">
          Référentiel unique des prestations et prix internes. Les modifications
          sont historisées et restent distinctes des devis Tolteck.
        </p>
        <button
          className="flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 bg-seno-700 px-4 text-sm font-medium text-white transition-colors hover:bg-seno-800"
          onClick={() => {
            saveMutation.reset();
            deleteMutation.reset();
            setDraft(createDraft());
          }}
          type="button"
        >
          <Plus aria-hidden="true" className="size-4" />
          Ajouter une ligne
        </button>
      </div>

      <section className="mt-5 border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_210px]">
            <label className="relative block">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
              />
              <input
                aria-label="Rechercher dans la base de prix"
                className="h-10 w-full border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Code, désignation, note…"
                value={search}
              />
            </label>
            <select
              aria-label="Filtrer par catégorie"
              className="h-10 border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
              onChange={(event) => setCategoryId(event.target.value)}
              value={categoryId}
            >
              <option value="all">Toutes les catégories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className={cn(
                "flex h-10 cursor-pointer items-center gap-2 border px-3 text-sm transition-colors",
                showInactive
                  ? "border-seno-700 bg-seno-50 text-seno-700"
                  : "border-slate-300 text-slate-600 hover:bg-slate-50",
              )}
              onClick={() => setShowInactive((current) => !current)}
              type="button"
            >
              <SlidersHorizontal aria-hidden="true" className="size-4" />
              Inactives
            </button>
            <button
              className="flex h-10 cursor-pointer items-center gap-2 border border-slate-300 px-3 text-sm text-slate-600 transition-colors hover:bg-slate-50"
              onClick={() => setIsBulkOpen((current) => !current)}
              type="button"
            >
              <Percent aria-hidden="true" className="size-4" />
              Hausse groupée
            </button>
          </div>
        </div>

        {isBulkOpen ? (
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-end">
            <label className="grid gap-1.5 text-sm font-medium text-slate-700 sm:w-48">
              Augmentation (%)
              <input
                className="h-10 border border-slate-300 bg-white px-3 text-sm outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
                inputMode="decimal"
                min="0"
                onChange={(event) => setBulkPercentage(event.target.value)}
                placeholder="Ex. 4,5"
                value={bulkPercentage}
              />
            </label>
            <label className="grid flex-1 gap-1.5 text-sm font-medium text-slate-700">
              Cible
              <select
                className="h-10 border border-slate-300 bg-white px-3 text-sm outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
                onChange={(event) => setBulkCategoryId(event.target.value)}
                value={bulkCategoryId}
              >
                <option value="all">Tous les forfaits actifs</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="h-10 cursor-pointer bg-seno-700 px-4 text-sm font-medium text-white transition-colors hover:bg-seno-800 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={bulkMutation.isPending || !bulkPercentage.trim()}
              onClick={submitBulkIncrease}
              type="button"
            >
              {bulkMutation.isPending ? "Application…" : "Appliquer"}
            </button>
            {bulkResult ? (
              <p className="text-sm text-emerald-700">{bulkResult}</p>
            ) : null}
            {bulkMutation.isError ? (
              <p className="text-sm text-red-700" role="alert">
                {bulkMutation.error instanceof Error
                  ? bulkMutation.error.message
                  : "La hausse n’a pas pu être appliquée."}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full border-collapse text-left">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] tracking-[0.1em] text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Prestation</th>
                <th className="px-4 py-3 font-semibold">Catégorie</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Unité</th>
                <th className="px-4 py-3 text-right font-semibold">Prix HT</th>
                <th className="px-4 py-3 font-semibold">Suivi</th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleItems.map((item) => {
                const freshness = getFreshness(item);
                return (
                  <tr
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-slate-50",
                      !item.isActive && "bg-slate-50/70 opacity-55",
                    )}
                    key={item.id}
                    onClick={() => openItem(item)}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium text-slate-500">
                      {item.code}
                    </td>
                    <td className="max-w-80 px-4 py-3">
                      <p className="font-medium text-slate-800">{item.designation}</p>
                      {item.comment ? (
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {item.comment}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {categoryNames.get(item.categoryId) ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <PriceTypeBadge type={item.type} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {item.unit || "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-800">
                      {formatPrice(item.price, item.type)}
                    </td>
                    <td className="px-4 py-3">
                      <p className={cn("text-xs font-medium", freshness.className)}>
                        {freshness.label}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {dateFormatter.format(new Date(item.updatedAt))}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight aria-hidden="true" className="size-4 text-slate-400" />
                    </td>
                  </tr>
                );
              })}
              {visibleItems.length === 0 ? (
                <tr>
                  <td className="px-4 py-14 text-center text-sm text-slate-500" colSpan={8}>
                    {items.length === 0
                      ? "Aucune ligne dans la base de prix. Ajoute la première prestation."
                      : "Aucune prestation ne correspond aux filtres."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <footer className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
          <span>
            {visibleItems.length} ligne{visibleItems.length > 1 ? "s" : ""} affichée
            {visibleItems.length > 1 ? "s" : ""}
          </span>
          <span>Les prix sont exprimés hors taxes.</span>
        </footer>
      </section>

      {draft ? (
        <PriceDrawer
          categories={categories}
          draft={draft}
          errorMessage={
            saveMutation.error instanceof Error
              ? saveMutation.error.message
              : deleteMutation.error instanceof Error
                ? deleteMutation.error.message
                : null
          }
          isSaving={saveMutation.isPending || deleteMutation.isPending}
          onClose={() => setDraft(null)}
          onDelete={() => {
            if (draft.id && window.confirm("Supprimer définitivement cette ligne ?")) {
              deleteMutation.mutate(draft.id);
            }
          }}
          onSave={() => saveMutation.mutate(draft)}
          onUpdate={(patch) => setDraft((current) => (current ? { ...current, ...patch } : current))}
        />
      ) : null}
    </PageCanvas>
  );
}
