import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  ChevronRight,
  Lightbulb,
  Megaphone,
  Plus,
  Search,
  UserRoundPlus,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  type ClientKind,
  type CommunicationInput,
  type CommunicationStatus,
  type EventInput,
  type EventStatus,
  type IdeaInput,
  type InteractionType,
  type ProspectInput,
  type ProspectInteraction,
  type ProspectPriority,
  type ProspectRecord,
  type ProspectStatus,
  type ProspectingCommunication,
  type ProspectingEvent,
  type ProspectIdea,
  type SourceKind,
  communicationStatuses,
  convertProspectIdeaToClient,
  convertProspectToClient,
  eventStatuses,
  getClientProspectingSnapshot,
  interactionTypes,
  prospectPriorities,
  prospectStatuses,
  recordProspectInteraction,
  saveProspect,
  saveProspectIdea,
  saveProspectingCommunication,
  saveProspectingEvent,
  sourceKinds,
} from "@/features/clients-prospects/api/client-prospecting-api";
import {
  ContactDetails,
  Drawer,
  FieldLabel,
  PriorityDot,
  ProspectStatusBadge,
  formatDate,
  getLocation,
  getProspectName,
  inputClassName,
  priorityLabels,
  prospectStatusLabels,
  sourceLabels,
  textareaClassName,
} from "@/features/clients-prospects/components/client-prospecting-ui";
import { useAuth } from "@/features/auth/context/AuthProvider";
import { DataListPage } from "@/shared/components/app-shell/DataListPage";
import { PageCanvas } from "@/shared/components/app-shell/PageCanvas";
import { cn } from "@/shared/lib/utils";

type ProspectTab = "CONTACTS" | "EVENTS" | "COMMUNICATIONS" | "IDEAS";
type ContactQuickFilter = "ALL" | "LATE" | "NEEDS_CONTACT" | "NO_FOLLOW_UP";
type ProspectDraft = ProspectInput & {
  id?: string;
  interactionNote: string;
  interactionType: InteractionType;
  recordInteraction: boolean;
};
type EventDraft = EventInput & { id?: string };
type CommunicationDraft = CommunicationInput & { id?: string };
type IdeaDraft = IdeaInput & { id?: string };

const tabs: Array<{ id: ProspectTab; label: string }> = [
  { id: "CONTACTS", label: "Contacts" },
  { id: "EVENTS", label: "Événements & lieux" },
  { id: "COMMUNICATIONS", label: "Communication & réseaux" },
  { id: "IDEAS", label: "Idées prospects" },
];

const eventStatusLabels: Record<EventStatus, string> = {
  ACTIVE: "En cours",
  CANCELLED: "Annulé",
  COMPLETED: "Terminé",
  PLANNED: "Prévu",
};

const communicationStatusLabels: Record<CommunicationStatus, string> = {
  ACTIVE: "En cours",
  COMPLETED: "Terminé",
  PAUSED: "En pause",
  PLANNED: "Prévu",
};

const interactionLabels: Record<InteractionType, string> = {
  CALL: "Appel",
  EMAIL: "Email",
  MEETING: "RDV",
  MESSAGE: "Message",
  NOTE: "Note",
  OTHER: "Autre",
};

function createProspectDraft(prospect?: ProspectRecord): ProspectDraft {
  return {
    city: prospect?.city ?? "",
    companyName: prospect?.companyName ?? "",
    email: prospect?.email ?? "",
    firstName: prospect?.firstName ?? "",
    id: prospect?.id,
    interactionNote: "",
    interactionType: "NOTE",
    kind: prospect?.kind ?? "PERSON",
    lastName: prospect?.lastName ?? "",
    nextFollowUpAt: prospect?.nextFollowUpAt ?? null,
    notes: prospect?.notes ?? "",
    originCommunicationId: prospect?.originCommunicationId ?? null,
    originEventId: prospect?.originEventId ?? null,
    phone: prospect?.phone ?? "",
    postalCode: prospect?.postalCode ?? "",
    priority: prospect?.priority ?? "MEDIUM",
    recordInteraction: false,
    sourceDetail: prospect?.sourceDetail ?? "",
    sourceKind: prospect?.sourceKind ?? "OTHER",
    status: prospect?.status ?? "NEW",
  };
}

function createEventDraft(event?: ProspectingEvent): EventDraft {
  return {
    comment: event?.comment ?? "",
    eventDate: event?.eventDate ?? null,
    id: event?.id,
    location: event?.location ?? "",
    name: event?.name ?? "",
    status: event?.status ?? "PLANNED",
    type: event?.type ?? "",
  };
}

function createCommunicationDraft(
  communication?: ProspectingCommunication,
): CommunicationDraft {
  return {
    channel: communication?.channel ?? "",
    comment: communication?.comment ?? "",
    id: communication?.id,
    name: communication?.name ?? "",
    periodLabel: communication?.periodLabel ?? "",
    status: communication?.status ?? "PLANNED",
  };
}

function createIdeaDraft(idea?: ProspectIdea): IdeaDraft {
  return {
    city: idea?.city ?? "",
    email: idea?.email ?? "",
    id: idea?.id,
    name: idea?.name ?? "",
    note: idea?.note ?? "",
    phone: idea?.phone ?? "",
  };
}

function ProspectForm({
  communications,
  draft,
  events,
  interactions,
  onChange,
}: {
  communications: ProspectingCommunication[];
  draft: ProspectDraft;
  events: ProspectingEvent[];
  interactions: ProspectInteraction[];
  onChange: (draft: ProspectDraft) => void;
}) {
  const update = <Key extends keyof ProspectDraft>(
    key: Key,
    value: ProspectDraft[Key],
  ) => {
    onChange({ ...draft, [key]: value });
  };

  return (
    <div className="grid gap-5">
      <section className="grid gap-3">
        <p className="text-xs font-semibold tracking-[0.13em] text-slate-500 uppercase">
          Contact
        </p>
        <div className="flex border border-slate-300">
          {(["PERSON", "COMPANY"] as ClientKind[]).map((kind) => (
            <button
              className={cn(
                "flex-1 cursor-pointer px-3 py-2 text-sm",
                draft.kind === kind
                  ? "bg-seno-700 text-white"
                  : "text-slate-600 hover:bg-slate-50",
              )}
              key={kind}
              onClick={() => update("kind", kind)}
              type="button"
            >
              {kind === "PERSON" ? "Particulier" : "Entreprise"}
            </button>
          ))}
        </div>
        {draft.kind === "PERSON" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldLabel label="Prénom">
              <input
                className={inputClassName}
                onChange={(event) => update("firstName", event.target.value)}
                value={draft.firstName}
              />
            </FieldLabel>
            <FieldLabel label="Nom *">
              <input
                className={inputClassName}
                onChange={(event) => update("lastName", event.target.value)}
                value={draft.lastName}
              />
            </FieldLabel>
          </div>
        ) : (
          <FieldLabel label="Raison sociale *">
            <input
              className={inputClassName}
              onChange={(event) => update("companyName", event.target.value)}
              value={draft.companyName}
            />
          </FieldLabel>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldLabel label="Email">
            <input
              className={inputClassName}
              onChange={(event) => update("email", event.target.value)}
              type="email"
              value={draft.email}
            />
          </FieldLabel>
          <FieldLabel label="Téléphone">
            <input
              className={inputClassName}
              onChange={(event) => update("phone", event.target.value)}
              type="tel"
              value={draft.phone}
            />
          </FieldLabel>
        </div>
        <div className="grid gap-3 sm:grid-cols-[130px_minmax(0,1fr)]">
          <FieldLabel label="Code postal">
            <input
              className={inputClassName}
              onChange={(event) => update("postalCode", event.target.value)}
              value={draft.postalCode}
            />
          </FieldLabel>
          <FieldLabel label="Ville">
            <input
              className={inputClassName}
              onChange={(event) => update("city", event.target.value)}
              value={draft.city}
            />
          </FieldLabel>
        </div>
      </section>

      <section className="grid gap-3 border-t border-slate-200 pt-5">
        <p className="text-xs font-semibold tracking-[0.13em] text-slate-500 uppercase">
          Qualification
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldLabel label="Statut">
            <select
              className={inputClassName}
              onChange={(event) =>
                update("status", event.target.value as ProspectStatus)
              }
              value={draft.status}
            >
              {prospectStatuses.map((status) => (
                <option key={status} value={status}>
                  {prospectStatusLabels[status]}
                </option>
              ))}
            </select>
          </FieldLabel>
          <FieldLabel label="Priorité">
            <select
              className={inputClassName}
              onChange={(event) =>
                update("priority", event.target.value as ProspectPriority)
              }
              value={draft.priority}
            >
              {prospectPriorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priorityLabels[priority]}
                </option>
              ))}
            </select>
          </FieldLabel>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldLabel label="Origine">
            <select
              className={inputClassName}
              onChange={(event) =>
                update("sourceKind", event.target.value as SourceKind)
              }
              value={draft.sourceKind}
            >
              {sourceKinds.map((source) => (
                <option key={source} value={source}>
                  {sourceLabels[source]}
                </option>
              ))}
            </select>
          </FieldLabel>
          <FieldLabel label="Précision">
            <input
              className={inputClassName}
              onChange={(event) => update("sourceDetail", event.target.value)}
              value={draft.sourceDetail}
            />
          </FieldLabel>
        </div>
        <FieldLabel label="Prochaine relance">
          <input
            className={inputClassName}
            onChange={(event) =>
              update("nextFollowUpAt", event.target.value || null)
            }
            type="date"
            value={draft.nextFollowUpAt ?? ""}
          />
        </FieldLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldLabel label="Événement d’origine">
            <select
              className={inputClassName}
              onChange={(event) =>
                update("originEventId", event.target.value || null)
              }
              value={draft.originEventId ?? ""}
            >
              <option value="">Aucun</option>
              {events.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </FieldLabel>
          <FieldLabel label="Action d’origine">
            <select
              className={inputClassName}
              onChange={(event) =>
                update("originCommunicationId", event.target.value || null)
              }
              value={draft.originCommunicationId ?? ""}
            >
              <option value="">Aucune</option>
              {communications.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </FieldLabel>
        </div>
        <FieldLabel label="Notes">
          <textarea
            className={textareaClassName}
            onChange={(event) => update("notes", event.target.value)}
            value={draft.notes}
          />
        </FieldLabel>
      </section>

      <section className="grid gap-3 border-t border-slate-200 pt-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.13em] text-slate-500 uppercase">
              Interactions
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Historique des échanges avec ce prospect.
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input
              checked={draft.recordInteraction}
              className="size-4 accent-seno-700"
              onChange={(event) =>
                update("recordInteraction", event.target.checked)
              }
              type="checkbox"
            />
            Consigner
          </label>
        </div>
        {draft.recordInteraction ? (
          <div className="grid gap-3 border border-seno-100 bg-seno-50/50 p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldLabel label="Type">
                <select
                  className={inputClassName}
                  onChange={(event) =>
                    update(
                      "interactionType",
                      event.target.value as InteractionType,
                    )
                  }
                  value={draft.interactionType}
                >
                  {interactionTypes.map((type) => (
                    <option key={type} value={type}>
                      {interactionLabels[type]}
                    </option>
                  ))}
                </select>
              </FieldLabel>
              <FieldLabel label="Prochaine relance">
                <input
                  className={inputClassName}
                  onChange={(event) =>
                    update("nextFollowUpAt", event.target.value || null)
                  }
                  type="date"
                  value={draft.nextFollowUpAt ?? ""}
                />
              </FieldLabel>
            </div>
            <FieldLabel label="Note de l’interaction">
              <textarea
                className={textareaClassName}
                onChange={(event) =>
                  update("interactionNote", event.target.value)
                }
                value={draft.interactionNote}
              />
            </FieldLabel>
          </div>
        ) : null}
        {draft.id ? (
          <div className="divide-y divide-slate-100 border border-slate-200">
            {interactions.length ? (
              interactions.map((interaction) => (
                <div className="p-3" key={interaction.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-800">
                      {interactionLabels[interaction.type]}
                    </p>
                    <time className="text-xs text-slate-500">
                      {new Intl.DateTimeFormat("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(interaction.occurredAt))}
                    </time>
                  </div>
                  {interaction.note ? (
                    <p className="mt-1 text-sm leading-5 text-slate-600">
                      {interaction.note}
                    </p>
                  ) : null}
                  {interaction.nextFollowUpAt ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Relance : {interaction.nextFollowUpAt}
                    </p>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="p-3 text-sm text-slate-500">
                Aucune interaction enregistrée.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            L’historique sera disponible une fois le prospect créé.
          </p>
        )}
      </section>
    </div>
  );
}

function EventForm({
  draft,
  onChange,
}: {
  draft: EventDraft;
  onChange: (draft: EventDraft) => void;
}) {
  const update = <Key extends keyof EventDraft>(
    key: Key,
    value: EventDraft[Key],
  ) => onChange({ ...draft, [key]: value });
  return (
    <div className="grid gap-4">
      <FieldLabel label="Nom *">
        <input
          className={inputClassName}
          onChange={(event) => update("name", event.target.value)}
          value={draft.name}
        />
      </FieldLabel>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldLabel label="Type">
          <input
            className={inputClassName}
            onChange={(event) => update("type", event.target.value)}
            placeholder="Salon, lieu, partenariat…"
            value={draft.type}
          />
        </FieldLabel>
        <FieldLabel label="Statut">
          <select
            className={inputClassName}
            onChange={(event) =>
              update("status", event.target.value as EventStatus)
            }
            value={draft.status}
          >
            {eventStatuses.map((status) => (
              <option key={status} value={status}>
                {eventStatusLabels[status]}
              </option>
            ))}
          </select>
        </FieldLabel>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldLabel label="Lieu">
          <input
            className={inputClassName}
            onChange={(event) => update("location", event.target.value)}
            value={draft.location}
          />
        </FieldLabel>
        <FieldLabel label="Date">
          <input
            className={inputClassName}
            onChange={(event) =>
              update("eventDate", event.target.value || null)
            }
            type="date"
            value={draft.eventDate ?? ""}
          />
        </FieldLabel>
      </div>
      <FieldLabel label="Commentaire">
        <textarea
          className={textareaClassName}
          onChange={(event) => update("comment", event.target.value)}
          value={draft.comment}
        />
      </FieldLabel>
    </div>
  );
}

function CommunicationForm({
  draft,
  onChange,
}: {
  draft: CommunicationDraft;
  onChange: (draft: CommunicationDraft) => void;
}) {
  const update = <Key extends keyof CommunicationDraft>(
    key: Key,
    value: CommunicationDraft[Key],
  ) => onChange({ ...draft, [key]: value });
  return (
    <div className="grid gap-4">
      <FieldLabel label="Action *">
        <input
          className={inputClassName}
          onChange={(event) => update("name", event.target.value)}
          value={draft.name}
        />
      </FieldLabel>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldLabel label="Canal">
          <input
            className={inputClassName}
            onChange={(event) => update("channel", event.target.value)}
            placeholder="Instagram, réseau, mailing…"
            value={draft.channel}
          />
        </FieldLabel>
        <FieldLabel label="Statut">
          <select
            className={inputClassName}
            onChange={(event) =>
              update("status", event.target.value as CommunicationStatus)
            }
            value={draft.status}
          >
            {communicationStatuses.map((status) => (
              <option key={status} value={status}>
                {communicationStatusLabels[status]}
              </option>
            ))}
          </select>
        </FieldLabel>
      </div>
      <FieldLabel label="Période">
        <input
          className={inputClassName}
          onChange={(event) => update("periodLabel", event.target.value)}
          placeholder="Septembre 2026"
          value={draft.periodLabel}
        />
      </FieldLabel>
      <FieldLabel label="Commentaire">
        <textarea
          className={textareaClassName}
          onChange={(event) => update("comment", event.target.value)}
          value={draft.comment}
        />
      </FieldLabel>
    </div>
  );
}

function IdeaForm({
  draft,
  onChange,
}: {
  draft: IdeaDraft;
  onChange: (draft: IdeaDraft) => void;
}) {
  const update = <Key extends keyof IdeaDraft>(
    key: Key,
    value: IdeaDraft[Key],
  ) => onChange({ ...draft, [key]: value });
  return (
    <div className="grid gap-4">
      <FieldLabel label="Nom de l’idée ou du contact *">
        <input
          className={inputClassName}
          onChange={(event) => update("name", event.target.value)}
          value={draft.name}
        />
      </FieldLabel>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldLabel label="Email">
          <input
            className={inputClassName}
            onChange={(event) => update("email", event.target.value)}
            type="email"
            value={draft.email}
          />
        </FieldLabel>
        <FieldLabel label="Téléphone">
          <input
            className={inputClassName}
            onChange={(event) => update("phone", event.target.value)}
            type="tel"
            value={draft.phone}
          />
        </FieldLabel>
      </div>
      <FieldLabel label="Ville">
        <input
          className={inputClassName}
          onChange={(event) => update("city", event.target.value)}
          value={draft.city}
        />
      </FieldLabel>
      <FieldLabel label="Note">
        <textarea
          className={textareaClassName}
          onChange={(event) => update("note", event.target.value)}
          value={draft.note}
        />
      </FieldLabel>
    </div>
  );
}

function EmptyState({
  icon,
  message,
}: {
  icon: React.ReactNode;
  message: string;
}) {
  return (
    <div className="grid min-h-64 place-items-center px-5 py-12 text-center">
      <div>
        {icon}
        <p className="mt-3 font-medium text-slate-700">{message}</p>
        <p className="mt-1 text-sm text-slate-500">
          Ajoutez une première entrée pour commencer le suivi.
        </p>
      </div>
    </div>
  );
}

export function ProspectionPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ProspectTab>("CONTACTS");
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<ContactQuickFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<ProspectStatus | "ALL">(
    "ALL",
  );
  const [priorityFilter, setPriorityFilter] = useState<
    ProspectPriority | "ALL"
  >("ALL");
  const [sourceFilter, setSourceFilter] = useState<SourceKind | "ALL">("ALL");
  const [prospectDraft, setProspectDraft] = useState<ProspectDraft | null>(
    null,
  );
  const [eventDraft, setEventDraft] = useState<EventDraft | null>(null);
  const [communicationDraft, setCommunicationDraft] =
    useState<CommunicationDraft | null>(null);
  const [ideaDraft, setIdeaDraft] = useState<IdeaDraft | null>(null);

  const snapshotQuery = useQuery({
    enabled: Boolean(user),
    queryFn: getClientProspectingSnapshot,
    queryKey: ["clients-prospects", user?.id],
  });
  const invalidate = async () =>
    queryClient.invalidateQueries({
      queryKey: ["clients-prospects", user?.id],
    });

  const prospectMutation = useMutation({
    mutationFn: async (draft: ProspectDraft) => {
      if (!user) throw new Error("Utilisateur non disponible.");
      if (
        (draft.kind === "PERSON" && !draft.lastName.trim()) ||
        (draft.kind === "COMPANY" && !draft.companyName.trim())
      )
        throw new Error("Renseignez le nom du prospect.");
      const {
        id,
        interactionNote,
        interactionType,
        recordInteraction,
        ...input
      } = draft;
      const prospectId = await saveProspect(input, user.id, id);
      if (recordInteraction) {
        if (!prospectId)
          throw new Error("Impossible d’enregistrer l’interaction.");
        await recordProspectInteraction({
          nextFollowUpAt: input.nextFollowUpAt,
          note: interactionNote,
          prospectId,
          type: interactionType,
        });
      }
    },
    onSuccess: async () => {
      setProspectDraft(null);
      await invalidate();
    },
  });
  const eventMutation = useMutation({
    mutationFn: async (draft: EventDraft) => {
      if (!user) throw new Error("Utilisateur non disponible.");
      if (!draft.name.trim())
        throw new Error("Renseignez le nom de l’événement ou du lieu.");
      const { id, ...input } = draft;
      await saveProspectingEvent(input, user.id, id);
    },
    onSuccess: async () => {
      setEventDraft(null);
      await invalidate();
    },
  });
  const communicationMutation = useMutation({
    mutationFn: async (draft: CommunicationDraft) => {
      if (!user) throw new Error("Utilisateur non disponible.");
      if (!draft.name.trim()) throw new Error("Renseignez le nom de l’action.");
      const { id, ...input } = draft;
      await saveProspectingCommunication(input, user.id, id);
    },
    onSuccess: async () => {
      setCommunicationDraft(null);
      await invalidate();
    },
  });
  const ideaMutation = useMutation({
    mutationFn: async (draft: IdeaDraft) => {
      if (!user) throw new Error("Utilisateur non disponible.");
      if (!draft.name.trim())
        throw new Error("Renseignez le nom de l’idée ou du contact.");
      const { id, ...input } = draft;
      await saveProspectIdea(input, user.id, id);
    },
    onSuccess: async () => {
      setIdeaDraft(null);
      await invalidate();
    },
  });
  const convertMutation = useMutation({
    mutationFn: convertProspectToClient,
    onSuccess: invalidate,
  });
  const convertIdeaMutation = useMutation({
    mutationFn: convertProspectIdeaToClient,
    onSuccess: invalidate,
  });

  const data = snapshotQuery.data;
  const today = new Date().toISOString().slice(0, 10);
  const normalizedSearch = search.trim().toLocaleLowerCase("fr-FR");
  const prospects = useMemo(
    () =>
      (data?.prospects ?? []).filter((prospect) => {
        const isOpen =
          prospect.status !== "CLOSED" && prospect.status !== "CONVERTED";
        const isLate = Boolean(
          prospect.nextFollowUpAt && prospect.nextFollowUpAt < today,
        );
        const matchesQuick =
          quickFilter === "ALL" ||
          (quickFilter === "LATE" && isLate) ||
          (quickFilter === "NEEDS_CONTACT" &&
            (prospect.status === "NEW" || prospect.status === "TO_CONTACT")) ||
          (quickFilter === "NO_FOLLOW_UP" &&
            isOpen &&
            !prospect.nextFollowUpAt);
        const haystack =
          `${getProspectName(prospect)} ${prospect.email} ${prospect.phone} ${prospect.city}`.toLocaleLowerCase(
            "fr-FR",
          );
        return (
          matchesQuick &&
          (statusFilter === "ALL" || prospect.status === statusFilter) &&
          (priorityFilter === "ALL" || prospect.priority === priorityFilter) &&
          (sourceFilter === "ALL" || prospect.sourceKind === sourceFilter) &&
          haystack.includes(normalizedSearch)
        );
      }),
    [
      data?.prospects,
      normalizedSearch,
      priorityFilter,
      quickFilter,
      sourceFilter,
      statusFilter,
      today,
    ],
  );
  const events = useMemo(
    () =>
      (data?.events ?? []).filter((item) =>
        `${item.name} ${item.type} ${item.location}`
          .toLocaleLowerCase("fr-FR")
          .includes(normalizedSearch),
      ),
    [data?.events, normalizedSearch],
  );
  const communications = useMemo(
    () =>
      (data?.communications ?? []).filter((item) =>
        `${item.name} ${item.channel} ${item.periodLabel}`
          .toLocaleLowerCase("fr-FR")
          .includes(normalizedSearch),
      ),
    [data?.communications, normalizedSearch],
  );
  const ideas = useMemo(
    () =>
      (data?.ideas ?? []).filter((item) =>
        `${item.name} ${item.city} ${item.note}`
          .toLocaleLowerCase("fr-FR")
          .includes(normalizedSearch),
      ),
    [data?.ideas, normalizedSearch],
  );

  if (snapshotQuery.isPending)
    return (
      <PageCanvas title="Prospection">
        <div className="mt-5 h-72 animate-pulse border border-slate-200 bg-white" />
      </PageCanvas>
    );
  if (snapshotQuery.isError || !data || !user)
    return (
      <PageCanvas title="Prospection">
        <p className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Impossible de charger la prospection. Vérifiez la migration puis
          réessayez.
        </p>
      </PageCanvas>
    );

  const openProspect = (prospect?: ProspectRecord) => {
    prospectMutation.reset();
    setProspectDraft(createProspectDraft(prospect));
  };
  const openEvent = (event?: ProspectingEvent) => {
    eventMutation.reset();
    setEventDraft(createEventDraft(event));
  };
  const openCommunication = (communication?: ProspectingCommunication) => {
    communicationMutation.reset();
    setCommunicationDraft(createCommunicationDraft(communication));
  };
  const openIdea = (idea?: ProspectIdea) => {
    ideaMutation.reset();
    setIdeaDraft(createIdeaDraft(idea));
  };
  const addLabel =
    tab === "CONTACTS"
      ? "Ajouter un prospect"
      : tab === "EVENTS"
        ? "Ajouter un événement / lieu"
        : tab === "COMMUNICATIONS"
          ? "Ajouter une action"
          : "Ajouter une idée";
  const onAdd = () => {
    if (tab === "CONTACTS") openProspect();
    else if (tab === "EVENTS") openEvent();
    else if (tab === "COMMUNICATIONS") openCommunication();
    else openIdea();
  };

  return (
    <DataListPage
      title="Prospection"
      toolbar={
        <div className="-my-4 pt-3">
          <div className="flex overflow-x-auto">
            {tabs.map((entry) => (
              <button
                className={cn(
                  "shrink-0 cursor-pointer border-b-2 px-4 py-2.5 text-sm font-medium",
                  tab === entry.id
                    ? "border-seno-700 text-seno-700"
                    : "border-transparent text-gray-500 hover:text-gray-800",
                )}
                key={entry.id}
                onClick={() => {
                  setTab(entry.id);
                  setSearch("");
                }}
                type="button"
              >
                {entry.label}
              </button>
            ))}
          </div>
        </div>
      }
    >
      <section className="border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full lg:max-w-md">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            />
            <input
              aria-label="Rechercher"
              className="h-10 w-full border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                tab === "CONTACTS" ? "Rechercher un prospect…" : "Rechercher…"
              }
              value={search}
            />
          </label>
          <button
            className="flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 bg-seno-700 px-4 text-sm font-medium text-white transition-colors hover:bg-seno-800"
            onClick={onAdd}
            type="button"
          >
            <Plus aria-hidden="true" className="size-4" />
            {addLabel}
          </button>
        </div>

        {tab === "CONTACTS" ? (
          <>
            <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["ALL", "Tous"],
                    ["NEEDS_CONTACT", "À traiter"],
                    ["LATE", "En retard"],
                    ["NO_FOLLOW_UP", "Sans relance"],
                  ] as Array<[ContactQuickFilter, string]>
                ).map(([id, label]) => (
                  <button
                    className={cn(
                      "cursor-pointer border px-3 py-2 text-xs font-medium",
                      quickFilter === id
                        ? "border-seno-700 bg-seno-700 text-white"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50",
                    )}
                    key={id}
                    onClick={() => setQuickFilter(id)}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <select
                  aria-label="Filtrer par statut"
                  className="h-9 border border-slate-300 bg-white px-2 text-xs text-slate-700"
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as ProspectStatus | "ALL",
                    )
                  }
                  value={statusFilter}
                >
                  <option value="ALL">Tous les statuts</option>
                  {prospectStatuses.map((status) => (
                    <option key={status} value={status}>
                      {prospectStatusLabels[status]}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Filtrer par priorité"
                  className="h-9 border border-slate-300 bg-white px-2 text-xs text-slate-700"
                  onChange={(event) =>
                    setPriorityFilter(
                      event.target.value as ProspectPriority | "ALL",
                    )
                  }
                  value={priorityFilter}
                >
                  <option value="ALL">Toutes les priorités</option>
                  {prospectPriorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priorityLabels[priority]}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Filtrer par source"
                  className="h-9 border border-slate-300 bg-white px-2 text-xs text-slate-700"
                  onChange={(event) =>
                    setSourceFilter(event.target.value as SourceKind | "ALL")
                  }
                  value={sourceFilter}
                >
                  <option value="ALL">Toutes les sources</option>
                  {sourceKinds.map((source) => (
                    <option key={source} value={source}>
                      {sourceLabels[source]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {prospects.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1080px] text-left">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold tracking-[0.1em] text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-3">Prospect</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Localisation</th>
                      <th className="px-4 py-3">Source</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3">Priorité</th>
                      <th className="px-4 py-3">Prochaine relance</th>
                      <th className="w-12 px-3 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {prospects.map((prospect) => (
                      <tr
                        className="cursor-pointer transition-colors hover:bg-slate-50"
                        key={prospect.id}
                        onClick={() => openProspect(prospect)}
                      >
                        <td className="px-4 py-4">
                          <p className="font-medium text-slate-900">
                            {getProspectName(prospect)}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {prospect.kind === "COMPANY"
                              ? "Entreprise"
                              : "Particulier"}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <ContactDetails
                            email={prospect.email}
                            phone={prospect.phone}
                          />
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          {getLocation(prospect.city, prospect.postalCode)}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          {sourceLabels[prospect.sourceKind]}
                          {prospect.sourceDetail ? (
                            <span className="block text-xs text-slate-400">
                              {prospect.sourceDetail}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-4">
                          <ProspectStatusBadge status={prospect.status} />
                        </td>
                        <td className="px-4 py-4">
                          <PriorityDot priority={prospect.priority} />
                        </td>
                        <td
                          className={cn(
                            "px-4 py-4 text-sm",
                            prospect.nextFollowUpAt &&
                              prospect.nextFollowUpAt < today
                              ? "font-medium text-red-700"
                              : "text-slate-600",
                          )}
                        >
                          {formatDate(prospect.nextFollowUpAt)}
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-2">
                            {prospect.status !== "CONVERTED" &&
                            prospect.status !== "CLOSED" ? (
                              <button
                                className="cursor-pointer border border-seno-700 px-2 py-1 text-xs font-medium text-seno-700 hover:bg-seno-50 disabled:opacity-50"
                                disabled={convertMutation.isPending}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  convertMutation.mutate(prospect.id);
                                }}
                                type="button"
                              >
                                Convertir
                              </button>
                            ) : null}
                            <ChevronRight
                              aria-hidden="true"
                              className="size-4 text-slate-400"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={
                  <UserRoundPlus
                    aria-hidden="true"
                    className="mx-auto size-7 text-slate-300"
                  />
                }
                message="Aucun prospect ne correspond aux filtres."
              />
            )}
          </>
        ) : null}

        {tab === "EVENTS" ? (
          events.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold tracking-[0.1em] text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Nom</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Lieu</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Contacts</th>
                    <th className="w-10 px-3 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {events.map((event) => {
                    const contactCount = data.prospects.filter(
                      (prospect) => prospect.originEventId === event.id,
                    ).length;
                    return (
                      <tr
                        className="cursor-pointer hover:bg-slate-50"
                        key={event.id}
                        onClick={() => openEvent(event)}
                      >
                        <td className="px-4 py-4 font-medium text-slate-900">
                          {event.name}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          {event.type || "—"}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          {event.location || "—"}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          {formatDate(event.eventDate)}
                        </td>
                        <td className="px-4 py-4">
                          <span className="bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                            {eventStatusLabels[event.status]}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          {contactCount}
                        </td>
                        <td className="px-3 py-4">
                          <ChevronRight
                            aria-hidden="true"
                            className="size-4 text-slate-400"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={
                <CalendarDays
                  aria-hidden="true"
                  className="mx-auto size-7 text-slate-300"
                />
              }
              message="Aucun événement ou lieu enregistré."
            />
          )
        ) : null}

        {tab === "COMMUNICATIONS" ? (
          communications.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold tracking-[0.1em] text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Canal</th>
                    <th className="px-4 py-3">Période</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Contacts générés</th>
                    <th className="w-10 px-3 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {communications.map((communication) => {
                    const contactCount = data.prospects.filter(
                      (prospect) =>
                        prospect.originCommunicationId === communication.id,
                    ).length;
                    return (
                      <tr
                        className="cursor-pointer hover:bg-slate-50"
                        key={communication.id}
                        onClick={() => openCommunication(communication)}
                      >
                        <td className="px-4 py-4 font-medium text-slate-900">
                          {communication.name}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          {communication.channel || "—"}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          {communication.periodLabel || "—"}
                        </td>
                        <td className="px-4 py-4">
                          <span className="bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                            {communicationStatusLabels[communication.status]}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          {contactCount}
                        </td>
                        <td className="px-3 py-4">
                          <ChevronRight
                            aria-hidden="true"
                            className="size-4 text-slate-400"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={
                <Megaphone
                  aria-hidden="true"
                  className="mx-auto size-7 text-slate-300"
                />
              }
              message="Aucune action de communication enregistrée."
            />
          )
        ) : null}

        {tab === "IDEAS" ? (
          ideas.length ? (
            <div className="grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-3">
              {ideas.map((idea) => (
                <article
                  className="cursor-pointer bg-white p-4 hover:bg-slate-50"
                  key={idea.id}
                  onClick={() => openIdea(idea)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-slate-900">
                        {idea.name}
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        Ajoutée le {formatDate(idea.createdAt.slice(0, 10))}
                      </p>
                    </div>
                    {idea.convertedClientId ? (
                      <span className="bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                        Convertie
                      </span>
                    ) : null}
                  </div>
                  {idea.note ? (
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                      {idea.note}
                    </p>
                  ) : (
                    <p className="mt-4 text-sm text-slate-400">Aucune note</p>
                  )}
                  <div className="mt-5 border-t border-slate-100 pt-3">
                    <ContactDetails email={idea.email} phone={idea.phone} />
                    <p className="mt-2 text-xs text-slate-500">
                      {idea.city || "Ville non renseignée"}
                    </p>
                  </div>
                  {!idea.convertedClientId ? (
                    <button
                      className="mt-4 cursor-pointer border border-seno-700 px-3 py-2 text-xs font-medium text-seno-700 hover:bg-seno-50 disabled:opacity-50"
                      disabled={convertIdeaMutation.isPending}
                      onClick={(event) => {
                        event.stopPropagation();
                        convertIdeaMutation.mutate(idea.id);
                      }}
                      type="button"
                    >
                      Convertir en client
                    </button>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={
                <Lightbulb
                  aria-hidden="true"
                  className="mx-auto size-7 text-slate-300"
                />
              }
              message="Aucune idée prospect enregistrée."
            />
          )
        ) : null}
      </section>

      {prospectDraft ? (
        <Drawer
          error={
            prospectMutation.isError ? prospectMutation.error.message : null
          }
          isSaving={prospectMutation.isPending}
          onClose={() => setProspectDraft(null)}
          onSave={() => prospectMutation.mutate(prospectDraft)}
          title={
            prospectDraft.id ? "Modifier le prospect" : "Ajouter un prospect"
          }
        >
          <ProspectForm
            communications={data.communications}
            draft={prospectDraft}
            events={data.events}
            interactions={data.interactions.filter(
              (interaction) => interaction.prospectId === prospectDraft.id,
            )}
            onChange={setProspectDraft}
          />
        </Drawer>
      ) : null}
      {eventDraft ? (
        <Drawer
          error={eventMutation.isError ? eventMutation.error.message : null}
          isSaving={eventMutation.isPending}
          onClose={() => setEventDraft(null)}
          onSave={() => eventMutation.mutate(eventDraft)}
          title={
            eventDraft.id
              ? "Modifier l’événement ou le lieu"
              : "Ajouter un événement ou lieu"
          }
        >
          <EventForm draft={eventDraft} onChange={setEventDraft} />
        </Drawer>
      ) : null}
      {communicationDraft ? (
        <Drawer
          error={
            communicationMutation.isError
              ? communicationMutation.error.message
              : null
          }
          isSaving={communicationMutation.isPending}
          onClose={() => setCommunicationDraft(null)}
          onSave={() => communicationMutation.mutate(communicationDraft)}
          title={
            communicationDraft.id ? "Modifier l’action" : "Ajouter une action"
          }
        >
          <CommunicationForm
            draft={communicationDraft}
            onChange={setCommunicationDraft}
          />
        </Drawer>
      ) : null}
      {ideaDraft ? (
        <Drawer
          error={ideaMutation.isError ? ideaMutation.error.message : null}
          isSaving={ideaMutation.isPending}
          onClose={() => setIdeaDraft(null)}
          onSave={() => ideaMutation.mutate(ideaDraft)}
          title={
            ideaDraft.id
              ? "Modifier l’idée prospect"
              : "Ajouter une idée prospect"
          }
        >
          <IdeaForm draft={ideaDraft} onChange={setIdeaDraft} />
        </Drawer>
      ) : null}
    </DataListPage>
  );
}
