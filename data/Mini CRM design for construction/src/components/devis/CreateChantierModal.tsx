import { useState } from "react";
import { X, Building2, CheckCircle2 } from "lucide-react";
import type { Devis } from "./devisTypes";
import { fmtMontant, fmtDate } from "./devisTypes";

export default function CreateChantierModal({
  devis,
  onClose,
  onConfirm,
}: {
  devis: Devis;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [nom, setNom] = useState(devis.projet);
  const [client, setClient] = useState(devis.client);
  const [adresse, setAdresse] = useState(devis.adresse);
  const [dateDebut, setDateDebut] = useState("");
  const [created, setCreated] = useState(false);

  const defaultRelance = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  })();

  const [acompteLibelle, setAcompteLibelle] = useState("Acompte 30% à la commande");
  const [acompteMontant, setAcompteMontant] = useState(
    String(Math.round(devis.montantTTC * 0.3))
  );
  const [acompteRelance, setAcompteRelance] = useState(defaultRelance);

  if (created) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-sm shadow-2xl w-full max-w-md mx-4 px-8 py-10 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-emerald-600" />
            </div>
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">Chantier créé</h2>
          <p className="text-sm text-gray-500 mb-6">
            Le chantier <strong>{nom}</strong> a été créé et lié au devis {devis.numero}.
          </p>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-[#00365A] text-white text-sm font-medium rounded-sm hover:bg-[#004A7A] transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-sm shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Building2 size={15} className="text-emerald-600" />
            <h2 className="text-sm font-semibold text-gray-900">Créer le chantier</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-sm px-4 py-3">
            <p className="text-xs text-emerald-700">
              Données préremplies depuis le devis{" "}
              <span className="font-mono font-medium">{devis.numero}</span> — vérifiez et complétez.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">
                Nom du chantier
              </label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-sm text-sm bg-white focus:outline-none focus:border-[#00365A]"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">
                Client
              </label>
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-sm text-sm bg-white focus:outline-none focus:border-[#00365A]"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">
                Adresse du chantier
              </label>
              <input
                type="text"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-sm text-sm bg-white focus:outline-none focus:border-[#00365A]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">
                Montant devis (TTC)
              </label>
              <div className="px-2.5 py-1.5 border border-gray-100 rounded-sm bg-gray-50 text-sm font-mono text-gray-700">
                {fmtMontant(devis.montantTTC)}
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">
                Date début prévue
              </label>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-sm text-sm bg-white focus:outline-none focus:border-[#00365A]"
              />
            </div>
          </div>

          {/* Acompte initial */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-3 font-semibold">Premier acompte</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">Libellé</label>
                <input type="text" value={acompteLibelle} onChange={e => setAcompteLibelle(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-sm text-sm bg-white focus:outline-none focus:border-[#00365A]" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">Montant (€)</label>
                <input type="text" value={acompteMontant} onChange={e => setAcompteMontant(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-sm text-sm bg-white focus:outline-none focus:border-[#00365A]" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">Date de relance</label>
                <input type="date" value={acompteRelance} onChange={e => setAcompteRelance(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-200 rounded-sm text-sm bg-white focus:outline-none focus:border-[#00365A]" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-gray-400 pt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shrink-0" />
            Le PDF du devis sera automatiquement associé au chantier
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">
            Annuler
          </button>
          <button
            onClick={() => setCreated(true)}
            className="flex items-center gap-2 px-5 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-sm hover:bg-emerald-700 transition-colors"
          >
            <Building2 size={14} />
            Créer le chantier
          </button>
        </div>
      </div>
    </div>
  );
}
