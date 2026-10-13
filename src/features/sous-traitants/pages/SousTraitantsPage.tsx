import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, HardHat, Plus, Search, X } from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/features/auth/context/AuthProvider";
import {
  type SubcontractorInput,
  type SubcontractorRecord,
  getSubcontractorSnapshot,
  saveSubcontractor,
} from "@/features/sous-traitants/api/subcontractors-api";
import {
  ContactDetails,
  FieldLabel,
  getLocation,
  inputClassName,
  textareaClassName,
} from "@/features/clients-prospects/components/client-prospecting-ui";
import { PageCanvas } from "@/shared/components/app-shell/PageCanvas";

type SubcontractorDraft = SubcontractorInput & { id?: string };

function createDraft(
  subcontractor?: SubcontractorRecord,
): SubcontractorDraft {
  return {
    address: subcontractor?.address ?? "",
    city: subcontractor?.city ?? "",
    contactName: subcontractor?.contactName ?? "",
    email: subcontractor?.email ?? "",
    id: subcontractor?.id,
    isArchived: subcontractor?.isArchived ?? false,
    name: subcontractor?.name ?? "",
    notes: subcontractor?.notes ?? "",
    phone: subcontractor?.phone ?? "",
    postalCode: subcontractor?.postalCode ?? "",
  };
}

function SubcontractorForm({
  draft,
  onChange,
}: {
  draft: SubcontractorDraft;
  onChange: (draft: SubcontractorDraft) => void;
}) {
  const update = <Key extends keyof SubcontractorDraft>(
    key: Key,
    value: SubcontractorDraft[Key],
  ) => onChange({ ...draft, [key]: value });

  return (
    <div className="grid gap-5">
      <section className="grid gap-3">
        <p className="text-xs font-semibold tracking-[0.13em] text-slate-500 uppercase">
          Identité
        </p>
        <FieldLabel label="Nom *">
          <input
            className={inputClassName}
            maxLength={240}
            onChange={(event) => update("name", event.target.value)}
            value={draft.name}
          />
        </FieldLabel>
        <FieldLabel label="Contact principal">
          <input
            className={inputClassName}
            maxLength={160}
            onChange={(event) => update("contactName", event.target.value)}
            value={draft.contactName}
          />
        </FieldLabel>
      </section>

      <section className="grid gap-3 border-t border-slate-200 pt-5">
        <p className="text-xs font-semibold tracking-[0.13em] text-slate-500 uppercase">
          Coordonnées
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldLabel label="Email">
            <input
              className={inputClassName}
              maxLength={320}
              onChange={(event) => update("email", event.target.value)}
              type="email"
              value={draft.email}
            />
          </FieldLabel>
          <FieldLabel label="Téléphone">
            <input
              className={inputClassName}
              maxLength={40}
              onChange={(event) => update("phone", event.target.value)}
              type="tel"
              value={draft.phone}
            />
          </FieldLabel>
        </div>
        <FieldLabel label="Adresse">
          <input
            className={inputClassName}
            maxLength={300}
            onChange={(event) => update("address", event.target.value)}
            value={draft.address}
          />
        </FieldLabel>
        <div className="grid gap-3 sm:grid-cols-[130px_minmax(0,1fr)]">
          <FieldLabel label="Code postal">
            <input
              className={inputClassName}
              maxLength={20}
              onChange={(event) => update("postalCode", event.target.value)}
              value={draft.postalCode}
            />
          </FieldLabel>
          <FieldLabel label="Ville">
            <input
              className={inputClassName}
              maxLength={100}
              onChange={(event) => update("city", event.target.value)}
              value={draft.city}
            />
          </FieldLabel>
        </div>
      </section>

      <section className="grid gap-3 border-t border-slate-200 pt-5">
        <p className="text-xs font-semibold tracking-[0.13em] text-slate-500 uppercase">
          Notes
        </p>
        <FieldLabel label="Notes internes">
          <textarea
            className={textareaClassName}
            maxLength={4000}
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
            Archiver ce sous-traitant
          </label>
        ) : null}
      </section>
    </div>
  );
}

function SubcontractorDrawer({
  children,
  error,
  isSaving,
  onClose,
  onSave,
  title,
}: {
  children: React.ReactNode;
  error: string | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: () => void;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Fermer"
        className="absolute inset-0 cursor-pointer bg-slate-950/35"
        onClick={onClose}
        type="button"
      />
      <aside className="relative flex h-[100dvh] w-full max-w-xl flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-seno-500">
              SOUS-TRAITANTS
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-slate-900">
              {title}
            </h2>
          </div>
          <button
            aria-label="Fermer"
            className="grid size-9 cursor-pointer place-items-center text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {error ? (
          <p className="mx-5 mb-3 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        <footer className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button
            className="cursor-pointer border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            Annuler
          </button>
          <button
            className="cursor-pointer bg-seno-700 px-4 py-2 text-sm font-medium text-white hover:bg-seno-800 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
            onClick={onSave}
            type="button"
          >
            {isSaving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </footer>
      </aside>
    </div>
  );
}

export function SousTraitantsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<SubcontractorDraft | null>(null);
  const [search, setSearch] = useState("");
  const snapshotQuery = useQuery({
    enabled: Boolean(user),
    queryFn: getSubcontractorSnapshot,
    queryKey: ["subcontractors", user?.id],
  });
  const saveMutation = useMutation({
    mutationFn: async (nextDraft: SubcontractorDraft) => {
      if (!user) {
        throw new Error("Utilisateur non disponible.");
      }
      if (!nextDraft.name.trim()) {
        throw new Error("Renseignez le nom du sous-traitant.");
      }

      const { id, ...input } = nextDraft;
      await saveSubcontractor({ id, input, userId: user.id });
    },
    onSuccess: async () => {
      setDraft(null);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["subcontractors", user?.id],
        }),
        queryClient.invalidateQueries({ queryKey: ["chantiers", user?.id] }),
      ]);
    },
  });

  const subcontractors = snapshotQuery.data?.subcontractors ?? [];
  const chantierCounts = new Map<string, number>();
  for (const assignment of snapshotQuery.data?.assignments ?? []) {
    chantierCounts.set(
      assignment.subcontractorId,
      (chantierCounts.get(assignment.subcontractorId) ?? 0) + 1,
    );
  }
  const normalizedSearch = search.trim().toLocaleLowerCase("fr-FR");
  const visibleSubcontractors = subcontractors.filter((subcontractor) =>
    `${subcontractor.name} ${subcontractor.contactName} ${subcontractor.email} ${subcontractor.phone} ${subcontractor.city}`
      .toLocaleLowerCase("fr-FR")
      .includes(normalizedSearch),
  );

  if (snapshotQuery.isPending) {
    return (
      <PageCanvas title="Sous-traitants">
        <div className="mt-5 h-72 animate-pulse border border-slate-200 bg-white" />
      </PageCanvas>
    );
  }

  if (snapshotQuery.isError || !user) {
    return (
      <PageCanvas title="Sous-traitants">
        <p className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Impossible de charger les sous-traitants. Vérifiez la migration puis
          réessayez.
        </p>
      </PageCanvas>
    );
  }

  return (
    <PageCanvas title="Sous-traitants">
      <div className="mt-2 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <p className="text-sm leading-6 text-slate-500">
          Répertoire des sous-traitants disponibles pour les chantiers.
        </p>
        <button
          className="flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 bg-seno-700 px-4 text-sm font-medium text-white transition-colors hover:bg-seno-800"
          onClick={() => {
            saveMutation.reset();
            setDraft(createDraft());
          }}
          type="button"
        >
          <Plus aria-hidden="true" className="size-4" />
          Ajouter un sous-traitant
        </button>
      </div>

      <section className="mt-5 border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <label className="relative block w-full lg:max-w-md">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            />
            <input
              aria-label="Rechercher un sous-traitant"
              className="h-10 w-full border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un sous-traitant…"
              value={search}
            />
          </label>
        </div>

        {visibleSubcontractors.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold tracking-[0.1em] text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Sous-traitant</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Coordonnées</th>
                  <th className="px-4 py-3">Localisation</th>
                  <th className="px-4 py-3">Chantiers</th>
                  <th className="w-10 px-3 py-3" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleSubcontractors.map((subcontractor) => (
                  <tr
                    className="cursor-pointer transition-colors hover:bg-slate-50"
                    key={subcontractor.id}
                    onClick={() => {
                      saveMutation.reset();
                      setDraft(createDraft(subcontractor));
                    }}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid size-8 place-items-center bg-seno-50 text-seno-700">
                          <HardHat aria-hidden="true" className="size-4" />
                        </span>
                        <p className="font-medium text-slate-900">
                          {subcontractor.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {subcontractor.contactName || "—"}
                    </td>
                    <td className="px-4 py-4">
                      <ContactDetails
                        email={subcontractor.email}
                        phone={subcontractor.phone}
                      />
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {getLocation(subcontractor.city, subcontractor.postalCode)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {chantierCounts.get(subcontractor.id) ?? 0}
                    </td>
                    <td className="px-3 py-4 text-slate-400">
                      <ChevronRight aria-hidden="true" className="size-4" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid min-h-64 place-items-center px-5 py-12 text-center">
            <div>
              <HardHat
                aria-hidden="true"
                className="mx-auto size-7 text-slate-300"
              />
              <p className="mt-3 font-medium text-slate-700">
                {search
                  ? "Aucun sous-traitant ne correspond à cette recherche."
                  : "Aucun sous-traitant pour le moment."}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Ajoutez le premier sous-traitant pour le sélectionner sur un
                chantier.
              </p>
            </div>
          </div>
        )}
      </section>

      {draft ? (
        <SubcontractorDrawer
          error={saveMutation.isError ? saveMutation.error.message : null}
          isSaving={saveMutation.isPending}
          onClose={() => setDraft(null)}
          onSave={() => saveMutation.mutate(draft)}
          title={draft.id ? "Modifier le sous-traitant" : "Ajouter un sous-traitant"}
        >
          <SubcontractorForm draft={draft} onChange={setDraft} />
        </SubcontractorDrawer>
      ) : null}
    </PageCanvas>
  );
}
