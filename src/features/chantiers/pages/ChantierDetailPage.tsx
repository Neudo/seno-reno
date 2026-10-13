import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  CircleAlert,
  FileText,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { Dialog } from "radix-ui";
import { lazy, Suspense, useRef, useState } from "react";

import { useAuth } from "@/features/auth/context/AuthProvider";
import { serializePurchaseQuantity } from "@/features/achats/lib/shopping-list";
import {
  createChantierProcurement,
  chantierDocumentCategories,
  depositStatuses,
  adjustmentKinds,
  adjustmentStatuses,
  deleteChantierAdjustment,
  deleteChantierDeposit,
  getChantierDocumentUrl,
  getChantierDetail,
  orderStatuses,
  paymentStatuses,
  saveChantierAdjustment,
  saveChantierDeposit,
  saveChantierDocument,
  saveChantierSubcontractorCommitment,
  type AdjustmentKind,
  type AdjustmentStatus,
  type ChantierAdjustment,
  type ChantierAdjustmentInput,
  type ChantierDeposit,
  type ChantierDepositInput,
  type ChantierDocumentCategory,
  type ChantierDocumentInput,
  type ChantierProcurement,
  type ChantierProcurementKind,
  type ChantierDetail,
  type ChantierRecord,
  type ChantierStatus,
  type ChantierSubcontractorCommitmentInput,
  type CreateChantierProcurementInput,
  type DepositStatus,
  type OrderStatus,
  type PaymentStatus,
} from "@/features/chantiers/api/chantiers-api";
import { ChantierCreatePage } from "@/features/chantiers/pages/ChantierCreatePage";
import { getQuoteDocumentUrl } from "@/features/devis/api/quotes-api";
import { cn } from "@/shared/lib/utils";

const ModifiedQuotePreview = lazy(() =>
  import("@/features/chantiers/components/ModifiedQuotePreview").then(
    (module) => ({ default: module.ModifiedQuotePreview }),
  ),
);

type ChantierTab =
  | "OVERVIEW"
  | "PURCHASES"
  | "SUBCONTRACTORS"
  | "ADJUSTMENTS"
  | "DOCUMENTS"
  | "FINANCES"
  | "FOLLOW_UP";

const tabs: { id: ChantierTab; label: string }[] = [
  { id: "OVERVIEW", label: "Aperçu" },
  { id: "PURCHASES", label: "Commandes & achats" },
  { id: "SUBCONTRACTORS", label: "Sous-traitants" },
  { id: "ADJUSTMENTS", label: "Plus / moins-values" },
  { id: "DOCUMENTS", label: "Documents" },
  { id: "FINANCES", label: "Finances" },
  { id: "FOLLOW_UP", label: "Suivi de chantier" },
];

const statusLabels: Record<ChantierStatus, string> = {
  CANCELLED: "Annulé",
  COMPLETED: "Terminé",
  IN_PROGRESS: "En cours",
  PAUSED: "En pause",
  PENDING: "En attente",
};

const statusTone: Record<ChantierStatus, string> = {
  CANCELLED: "border-slate-200 bg-slate-50 text-slate-600",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  IN_PROGRESS: "border-sky-200 bg-sky-50 text-sky-700",
  PAUSED: "border-amber-200 bg-amber-50 text-amber-800",
  PENDING: "border-violet-200 bg-violet-50 text-violet-700",
};

const orderStatusLabels: Record<OrderStatus, string> = {
  CANCELLED: "Annulée",
  ORDERED: "Commandée",
  READY: "Prête",
  RECEIVED: "Reçue",
  TO_ORDER: "À commander",
};

const orderStatusTone: Record<OrderStatus, string> = {
  CANCELLED: "border-slate-200 bg-slate-50 text-slate-600",
  ORDERED: "border-sky-200 bg-sky-50 text-sky-700",
  READY: "border-violet-200 bg-violet-50 text-violet-700",
  RECEIVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  TO_ORDER: "border-amber-200 bg-amber-50 text-amber-800",
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  PAID: "Payé",
  PARTIAL: "Partiel",
  UNPAID: "Non payé",
};

const paymentStatusTone: Record<PaymentStatus, string> = {
  PAID: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PARTIAL: "border-amber-200 bg-amber-50 text-amber-800",
  UNPAID: "border-red-200 bg-red-50 text-red-700",
};

const depositStatusLabels: Record<DepositStatus, string> = {
  CALLED: "Appelé",
  COLLECTED: "Encaissé",
  TO_CALL: "À appeler",
};

const depositStatusTone: Record<DepositStatus, string> = {
  CALLED: "border-sky-200 bg-sky-50 text-sky-700",
  COLLECTED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  TO_CALL: "border-amber-200 bg-amber-50 text-amber-800",
};

const adjustmentKindLabels: Record<AdjustmentKind, string> = {
  MINUS: "Moins-value",
  PLUS: "Plus-value",
};

const adjustmentStatusLabels: Record<AdjustmentStatus, string> = {
  ACCEPTED: "Acceptée",
  PROPOSED: "Proposée",
  REFUSED: "Refusée",
};

const adjustmentStatusTone: Record<AdjustmentStatus, string> = {
  ACCEPTED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PROPOSED: "border-amber-200 bg-amber-50 text-amber-800",
  REFUSED: "border-red-200 bg-red-50 text-red-700",
};

const documentCategoryLabels: Record<ChantierDocumentCategory, string> = {
  ADMINISTRATIVE: "Administratif",
  INVOICE: "Facture",
  OTHER: "Autre",
  PHOTO: "Photo",
  PLAN: "Plan",
  PURCHASE_ORDER: "Bon de commande",
  QUOTE: "Devis",
  SUBCONTRACTOR_DOCUMENT: "Document sous-traitant",
};

const amountFormatter = new Intl.NumberFormat("fr-FR", {
  currency: "EUR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency",
});

const shortDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
});

const tableDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatAmount(value: number | null) {
  return value === null ? "—" : amountFormatter.format(value);
}

function formatShortDate(value: string | null) {
  return value ? shortDateFormatter.format(new Date(`${value}T12:00:00`)) : "—";
}

function formatTableDate(value: string | null) {
  return value ? tableDateFormatter.format(new Date(`${value}T12:00:00`)) : "—";
}

function formatPeriod(chantier: ChantierRecord) {
  if (!chantier.plannedStartDate && !chantier.plannedEndDate) {
    return "Non renseignée";
  }

  return `${formatShortDate(chantier.plannedStartDate)} → ${formatShortDate(
    chantier.plannedEndDate,
  )}`;
}

function StatusBadge({ status }: { status: ChantierStatus }) {
  return (
    <span
      className={cn(
        "inline-flex border px-2 py-1 text-[11px] font-medium whitespace-nowrap",
        statusTone[status],
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

function MetricCard({
  label,
  tone = "text-slate-900",
  value,
}: {
  label: string;
  tone?: string;
  value: string;
}) {
  return (
    <article className="border border-slate-200 bg-white px-4 py-3.5">
      <p className="text-[10px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
        {label}
      </p>
      <p className={cn("mt-2 text-xl font-semibold tracking-[-0.03em]", tone)}>
        {value}
      </p>
    </article>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10px] font-semibold tracking-[0.15em] text-slate-500 uppercase">
      {children}
    </h2>
  );
}

function InformationLine({
  children,
  icon: Icon,
  label,
}: {
  children: React.ReactNode;
  icon: typeof UserRound;
  label: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-slate-400"
      />
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 text-sm leading-5 text-slate-800">{children}</p>
      </div>
    </div>
  );
}

function DetailDialog({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div
      aria-labelledby="chantier-dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center p-4"
      role="dialog"
    >
      <button
        aria-label="Fermer"
        className="absolute inset-0 cursor-default bg-slate-950/35"
        onClick={onClose}
        type="button"
      />
      <div className="relative max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <h2
            className="text-lg font-semibold tracking-[-0.02em] text-slate-900"
            id="chantier-dialog-title"
          >
            {title}
          </h2>
          <button
            aria-label="Fermer"
            className="grid size-9 cursor-pointer place-items-center border border-slate-300 text-slate-500 transition-colors hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

type DepositDraft = {
  amount: string;
  callDueDate: string;
  id?: string;
  label: string;
  reminderDate: string;
  status: DepositStatus;
};

function createDepositDraft(deposit?: ChantierDeposit): DepositDraft {
  return {
    amount: deposit ? String(deposit.amount) : "",
    callDueDate: deposit?.callDueDate ?? "",
    id: deposit?.id,
    label: deposit?.label ?? "",
    reminderDate: deposit?.reminderDate ?? "",
    status: deposit?.status ?? "TO_CALL",
  };
}

function DepositStatusBadge({ status }: { status: DepositStatus }) {
  return (
    <span
      className={cn(
        "inline-flex border px-2 py-1 text-[11px] font-medium whitespace-nowrap",
        depositStatusTone[status],
      )}
    >
      {depositStatusLabels[status]}
    </span>
  );
}

function DepositDialog({
  draft,
  isSaving,
  onClose,
  onSave,
}: {
  draft: DepositDraft;
  isSaving: boolean;
  onClose: () => void;
  onSave: (
    id: string | undefined,
    input: ChantierDepositInput,
  ) => Promise<void>;
}) {
  const [nextDraft, setNextDraft] = useState(draft);
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(nextDraft.id);

  const update = <Key extends keyof DepositDraft>(
    key: Key,
    value: DepositDraft[Key],
  ) => setNextDraft((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!nextDraft.label.trim()) {
      setError("Le libellé est requis.");
      return;
    }

    try {
      const amount = parseAmount(nextDraft.amount, {
        label: "Le montant",
        required: true,
      });
      await onSave(nextDraft.id, {
        amount: amount ?? 0,
        callDueDate: nextDraft.callDueDate || null,
        label: nextDraft.label,
        reminderDate: nextDraft.reminderDate || null,
        status: nextDraft.status,
      });
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "L’enregistrement a échoué.",
      );
    }
  };

  return (
    <DetailDialog
      onClose={onClose}
      title={isEditing ? "Modifier l’acompte" : "Ajouter un acompte"}
    >
      <form className="grid gap-4 p-5" onSubmit={(event) => void submit(event)}>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-slate-700">Libellé *</span>
          <input
            autoFocus
            className="h-10 border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
            maxLength={240}
            onChange={(event) => update("label", event.target.value)}
            value={nextDraft.label}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">
              Montant (€) *
            </span>
            <input
              className="h-10 border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
              inputMode="decimal"
              onChange={(event) => update("amount", event.target.value)}
              value={nextDraft.amount}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">Statut</span>
            <select
              className="h-10 cursor-pointer border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
              onChange={(event) =>
                update("status", event.target.value as DepositStatus)
              }
              value={nextDraft.status}
            >
              {depositStatuses.map((status) => (
                <option key={status} value={status}>
                  {depositStatusLabels[status]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">
              Date d’appel prévue
            </span>
            <input
              className="h-10 border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
              onChange={(event) => update("callDueDate", event.target.value)}
              type="date"
              value={nextDraft.callDueDate}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">
              Date de relance
            </span>
            <input
              className="h-10 border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
              onChange={(event) => update("reminderDate", event.target.value)}
              type="date"
              value={nextDraft.reminderDate}
            />
          </label>
        </div>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <footer className="mt-1 flex justify-end gap-2 border-t border-slate-200 pt-4">
          <button
            className="h-10 cursor-pointer border border-slate-300 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            Annuler
          </button>
          <button
            className="h-10 cursor-pointer bg-seno-700 px-4 text-sm font-medium text-white transition-colors hover:bg-seno-800 disabled:cursor-wait disabled:opacity-60"
            disabled={isSaving}
            type="submit"
          >
            {isSaving
              ? "Enregistrement…"
              : isEditing
                ? "Enregistrer"
                : "Ajouter"}
          </button>
        </footer>
      </form>
    </DetailDialog>
  );
}

function Overview({ detail }: { detail: ChantierDetail }) {
  const { chantier, subcontractors } = detail;
  const hasNotes = Boolean(chantier.notes.trim());
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [depositDraft, setDepositDraft] = useState<DepositDraft | null>(null);
  const depositsTotal = detail.deposits.reduce(
    (total, deposit) => total + deposit.amount,
    0,
  );

  const saveDepositMutation = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string | undefined;
      input: ChantierDepositInput;
    }) => {
      if (!user) {
        throw new Error("Utilisateur non disponible.");
      }

      await saveChantierDeposit({
        chantierId: chantier.id,
        id,
        input,
        userId: user.id,
      });
    },
    onSuccess: async () => {
      setDepositDraft(null);
      await queryClient.invalidateQueries({
        queryKey: ["chantier", user?.id, chantier.id],
      });
    },
  });

  const deleteDepositMutation = useMutation({
    mutationFn: deleteChantierDeposit,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["chantier", user?.id, chantier.id],
      });
    },
  });

  return (
    <div className="grid gap-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="CA prévisionnel"
          value={formatAmount(chantier.initialSignedQuoteAmount)}
        />
        <MetricCard label="Coûts prévisionnels" value="—" />
        <MetricCard label="Marge" tone="text-emerald-700" value="—" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        <article className="border border-slate-200 bg-white p-5">
          <SectionTitle>Informations</SectionTitle>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <InformationLine icon={UserRound} label="Client">
              {chantier.clientName}
            </InformationLine>
            <InformationLine icon={MapPin} label="Adresse">
              {chantier.address || "Non renseignée"}
            </InformationLine>
            <InformationLine icon={CalendarDays} label="Période">
              {formatPeriod(chantier)}
            </InformationLine>
            <InformationLine icon={FileText} label="Devis initial">
              {formatAmount(chantier.initialSignedQuoteAmount)}
            </InformationLine>
          </div>
          <div className="mt-5 border-t border-slate-100 pt-5">
            <p className="text-[11px] font-medium text-slate-500">Notes</p>
            <p className="mt-1 text-sm leading-6 whitespace-pre-line text-slate-700">
              {hasNotes ? chantier.notes : "Aucune note renseignée."}
            </p>
          </div>
        </article>

        <aside className="border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2 text-amber-900">
            <CircleAlert aria-hidden="true" className="size-4" />
            <SectionTitle>À surveiller</SectionTitle>
          </div>
          <div className="mt-5 border-t border-amber-200 pt-4">
            <p className="text-sm font-medium text-slate-800">
              {subcontractors.length === 0
                ? "Aucun sous-traitant rattaché"
                : `${subcontractors.length} sous-traitant${
                    subcontractors.length > 1 ? "s" : ""
                  } rattaché${subcontractors.length > 1 ? "s" : ""}`}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Renseignez les prestations, montants et échéances depuis l’onglet
              Sous-traitants.
            </p>
          </div>
        </aside>
      </section>

      <section className="border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div>
            <SectionTitle>Acomptes</SectionTitle>
            <p className="mt-1 text-sm text-slate-500">
              {detail.deposits.length
                ? `${detail.deposits.length} acompte${
                    detail.deposits.length > 1 ? "s" : ""
                  } · ${formatAmount(depositsTotal)}`
                : "Aucun acompte renseigné"}
            </p>
          </div>
          <button
            className="flex h-10 cursor-pointer items-center justify-center gap-2 bg-seno-700 px-3 text-sm font-medium text-white transition-colors hover:bg-seno-800"
            onClick={() => setDepositDraft(createDepositDraft())}
            type="button"
          >
            <Plus aria-hidden="true" className="size-4" />
            Ajouter un acompte
          </button>
        </div>
        {detail.deposits.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold tracking-[0.1em] text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Libellé</th>
                  <th className="px-4 py-3 text-right">Montant</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Appel prévu</th>
                  <th className="px-4 py-3">Relance</th>
                  <th aria-label="Actions" className="w-24 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {detail.deposits.map((deposit) => (
                  <tr key={deposit.id}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {deposit.label}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-slate-800">
                      {formatAmount(deposit.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <DepositStatusBadge status={deposit.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatTableDate(deposit.callDueDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatTableDate(deposit.reminderDate)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          aria-label={`Modifier ${deposit.label}`}
                          className="grid size-8 cursor-pointer place-items-center border border-slate-300 text-slate-600 transition-colors hover:bg-slate-50"
                          onClick={() =>
                            setDepositDraft(createDepositDraft(deposit))
                          }
                          type="button"
                        >
                          <Pencil aria-hidden="true" className="size-3.5" />
                        </button>
                        <button
                          aria-label={`Supprimer ${deposit.label}`}
                          className="grid size-8 cursor-pointer place-items-center border border-slate-300 text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-wait disabled:opacity-60"
                          disabled={deleteDepositMutation.isPending}
                          onClick={() =>
                            deleteDepositMutation.mutate(deposit.id)
                          }
                          type="button"
                        >
                          <Trash2 aria-hidden="true" className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-8 text-sm text-slate-600">
            Aucun acompte n’est renseigné pour ce chantier.
          </p>
        )}
        {deleteDepositMutation.isError ? (
          <p className="border-t border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            La suppression a échoué. Réessayez dans un instant.
          </p>
        ) : null}
      </section>

      {depositDraft ? (
        <DepositDialog
          draft={depositDraft}
          isSaving={saveDepositMutation.isPending}
          onClose={() => {
            if (!saveDepositMutation.isPending) {
              setDepositDraft(null);
            }
          }}
          onSave={(id, input) => saveDepositMutation.mutateAsync({ id, input })}
        />
      ) : null}
    </div>
  );
}

type ProcurementDraft = {
  addToShoppingList: boolean;
  description: string;
  forecastAmount: string;
  kind: ChantierProcurementKind;
  orderStatus: OrderStatus;
  orderedAt: string;
  paymentStatus: PaymentStatus;
  plannedDeliveryDate: string;
  quantity: string;
  supplier: string;
  title: string;
};

function createProcurementDraft(
  kind: ChantierProcurementKind,
): ProcurementDraft {
  return {
    addToShoppingList: true,
    description: "",
    forecastAmount: "",
    kind,
    orderStatus: "TO_ORDER",
    orderedAt: "",
    paymentStatus: "UNPAID",
    plannedDeliveryDate: "",
    quantity: "",
    supplier: "",
    title: "",
  };
}

function parseAmount(
  value: string,
  { label, required }: { label: string; required: boolean },
) {
  const normalized = value.trim().replace(/\s/gu, "").replace(",", ".");
  if (!normalized) {
    if (required) {
      throw new Error(`${label} est requis.`);
    }

    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} doit être un nombre positif ou nul.`);
  }

  return parsed;
}

function ProcurementStatus({
  procurement,
}: {
  procurement: ChantierProcurement;
}) {
  if (procurement.kind === "PURCHASE") {
    return (
      <span className="inline-flex border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600 whitespace-nowrap">
        {procurement.purchasedAt
          ? "Acheté"
          : procurement.addToShoppingList
            ? "Liste de courses"
            : "Achat"}
      </span>
    );
  }

  if (!procurement.orderStatus) {
    return "—";
  }

  return (
    <span
      className={cn(
        "inline-flex border px-2 py-1 text-[11px] font-medium whitespace-nowrap",
        orderStatusTone[procurement.orderStatus],
      )}
    >
      {orderStatusLabels[procurement.orderStatus]}
    </span>
  );
}

function ProcurementPayment({
  procurement,
}: {
  procurement: ChantierProcurement;
}) {
  if (!procurement.paymentStatus) {
    return "—";
  }

  return (
    <span
      className={cn(
        "inline-flex border px-2 py-1 text-[11px] font-medium whitespace-nowrap",
        paymentStatusTone[procurement.paymentStatus],
      )}
    >
      {paymentStatusLabels[procurement.paymentStatus]}
    </span>
  );
}

function ProcurementDialog({
  draft,
  isSaving,
  onClose,
  onSave,
}: {
  draft: ProcurementDraft;
  isSaving: boolean;
  onClose: () => void;
  onSave: (input: CreateChantierProcurementInput) => Promise<void>;
}) {
  const [nextDraft, setNextDraft] = useState(draft);
  const [error, setError] = useState<string | null>(null);
  const isOrder = nextDraft.kind === "ORDER";
  const title = isOrder ? "Ajouter une commande" : "Ajouter un achat";

  const update = <Key extends keyof ProcurementDraft>(
    key: Key,
    value: ProcurementDraft[Key],
  ) => {
    setNextDraft((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!nextDraft.title.trim()) {
      setError(isOrder ? "Le titre est requis." : "L’article est requis.");
      return;
    }

    try {
      await onSave({
        addToShoppingList: isOrder ? false : nextDraft.addToShoppingList,
        description: isOrder ? nextDraft.description : "",
        forecastAmount: parseAmount(nextDraft.forecastAmount, {
          label: isOrder ? "Le montant prévisionnel" : "Le montant estimé",
          required: isOrder,
        }),
        kind: nextDraft.kind,
        orderStatus: isOrder ? nextDraft.orderStatus : null,
        orderedAt: isOrder ? nextDraft.orderedAt || null : null,
        paymentStatus: isOrder ? nextDraft.paymentStatus : null,
        plannedDeliveryDate: isOrder
          ? nextDraft.plannedDeliveryDate || null
          : null,
        ...(isOrder
          ? { quantity: null, quantityLabel: "" }
          : serializePurchaseQuantity(nextDraft.quantity)),
        supplier: nextDraft.supplier,
        title: nextDraft.title,
      });
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "L’enregistrement a échoué.",
      );
    }
  };

  return (
    <div
      aria-labelledby="procurement-dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center p-4"
      role="dialog"
    >
      <button
        aria-label="Fermer"
        className="absolute inset-0 cursor-default bg-black/30"
        onClick={onClose}
        type="button"
      />
      <div
        className={cn(
          "relative max-h-[calc(100dvh-2rem)] w-full overflow-y-auto bg-white shadow-xl",
          isOrder ? "max-w-[520px]" : "max-w-[420px]",
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <h2
            className="text-sm font-semibold text-gray-800"
            id="procurement-dialog-title"
          >
            {title}
          </h2>
          <button
            aria-label="Fermer"
            className="cursor-pointer text-gray-400 hover:text-gray-600"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </header>

        <form
          className="grid gap-3 px-6 py-4"
          onSubmit={(event) => void submit(event)}
        >
          <label className="grid gap-1">
            <span className="text-xs font-medium text-gray-500">
              {isOrder ? "Titre *" : "Article *"}
            </span>
            <input
              autoFocus
              className="border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-seno-700"
              onChange={(event) => update("title", event.target.value)}
              value={nextDraft.title}
            />
          </label>

          <div className={isOrder ? "grid" : "grid grid-cols-2 gap-3"}>
            {isOrder ? null : (
              <label className="grid gap-1">
                <span className="text-xs font-medium text-gray-500">
                  Quantité
                </span>
                <input
                  className="border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-seno-700"
                  maxLength={120}
                  placeholder="Ex. : 3 sacs"
                  onChange={(event) => update("quantity", event.target.value)}
                  value={nextDraft.quantity}
                />
              </label>
            )}

            <label className="grid gap-1">
              <span className="text-xs font-medium text-gray-500">
                {isOrder ? "Montant prévisionnel *" : "Montant estimé (€)"}
              </span>
              <input
                className="border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-seno-700"
                inputMode="decimal"
                onChange={(event) =>
                  update("forecastAmount", event.target.value)
                }
                value={nextDraft.forecastAmount}
              />
            </label>
          </div>

          <label className="grid gap-1">
            <span className="text-xs font-medium text-gray-500">
              Fournisseur
            </span>
            <input
              className="border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-seno-700"
              onChange={(event) => update("supplier", event.target.value)}
              value={nextDraft.supplier}
            />
          </label>

          {isOrder ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-xs font-medium text-gray-500">
                    Statut commande
                  </span>
                  <select
                    className="h-10 cursor-pointer border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
                    onChange={(event) =>
                      update("orderStatus", event.target.value as OrderStatus)
                    }
                    value={nextDraft.orderStatus}
                  >
                    {orderStatuses.map((status) => (
                      <option key={status} value={status}>
                        {orderStatusLabels[status]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-medium text-gray-500">
                    Statut paiement
                  </span>
                  <select
                    className="h-10 cursor-pointer border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
                    onChange={(event) =>
                      update(
                        "paymentStatus",
                        event.target.value as PaymentStatus,
                      )
                    }
                    value={nextDraft.paymentStatus}
                  >
                    {paymentStatuses.map((status) => (
                      <option key={status} value={status}>
                        {paymentStatusLabels[status]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-xs font-medium text-gray-500">
                    Date commande
                  </span>
                  <input
                    className="border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-seno-700"
                    onChange={(event) =>
                      update("orderedAt", event.target.value)
                    }
                    type="date"
                    value={nextDraft.orderedAt}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-medium text-gray-500">
                    Livraison prévue
                  </span>
                  <input
                    className="border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-seno-700"
                    onChange={(event) =>
                      update("plannedDeliveryDate", event.target.value)
                    }
                    type="date"
                    value={nextDraft.plannedDeliveryDate}
                  />
                </label>
              </div>
              <label className="grid gap-1">
                <span className="text-xs font-medium text-gray-500">
                  Description
                </span>
                <textarea
                  className="min-h-24 border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
                  onChange={(event) =>
                    update("description", event.target.value)
                  }
                  value={nextDraft.description}
                />
              </label>
            </>
          ) : (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                checked={nextDraft.addToShoppingList}
                className="size-4 accent-seno-700"
                onChange={(event) =>
                  update("addToShoppingList", event.target.checked)
                }
                type="checkbox"
              />
              Ajouter dans la liste de courses
            </label>
          )}

          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <footer className="mt-1 flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              className="h-10 cursor-pointer border border-slate-300 px-4 text-xs font-medium text-gray-500 transition-colors hover:bg-slate-50"
              onClick={onClose}
              type="button"
            >
              Annuler
            </button>
            <button
              className="cursor-pointer bg-seno-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-seno-800 disabled:cursor-wait disabled:opacity-60"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? "Ajout…" : "Ajouter"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

function Purchases({ detail }: { detail: ChantierDetail }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<ProcurementDraft | null>(null);
  const procurements = detail.procurements;
  const hasForecastAmount = procurements.some(
    (procurement) => procurement.forecastAmount !== null,
  );
  const forecastTotal = procurements.reduce(
    (total, procurement) => total + (procurement.forecastAmount ?? 0),
    0,
  );

  const createMutation = useMutation({
    mutationFn: async (input: CreateChantierProcurementInput) => {
      if (!user) {
        throw new Error("Utilisateur non disponible.");
      }

      await createChantierProcurement({
        chantierId: detail.chantier.id,
        input,
        userId: user.id,
      });
    },
    onSuccess: async () => {
      setDraft(null);
      await queryClient.invalidateQueries({
        queryKey: ["chantier", user?.id, detail.chantier.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["shopping-list", user?.id],
      });
    },
  });

  return (
    <div className="grid gap-5">
      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Total prévisionnel"
          value={hasForecastAmount ? formatAmount(forecastTotal) : "—"}
        />
        <MetricCard label="Total réel" value="—" />
        <MetricCard label="Écart" value="—" />
      </section>

      <section className="border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex flex-wrap gap-2">
            <button
              className="flex h-10 cursor-pointer items-center justify-center gap-2 border border-slate-300 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              onClick={() => setDraft(createProcurementDraft("PURCHASE"))}
              type="button"
            >
              <Plus aria-hidden="true" className="size-4" />
              Ajouter un achat
            </button>
            <button
              className="flex h-10 cursor-pointer items-center justify-center gap-2 bg-seno-700 px-3 text-sm font-medium text-white transition-colors hover:bg-seno-800"
              onClick={() => setDraft(createProcurementDraft("ORDER"))}
              type="button"
            >
              <Plus aria-hidden="true" className="size-4" />
              Ajouter une commande
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold tracking-[0.1em] text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Commande</th>
                <th className="px-4 py-3">Fournisseur</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Prévu</th>
                <th className="px-4 py-3 text-right">Réel</th>
                <th className="px-4 py-3">Livraison</th>
                <th className="px-4 py-3">Paiement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {procurements.map((procurement) => (
                <tr key={procurement.id}>
                  <td className="max-w-90 px-4 py-3">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {procurement.title}
                    </p>
                    {procurement.quantityLabel ||
                    procurement.quantity !== null ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Quantité :{" "}
                        {procurement.quantityLabel ||
                          procurement.quantity?.toLocaleString("fr-FR")}
                      </p>
                    ) : null}
                  </td>
                  <td className="max-w-60 px-4 py-3 text-sm text-slate-600">
                    <p className="truncate">{procurement.supplier || "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <ProcurementStatus procurement={procurement} />
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-slate-800">
                    {formatAmount(procurement.forecastAmount)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-slate-600">
                    —
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {formatTableDate(procurement.plannedDeliveryDate)}
                  </td>
                  <td className="px-4 py-3">
                    <ProcurementPayment procurement={procurement} />
                  </td>
                </tr>
              ))}
              {procurements.length === 0 ? (
                <tr>
                  <td className="px-5 py-14 text-center" colSpan={7}>
                    <p className="text-sm font-medium text-slate-800">
                      Aucun achat ni aucune commande pour le moment.
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Ajoutez une commande ou un achat pour démarrer le suivi.
                    </p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {draft ? (
        <ProcurementDialog
          draft={draft}
          isSaving={createMutation.isPending}
          onClose={() => {
            if (!createMutation.isPending) {
              setDraft(null);
            }
          }}
          onSave={(input) => createMutation.mutateAsync(input)}
        />
      ) : null}
    </div>
  );
}

type SubcontractorCommitmentDraft = {
  actualAmount: string;
  comment: string;
  dueDate: string;
  forecastAmount: string;
  paidAmount: string;
  paymentStatus: PaymentStatus;
  serviceDescription: string;
  subcontractorId: string;
};

function createSubcontractorCommitmentDraft(): SubcontractorCommitmentDraft {
  return {
    actualAmount: "",
    comment: "",
    dueDate: "",
    forecastAmount: "",
    paidAmount: "",
    paymentStatus: "UNPAID",
    serviceDescription: "",
    subcontractorId: "",
  };
}

function SubcontractorCommitmentDialog({
  detail,
  isSaving,
  onClose,
  onSave,
}: {
  detail: ChantierDetail;
  isSaving: boolean;
  onClose: () => void;
  onSave: (input: ChantierSubcontractorCommitmentInput) => Promise<void>;
}) {
  const [draft, setDraft] = useState(createSubcontractorCommitmentDraft);
  const [error, setError] = useState<string | null>(null);
  const availableSubcontractors = detail.availableSubcontractors.filter(
    (subcontractor) => !subcontractor.isArchived,
  );

  const update = <Key extends keyof SubcontractorCommitmentDraft>(
    key: Key,
    value: SubcontractorCommitmentDraft[Key],
  ) => setDraft((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!draft.subcontractorId) {
      setError("Sélectionnez l’entreprise ou l’artisan.");
      return;
    }

    try {
      const forecastAmount = parseAmount(draft.forecastAmount, {
        label: "Le montant prévisionnel",
        required: true,
      });
      const actualAmount = parseAmount(draft.actualAmount, {
        label: "Le montant réel",
        required: false,
      });
      const paidAmount = parseAmount(draft.paidAmount, {
        label: "Le montant payé",
        required: false,
      });

      await onSave({
        actualAmount,
        comment: draft.comment,
        dueDate: draft.dueDate || null,
        forecastAmount,
        paidAmount: paidAmount ?? 0,
        paymentStatus: draft.paymentStatus,
        serviceDescription: draft.serviceDescription,
        subcontractorId: draft.subcontractorId,
      });
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "L’enregistrement a échoué.",
      );
    }
  };

  return (
    <DetailDialog onClose={onClose} title="Ajouter un sous-traitant">
      <form className="grid gap-4 p-5" onSubmit={(event) => void submit(event)}>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-slate-700">
            Entreprise / artisan *
          </span>
          <select
            autoFocus
            className="h-10 cursor-pointer border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
            onChange={(event) => update("subcontractorId", event.target.value)}
            value={draft.subcontractorId}
          >
            <option value="">Sélectionner un sous-traitant</option>
            {availableSubcontractors.map((subcontractor) => (
              <option key={subcontractor.id} value={subcontractor.id}>
                {subcontractor.name}
              </option>
            ))}
          </select>
        </label>
        {availableSubcontractors.length === 0 ? (
          <p className="border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-900">
            Aucun sous-traitant n’est disponible. Ajoutez-le depuis la page
            Sous-traitants.
          </p>
        ) : null}
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-slate-700">Prestation</span>
          <input
            className="h-10 border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
            maxLength={2000}
            onChange={(event) =>
              update("serviceDescription", event.target.value)
            }
            value={draft.serviceDescription}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">
              Montant prévisionnel *
            </span>
            <input
              className="h-10 border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
              inputMode="decimal"
              onChange={(event) => update("forecastAmount", event.target.value)}
              value={draft.forecastAmount}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">
              Montant réel
            </span>
            <input
              className="h-10 border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
              inputMode="decimal"
              onChange={(event) => update("actualAmount", event.target.value)}
              value={draft.actualAmount}
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">
              Montant payé
            </span>
            <input
              className="h-10 border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
              inputMode="decimal"
              onChange={(event) => update("paidAmount", event.target.value)}
              value={draft.paidAmount}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">
              Statut paiement
            </span>
            <select
              className="h-10 cursor-pointer border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
              onChange={(event) =>
                update("paymentStatus", event.target.value as PaymentStatus)
              }
              value={draft.paymentStatus}
            >
              {paymentStatuses.map((status) => (
                <option key={status} value={status}>
                  {paymentStatusLabels[status]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-slate-700">Échéance</span>
          <input
            className="h-10 border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
            onChange={(event) => update("dueDate", event.target.value)}
            type="date"
            value={draft.dueDate}
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-slate-700">
            Commentaire
          </span>
          <textarea
            className="min-h-24 border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
            maxLength={4000}
            onChange={(event) => update("comment", event.target.value)}
            value={draft.comment}
          />
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <footer className="mt-1 flex justify-end gap-2 border-t border-slate-200 pt-4">
          <button
            className="h-10 cursor-pointer border border-slate-300 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            Annuler
          </button>
          <button
            className="h-10 cursor-pointer bg-seno-700 px-4 text-sm font-medium text-white transition-colors hover:bg-seno-800 disabled:cursor-wait disabled:opacity-60"
            disabled={isSaving || availableSubcontractors.length === 0}
            type="submit"
          >
            {isSaving ? "Ajout…" : "Ajouter"}
          </button>
        </footer>
      </form>
    </DetailDialog>
  );
}

function Subcontractors({ detail }: { detail: ChantierDetail }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const commitments = detail.subcontractorCommitments;
  const forecastTotal = commitments.reduce(
    (total, commitment) => total + (commitment.forecastAmount ?? 0),
    0,
  );
  const actualTotal = commitments.reduce(
    (total, commitment) => total + (commitment.actualAmount ?? 0),
    0,
  );
  const paidTotal = commitments.reduce(
    (total, commitment) => total + commitment.paidAmount,
    0,
  );
  const hasForecastAmount = commitments.some(
    (commitment) => commitment.forecastAmount !== null,
  );
  const hasActualAmount = commitments.some(
    (commitment) => commitment.actualAmount !== null,
  );

  const saveMutation = useMutation({
    mutationFn: async (input: ChantierSubcontractorCommitmentInput) => {
      if (!user) {
        throw new Error("Utilisateur non disponible.");
      }

      await saveChantierSubcontractorCommitment({
        chantierId: detail.chantier.id,
        input,
        userId: user.id,
      });
    },
    onSuccess: async () => {
      setIsDialogOpen(false);
      await queryClient.invalidateQueries({
        queryKey: ["chantier", user?.id, detail.chantier.id],
      });
    },
  });

  return (
    <div className="grid gap-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total prévu"
          value={hasForecastAmount ? formatAmount(forecastTotal) : "—"}
        />
        <MetricCard
          label="Total réel"
          value={hasActualAmount ? formatAmount(actualTotal) : "—"}
        />
        <MetricCard
          label="Total payé"
          value={commitments.length ? formatAmount(paidTotal) : "—"}
        />
        <MetricCard
          label="Reste à payer"
          value={
            hasActualAmount
              ? formatAmount(Math.max(actualTotal - paidTotal, 0))
              : "—"
          }
        />
      </section>
      <section className="border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <SectionTitle>Sous-traitants</SectionTitle>
          <button
            className="flex h-10 cursor-pointer items-center justify-center gap-2 bg-seno-700 px-3 text-sm font-medium text-white transition-colors hover:bg-seno-800"
            onClick={() => setIsDialogOpen(true)}
            type="button"
          >
            <Plus aria-hidden="true" className="size-4" />
            Ajouter un sous-traitant
          </button>
        </div>
        {commitments.length === 0 ? (
          <article className="border border-slate-200 bg-white p-5 lg:col-span-2">
            <p className="text-sm text-slate-600">
              Aucun sous-traitant n’est rattaché à ce chantier.
            </p>
          </article>
        ) : (
          <div className="grid gap-px bg-slate-200 lg:grid-cols-2">
            {commitments.map((commitment) => (
              <article
                className="bg-white p-5"
                key={commitment.subcontractor.id}
              >
                <div>
                  <p className="text-base font-semibold tracking-[-0.02em] text-slate-900">
                    {commitment.subcontractor.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {commitment.serviceDescription ||
                      "Prestation non renseignée"}
                  </p>
                </div>
                <dl className="mt-5 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-[11px] font-medium text-slate-500">
                      Prévu
                    </dt>
                    <dd className="mt-1 text-slate-800">
                      {formatAmount(commitment.forecastAmount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium text-slate-500">
                      Réel
                    </dt>
                    <dd className="mt-1 text-slate-800">
                      {formatAmount(commitment.actualAmount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium text-slate-500">
                      Payé
                    </dt>
                    <dd className="mt-1 text-slate-800">
                      {formatAmount(commitment.paidAmount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium text-slate-500">
                      Paiement
                    </dt>
                    <dd className="mt-1">
                      <span
                        className={cn(
                          "inline-flex border px-2 py-1 text-[11px] font-medium",
                          paymentStatusTone[commitment.paymentStatus],
                        )}
                      >
                        {paymentStatusLabels[commitment.paymentStatus]}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium text-slate-500">
                      Échéance
                    </dt>
                    <dd className="mt-1 text-slate-800">
                      {formatTableDate(commitment.dueDate)}
                    </dd>
                  </div>
                </dl>
                {commitment.comment ? (
                  <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">
                    {commitment.comment}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
      {saveMutation.isError ? (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          L’enregistrement a échoué. Réessayez dans un instant.
        </p>
      ) : null}
      {isDialogOpen ? (
        <SubcontractorCommitmentDialog
          detail={detail}
          isSaving={saveMutation.isPending}
          onClose={() => {
            if (!saveMutation.isPending) {
              setIsDialogOpen(false);
            }
          }}
          onSave={(input) => saveMutation.mutateAsync(input)}
        />
      ) : null}
    </div>
  );
}

type AdjustmentDraft = {
  amount: string;
  description: string;
  kind: AdjustmentKind;
  label: string;
  occurredOn: string;
  status: AdjustmentStatus;
};

function createAdjustmentDraft(
  adjustment?: ChantierAdjustment,
): AdjustmentDraft {
  return {
    amount: adjustment ? String(adjustment.amount) : "",
    description: adjustment?.description ?? "",
    kind: adjustment?.kind ?? "PLUS",
    label: adjustment?.label ?? "",
    occurredOn: adjustment
      ? (adjustment.occurredOn ?? "")
      : new Date().toISOString().slice(0, 10),
    status: adjustment?.status ?? "PROPOSED",
  };
}

function AdjustmentDialog({
  adjustment,
  isDeleting,
  isSaving,
  onClose,
  onDelete,
  onRestoreFocus,
  onSave,
}: {
  adjustment?: ChantierAdjustment;
  isDeleting: boolean;
  isSaving: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
  onRestoreFocus: () => void;
  onSave: (input: ChantierAdjustmentInput) => Promise<void>;
}) {
  const [originalDraft] = useState(() => createAdjustmentDraft(adjustment));
  const [draft, setDraft] = useState(originalDraft);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const actionLock = useRef(false);
  const isEditing = Boolean(adjustment);
  const isBusy = isSaving || isDeleting;
  const hasChanges = (Object.keys(draft) as (keyof AdjustmentDraft)[]).some(
    (key) => draft[key] !== originalDraft[key],
  );

  const update = <Key extends keyof AdjustmentDraft>(
    key: Key,
    value: AdjustmentDraft[Key],
  ) => setDraft((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      isBusy ||
      actionLock.current ||
      isConfirmingDelete ||
      (isEditing && !hasChanges)
    )
      return;
    setError(null);

    if (!draft.label.trim()) {
      setError("Le libellé est requis.");
      return;
    }

    try {
      const amount = parseAmount(draft.amount, {
        label: "Le montant",
        required: true,
      });
      actionLock.current = true;
      await onSave({
        amount: amount ?? 0,
        description: draft.description,
        kind: draft.kind,
        label: draft.label,
        occurredOn: draft.occurredOn || null,
        status: draft.status,
      });
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "L’enregistrement a échoué.",
      );
    } finally {
      actionLock.current = false;
    }
  };

  const remove = async () => {
    if (!adjustment || !isConfirmingDelete || isBusy || actionLock.current)
      return;
    actionLock.current = true;
    setError(null);
    try {
      await onDelete();
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "La suppression a échoué.",
      );
    } finally {
      actionLock.current = false;
    }
  };

  const form = (
    <form className="grid gap-4 p-5" onSubmit={(event) => void submit(event)}>
      <fieldset
        className="grid min-w-0 gap-4"
        disabled={isBusy || isConfirmingDelete}
      >
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-slate-700">Libellé *</span>
          <input
            autoFocus
            className="h-10 border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
            maxLength={240}
            onChange={(event) => update("label", event.target.value)}
            value={draft.label}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">Type</span>
            <select
              className="h-10 cursor-pointer border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
              onChange={(event) =>
                update("kind", event.target.value as AdjustmentKind)
              }
              value={draft.kind}
            >
              {adjustmentKinds.map((kind) => (
                <option key={kind} value={kind}>
                  {adjustmentKindLabels[kind]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">
              Montant (€) *
            </span>
            <input
              className="h-10 border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
              inputMode="decimal"
              onChange={(event) => update("amount", event.target.value)}
              value={draft.amount}
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">Statut</span>
            <select
              className="h-10 cursor-pointer border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
              onChange={(event) =>
                update("status", event.target.value as AdjustmentStatus)
              }
              value={draft.status}
            >
              {adjustmentStatuses.map((status) => (
                <option key={status} value={status}>
                  {adjustmentStatusLabels[status]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-700">Date</span>
            <input
              className="h-10 border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
              onChange={(event) => update("occurredOn", event.target.value)}
              type="date"
              value={draft.occurredOn}
            />
          </label>
        </div>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-slate-700">
            Description
          </span>
          <textarea
            className="min-h-24 border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
            maxLength={4000}
            onChange={(event) => update("description", event.target.value)}
            value={draft.description}
          />
        </label>
      </fieldset>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {isConfirmingDelete ? (
        <div className="grid gap-3 border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-900">
            Supprimer « {adjustment?.label} » ? Cette action est définitive.
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              className="h-10 cursor-pointer border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isBusy}
              onClick={() => setIsConfirmingDelete(false)}
              type="button"
            >
              Annuler la suppression
            </button>
            <button
              className="h-10 cursor-pointer bg-red-700 px-4 text-sm font-medium text-white hover:bg-red-800 disabled:cursor-wait disabled:opacity-60"
              disabled={isBusy}
              onClick={() => void remove()}
              type="button"
            >
              {isDeleting ? "Suppression…" : "Confirmer la suppression"}
            </button>
          </div>
        </div>
      ) : (
        <footer className="mt-1 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
          {isEditing ? (
            <button
              className="mr-auto flex h-10 cursor-pointer items-center gap-2 border border-red-200 px-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isBusy}
              onClick={() => {
                setError(null);
                setIsConfirmingDelete(true);
              }}
              type="button"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Supprimer
            </button>
          ) : null}
          <button
            className="h-10 cursor-pointer border border-slate-300 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isBusy}
            onClick={onClose}
            type="button"
          >
            Annuler
          </button>
          <button
            className="h-10 cursor-pointer bg-seno-700 px-4 text-sm font-medium text-white transition-colors hover:bg-seno-800 disabled:cursor-wait disabled:opacity-60"
            disabled={isBusy || (isEditing && !hasChanges)}
            type="submit"
          >
            {isSaving
              ? "Enregistrement…"
              : isEditing
                ? "Enregistrer"
                : "Ajouter"}
          </button>
        </footer>
      )}
    </form>
  );

  if (!adjustment)
    return (
      <DetailDialog onClose={onClose} title="Ajouter un élément">
        {form}
      </DetailDialog>
    );

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !isBusy && !actionLock.current) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/35" />
        <Dialog.Content
          className="fixed inset-y-0 right-0 z-50 flex h-dvh w-full flex-col border-l border-slate-200 bg-white shadow-2xl outline-none sm:max-w-xl"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            onRestoreFocus();
          }}
        >
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div>
              <Dialog.Title className="text-lg font-semibold tracking-[-0.02em] text-slate-900">
                {adjustment.kind === "PLUS"
                  ? "Modifier la plus-value"
                  : "Modifier la moins-value"}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-slate-500">
                {adjustment.label}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Fermer"
              className="grid size-9 shrink-0 cursor-pointer place-items-center border border-slate-300 text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isBusy}
            >
              <X aria-hidden="true" className="size-4" />
            </Dialog.Close>
          </header>
          <div className="min-h-0 overflow-y-auto">{form}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Adjustments({ detail }: { detail: ChantierDetail }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editor, setEditor] = useState<{
    adjustment?: ChantierAdjustment;
  } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const editorTrigger = useRef<HTMLTableRowElement | null>(null);
  const addButton = useRef<HTMLButtonElement | null>(null);
  const saveMutation = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id?: string;
      input: ChantierAdjustmentInput;
    }) => {
      if (!user) {
        throw new Error("Utilisateur non disponible.");
      }

      await saveChantierAdjustment({
        chantierId: detail.chantier.id,
        id,
        input,
        userId: user.id,
      });
    },
    onSuccess: async () => {
      setEditor(null);
      await queryClient.invalidateQueries({
        queryKey: ["chantier", user?.id, detail.chantier.id],
      });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Utilisateur non disponible.");
      await deleteChantierAdjustment(id);
    },
    onSuccess: async () => {
      editorTrigger.current = null;
      setEditor(null);
      await queryClient.invalidateQueries({
        queryKey: ["chantier", user?.id, detail.chantier.id],
      });
    },
  });
  const openEditor = (
    adjustment?: ChantierAdjustment,
    trigger?: HTMLTableRowElement,
  ) => {
    editorTrigger.current = trigger ?? null;
    saveMutation.reset();
    deleteMutation.reset();
    setEditor({ adjustment });
  };

  return (
    <div className="grid gap-5">
      <section className="border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div>
            <SectionTitle>Plus / moins-values</SectionTitle>
            <p className="mt-1 text-sm text-slate-500">
              Seules les variations acceptées modifient le devis.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="flex h-10 cursor-pointer items-center justify-center gap-2 border border-slate-300 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              onClick={() => setIsPreviewOpen(true)}
              type="button"
            >
              <FileText aria-hidden="true" className="size-4" />
              Voir le devis modifié
            </button>
            <button
              className="flex h-10 cursor-pointer items-center justify-center gap-2 bg-seno-700 px-3 text-sm font-medium text-white transition-colors hover:bg-seno-800"
              onClick={() => openEditor()}
              ref={addButton}
              type="button"
            >
              <Plus aria-hidden="true" className="size-4" />
              Ajouter un élément
            </button>
          </div>
        </div>
        {detail.adjustments.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold tracking-[0.1em] text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Libellé</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Montant</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {detail.adjustments.map((adjustment) => (
                  <tr
                    aria-haspopup="dialog"
                    className="cursor-pointer transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-seno-700"
                    key={adjustment.id}
                    onClick={(event) => {
                      event.currentTarget.focus();
                      openEditor(adjustment, event.currentTarget);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openEditor(adjustment, event.currentTarget);
                      }
                    }}
                    tabIndex={0}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-900">
                        {adjustment.label}
                      </p>
                      {adjustment.description ? (
                        <p className="mt-1 max-w-lg text-xs text-slate-500">
                          {adjustment.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {adjustmentKindLabels[adjustment.kind]}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right text-sm font-medium",
                        adjustment.kind === "PLUS"
                          ? "text-emerald-700"
                          : "text-red-700",
                      )}
                    >
                      {adjustment.kind === "PLUS" ? "+" : "−"}
                      {formatAmount(adjustment.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex border px-2 py-1 text-[11px] font-medium whitespace-nowrap",
                          adjustmentStatusTone[adjustment.status],
                        )}
                      >
                        {adjustmentStatusLabels[adjustment.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {formatTableDate(adjustment.occurredOn)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-8 text-sm text-slate-600">
            Aucun élément n’est renseigné pour ce chantier.
          </p>
        )}
      </section>
      {saveMutation.isError && !editor ? (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          L’enregistrement a échoué. Réessayez dans un instant.
        </p>
      ) : null}
      {isPreviewOpen ? (
        <Suspense
          fallback={
            <DetailDialog
              onClose={() => setIsPreviewOpen(false)}
              title="Devis modifié"
            >
              <p className="p-5 text-sm text-slate-500">
                Chargement de l’aperçu…
              </p>
            </DetailDialog>
          }
        >
          <ModifiedQuotePreview
            detail={detail}
            onClose={() => setIsPreviewOpen(false)}
          />
        </Suspense>
      ) : null}
      {editor ? (
        <AdjustmentDialog
          adjustment={editor.adjustment}
          isDeleting={deleteMutation.isPending}
          isSaving={saveMutation.isPending}
          key={editor.adjustment?.id ?? "new"}
          onClose={() => {
            if (!saveMutation.isPending && !deleteMutation.isPending) {
              setEditor(null);
            }
          }}
          onDelete={() =>
            editor.adjustment
              ? deleteMutation.mutateAsync(editor.adjustment.id)
              : Promise.resolve()
          }
          onRestoreFocus={() => {
            if (editorTrigger.current?.isConnected)
              editorTrigger.current.focus();
            else addButton.current?.focus();
          }}
          onSave={(input) =>
            saveMutation.mutateAsync({ id: editor.adjustment?.id, input })
          }
        />
      ) : null}
    </div>
  );
}

type ChantierDocumentDraft = {
  category: ChantierDocumentCategory;
  name: string;
};

type ChantierDocumentUploadInput = {
  file: File;
  input: ChantierDocumentInput;
};

function DocumentDialog({
  isSaving,
  onClose,
  onSave,
}: {
  isSaving: boolean;
  onClose: () => void;
  onSave: (input: ChantierDocumentUploadInput) => Promise<void>;
}) {
  const [draft, setDraft] = useState<ChantierDocumentDraft>({
    category: "OTHER",
    name: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!draft.name.trim()) {
      setError("Le nom du document est requis.");
      return;
    }

    if (!file) {
      setError("Sélectionnez le fichier à ajouter.");
      return;
    }

    try {
      await onSave({ file, input: draft });
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "L’enregistrement a échoué.",
      );
    }
  };

  return (
    <DetailDialog onClose={onClose} title="Ajouter un document">
      <form className="grid gap-4 p-5" onSubmit={(event) => void submit(event)}>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-slate-700">
            Nom du document *
          </span>
          <input
            autoFocus
            className="h-10 border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
            maxLength={240}
            onChange={(event) =>
              setDraft((current) => ({ ...current, name: event.target.value }))
            }
            value={draft.name}
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-slate-700">Catégorie</span>
          <select
            className="h-10 cursor-pointer border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                category: event.target.value as ChantierDocumentCategory,
              }))
            }
            value={draft.category}
          >
            {chantierDocumentCategories.map((category) => (
              <option key={category} value={category}>
                {documentCategoryLabels[category]}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-1.5">
          <span className="text-sm font-medium text-slate-700">Fichier *</span>
          <input
            className="sr-only"
            id="chantier-document-file"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            type="file"
          />
          <label
            className="flex min-h-10 cursor-pointer items-center gap-2 border border-slate-300 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
            htmlFor="chantier-document-file"
          >
            <Upload
              aria-hidden="true"
              className="size-4 shrink-0 text-slate-500"
            />
            <span className="truncate">
              {file ? file.name : "Sélectionner un fichier"}
            </span>
          </label>
          <p className="text-xs text-slate-500">20 Mo maximum.</p>
        </div>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <footer className="mt-1 flex justify-end gap-2 border-t border-slate-200 pt-4">
          <button
            className="h-10 cursor-pointer border border-slate-300 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            Annuler
          </button>
          <button
            className="h-10 cursor-pointer bg-seno-700 px-4 text-sm font-medium text-white transition-colors hover:bg-seno-800 disabled:cursor-wait disabled:opacity-60"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? "Ajout…" : "Ajouter"}
          </button>
        </footer>
      </form>
    </DetailDialog>
  );
}

function Documents({ detail }: { detail: ChantierDetail }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const initialQuoteDocumentMutation = useMutation({
    mutationFn: getQuoteDocumentUrl,
  });
  const chantierDocumentMutation = useMutation({
    mutationFn: getChantierDocumentUrl,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const saveDocumentMutation = useMutation({
    mutationFn: async ({ file, input }: ChantierDocumentUploadInput) => {
      if (!user) {
        throw new Error("Utilisateur non disponible.");
      }

      await saveChantierDocument({
        chantierId: detail.chantier.id,
        file,
        input,
        userId: user.id,
      });
    },
    onSuccess: async () => {
      setIsDialogOpen(false);
      await queryClient.invalidateQueries({
        queryKey: ["chantier", user?.id, detail.chantier.id],
      });
    },
  });

  const openInitialQuote = (path: string) => {
    initialQuoteDocumentMutation.mutate(path, {
      onSuccess: (signedUrl) => {
        window.open(signedUrl, "_blank", "noopener,noreferrer");
      },
    });
  };

  const openChantierDocument = (path: string) => {
    chantierDocumentMutation.mutate(path, {
      onSuccess: (signedUrl) => {
        window.open(signedUrl, "_blank", "noopener,noreferrer");
      },
    });
  };

  return (
    <div className="grid gap-5">
      <section className="border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <SectionTitle>Documents</SectionTitle>
          <button
            className="flex h-10 cursor-pointer items-center justify-center gap-2 bg-seno-700 px-3 text-sm font-medium text-white transition-colors hover:bg-seno-800"
            onClick={() => setIsDialogOpen(true)}
            type="button"
          >
            <Plus aria-hidden="true" className="size-4" />
            Ajouter un document
          </button>
        </div>
        {detail.initialQuote ? (
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <FileText
                aria-hidden="true"
                className="size-5 shrink-0 text-seno-700"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {detail.initialQuote.documentName}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Devis {detail.initialQuote.quoteNumber}
                  {detail.initialQuote.title
                    ? ` · ${detail.initialQuote.title}`
                    : ""}
                </p>
              </div>
            </div>
            <button
              className="h-9 shrink-0 cursor-pointer border border-slate-300 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
              disabled={initialQuoteDocumentMutation.isPending}
              onClick={() =>
                openInitialQuote(detail.initialQuote!.documentPath)
              }
              type="button"
            >
              {initialQuoteDocumentMutation.isPending ? "Ouverture…" : "Ouvrir"}
            </button>
          </div>
        ) : null}
        {detail.documents.length ? (
          <ul className="divide-y divide-slate-100">
            {detail.documents.map((document) => (
              <li
                className="flex items-center gap-3 px-5 py-4"
                key={document.id}
              >
                <FileText
                  aria-hidden="true"
                  className="size-5 shrink-0 text-slate-400"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {document.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {documentCategoryLabels[document.category]}
                    {document.fileName ? ` · ${document.fileName}` : ""}
                  </p>
                </div>
                {document.filePath ? (
                  <button
                    className="ml-auto h-9 shrink-0 cursor-pointer border border-slate-300 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
                    disabled={chantierDocumentMutation.isPending}
                    onClick={() => openChantierDocument(document.filePath!)}
                    type="button"
                  >
                    {chantierDocumentMutation.isPending
                      ? "Ouverture…"
                      : "Ouvrir"}
                  </button>
                ) : (
                  <span className="ml-auto shrink-0 text-xs text-slate-400">
                    Fichier indisponible
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : !detail.initialQuote ? (
          <p className="px-5 py-8 text-sm text-slate-600">
            Aucun document n’est rattaché à ce chantier.
          </p>
        ) : null}
      </section>
      {initialQuoteDocumentMutation.isError ||
      chantierDocumentMutation.isError ? (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Le document n’a pas pu être ouvert. Réessayez dans un instant.
        </p>
      ) : null}
      {saveDocumentMutation.isError ? (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          L’enregistrement a échoué. Réessayez dans un instant.
        </p>
      ) : null}
      {isDialogOpen ? (
        <DocumentDialog
          isSaving={saveDocumentMutation.isPending}
          onClose={() => {
            if (!saveDocumentMutation.isPending) {
              setIsDialogOpen(false);
            }
          }}
          onSave={(input) => saveDocumentMutation.mutateAsync(input)}
        />
      ) : null}
    </div>
  );
}

function Finances({ detail }: { detail: ChantierDetail }) {
  const initialQuoteAmount = detail.chantier.initialSignedQuoteAmount;
  const acceptedAdjustmentImpact = detail.adjustments
    .filter((adjustment) => adjustment.status === "ACCEPTED")
    .reduce(
      (total, adjustment) =>
        total +
        (adjustment.kind === "PLUS" ? adjustment.amount : -adjustment.amount),
      0,
    );
  const revisedQuoteAmount =
    initialQuoteAmount === null
      ? null
      : initialQuoteAmount + acceptedAdjustmentImpact;
  const estimatedProcurementCost = detail.procurements.reduce(
    (total, procurement) => total + (procurement.forecastAmount ?? 0),
    0,
  );
  const hasEstimatedProcurementCost = detail.procurements.some(
    (procurement) => procurement.forecastAmount !== null,
  );
  const estimatedSubcontractingCost = detail.subcontractorCommitments.reduce(
    (total, commitment) => total + (commitment.forecastAmount ?? 0),
    0,
  );
  const hasEstimatedSubcontractingCost = detail.subcontractorCommitments.some(
    (commitment) => commitment.forecastAmount !== null,
  );
  const actualSubcontractingCost = detail.subcontractorCommitments.reduce(
    (total, commitment) => total + (commitment.actualAmount ?? 0),
    0,
  );
  const hasActualSubcontractingCost = detail.subcontractorCommitments.some(
    (commitment) => commitment.actualAmount !== null,
  );
  const collectedDeposits = detail.deposits
    .filter((deposit) => deposit.status === "COLLECTED")
    .reduce((total, deposit) => total + deposit.amount, 0);
  const hasCollectedDeposit = detail.deposits.some(
    (deposit) => deposit.status === "COLLECTED",
  );

  return (
    <div className="grid gap-5">
      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Devis initial"
          value={formatAmount(initialQuoteAmount)}
        />
        <MetricCard
          label="Devis modifié"
          value={formatAmount(revisedQuoteAmount)}
        />
        <MetricCard
          label="Acomptes encaissés"
          value={hasCollectedDeposit ? formatAmount(collectedDeposits) : "—"}
        />
      </section>
      <section className="border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <SectionTitle>Devis initial vs suivi réel chantier</SectionTitle>
          <p className="mt-1 text-sm text-slate-500">
            Le réel est affiché uniquement lorsqu’il a été renseigné.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[660px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold tracking-[0.1em] text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Poste</th>
                <th className="px-4 py-3 text-right">Prévisionnel</th>
                <th className="px-4 py-3 text-right">Réel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                  Sous-traitance
                </td>
                <td className="px-4 py-3 text-right text-sm text-slate-700">
                  {hasEstimatedSubcontractingCost
                    ? formatAmount(estimatedSubcontractingCost)
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right text-sm text-slate-700">
                  {hasActualSubcontractingCost
                    ? formatAmount(actualSubcontractingCost)
                    : "—"}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                  Achats & commandes
                </td>
                <td className="px-4 py-3 text-right text-sm text-slate-700">
                  {hasEstimatedProcurementCost
                    ? formatAmount(estimatedProcurementCost)
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right text-sm text-slate-500">
                  Non renseigné
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                  Acomptes
                </td>
                <td className="px-4 py-3 text-right text-sm text-slate-500">
                  —
                </td>
                <td className="px-4 py-3 text-right text-sm text-slate-700">
                  {hasCollectedDeposit ? formatAmount(collectedDeposits) : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function DetailContent({ detail }: { detail: ChantierDetail }) {
  const [activeTab, setActiveTab] = useState<ChantierTab>("OVERVIEW");
  const { chantier } = detail;

  return (
    <main className="min-w-0 flex-1 overflow-auto bg-background">
      <header className="border-b border-gray-200 bg-white">
        <div className="px-4 pt-4 sm:px-6">
          <Link
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 transition-colors hover:text-seno-700"
            to="/chantiers"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Retour aux chantiers
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900">
              {chantier.name}
            </h1>
            <StatusBadge status={chantier.status} />
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {chantier.clientName} ·{" "}
            {chantier.address || "Adresse non renseignée"}
          </p>
          <nav
            aria-label="Navigation de la fiche chantier"
            className="mt-4 -mx-4 overflow-x-auto sm:-mx-6"
          >
            <div className="flex min-w-max px-4 sm:px-6">
              {tabs.map((tab) => (
                <button
                  className={cn(
                    "cursor-pointer border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors",
                    activeTab === tab.id
                      ? "border-seno-700 text-seno-700"
                      : "border-transparent text-gray-500 hover:text-gray-700",
                  )}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>

      <div className="px-4 py-6 sm:px-6">
        {activeTab === "OVERVIEW" ? <Overview detail={detail} /> : null}
        {activeTab === "PURCHASES" ? <Purchases detail={detail} /> : null}
        {activeTab === "SUBCONTRACTORS" ? (
          <Subcontractors detail={detail} />
        ) : null}
        {activeTab === "ADJUSTMENTS" ? <Adjustments detail={detail} /> : null}
        {activeTab === "DOCUMENTS" ? <Documents detail={detail} /> : null}
        {activeTab === "FINANCES" ? <Finances detail={detail} /> : null}
      </div>
    </main>
  );
}

function DetailState({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-w-0 flex-1 overflow-auto bg-[#f7f8f9]">
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-7">
        <Link
          className="inline-flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-seno-700"
          to="/chantiers"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Retour aux chantiers
        </Link>
        <div className="mt-5 border border-slate-200 bg-white p-5">
          {children}
        </div>
      </div>
    </main>
  );
}

export function ChantierDetailPage({ chantierId }: { chantierId: string }) {
  const { user } = useAuth();
  const detailQuery = useQuery({
    enabled: Boolean(user) && chantierId !== "nouveau",
    queryFn: () => getChantierDetail(chantierId),
    queryKey: ["chantier", user?.id, chantierId],
  });

  if (chantierId === "nouveau") {
    return <ChantierCreatePage />;
  }

  if (detailQuery.isPending) {
    return (
      <DetailState>
        <div className="h-40 animate-pulse bg-slate-100" />
      </DetailState>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <DetailState>
        <p className="text-sm text-slate-700">
          {detailQuery.isError
            ? "Impossible de charger ce chantier. Réessayez dans un instant."
            : "Ce chantier est introuvable ou n’est plus accessible."}
        </p>
      </DetailState>
    );
  }

  return (
    <DetailContent
      detail={detailQuery.data}
      key={detailQuery.data.chantier.id}
    />
  );
}
