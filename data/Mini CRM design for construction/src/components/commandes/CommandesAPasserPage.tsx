import { useState } from "react";
import { ShoppingCart, ChevronDown, ChevronRight, MapPin } from "lucide-react";
import { INITIAL_CHANTIERS } from "../chantiers/chantierData";

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

interface CommandeAvecChantier {
  id: number;
  titre: string;
  fournisseur: string;
  montantPrevisionnel: number;
  dateLivraisonPrevue?: string;
  chantierId: number;
  chantierNom: string;
  clientNom: string;
  adresse: string;
}

function buildGroupedCommandes() {
  const grouped: Record<
    number,
    {
      chantierId: number;
      chantierNom: string;
      clientNom: string;
      adresse: string;
      commandes: CommandeAvecChantier[];
      total: number;
    }
  > = {};

  for (const chantier of INITIAL_CHANTIERS) {
    const cmdsAP = chantier.commandes.filter((c) => c.statutCommande === "a_commander");
    if (cmdsAP.length === 0) continue;

    grouped[chantier.id] = {
      chantierId: chantier.id,
      chantierNom: chantier.nom,
      clientNom: chantier.clientNom,
      adresse: chantier.adresse,
      commandes: cmdsAP.map((c) => ({
        id: c.id,
        titre: c.titre,
        fournisseur: c.fournisseur,
        montantPrevisionnel: c.montantPrevisionnel,
        dateLivraisonPrevue: c.dateLivraisonPrevue,
        chantierId: chantier.id,
        chantierNom: chantier.nom,
        clientNom: chantier.clientNom,
        adresse: chantier.adresse,
      })),
      total: cmdsAP.reduce((s, c) => s + c.montantPrevisionnel, 0),
    };
  }

  return Object.values(grouped).sort((a, b) => b.total - a.total);
}

export default function CommandesAPasserPage() {
  const groups = buildGroupedCommandes();
  const [expanded, setExpanded] = useState<Set<number>>(
    new Set(groups.map((g) => g.chantierId))
  );

  const totalGlobal = groups.reduce((s, g) => s + g.total, 0);
  const totalArticles = groups.reduce((s, g) => s + g.commandes.length, 0);

  const toggle = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4F5F7]">
      <div className="max-w-screen-xl mx-auto px-6 py-6 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight flex items-center gap-2">
            <ShoppingCart size={18} className="text-amber-600" />
            Commandes à passer
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Articles en statut "à commander", regroupés par chantier
          </p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-3 gap-px bg-gray-200 border border-gray-200">
          <div className="bg-white px-5 py-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Articles à commander</p>
            <p className="font-mono text-2xl font-medium text-amber-700">{totalArticles}</p>
          </div>
          <div className="bg-white px-5 py-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Chantiers concernés</p>
            <p className="font-mono text-2xl font-medium text-[#00365A]">{groups.length}</p>
          </div>
          <div className="bg-white px-5 py-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Montant prévisionnel total</p>
            <p className="font-mono text-2xl font-medium text-gray-900">{fmt(totalGlobal)}</p>
          </div>
        </div>

        {/* Groups */}
        <div className="space-y-2">
          {groups.map((g) => {
            const isOpen = expanded.has(g.chantierId);
            return (
              <div key={g.chantierId} className="bg-white border border-gray-200">
                {/* Group header */}
                <button
                  onClick={() => toggle(g.chantierId)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 flex-shrink-0">
                      {isOpen ? (
                        <ChevronDown size={15} className="text-gray-400" />
                      ) : (
                        <ChevronRight size={15} className="text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm leading-tight truncate">
                        {g.chantierNom}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <span>{g.clientNom}</span>
                        <span className="text-gray-200">·</span>
                        <MapPin size={10} className="flex-shrink-0" />
                        <span className="truncate">{g.adresse}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 flex-shrink-0 ml-4">
                    <span className="text-xs text-gray-400 font-mono">
                      {g.commandes.length} article{g.commandes.length > 1 ? "s" : ""}
                    </span>
                    <span className="font-mono font-semibold text-amber-700 text-sm">
                      {fmt(g.total)}
                    </span>
                  </div>
                </button>

                {/* Commandes list */}
                {isOpen && (
                  <div className="border-t border-gray-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500">
                            Article
                          </th>
                          <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500">
                            Fournisseur
                          </th>
                          <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500">
                            Livraison prévue
                          </th>
                          <th className="text-right px-5 py-2.5 text-xs font-medium text-gray-500">
                            Montant
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {g.commandes.map((c) => (
                          <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3 text-gray-900 text-xs font-medium">
                              {c.titre}
                            </td>
                            <td className="px-5 py-3 text-gray-500 text-xs">{c.fournisseur}</td>
                            <td className="px-5 py-3 font-mono text-xs text-gray-400">
                              {c.dateLivraisonPrevue
                                ? new Date(c.dateLivraisonPrevue).toLocaleDateString("fr-FR", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "—"}
                            </td>
                            <td className="px-5 py-3 text-right font-mono font-medium text-gray-900 text-xs">
                              {fmt(c.montantPrevisionnel)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-gray-200 bg-gray-50">
                          <td
                            colSpan={3}
                            className="px-5 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider"
                          >
                            Total chantier
                          </td>
                          <td className="px-5 py-2.5 text-right font-mono font-semibold text-amber-700 text-sm">
                            {fmt(g.total)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
