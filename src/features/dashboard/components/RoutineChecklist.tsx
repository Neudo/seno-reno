import { useState } from "react";
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

import { cn } from "@/shared/lib/utils";

type Task = {
  id: string;
  label: string;
  auto?: boolean;
  autoTag?: string;
  autoUrgent?: boolean;
  custom?: boolean;
};

type Section = {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
};

const routineSections: Section[] = [
  {
    id: "agenda",
    title: "AGENDA",
    color: "#00365A",
    tasks: [
      { id: "ag1", label: "Rendez-vous du jour" },
      { id: "ag2", label: "Contraintes horaires pro / perso" },
    ],
  },
  {
    id: "messagerie",
    title: "MESSAGERIE",
    color: "#1D4ED8",
    tasks: [
      { id: "mg1", label: "Emails" },
      { id: "mg2", label: "Répondeur téléphonique" },
      { id: "mg3", label: "Messenger" },
      { id: "mg4", label: "WIX (formulaires site)" },
      { id: "mg5", label: "Instagram (messages directs)" },
    ],
  },
  {
    id: "finances",
    title: "FINANCES",
    color: "#166534",
    tasks: [
      { id: "fi1", label: "Position des comptes" },
      { id: "fi2", label: "Facture acompte / solde ?" },
      { id: "fi3", label: "Paiement sous-traitant ?" },
      { id: "fi4", label: "Justificatifs → Charlotte" },
      {
        id: "auto-f1",
        label:
          "Facture acompte 30% à envoyer — Extension Bernard, Auxerre — 18 600 €",
        auto: true,
        autoTag: "Facture",
        autoUrgent: true,
      },
      {
        id: "auto-f2",
        label:
          "Paiement sous-traitant — Plomberie Fontaine — 4 000 € — échéance aujourd'hui — Chantier Renard",
        auto: true,
        autoTag: "Paiement ST",
        autoUrgent: true,
      },
      {
        id: "auto-f3",
        label:
          "Acompte intermédiaire à recevoir — Extension Moreau, Toucy — 20 400 €",
        auto: true,
        autoTag: "Encaissement",
      },
    ],
  },
  {
    id: "chantiers_cours",
    title: "CHANTIERS EN COURS",
    color: "#6B21A8",
    tasks: [
      { id: "cc1", label: "MAJ tableau Clients / Sous-traitants" },
      { id: "cc2", label: "Vérifier marge / coûts" },
      { id: "cc3", label: "Docs client / Sous-traitant" },
      { id: "cc4", label: "Suivi commandes" },
      {
        id: "auto-cc1",
        label:
          "Vérifier livraison parquet chêne — BL PB-2026-1142 — Appart T3 quai Marine, Auxerre",
        auto: true,
        autoTag: "Suivi commande",
      },
      {
        id: "auto-cc2",
        label:
          "Commande menuiseries extérieures en attente — Longère Aubert, Saint-Fargeau",
        auto: true,
        autoTag: "Suivi commande",
        autoUrgent: true,
      },
      {
        id: "auto-cc3",
        label:
          "Mettre à jour tableau de suivi — Rénovation Chabrier, Joigny (avancement 71%)",
        auto: true,
        autoTag: "MAJ tableau",
      },
    ],
  },
  {
    id: "chantiers_signes",
    title: "CHANTIERS SIGNÉS – NON COMMENCÉS",
    color: "#B45309",
    tasks: [
      { id: "cs1", label: "Faire / envoyer bon de commande sous-traitant" },
      { id: "cs2", label: "Construire tableau de suivi" },
      { id: "cs3", label: "Construire tableau de commandes" },
      {
        id: "auto-cs1",
        label:
          "Envoyer bon de commande Béton Yonne — Dalle extension Bernard, Auxerre — 8 000 €",
        auto: true,
        autoTag: "Bon de commande",
        autoUrgent: true,
      },
      {
        id: "auto-cs2",
        label:
          "Construire tableau de suivi — Maison Renard, Auxerre — démarrage 7 sept.",
        auto: true,
        autoTag: "Tableau suivi",
      },
    ],
  },
  {
    id: "devis",
    title: "DEVIS EN COURS",
    color: "#0369A1",
    tasks: [
      { id: "dv1", label: "Avancer / envoyer devis en cours" },
      {
        id: "auto-d1",
        label:
          "Relancer DEV-2026-0074 — Philippe Garnier, Migennes — électricité — 6 800 € — 19 jours sans réponse",
        auto: true,
        autoTag: "Relance devis",
        autoUrgent: true,
      },
      {
        id: "auto-d2",
        label:
          "Envoyer DEV-2026-0069 — Guy Lefebvre, Moutiers — plomberie — 7 400 € — finalisé le 25/08",
        auto: true,
        autoTag: "Devis à envoyer",
        autoUrgent: true,
      },
      {
        id: "auto-d3",
        label:
          "Mettre à jour devis — Faure, Sens — cuisine — choix matériaux en cours",
        auto: true,
        autoTag: "Devis à avancer",
      },
    ],
  },
  {
    id: "suivi_general",
    title: "TABLEAU SUIVI GÉNÉRAL SENO",
    color: "#7C3AED",
    tasks: [
      { id: "sg1", label: "Devis à commencer" },
      { id: "sg2", label: "Devis à relancer" },
      {
        id: "auto-sg1",
        label:
          "Relancer devis — DEV-2026-0065 — Corinne Thibaut, Chablis — SDB — 14 000 € — 5 jours sans réponse",
        auto: true,
        autoTag: "À relancer",
        autoUrgent: true,
      },
      {
        id: "auto-sg2",
        label:
          "Prospect à rappeler — Corinne Thibaut — rendez-vous à fixer début septembre",
        auto: true,
        autoTag: "Prospection",
      },
    ],
  },
  {
    id: "prospection",
    title: "PROSPECTION",
    color: "#BE185D",
    tasks: [
      { id: "pr1", label: "Architectes" },
      { id: "pr2", label: "Notaires" },
      { id: "pr3", label: "Agents immobiliers" },
      { id: "pr4", label: "Autres contacts" },
    ],
  },
  {
    id: "communication",
    title: "COMMUNICATION",
    color: "#B91C1C",
    tasks: [
      { id: "co1", label: "Instagram" },
      { id: "co2", label: "Facebook" },
      { id: "co3", label: "Site SENO" },
    ],
  },
];

function createSections() {
  return routineSections.map((section) => ({
    ...section,
    tasks: section.tasks.map((task) => ({ ...task })),
  }));
}

function TaskRow({
  completed,
  onDelete,
  onToggle,
  task,
}: {
  completed: boolean;
  onDelete?: () => void;
  onToggle: () => void;
  task: Task;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-4 py-2.5 transition-colors",
        completed ? "opacity-40" : "hover:bg-gray-50",
        task.auto && !completed && "bg-blue-50/30",
      )}
    >
      <button
        aria-label={
          completed
            ? "Marquer " + task.label + " comme non terminée"
            : "Terminer " + task.label
        }
        className="mt-px shrink-0 cursor-pointer text-gray-300 transition-colors hover:text-[#00365A]"
        onClick={onToggle}
        type="button"
      >
        {completed ? (
          <CheckSquare2
            aria-hidden="true"
            className="size-[15px] text-[#00365A]"
          />
        ) : (
          <Square aria-hidden="true" className="size-[15px]" />
        )}
      </button>
      <span
        className={cn(
          "flex-1 text-sm leading-snug",
          completed
            ? "text-gray-400 line-through"
            : task.autoUrgent
              ? "font-medium text-gray-900"
              : "text-gray-800",
        )}
      >
        {task.label}
      </span>
      <div className="flex shrink-0 items-center gap-2">
        {task.auto && task.autoTag && !completed ? (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 border px-1.5 py-0.5 text-xs font-medium",
              task.autoUrgent
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-[#00365A]/20 bg-[#E8F0F6] text-[#00365A]",
            )}
          >
            <Zap aria-hidden="true" className="size-2.5" />
            {task.autoTag}
          </span>
        ) : null}
        {task.custom && onDelete ? (
          <button
            aria-label={"Supprimer " + task.label}
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

export function RoutineChecklist() {
  const [sections, setSections] = useState(createSections);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [collapsedSectionIds, setCollapsedSectionIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const totalTasks = sections.reduce(
    (count, section) => count + section.tasks.length,
    0,
  );
  const completedTasks = completedTaskIds.size;
  const progress =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const urgentTasks = sections.reduce(
    (count, section) =>
      count +
      section.tasks.filter(
        (task) => task.autoUrgent && !completedTaskIds.has(task.id),
      ).length,
    0,
  );

  function toggleTask(taskId: string) {
    setCompletedTaskIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (nextIds.has(taskId)) {
        nextIds.delete(taskId);
      } else {
        nextIds.add(taskId);
      }
      return nextIds;
    });
  }

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

  function toggleAllTasks(section: Section) {
    const taskIds = section.tasks.map((task) => task.id);
    const allCompleted = taskIds.every((taskId) =>
      completedTaskIds.has(taskId),
    );

    setCompletedTaskIds((currentIds) => {
      const nextIds = new Set(currentIds);
      taskIds.forEach((taskId) => {
        if (allCompleted) {
          nextIds.delete(taskId);
        } else {
          nextIds.add(taskId);
        }
      });
      return nextIds;
    });
  }

  function addTask(sectionId: string) {
    const label = drafts[sectionId]?.trim();
    if (!label) {
      return;
    }

    setSections((currentSections) =>
      currentSections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              tasks: [
                ...section.tasks,
                { id: "custom-" + Date.now(), label, custom: true },
              ],
            }
          : section,
      ),
    );
    setDrafts((currentDrafts) => ({ ...currentDrafts, [sectionId]: "" }));
    setEditingSectionId(null);
  }

  function deleteTask(sectionId: string, taskId: string) {
    setSections((currentSections) =>
      currentSections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              tasks: section.tasks.filter((task) => task.id !== taskId),
            }
          : section,
      ),
    );
    setCompletedTaskIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.delete(taskId);
      return nextIds;
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
                className="flex cursor-pointer items-center gap-1.5 border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-[#00365A] hover:text-[#00365A]"
                onClick={() => setCompletedTaskIds(new Set())}
                type="button"
              >
                <RotateCcw aria-hidden="true" className="size-[11px]" />
                Réinitialiser
              </button>
              <button
                className="flex cursor-pointer items-center gap-1.5 border border-[#00365A] px-3 py-1.5 text-xs font-medium text-[#00365A] transition-colors hover:bg-[#00365A] hover:text-white"
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

        {sections.map((section) => {
          const completedCount = section.tasks.filter((task) =>
            completedTaskIds.has(task.id),
          ).length;
          const allCompleted =
            section.tasks.length > 0 && completedCount === section.tasks.length;
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
                      : "Tout cocher dans ") + section.title
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
                    {section.title}
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
                    {completedCount}/{section.tasks.length}
                  </span>
                </button>
                <button
                  aria-label={
                    (isCollapsed ? "Déplier " : "Replier ") + section.title
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
                    {section.tasks.map((task) => (
                      <TaskRow
                        completed={completedTaskIds.has(task.id)}
                        key={task.id}
                        onDelete={
                          task.custom
                            ? () => deleteTask(section.id, task.id)
                            : undefined
                        }
                        onToggle={() => toggleTask(task.id)}
                        task={task}
                      />
                    ))}
                  </div>
                  <div className="border-t border-gray-50 px-4 py-2">
                    {isAddingTask ? (
                      <div className="flex items-center gap-2">
                        <input
                          aria-label={"Nouvelle tâche dans " + section.title}
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
                              addTask(section.id);
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
                          className="cursor-pointer bg-[#00365A] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#004A7A]"
                          onClick={() => addTask(section.id)}
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
