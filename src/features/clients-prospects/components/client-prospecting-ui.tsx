import type { ReactNode } from "react";
import { Copy, Mail, Phone, X } from "lucide-react";

import type {
  ClientRecord,
  ProspectRecord,
  ProspectPriority,
  ProspectStatus,
  SourceKind,
} from "@/features/clients-prospects/api/client-prospecting-api";
import { cn } from "@/shared/lib/utils";

export const sourceLabels: Record<SourceKind, string> = {
  EVENT: "Événement",
  FORMER_CLIENT: "Ancien client",
  INSTAGRAM: "Instagram",
  LINKEDIN: "LinkedIn",
  OTHER: "Autre",
  PROFESSIONAL_NETWORK: "Réseau professionnel",
  RECOMMENDATION: "Recommandation",
  WEBSITE: "Site internet",
};

export const prospectStatusLabels: Record<ProspectStatus, string> = {
  CLOSED: "Sans suite",
  CONTACTED: "Contacté",
  CONVERTED: "Converti en client",
  IN_DISCUSSION: "En discussion",
  NEW: "Nouveau",
  TO_CONTACT: "À contacter",
  TO_FOLLOW_UP: "À relancer",
};

export const priorityLabels: Record<ProspectPriority, string> = {
  HIGH: "Haute",
  LOW: "Basse",
  MEDIUM: "Moyenne",
};

export function getClientName(client: ClientRecord) {
  if (client.kind === "COMPANY") {
    return client.companyName;
  }

  return `${client.firstName} ${client.lastName}`.trim();
}

export function getProspectName(prospect: ProspectRecord) {
  if (prospect.kind === "COMPANY") {
    return prospect.companyName;
  }

  return `${prospect.firstName} ${prospect.lastName}`.trim();
}

export function getLocation(city: string, postalCode = "") {
  return [postalCode, city].filter(Boolean).join(" ") || "—";
}

export function formatDate(date: string | null) {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

export function ContactDetails({
  email,
  phone,
}: {
  email: string;
  phone: string;
}) {
  const copy = async (value: string) => {
    if (!value || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(value);
  };

  return (
    <div className="grid gap-1 text-xs text-slate-600">
      {email ? (
        <span className="flex min-w-0 items-center gap-1.5">
          <Mail aria-hidden="true" className="size-3 shrink-0 text-slate-400" />
          <span className="truncate">{email}</span>
          <button
            aria-label="Copier l’email"
            className="grid size-5 shrink-0 cursor-pointer place-items-center text-slate-400 hover:text-seno-700"
            onClick={(event) => {
              event.stopPropagation();
              void copy(email);
            }}
            type="button"
          >
            <Copy aria-hidden="true" className="size-3" />
          </button>
        </span>
      ) : null}
      {phone ? (
        <span className="flex min-w-0 items-center gap-1.5">
          <Phone
            aria-hidden="true"
            className="size-3 shrink-0 text-slate-400"
          />
          <span>{phone}</span>
          <button
            aria-label="Copier le téléphone"
            className="grid size-5 shrink-0 cursor-pointer place-items-center text-slate-400 hover:text-seno-700"
            onClick={(event) => {
              event.stopPropagation();
              void copy(phone);
            }}
            type="button"
          >
            <Copy aria-hidden="true" className="size-3" />
          </button>
        </span>
      ) : null}
      {!email && !phone ? <span>—</span> : null}
    </div>
  );
}

export function ProspectStatusBadge({ status }: { status: ProspectStatus }) {
  return (
    <span
      className={cn(
        "inline-flex px-2 py-1 text-xs font-medium",
        status === "TO_FOLLOW_UP" && "bg-amber-50 text-amber-800",
        status === "IN_DISCUSSION" && "bg-violet-50 text-violet-700",
        status === "CONTACTED" && "bg-sky-50 text-sky-700",
        status === "CONVERTED" && "bg-emerald-50 text-emerald-700",
        status === "CLOSED" && "bg-slate-100 text-slate-500",
        (status === "NEW" || status === "TO_CONTACT") &&
          "bg-slate-100 text-slate-700",
      )}
    >
      {prospectStatusLabels[status]}
    </span>
  );
}

export function PriorityDot({ priority }: { priority: ProspectPriority }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
      <span
        className={cn(
          "size-2 rounded-full",
          priority === "HIGH" && "bg-red-500",
          priority === "MEDIUM" && "bg-amber-400",
          priority === "LOW" && "bg-slate-300",
        )}
      />
      {priorityLabels[priority]}
    </span>
  );
}

export function Drawer({
  children,
  error,
  isSaving,
  onClose,
  onSave,
  title,
}: {
  children: ReactNode;
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
              CLIENTS &amp; PROSPECTS
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
          <p
            className="mx-5 mb-3 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
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

export function FieldLabel({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}

export const inputClassName =
  "h-10 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15";

export const textareaClassName =
  "min-h-24 w-full resize-y border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-seno-700 focus:ring-2 focus:ring-seno-700/15";
