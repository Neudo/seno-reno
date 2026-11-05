import { FileText, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { lazy, Suspense } from "react";

import type { ContractContext } from "@/features/outils/subcontracting/contract-data";
import { Button } from "@/shared/components/ui/button";

const ContractGenerationForm = lazy(() =>
  import("@/features/outils/subcontracting/ContractGenerationForm").then(
    (module) => ({
      default: module.ContractGenerationForm,
    }),
  ),
);

export function ContractGenerationDialog({
  context,
}: {
  context: ContractContext;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button
          aria-label={`Générer les documents pour ${context.subcontractor.name}`}
          size="sm"
          variant="outline"
        >
          <FileText aria-hidden="true" />
          Générer les documents
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-auto border border-border bg-background shadow-xl outline-none">
          <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border bg-card px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <Dialog.Title className="text-base font-semibold text-foreground">
                Contrat et déclaration sur l’honneur
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Complétez les informations de {context.subcontractor.name} avant
                de générer les PDF.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button aria-label="Fermer" size="icon" variant="ghost">
                <X aria-hidden="true" />
              </Button>
            </Dialog.Close>
          </header>
          <div className="p-4 sm:p-5">
            <Suspense
              fallback={
                <p className="text-sm text-muted-foreground" role="status">
                  Chargement du formulaire…
                </p>
              }
            >
              <ContractGenerationForm context={context} />
            </Suspense>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
