import { zodResolver } from "@hookform/resolvers/zod";
import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Save } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useAuth } from "@/features/auth/context/AuthProvider";
import {
  contractSettingsKey,
  getContractSettings,
  saveContractSettings,
} from "@/features/outils/api/subcontractor-contract-settings-api";
import {
  ContractField,
  FormSection,
  PartyFields,
} from "@/features/outils/subcontracting/ContractFormFields";
import {
  contractSettingsSchema,
  getContractSettingsDefaults,
  type ContractSettings,
} from "@/features/outils/subcontracting/contract-data";
import { Button } from "@/shared/components/ui/button";

function SettingsForm({
  initial,
  userId,
}: {
  initial: ContractSettings | null;
  userId: string;
}) {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<"saved" | "error" | null>(null);
  const form = useForm<ContractSettings>({
    defaultValues: initial ?? getContractSettingsDefaults(),
    resolver: zodResolver(contractSettingsSchema),
  });
  const { isSubmitting, isDirty } = form.formState;
  const submit = form.handleSubmit(async (values) => {
    setFeedback(null);
    try {
      const saved = await saveContractSettings(userId, values);
      queryClient.setQueryData(contractSettingsKey(userId), saved);
      form.reset(saved);
      setFeedback("saved");
    } catch {
      setFeedback("error");
    }
  });

  return (
    <form
      aria-label="Coordonnées de la société donneuse d’ordre"
      noValidate
      onChange={() => setFeedback(null)}
      onSubmit={(event) => void submit(event)}
    >
      <FormSection heading="h2" title="Société donneuse d’ordre">
        <p className="text-sm text-muted-foreground">
          Renseignez une fois les coordonnées légales de votre société. Elles
          seront reprises dans les contrats générés depuis les chantiers.
        </p>
        <fieldset className="grid min-w-0 gap-4" disabled={isSubmitting}>
          <PartyFields
            renderField={(field, props) => (
              <ContractField
                {...props}
                form={form}
                name={`principal.${field}`}
              />
            )}
          />
          <ContractField
            form={form}
            label="Représentant(s) de la société"
            maxLength={200}
            name="principalRepresentatives"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <ContractField
              form={form}
              label="Ville du tribunal de commerce"
              maxLength={100}
              name="courtCity"
            />
            <ContractField
              form={form}
              label="Lieu de signature par défaut"
              maxLength={100}
              name="defaultSignatureCity"
              optional
            />
          </div>
        </fieldset>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
          {feedback === "saved" ? (
            <p className="mr-auto text-sm text-foreground" role="status">
              Coordonnées enregistrées.
            </p>
          ) : null}
          {feedback === "error" ? (
            <p className="mr-auto text-sm text-destructive" role="alert">
              Impossible d’enregistrer les coordonnées. Réessayez dans un
              instant.
            </p>
          ) : null}
          <Button
            disabled={isSubmitting || (!!initial && !isDirty)}
            type="submit"
          >
            {isSubmitting ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            ) : (
              <Save aria-hidden="true" />
            )}
            {isSubmitting ? "Enregistrement…" : "Enregistrer les coordonnées"}
          </Button>
        </div>
      </FormSection>
    </form>
  );
}

export function ContractPrincipalSettings() {
  const { user } = useAuth();
  const settings = useQuery({
    queryKey: contractSettingsKey(user?.id),
    queryFn: user ? () => getContractSettings(user.id) : skipToken,
  });

  if (!user) return null;
  if (settings.isPending) {
    return (
      <p
        className="border border-border bg-card p-4 text-sm text-muted-foreground"
        role="status"
      >
        Chargement des coordonnées…
      </p>
    );
  }
  if (settings.isError) {
    return (
      <div className="flex flex-wrap items-center gap-3 border border-border bg-card p-4">
        <p className="text-sm text-destructive" role="alert">
          Impossible de charger les coordonnées de la société.
        </p>
        <Button
          disabled={settings.isFetching}
          onClick={() => void settings.refetch()}
          type="button"
          variant="outline"
        >
          Réessayer
        </Button>
      </div>
    );
  }
  return (
    <SettingsForm initial={settings.data} key={user.id} userId={user.id} />
  );
}
