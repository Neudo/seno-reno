import { useId, type ReactNode } from "react";
import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";

import type { ContractParty } from "@/features/outils/subcontracting/contract-data";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

type FieldPresentation = {
  label: string;
  maxLength?: number;
  optional?: boolean;
  type?: "text" | "date" | "multiline";
};

export function ContractField<T extends FieldValues>({
  form,
  label,
  name,
  maxLength,
  optional,
  type = "text",
}: FieldPresentation & { form: UseFormReturn<T>; name: FieldPath<T> }) {
  const id = useId();
  const error = form.getFieldState(name, form.formState).error;
  const inputProps = {
    ...form.register(name),
    id,
    maxLength,
    required: !optional,
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? `${id}-error` : undefined,
  };

  return (
    <div className="grid min-w-0 content-start gap-1.5">
      <Label className="leading-5" htmlFor={id}>
        {label}
        {optional ? (
          <span className="text-xs font-normal text-muted-foreground">
            Facultatif
          </span>
        ) : null}
      </Label>
      {type === "multiline" ? (
        <textarea
          className="min-h-20 w-full resize-y border border-input bg-transparent px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive md:text-sm"
          {...inputProps}
        />
      ) : (
        <Input type={type} {...inputProps} />
      )}
      {error ? (
        <p className="text-xs text-destructive" id={`${id}-error`}>
          {error.message}
        </p>
      ) : null}
    </div>
  );
}

export function FormSection({
  title,
  heading: Heading = "h3",
  children,
}: {
  title: string;
  heading?: "h2" | "h3";
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      className="min-w-0 border border-border bg-card"
    >
      <Heading
        className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground sm:px-5"
        id={id}
      >
        {title}
      </Heading>
      <div className="grid gap-4 p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function PartyFields({
  renderField,
}: {
  renderField: (
    field: keyof ContractParty,
    presentation: FieldPresentation,
  ) => ReactNode;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {renderField("name", { label: "Raison sociale", maxLength: 120 })}
        {renderField("legalForm", { label: "Forme juridique", maxLength: 100 })}
      </div>
      {renderField("address", {
        label: "Adresse du siège social",
        maxLength: 320,
        type: "multiline",
      })}
      <div className="grid gap-4 sm:grid-cols-2">
        {renderField("registryCity", { label: "Ville du RCS", maxLength: 100 })}
        {renderField("registrationNumber", {
          label: "Numéro RCS",
          maxLength: 50,
        })}
      </div>
      {renderField("capital", {
        label: "Capital social (montant et devise)",
        maxLength: 60,
        optional: true,
      })}
    </>
  );
}
