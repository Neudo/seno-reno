import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Building2,
  ChevronRight,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import { useState } from "react";

import {
  type ClientInput,
  type ClientKind,
  type ClientRecord,
  type SourceKind,
  getClientProspectingSnapshot,
  saveClient,
  sourceKinds,
} from "@/features/clients-prospects/api/client-prospecting-api";
import {
  ContactDetails,
  Drawer,
  FieldLabel,
  getClientName,
  getLocation,
  inputClassName,
  sourceLabels,
  textareaClassName,
} from "@/features/clients-prospects/components/client-prospecting-ui";
import { useAuth } from "@/features/auth/context/AuthProvider";
import { getChantierSnapshot } from "@/features/chantiers/api/chantiers-api";
import { PageCanvas } from "@/shared/components/app-shell/PageCanvas";
import { cn } from "@/shared/lib/utils";

type ClientFilter = "ALL" | "ARCHIVED" | "CURRENT_SITE" | "WITHOUT_SITE";
type ClientDraft = ClientInput & { id?: string };

const clientFilters: Array<{ id: ClientFilter; label: string }> = [
  { id: "ALL", label: "Tous" },
  { id: "CURRENT_SITE", label: "Chantier en cours" },
  { id: "WITHOUT_SITE", label: "Sans chantier" },
  { id: "ARCHIVED", label: "Archivés" },
];

function createClientDraft(client?: ClientRecord): ClientDraft {
  return {
    address: client?.address ?? "",
    city: client?.city ?? "",
    companyName: client?.companyName ?? "",
    email: client?.email ?? "",
    firstName: client?.firstName ?? "",
    id: client?.id,
    isArchived: client?.isArchived ?? false,
    kind: client?.kind ?? "PERSON",
    lastName: client?.lastName ?? "",
    notes: client?.notes ?? "",
    onedriveUrl: client?.onedriveUrl ?? "",
    phone: client?.phone ?? "",
    postalCode: client?.postalCode ?? "",
    primaryContact: client?.primaryContact ?? "",
    sourceDetail: client?.sourceDetail ?? "",
    sourceKind: client?.sourceKind ?? "OTHER",
  };
}

function ClientForm({
  draft,
  onChange,
}: {
  draft: ClientDraft;
  onChange: (draft: ClientDraft) => void;
}) {
  const update = <Key extends keyof ClientDraft>(
    key: Key,
    value: ClientDraft[Key],
  ) => {
    onChange({ ...draft, [key]: value });
  };

  return (
    <div className="grid gap-5">
      <section className="grid gap-3">
        <p className="text-xs font-semibold tracking-[0.13em] text-slate-500 uppercase">
          Identité
        </p>
        <div className="flex border border-slate-300">
          {(["PERSON", "COMPANY"] as ClientKind[]).map((kind) => (
            <button
              className={cn(
                "flex-1 cursor-pointer px-3 py-2 text-sm transition-colors",
                draft.kind === kind
                  ? "bg-seno-700 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50",
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
                required
                value={draft.lastName}
              />
            </FieldLabel>
          </div>
        ) : (
          <>
            <FieldLabel label="Raison sociale *">
              <input
                className={inputClassName}
                onChange={(event) => update("companyName", event.target.value)}
                required
                value={draft.companyName}
              />
            </FieldLabel>
            <FieldLabel label="Contact principal">
              <input
                className={inputClassName}
                onChange={(event) =>
                  update("primaryContact", event.target.value)
                }
                value={draft.primaryContact}
              />
            </FieldLabel>
          </>
        )}
      </section>

      <section className="grid gap-3 border-t border-slate-200 pt-5">
        <p className="text-xs font-semibold tracking-[0.13em] text-slate-500 uppercase">
          Coordonnées
        </p>
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
        <FieldLabel label="Adresse">
          <input
            className={inputClassName}
            onChange={(event) => update("address", event.target.value)}
            value={draft.address}
          />
        </FieldLabel>
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
          Suivi
        </p>
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
        <FieldLabel label="Précision sur l’origine">
          <input
            className={inputClassName}
            onChange={(event) => update("sourceDetail", event.target.value)}
            value={draft.sourceDetail}
          />
        </FieldLabel>
        <FieldLabel label="Lien OneDrive">
          <input
            className={inputClassName}
            onChange={(event) => update("onedriveUrl", event.target.value)}
            placeholder="https://…"
            type="url"
            value={draft.onedriveUrl}
          />
        </FieldLabel>
        <FieldLabel label="Notes">
          <textarea
            className={textareaClassName}
            onChange={(event) => update("notes", event.target.value)}
            value={draft.notes}
          />
        </FieldLabel>
        {draft.id ? (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              checked={draft.isArchived}
              className="size-4 accent-seno-700"
              onChange={(event) => update("isArchived", event.target.checked)}
              type="checkbox"
            />
            Archiver ce client
          </label>
        ) : null}
      </section>
    </div>
  );
}

export function ClientsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ClientFilter>("ALL");
  const [draft, setDraft] = useState<ClientDraft | null>(null);

  const snapshotQuery = useQuery({
    enabled: Boolean(user),
    queryFn: getClientProspectingSnapshot,
    queryKey: ["clients-prospects", user?.id],
  });
  const chantierQuery = useQuery({
    enabled: Boolean(user),
    queryFn: getChantierSnapshot,
    queryKey: ["chantiers", user?.id],
  });

  const saveMutation = useMutation({
    mutationFn: async (nextDraft: ClientDraft) => {
      if (!user) {
        throw new Error("Utilisateur non disponible.");
      }
      if (
        (nextDraft.kind === "PERSON" && !nextDraft.lastName.trim()) ||
        (nextDraft.kind === "COMPANY" && !nextDraft.companyName.trim())
      ) {
        throw new Error("Renseigne le nom du client.");
      }

      const { id, ...input } = nextDraft;
      await saveClient(input, user.id, id);
    },
    onSuccess: async () => {
      setDraft(null);
      await queryClient.invalidateQueries({
        queryKey: ["clients-prospects", user?.id],
      });
    },
  });

  const clients = snapshotQuery.data?.clients;
  const chantiersByClient = new Map<string, number>();
  const currentChantierClientIds = new Set<string>();
  for (const chantier of chantierQuery.data?.chantiers ?? []) {
    chantiersByClient.set(
      chantier.clientId,
      (chantiersByClient.get(chantier.clientId) ?? 0) + 1,
    );
    if (chantier.status === "IN_PROGRESS") {
      currentChantierClientIds.add(chantier.clientId);
    }
  }
  const normalizedSearch = search.trim().toLocaleLowerCase("fr-FR");
  const visibleClients = (clients ?? []).filter((client) => {
    const matchesFilter =
      filter === "ALL"
        ? !client.isArchived
        : filter === "ARCHIVED"
          ? client.isArchived
          : filter === "WITHOUT_SITE"
            ? !client.isArchived && !chantiersByClient.has(client.id)
            : !client.isArchived && currentChantierClientIds.has(client.id);
    const haystack =
      `${getClientName(client)} ${client.email} ${client.phone} ${client.city}`.toLocaleLowerCase(
        "fr-FR",
      );
    return matchesFilter && haystack.includes(normalizedSearch);
  });

  if (snapshotQuery.isPending || chantierQuery.isPending) {
    return (
      <PageCanvas title="Clients">
        <div className="mt-5 h-72 animate-pulse border border-slate-200 bg-white" />
      </PageCanvas>
    );
  }

  if (snapshotQuery.isError || chantierQuery.isError || !user) {
    return (
      <PageCanvas title="Clients">
        <p className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Impossible de charger les clients. Vérifie la migration puis réessaie.
        </p>
      </PageCanvas>
    );
  }

  return (
    <PageCanvas title="Clients">
      <div className="mt-2 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm leading-6 text-slate-500">
            Contacts clients, coordonnées et origine de la relation.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Les chantiers rattachés sont comptabilisés dans la liste.
          </p>
        </div>
        <button
          className="flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 bg-seno-700 px-4 text-sm font-medium text-white transition-colors hover:bg-seno-800"
          onClick={() => {
            saveMutation.reset();
            setDraft(createClientDraft());
          }}
          type="button"
        >
          <Plus aria-hidden="true" className="size-4" />
          Ajouter un client
        </button>
      </div>

      <section className="mt-5 border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full lg:max-w-md">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            />
            <input
              aria-label="Rechercher un client"
              className="h-10 w-full border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un client…"
              value={search}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {clientFilters.map((entry) => (
              <button
                className={cn(
                  "cursor-pointer border px-3 py-2 text-xs font-medium transition-colors",
                  filter === entry.id
                    ? "border-seno-700 bg-seno-700 text-white"
                    : "border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50",
                )}
                key={entry.id}
                onClick={() => setFilter(entry.id)}
                type="button"
              >
                {entry.label}
              </button>
            ))}
          </div>
        </div>

        {visibleClients.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold tracking-[0.1em] text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Localisation</th>
                  <th className="px-4 py-3">Chantiers</th>
                  <th className="w-10 px-3 py-3" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleClients.map((client) => (
                  <tr
                    className="cursor-pointer transition-colors hover:bg-slate-50"
                    key={client.id}
                    onClick={() => {
                      saveMutation.reset();
                      setDraft(createClientDraft(client));
                    }}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid size-8 place-items-center bg-seno-50 text-seno-700">
                          {client.kind === "COMPANY" ? (
                            <Building2 aria-hidden="true" className="size-4" />
                          ) : (
                            <UserRound aria-hidden="true" className="size-4" />
                          )}
                        </span>
                        <div>
                          <p className="font-medium text-slate-900">
                            {getClientName(client)}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {sourceLabels[client.sourceKind]}
                            {client.sourceDetail
                              ? ` · ${client.sourceDetail}`
                              : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <ContactDetails
                        email={client.email}
                        phone={client.phone}
                      />
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {getLocation(client.city, client.postalCode)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {chantiersByClient.get(client.id) ?? 0}
                    </td>
                    <td className="px-3 py-4 text-slate-400">
                      {client.isArchived ? (
                        <Archive
                          aria-label="Client archivé"
                          className="size-4"
                        />
                      ) : (
                        <ChevronRight aria-hidden="true" className="size-4" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid min-h-64 place-items-center px-5 py-12 text-center">
            <div>
              <UserRound
                aria-hidden="true"
                className="mx-auto size-7 text-slate-300"
              />
              <p className="mt-3 font-medium text-slate-700">
                {search
                  ? "Aucun client ne correspond à cette recherche."
                  : "Aucun client pour le moment."}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Ajoute le premier contact client pour démarrer.
              </p>
            </div>
          </div>
        )}
      </section>

      {draft ? (
        <Drawer
          error={saveMutation.isError ? saveMutation.error.message : null}
          isSaving={saveMutation.isPending}
          onClose={() => setDraft(null)}
          onSave={() => saveMutation.mutate(draft)}
          title={draft.id ? "Modifier le client" : "Ajouter un client"}
        >
          <ClientForm draft={draft} onChange={setDraft} />
        </Drawer>
      ) : null}
    </PageCanvas>
  );
}
