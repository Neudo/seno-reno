import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  CheckSquare2,
  ChevronDown,
  ChevronUp,
  MinusSquare,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Square,
  Trash2,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/features/auth/context/AuthProvider";
import {
  createRoutineItem,
  deleteRoutineItem,
  getRoutineSnapshot,
  resetRoutineDay,
  toggleRoutineItemCompletion,
  type RoutineCategory,
  type RoutineItem,
} from "@/features/routine/api/routine-api";
import { cn } from "@/shared/lib/utils";

function TaskRow({
  completed,
  onDelete,
  onToggle,
  task,
}: {
  completed: boolean;
  onDelete?: () => void;
  onToggle: () => void;
  task: RoutineItem;
}) {
  const taskInputId = `routine-task-${task.id}`;

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-4 py-2.5 transition-colors",
        completed ? "opacity-40" : "hover:bg-gray-50",
        task.sourceTag && !completed && "bg-blue-50/30",
      )}
    >
      <input
        aria-label={
          completed
            ? "Marquer " + task.title + " comme non terminée"
            : "Terminer " + task.title
        }
        checked={completed}
        className="peer sr-only"
        id={taskInputId}
        onChange={onToggle}
        type="checkbox"
      />
      <label
        className="mt-px shrink-0 cursor-pointer text-gray-300 transition-colors hover:text-[#00365A] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#00365A]"
        htmlFor={taskInputId}
      >
        {completed ? (
          <CheckSquare2
            aria-hidden="true"
            className="size-[15px] text-[#00365A]"
          />
        ) : (
          <Square aria-hidden="true" className="size-[15px]" />
        )}
      </label>
      <label
        className={cn(
          "flex-1 cursor-pointer text-sm leading-snug",
          completed
            ? "text-gray-400 line-through"
            : task.isUrgent
              ? "font-medium text-gray-900"
              : "text-gray-800",
        )}
        htmlFor={taskInputId}
      >
        {task.title}
      </label>
      <div className="flex shrink-0 items-center gap-2">
        {task.sourceTag && !completed ? (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 border px-1.5 py-0.5 text-xs font-medium",
              task.isUrgent
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-[#00365A]/20 bg-[#E8F0F6] text-[#00365A]",
            )}
          >
            <Zap aria-hidden="true" className="size-2.5" />
            {task.sourceTag}
          </span>
        ) : null}
        {task.isCustom && onDelete ? (
          <button
            aria-label={"Supprimer " + task.title}
            className="cursor-pointer p-1 text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
            onClick={onDelete}
            type="button"
          >
            <Trash2 aria-hidden="true" className="size-3" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function RoutineLoading() {
  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-[#F4F5F7]">
      <div className="mx-auto max-w-3xl space-y-4 px-6 py-6">
        <div className="h-24 animate-pulse border border-gray-200 bg-white" />
        <div className="h-48 animate-pulse border border-gray-200 bg-white" />
        <div className="h-48 animate-pulse border border-gray-200 bg-white" />
      </div>
    </main>
  );
}

export function RoutineChecklist() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [collapsedSectionIds, setCollapsedSectionIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const routineQuery = useQuery({
    enabled: Boolean(user),
    queryFn: getRoutineSnapshot,
    queryKey: ["routine", user?.id],
  });

  const invalidateRoutine = async () => {
    await queryClient.invalidateQueries({ queryKey: ["routine", user?.id] });
  };

  const completionMutation = useMutation({
    mutationFn: toggleRoutineItemCompletion,
    onSuccess: invalidateRoutine,
  });
  const createItemMutation = useMutation({
    mutationFn: createRoutineItem,
    onSuccess: invalidateRoutine,
  });
  const deleteItemMutation = useMutation({
    mutationFn: deleteRoutineItem,
    onSuccess: invalidateRoutine,
  });
  const resetDayMutation = useMutation({
    mutationFn: resetRoutineDay,
    onSuccess: invalidateRoutine,
  });

  if (routineQuery.isPending) {
    return <RoutineLoading />;
  }

  if (routineQuery.isError || !routineQuery.data || !user) {
    return (
      <main className="min-w-0 flex-1 overflow-y-auto bg-[#F4F5F7]">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Impossible de charger la routine. Réessayez dans un instant.
          </div>
        </div>
      </main>
    );
  }

  const { completedItemIds, routineDate, sections } = routineQuery.data;
  const userId = user.id;
  const totalTasks = sections.reduce(
    (count, section) => count + section.items.length,
    0,
  );
  const completedTasks = completedItemIds.size;
  const progress =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const urgentTasks = sections.reduce(
    (count, section) =>
      count +
      section.items.filter(
        (item) => item.isUrgent && !completedItemIds.has(item.id),
      ).length,
    0,
  );

  function toggleCollapsedSection(sectionId: string) {
    setCollapsedSectionIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (nextIds.has(sectionId)) {
        nextIds.delete(sectionId);
      } else {
        nextIds.add(sectionId);
      }
      return nextIds;
    });
  }

  function toggleTask(item: RoutineItem) {
    void completionMutation.mutateAsync({
      completed: completedItemIds.has(item.id),
      itemId: item.id,
      routineDate,
      userId,
    });
  }

  function toggleAllTasks(section: RoutineCategory) {
    const allCompleted = section.items.every((item) =>
      completedItemIds.has(item.id),
    );
    void Promise.all(
      section.items.map((item) =>
        completionMutation.mutateAsync({
          completed: allCompleted,
          itemId: item.id,
          routineDate,
          userId,
        }),
      ),
    );
  }

  function addTask(section: RoutineCategory) {
    const title = drafts[section.id]?.trim();
    if (!title) {
      return;
    }

    void createItemMutation
      .mutateAsync({
        categoryId: section.id,
        position: section.items.length,
        title,
        userId,
      })
      .then(() => {
        setDrafts((currentDrafts) => ({ ...currentDrafts, [section.id]: "" }));
        setEditingSectionId(null);
      });
  }

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-[#F4F5F7]">
      <div className="mx-auto max-w-3xl space-y-4 px-6 py-6">
        <section
          aria-label="Progression de la routine"
          className="border border-gray-200 bg-white px-5 py-4"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="font-mono text-2xl font-semibold text-[#00365A]">
                {progress}%
              </span>
              <span className="ml-2 text-sm text-gray-500">
                de la routine complétée
              </span>
              <span className="ml-1 font-mono text-sm text-gray-400">
                ({completedTasks}/{totalTasks})
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {urgentTasks > 0 ? (
                <span className="flex items-center gap-1.5 border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700">
                  <Zap aria-hidden="true" className="size-[11px]" />
                  {urgentTasks} actions urgentes
                </span>
              ) : null}
              <button
                className="flex cursor-pointer items-center gap-1.5 border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-[#00365A] hover:text-[#00365A] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={resetDayMutation.isPending}
                onClick={() =>
                  void resetDayMutation.mutateAsync({
                    itemIds: sections.flatMap((section) =>
                      section.items.map((item) => item.id),
                    ),
                    routineDate,
                  })
                }
                type="button"
              >
                <RotateCcw aria-hidden="true" className="size-[11px]" />
                Réinitialiser
              </button>
              <button
                className="flex cursor-pointer items-center gap-1.5 border border-[#00365A] px-3 py-1.5 text-xs font-medium text-[#00365A] transition-colors hover:bg-[#00365A] hover:text-white"
                onClick={() => void navigate({ to: "/routine/parametres" })}
                type="button"
              >
                <SlidersHorizontal aria-hidden="true" className="size-[11px]" />
                Personnaliser
              </button>
            </div>
          </div>
          <div className="h-1.5 w-full bg-gray-100">
            <div
              className="h-full bg-[#00365A] transition-all duration-300"
              style={{ width: progress + "%" }}
            />
          </div>
        </section>

        {sections.length === 0 ? (
          <section className="border border-gray-200 bg-white px-5 py-6">
            <p className="text-sm font-medium text-gray-800">
              Aucune routine configurée.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Utilisez « Personnaliser » pour ajouter vos catégories et vos
              tâches.
            </p>
          </section>
        ) : null}

        {sections.map((section) => {
          const completedCount = section.items.filter((item) =>
            completedItemIds.has(item.id),
          ).length;
          const allCompleted =
            section.items.length > 0 && completedCount === section.items.length;
          const partiallyCompleted = completedCount > 0 && !allCompleted;
          const isCollapsed = collapsedSectionIds.has(section.id);
          const isAddingTask = editingSectionId === section.id;

          return (
            <section
              className="overflow-hidden border border-gray-200 bg-white"
              key={section.id}
            >
              <div
                className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 transition-colors hover:bg-gray-50"
                style={{ borderLeft: "3px solid " + section.color }}
              >
                <button
                  aria-label={
                    (allCompleted
                      ? "Tout décocher dans "
                      : "Tout cocher dans ") + section.name
                  }
                  className="shrink-0 cursor-pointer"
                  onClick={() => toggleAllTasks(section)}
                  type="button"
                >
                  {allCompleted ? (
                    <CheckSquare2
                      aria-hidden="true"
                      className="size-[15px] text-[#00365A]"
                    />
                  ) : partiallyCompleted ? (
                    <MinusSquare
                      aria-hidden="true"
                      className="size-[15px] text-gray-300"
                    />
                  ) : (
                    <Square
                      aria-hidden="true"
                      className="size-[15px] text-gray-300"
                    />
                  )}
                </button>
                <button
                  aria-expanded={!isCollapsed}
                  className="flex flex-1 cursor-pointer items-center gap-3 text-left"
                  onClick={() => toggleCollapsedSection(section.id)}
                  type="button"
                >
                  <span className="text-xs font-bold tracking-widest text-gray-700">
                    {section.name}
                  </span>
                  <span
                    className="border px-1.5 py-0.5 font-mono text-xs font-medium"
                    style={{
                      background: allCompleted
                        ? "#F0FDF4"
                        : section.color + "12",
                      borderColor: allCompleted
                        ? "#BBF7D0"
                        : section.color + "30",
                      color: allCompleted ? "#166534" : section.color,
                    }}
                  >
                    {completedCount}/{section.items.length}
                  </span>
                </button>
                <button
                  aria-label={
                    (isCollapsed ? "Déplier " : "Replier ") + section.name
                  }
                  className="shrink-0 cursor-pointer text-gray-400"
                  onClick={() => toggleCollapsedSection(section.id)}
                  type="button"
                >
                  {isCollapsed ? (
                    <ChevronDown aria-hidden="true" className="size-3.5" />
                  ) : (
                    <ChevronUp aria-hidden="true" className="size-3.5" />
                  )}
                </button>
              </div>

              {!isCollapsed ? (
                <>
                  <div className="divide-y divide-gray-50">
                    {section.items.map((item) => (
                      <TaskRow
                        completed={completedItemIds.has(item.id)}
                        key={item.id}
                        onDelete={
                          item.isCustom
                            ? () => void deleteItemMutation.mutateAsync(item.id)
                            : undefined
                        }
                        onToggle={() => toggleTask(item)}
                        task={item}
                      />
                    ))}
                  </div>
                  <div className="border-t border-gray-50 px-4 py-2">
                    {isAddingTask ? (
                      <div className="flex items-center gap-2">
                        <input
                          aria-label={"Nouvelle tâche dans " + section.name}
                          autoFocus
                          className="flex-1 border border-[#00365A] bg-white px-2.5 py-1.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
                          onChange={(event) =>
                            setDrafts((currentDrafts) => ({
                              ...currentDrafts,
                              [section.id]: event.target.value,
                            }))
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              addTask(section);
                            }
                            if (event.key === "Escape") {
                              setEditingSectionId(null);
                            }
                          }}
                          placeholder="Nouvelle tâche…"
                          type="text"
                          value={drafts[section.id] ?? ""}
                        />
                        <button
                          className="cursor-pointer bg-[#00365A] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#004A7A] disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={createItemMutation.isPending}
                          onClick={() => addTask(section)}
                          type="button"
                        >
                          Ajouter
                        </button>
                        <button
                          className="cursor-pointer border border-gray-200 px-3 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-50"
                          onClick={() => setEditingSectionId(null)}
                          type="button"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        className="flex cursor-pointer items-center gap-1.5 py-1 text-xs text-gray-400 transition-colors hover:text-[#00365A]"
                        onClick={() => setEditingSectionId(section.id)}
                        type="button"
                      >
                        <Plus aria-hidden="true" className="size-3" />
                        Ajouter une tâche
                      </button>
                    )}
                  </div>
                </>
              ) : null}
            </section>
          );
        })}
      </div>
    </main>
  );
}
