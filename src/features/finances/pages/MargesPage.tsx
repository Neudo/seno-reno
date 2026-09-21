import { BarChart3, CircleDollarSign, Percent, ReceiptText } from "lucide-react";

import {
  FinanceCard,
  FinanceEmpty,
  FinancePanel,
} from "@/features/finances/components/finance-ui";
import { PageCanvas } from "@/shared/components/app-shell/PageCanvas";

export function MargesPage() {
  return (
    <PageCanvas title="Marges">
      <div className="mt-2 border-b border-slate-200 pb-5">
        <p className="max-w-3xl text-sm leading-6 text-slate-500">
          Rentabilité économique par chantier. Les charges fixes, les mouvements de
          trésorerie génériques et le remboursement d’une avance ne sont pas inclus.
        </p>
      </div>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <FinanceCard
          icon={CircleDollarSign}
          label="CA actualisé"
          note="Aucun devis signé raccordé"
          value="—"
        />
        <FinanceCard
          icon={ReceiptText}
          label="Coûts directs"
          note="Aucun achat ou sous-traitant raccordé"
          tone="outgoing"
          value="—"
        />
        <FinanceCard
          icon={BarChart3}
          label="Marge brute"
          note="En attente des données de chantier"
          value="—"
        />
        <FinanceCard
          icon={Percent}
          label="Taux global"
          note="Calculé sur le CA actualisé"
          value="—"
        />
      </section>

      <FinancePanel className="mt-5" title="Marges par chantier">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full border-collapse text-left">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] tracking-[0.1em] text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Chantier</th>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 text-right font-semibold">CA actualisé</th>
                <th className="px-4 py-3 text-right font-semibold">Coûts directs</th>
                <th className="px-4 py-3 text-right font-semibold">Marge prévisionnelle</th>
                <th className="px-4 py-3 text-right font-semibold">Marge actualisée</th>
                <th className="px-4 py-3 text-right font-semibold">Taux</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-0" colSpan={7}>
                  <FinanceEmpty
                    detail="Les marges apparaîtront dès que les chantiers, devis signés, achats et sous-traitants auront leur source de données dans l’application. Cette page ne crée ni ne modifie de marge manuellement."
                    title="Aucune donnée de chantier à consolider"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </FinancePanel>

      <FinancePanel className="mt-5" title="Méthode de calcul">
        <div className="grid divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="p-4">
            <p className="text-sm font-medium text-slate-800">CA actualisé</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Devis signé, plus les plus-values acceptées, moins les moins-values
              acceptées.
            </p>
          </div>
          <div className="p-4">
            <p className="text-sm font-medium text-slate-800">Coûts directs</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Commandes, achats, sous-traitants et dépenses personnelles rattachées
              à ce chantier.
            </p>
          </div>
          <div className="p-4">
            <p className="text-sm font-medium text-slate-800">Marge brute</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              CA actualisé moins coûts directs, avec un taux calculé sur le CA
              actualisé.
            </p>
          </div>
        </div>
      </FinancePanel>
    </PageCanvas>
  );
}
