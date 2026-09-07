import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  RotateCcw,
  Square,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/features/auth/context/AuthProvider";
import {
  createRoutineCategory,
  createRoutineItem,
  deleteRoutineCategory,
  deleteRoutineItem,
  getRoutineSnapshot,
  resetRoutine,
  updateRoutineCategory,
  updateRoutineCategoryOrder,
  updateRoutineItemOrder,
  updateRoutineItemTitle,
  type RoutineCategory,
} from "@/features/routine/api/routine-api";
import { cn } from "@/shared/lib/utils";

const categoryColors = [
  "#00365A",
  "#1D4ED8",
  "#166534",
  "#6B21A8",
  "#B45309",
  "#0369A1",
  "#7C3AED",
  "#BE185D",
  "#B91C1C",
  "#0F766E",
  "#92400E",
  "#1E3A5F",
];

function moveItem<T>(items: T[], from: number, to: number) {
  if (to < 0 || to >= items.length) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(from, 1);
  nextItems.splice(to, 0, movedItem);
  return nextItems;
}

function EditableText({
  ariaLabel,
  className,
  onSave,
  value,
}: {
  ariaLabel: string;
  className?: string;
  onSave: (value: string) => void;
  value: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function save() {
    const nextValue = draft.trim();
    setIsEditing(false);
    if (nextValue && nextValue !== value) {
      onSave(nextValue);
    }
  }

  if (isEditing) {
    return (
      <input
        aria-label={ariaLabel}
        autoFocus
        className={cn(
          "border border-[#00365A] bg-white px-1 py-0.5 focus:outline-none",
          className,
        )}
        onBlur={save}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            save();
          }
          if (event.key === "Escape") {
            setDraft(value);
            setIsEditing(false);
          }
        }}
        value={draft}
      />
    );
  }

  return (
    <button
      aria-label={ariaLabel}
      className={cn(
        "group/edit inline-flex min-w-0 cursor-pointer items-center gap-1 text-left",
        className,
      )}
      onClick={() => {
        setDraft(value);
        setIsEditing(true);
      }}
      type="button"
    >
      <span className="truncate">{value}</span>
      <Pencil className="size-3 shrink-0 text-gray-300 opacity-0 transition-opacity group-hover/edit:opacity-100" />
    </button>
  );
}

function ColorPicker({
  color,
  onChange,
}: {
  color: string;
  onChange: (color: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        aria-label="Changer la couleur de la catégorie"
        className="size-6 cursor-pointer border border-gray-200 p-0.5"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="block size-full" style={{ backgroundColor: color }} />
      </button>
      {isOpen ? (
        <div className="absolute z-10 mt-1 grid w-36 grid-cols-4 gap-1 border border-gray-200 bg-white p-2 shadow-sm">
          {categoryColors.map((candidate) => (
            <button
              aria-label={"Choisir " + candidate}
              className="flex size-6 cursor-pointer items-center justify-center border border-transparent"
              key={candidate}
              onClick={() => {
                onChange(candidate);
                setIsOpen(false);
              }}
              style={{ backgroundColor: candidate }}
              type="button"
            >
              {candidate === color ? (
                <Check aria-hidden="true" className="size-3 text-white" />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RoutineSettingsLoading() {
  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-[#F4F5F7]">
      <div className="mx-auto max-w-3xl space-y-4 px-6 py-6">
        <div className="h-20 animate-pulse border border-gray-200 bg-white" />
        <div className="h-64 animate-pulse border border-gray-200 bg-white" />
      </div>
    </main>
  );
}

export function RoutineSettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [addingItemInCategoryId, setAddingItemInCategoryId] = useState<
    string | null
  >(null);
  const [itemDraft, setItemDraft] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState("");
  const [categoryColor, setCategoryColor] = useState(categoryColors[0]);

  const routineQuery = useQuery({
    enabled: Boolean(user),
    queryFn: getRoutineSnapshot,
    queryKey: ["routine", user?.id],
  });
  const invalidateRoutine = async () => {
    await queryClient.invalidateQueries({ queryKey: ["routine", user?.id] });
  };

  const createItemMutation = useMutation({
    mutationFn: createRoutineItem,
    onSuccess: invalidateRoutine,
  });
  const updateItemMutation = useMutation({
    mutationFn: updateRoutineItemTitle,
    onSuccess: invalidateRoutine,
  });
  const deleteItemMutation = useMutation({
    mutationFn: deleteRoutineItem,
    onSuccess: invalidateRoutine,
  });
  const createCategoryMutation = useMutation({
    mutationFn: createRoutineCategory,
    onSuccess: invalidateRoutine,
  });
  const updateCategoryMutation = useMutation({
    mutationFn: updateRoutineCategory,
    onSuccess: invalidateRoutine,
  });
  const deleteCategoryMutation = useMutation({
    mutationFn: deleteRoutineCategory,
    onSuccess: invalidateRoutine,
  });
  const categoryOrderMutation = useMutation({
    mutationFn: updateRoutineCategoryOrder,
    onSuccess: invalidateRoutine,
  });
  const itemOrderMutation = useMutation({
    mutationFn: updateRoutineItemOrder,
    onSuccess: invalidateRoutine,
  });
  const resetRoutineMutation = useMutation({
    mutationFn: resetRoutine,
    onSuccess: invalidateRoutine,
  });

  if (routineQuery.isPending) {
    return <RoutineSettingsLoading />;
  }

  if (routineQuery.isError || !routineQuery.data || !user) {
    return (
      <main className="min-w-0 flex-1 overflow-y-auto bg-[#F4F5F7]">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Impossible de charger les paramètres de la routine.
          </div>
        </div>
      </main>
    );
  }

  const { sections } = routineQuery.data;
  const userId = user.id;
  const permanentTaskCount = sections.reduce(
    (count, section) =>
      count + section.items.filter((item) => item.isPermanent).length,
    0,
  );

  function addPermanentItem(category: RoutineCategory) {
    const title = itemDraft.trim();
    if (!title) {
      return;
    }

    void createItemMutation
      .mutateAsync({
        categoryId: category.id,
        position: category.items.length,
        title,
        userId,
      })
      .then(() => {
        setAddingItemInCategoryId(null);
        setItemDraft("");
      });
  }

  function addCategory() {
    const name = categoryDraft.trim();
    if (!name) {
      return;
    }

    void createCategoryMutation
      .mutateAsync({
        color: categoryColor,
        name,
        position: sections.length,
        userId,
      })
      .then(() => {
        setCategoryDraft("");
        setCategoryColor(categoryColors[0]);
        setIsAddingCategory(false);
      });
  }

  function moveCategory(from: number, direction: -1 | 1) {
    const orderedCategories = moveItem(sections, from, from + direction);
    if (orderedCategories === sections) {
      return;
    }
    void categoryOrderMutation.mutateAsync(
      orderedCategories.map((category) => category.id),
    );
  }

  function movePermanentItem(
    category: RoutineCategory,
    from: number,
    direction: -1 | 1,
  ) {
    const permanentItems = category.items.filter((item) => item.isPermanent);
    const orderedItems = moveItem(permanentItems, from, from + direction);
    if (orderedItems === permanentItems) {
      return;
    }
    const automaticItems = category.items.filter((item) => !item.isPermanent);
    void itemOrderMutation.mutateAsync(
      [...orderedItems, ...automaticItems].map((item) => item.id),
    );
  }

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-[#F4F5F7]">
      <div className="mx-auto max-w-3xl space-y-4 px-6 py-6">
        <section className="flex flex-wrap items-center justify-between gap-4 border border-gray-200 bg-white px-5 py-4">
          <div>
            <h2 className="text-sm font-bold tracking-widest text-gray-800 uppercase">
              Personnalisation de la routine
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              {sections.length} catégories · {permanentTaskCount} tâches
              permanentes
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="flex cursor-pointer items-center gap-1.5 border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={resetRoutineMutation.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    "Réinitialiser la routine par défaut ? Toutes vos modifications seront perdues.",
                  )
                ) {
                  void resetRoutineMutation.mutateAsync(
                    sections.map((section) => section.id),
                  );
                }
              }}
              type="button"
            >
              <RotateCcw aria-hidden="true" className="size-3" />
              Réinitialiser
            </button>
            <button
              className="cursor-pointer bg-[#00365A] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#004A7A]"
              onClick={() => void navigate({ to: "/routine" })}
              type="button"
            >
              ← Retour à la routine
            </button>
          </div>
        </section>

        {sections.map((category, categoryIndex) => {
          const permanentItems = category.items.filter(
            (item) => item.isPermanent,
          );
          const isAddingItem = addingItemInCategoryId === category.id;

          return (
            <section
              className="overflow-visible border border-gray-200 bg-white"
              key={category.id}
            >
              <div
                className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3"
                style={{ borderLeft: "3px solid " + category.color }}
              >
                <div className="flex flex-col">
                  <button
                    aria-label={"Monter " + category.name}
                    className="cursor-pointer text-gray-300 transition-colors hover:text-[#00365A] disabled:cursor-not-allowed disabled:opacity-30"
                    disabled={categoryIndex === 0}
                    onClick={() => moveCategory(categoryIndex, -1)}
                    type="button"
                  >
                    <ChevronUp aria-hidden="true" className="size-3" />
                  </button>
                  <button
                    aria-label={"Descendre " + category.name}
                    className="cursor-pointer text-gray-300 transition-colors hover:text-[#00365A] disabled:cursor-not-allowed disabled:opacity-30"
                    disabled={categoryIndex === sections.length - 1}
                    onClick={() => moveCategory(categoryIndex, 1)}
                    type="button"
                  >
                    <ChevronDown aria-hidden="true" className="size-3" />
                  </button>
                </div>
                <ColorPicker
                  color={category.color}
                  onChange={(color) =>
                    void updateCategoryMutation.mutateAsync({
                      categoryId: category.id,
                      color,
                    })
                  }
                />
                <div className="min-w-0 flex-1">
                  <EditableText
                    ariaLabel={"Renommer " + category.name}
                    className="max-w-full text-xs font-bold tracking-widest text-gray-700 uppercase"
                    onSave={(name) =>
                      void updateCategoryMutation.mutateAsync({
                        categoryId: category.id,
                        name,
                      })
                    }
                    value={category.name}
                  />
                  <p className="mt-0.5 text-xs text-gray-400">
                    {permanentItems.length} tâche
                    {permanentItems.length > 1 ? "s" : ""} permanente
                    {permanentItems.length > 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  aria-label={"Supprimer la catégorie " + category.name}
                  className="cursor-pointer p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                  onClick={() => {
                    if (
                      window.confirm(
                        'Supprimer la catégorie "' +
                          category.name +
                          '" et toutes ses tâches ?',
                      )
                    ) {
                      void deleteCategoryMutation.mutateAsync(category.id);
                    }
                  }}
                  type="button"
                >
                  <Trash2 aria-hidden="true" className="size-3.5" />
                </button>
              </div>

              <div className="divide-y divide-gray-50">
                {permanentItems.map((item, itemIndex) => (
                  <div
                    className="group flex items-center gap-3 px-4 py-2.5"
                    key={item.id}
                  >
                    <div className="flex flex-col">
                      <button
                        aria-label={"Monter " + item.title}
                        className="cursor-pointer text-gray-300 transition-colors hover:text-[#00365A] disabled:cursor-not-allowed disabled:opacity-30"
                        disabled={itemIndex === 0}
                        onClick={() =>
                          movePermanentItem(category, itemIndex, -1)
                        }
                        type="button"
                      >
                        <ChevronUp aria-hidden="true" className="size-3" />
                      </button>
                      <button
                        aria-label={"Descendre " + item.title}
                        className="cursor-pointer text-gray-300 transition-colors hover:text-[#00365A] disabled:cursor-not-allowed disabled:opacity-30"
                        disabled={itemIndex === permanentItems.length - 1}
                        onClick={() =>
                          movePermanentItem(category, itemIndex, 1)
                        }
                        type="button"
                      >
                        <ChevronDown aria-hidden="true" className="size-3" />
                      </button>
                    </div>
                    <Square
                      aria-hidden="true"
                      className="size-3.5 shrink-0 text-gray-300"
                    />
                    <EditableText
                      ariaLabel={"Modifier " + item.title}
                      className="flex-1 text-sm text-gray-700"
                      onSave={(title) =>
                        void updateItemMutation.mutateAsync({
                          itemId: item.id,
                          title,
                        })
                      }
                      value={item.title}
                    />
                    <button
                      aria-label={"Supprimer " + item.title}
                      className="cursor-pointer p-1.5 text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                      onClick={() =>
                        void deleteItemMutation.mutateAsync(item.id)
                      }
                      type="button"
                    >
                      <Trash2 aria-hidden="true" className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 px-4 py-2.5">
                {isAddingItem ? (
                  <div className="flex items-center gap-2">
                    <input
                      aria-label={"Nouvelle tâche dans " + category.name}
                      autoFocus
                      className="flex-1 border border-[#00365A] px-2.5 py-1.5 text-sm placeholder:text-gray-400 focus:outline-none"
                      onChange={(event) => setItemDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          addPermanentItem(category);
                        }
                        if (event.key === "Escape") {
                          setAddingItemInCategoryId(null);
                          setItemDraft("");
                        }
                      }}
                      placeholder="Intitulé de la tâche…"
                      value={itemDraft}
                    />
                    <button
                      className="cursor-pointer bg-[#00365A] px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={createItemMutation.isPending}
                      onClick={() => addPermanentItem(category)}
                      type="button"
                    >
                      Ajouter
                    </button>
                    <button
                      className="cursor-pointer border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
                      onClick={() => {
                        setAddingItemInCategoryId(null);
                        setItemDraft("");
                      }}
                      type="button"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    className="flex cursor-pointer items-center gap-1.5 py-1 text-xs text-gray-400 transition-colors hover:text-[#00365A]"
                    onClick={() => {
                      setAddingItemInCategoryId(category.id);
                      setItemDraft("");
                    }}
                    type="button"
                  >
                    <Plus aria-hidden="true" className="size-3" />
                    Ajouter une tâche permanente
                  </button>
                )}
              </div>
            </section>
          );
        })}

        {isAddingCategory ? (
          <section className="border border-dashed border-[#00365A]/40 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <input
                aria-label="Nom de la nouvelle catégorie"
                autoFocus
                className="min-w-48 flex-1 border border-[#00365A] px-2.5 py-1.5 text-sm placeholder:text-gray-400 focus:outline-none"
                onChange={(event) => setCategoryDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    addCategory();
                  }
                  if (event.key === "Escape") {
                    setIsAddingCategory(false);
                    setCategoryDraft("");
                  }
                }}
                placeholder="Nom de la catégorie…"
                value={categoryDraft}
              />
              <div className="flex flex-wrap gap-1">
                {categoryColors.map((color) => (
                  <button
                    aria-label={"Choisir " + color}
                    className={cn(
                      "flex size-6 cursor-pointer items-center justify-center border",
                      color === categoryColor
                        ? "border-gray-900"
                        : "border-transparent",
                    )}
                    key={color}
                    onClick={() => setCategoryColor(color)}
                    style={{ backgroundColor: color }}
                    type="button"
                  >
                    {color === categoryColor ? (
                      <Check aria-hidden="true" className="size-3 text-white" />
                    ) : null}
                  </button>
                ))}
              </div>
              <button
                className="cursor-pointer bg-[#00365A] px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={createCategoryMutation.isPending}
                onClick={addCategory}
                type="button"
              >
                Ajouter
              </button>
              <button
                className="cursor-pointer border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
                onClick={() => {
                  setIsAddingCategory(false);
                  setCategoryDraft("");
                }}
                type="button"
              >
                Annuler
              </button>
            </div>
          </section>
        ) : (
          <button
            className="flex w-full cursor-pointer items-center justify-center gap-2 border border-dashed border-gray-300 bg-white px-4 py-4 text-xs font-medium text-gray-500 transition-colors hover:border-[#00365A] hover:text-[#00365A]"
            onClick={() => setIsAddingCategory(true)}
            type="button"
          >
            <Plus aria-hidden="true" className="size-3.5" />
            Ajouter une catégorie
          </button>
        )}
      </div>
    </main>
  );
}
