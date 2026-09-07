import { PageCanvas } from "@/shared/components/app-shell/PageCanvas";
import { BdcGenerator } from "@/features/outils/bdc/BdcGenerator";

export function GenerationBdcPage() {
  return (
    <PageCanvas title="Génération BDC">
      <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
        Transforme un devis Tolteck en bon de commande sous-traitant, sans
        reprendre les prix unitaires du client.
      </p>
      <BdcGenerator />
    </PageCanvas>
  );
}
