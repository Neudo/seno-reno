import { useState } from "react";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Copy,
  Check,
  Pencil,
  ExternalLink,
  Plus,
  FileText,
  FolderOpen,
  X,
} from "lucide-react";
import type { Client, SourceClient } from "./clientTypes";
import {
  SOURCE_CLIENT_LABELS,
  STATUT_CHANTIER_LABELS,
  STATUT_CHANTIER_STYLE,
  clientDisplayName,
  clientSubtitle,
} from "./clientTypes";

type Tab = "apercu" | "chantiers" | "documents";

interface Props {
  client: Client;
  onBack: () => void;
  onUpdate?: (updated: Client) => void;
}

function CopyBtn({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      title={`Copier ${label}`}
      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#00365A] transition-colors cursor-pointer"
    >
      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
      <span className={copied ? "text-emerald-500" : ""}>{copied ? "Copié" : `Copier ${label}`}</span>
    </button>
  );
}

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function fmtMontant(n?: number) {
  if (!n) return "—";
  return n.toLocaleString("fr-FR") + " €";
}

function AperçuTab({ client }: { client: Client }) {
  const hasOneDrive = !!client.oneDriveUrl;
  const activeChantiers = client.chantiers.filter((c) => c.statut === "en_cours");
  const otherChantiers = client.chantiers.filter((c) => c.statut !== "en_cours");

  return (
    <div className="grid grid-cols-[1fr_320px] gap-5">
      {/* Left col */}
      <div className="space-y-5">
        {/* Coordonnées */}
        <div className="bg-white border border-gray-200 rounded-sm p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Coordonnées</h3>
          <div className="space-y-3">
            {client.email && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-gray-400 shrink-0" />
                  <span className="text-sm font-mono text-gray-700">{client.email}</span>
                </div>
                <CopyBtn value={client.email} label="l'email" />
              </div>
            )}
            {client.telephone && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-700">{client.telephone}</span>
                </div>
                <CopyBtn value={client.telephone} label="le téléphone" />
              </div>
            )}
            {(client.adresse || client.ville) && (
              <div className="flex items-start gap-2">
                <MapPin size={13} className="text-gray-400 shrink-0 mt-0.5" />
                <div className="text-sm text-gray-600">
                  {client.adresse && <p>{client.adresse}</p>}
                  {(client.codePostal || client.ville) && (
                    <p>{[client.codePostal, client.ville].filter(Boolean).join(" ")}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chantiers aperçu */}
        <div className="bg-white border border-gray-200 rounded-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Chantiers</h3>
            <button className="flex items-center gap-1.5 text-xs font-medium text-[#00365A] hover:text-[#004d80] cursor-pointer transition-colors">
              <Plus size={13} />
              Nouveau chantier
            </button>
          </div>
          {client.chantiers.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Aucun chantier associé.</p>
          ) : (
            <div className="space-y-2">
              {[...activeChantiers, ...otherChantiers].slice(0, 4).map((ch) => (
                <div key={ch.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{ch.nom}</p>
                    <p className="text-xs text-gray-400">{ch.adresse}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-sm font-medium shrink-0 ml-3 ${STATUT_CHANTIER_STYLE[ch.statut]}`}>
                    {STATUT_CHANTIER_LABELS[ch.statut]}
                  </span>
                </div>
              ))}
            </div>
          )}
          {client.chantiers.length > 4 && (
            <button className="mt-3 text-xs text-[#00365A] hover:underline cursor-pointer">
              Voir tous les chantiers ({client.chantiers.length})
            </button>
          )}
        </div>
      </div>

      {/* Right col */}
      <div className="space-y-5">
        {/* Infos */}
        <div className="bg-white border border-gray-200 rounded-sm p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Informations</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Source</p>
              <p className="text-sm text-gray-700">{SOURCE_CLIENT_LABELS[client.source]}</p>
              {client.sourceDetail && <p className="text-xs text-gray-400">{client.sourceDetail}</p>}
            </div>
            {client.dateConversionProspect && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Converti depuis un prospect</p>
                <p className="text-sm text-gray-700">le {fmtDate(client.dateConversionProspect)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Client depuis</p>
              <p className="text-sm text-gray-700">{fmtDate(client.dateCreation)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Chantiers</p>
              <p className="text-sm text-gray-700">
                {client.chantiers.length} au total
                {activeChantiers.length > 0 && (
                  <span className="ml-1 text-blue-600 font-medium">({activeChantiers.length} en cours)</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {client.notes && (
          <div className="bg-white border border-gray-200 rounded-sm p-5">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Notes</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{client.notes}</p>
          </div>
        )}

        {/* OneDrive */}
        {hasOneDrive && (
          <div className="bg-blue-50 border border-blue-100 rounded-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <FolderOpen size={14} className="text-blue-500" />
              <h3 className="text-xs font-semibold text-blue-700 uppercase tracking-widest">Dossier historique</h3>
            </div>
            <p className="text-xs text-blue-600 mb-3">
              Ce client possède des documents historiques sur OneDrive.
            </p>
            <a
              href={client.oneDriveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-800 cursor-pointer transition-colors"
            >
              <ExternalLink size={12} />
              Ouvrir le dossier OneDrive
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function ChantiersTab({ client }: { client: Client }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="flex items-center gap-2 bg-[#00365A] text-white text-sm font-medium px-4 py-1.5 rounded-sm hover:bg-[#004d80] transition-colors cursor-pointer">
          <Plus size={14} />
          Nouveau chantier
        </button>
      </div>
      <div className="bg-white border border-gray-200 rounded-sm overflow-x-auto">
        <table className="min-w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Nom du chantier</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Statut</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Adresse</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Montant</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Début</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Fin prévue</th>
            </tr>
          </thead>
          <tbody>
            {client.chantiers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-12 text-sm">
                  Aucun chantier pour ce client.
                </td>
              </tr>
            ) : (
              client.chantiers.map((ch) => (
                <tr key={ch.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{ch.nom}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-sm font-medium ${STATUT_CHANTIER_STYLE[ch.statut]}`}>
                      {STATUT_CHANTIER_LABELS[ch.statut]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{ch.adresse}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-gray-700">{fmtMontant(ch.montant)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(ch.dateDebut)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(ch.dateFinPrevue)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DocumentsTab({ client }: { client: Client }) {
  const hasOneDrive = !!client.oneDriveUrl;

  return (
    <div className="space-y-5">
      {/* Documents client */}
      <div className="bg-white border border-gray-200 rounded-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Documents client</h3>
            <p className="text-xs text-gray-400 mt-0.5">Administratifs, informations générales, documents transversaux.</p>
          </div>
          <button className="flex items-center gap-1.5 text-xs font-medium text-[#00365A] hover:text-[#004d80] cursor-pointer transition-colors">
            <Plus size={13} />
            Ajouter
          </button>
        </div>
        {client.documents.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-2 text-center">
            <FileText size={20} className="text-gray-300" />
            <p className="text-sm text-gray-400">Aucun document pour ce client.</p>
            <p className="text-xs text-gray-300">Les documents liés aux chantiers restent dans leur chantier respectif.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {client.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-gray-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{doc.nom}</p>
                    <p className="text-xs text-gray-400">{doc.type} · {doc.taille} · Ajouté le {fmtDate(doc.dateAjout)}</p>
                  </div>
                </div>
                <button className="text-xs text-[#00365A] hover:underline cursor-pointer">Ouvrir</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* OneDrive historique */}
      {hasOneDrive && (
        <div className="bg-blue-50 border border-blue-100 rounded-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <FolderOpen size={14} className="text-blue-500" />
            <h3 className="text-xs font-semibold text-blue-700 uppercase tracking-widest">Dossier historique OneDrive</h3>
          </div>
          <p className="text-sm text-blue-600 mb-1">Ce client possède des documents historiques sur OneDrive.</p>
          <p className="text-xs text-blue-500 mb-3">
            L'historique OneDrive coexiste avec les nouveaux documents stockés dans l'application.
          </p>
          <a
            href={client.oneDriveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800 cursor-pointer transition-colors"
          >
            <ExternalLink size={14} />
            Ouvrir le dossier OneDrive
          </a>
        </div>
      )}

      {!hasOneDrive && (
        <p className="text-xs text-gray-400 text-center">
          Les documents de chantier (devis, plans, factures, photos…) restent accessibles depuis chaque chantier.
        </p>
      )}
    </div>
  );
}

// ─── Edit Modal ──────────────────────────────────────────────────────────────

function EditClientModal({ client, onClose, onSave }: {
  client: Client;
  onClose: () => void;
  onSave: (updated: Client) => void;
}) {
  const [form, setForm] = useState({
    prenom: client.prenom ?? "",
    nom: client.nom ?? "",
    societe: client.societe ?? "",
    contactPrincipal: client.contactPrincipal ?? "",
    email: client.email,
    telephone: client.telephone,
    adresse: client.adresse ?? "",
    codePostal: client.codePostal ?? "",
    ville: client.ville ?? "",
    source: client.source,
    sourceDetail: client.sourceDetail ?? "",
    notes: client.notes ?? "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = () => {
    onSave({ ...client, ...form, source: form.source as SourceClient });
    onClose();
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
      {children}
    </div>
  );

  const inputCls = "w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:border-[#00365A] transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-sm shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Modifier le client</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 cursor-pointer transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-5 flex-1">

          {/* Identité */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Identité</p>
            <div className="space-y-3">
              {client.type === "personne" ? (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Prénom">
                    <input className={inputCls} value={form.prenom} onChange={set("prenom")} />
                  </Field>
                  <Field label="Nom">
                    <input className={inputCls} value={form.nom} onChange={set("nom")} />
                  </Field>
                </div>
              ) : (
                <>
                  <Field label="Société">
                    <input className={inputCls} value={form.societe} onChange={set("societe")} />
                  </Field>
                  <Field label="Contact principal">
                    <input className={inputCls} value={form.contactPrincipal} onChange={set("contactPrincipal")} />
                  </Field>
                </>
              )}
            </div>
          </div>

          {/* Coordonnées */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Coordonnées</p>
            <div className="space-y-3">
              <Field label="Email">
                <input className={inputCls} type="email" value={form.email} onChange={set("email")} />
              </Field>
              <Field label="Téléphone">
                <input className={inputCls} type="tel" value={form.telephone} onChange={set("telephone")} />
              </Field>
              <Field label="Adresse">
                <input className={inputCls} value={form.adresse} onChange={set("adresse")} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Code postal">
                  <input className={inputCls} value={form.codePostal} onChange={set("codePostal")} />
                </Field>
                <Field label="Ville">
                  <input className={inputCls} value={form.ville} onChange={set("ville")} />
                </Field>
              </div>
            </div>
          </div>

          {/* Source */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Origine</p>
            <div className="space-y-3">
              <Field label="Source">
                <select className={inputCls} value={form.source} onChange={set("source")}>
                  {Object.entries(SOURCE_CLIENT_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </Field>
              <Field label="Détail source (optionnel)">
                <input className={inputCls} value={form.sourceDetail} onChange={set("sourceDetail")} placeholder="Ex : recommandé par M. Dupont" />
              </Field>
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Notes</p>
            <textarea
              className={`${inputCls} min-h-[80px] resize-y`}
              value={form.notes}
              onChange={set("notes")}
              placeholder="Notes internes sur ce client…"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="text-sm px-4 py-1.5 border border-gray-200 rounded-sm text-gray-600 hover:bg-gray-50 cursor-pointer">
            Annuler
          </button>
          <button onClick={handleSave} className="text-sm px-4 py-1.5 bg-[#00365A] text-white rounded-sm hover:bg-[#004d80] cursor-pointer font-medium">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

const TABS: { id: Tab; label: string }[] = [
  { id: "apercu", label: "Aperçu" },
  { id: "chantiers", label: "Chantiers" },
  { id: "documents", label: "Documents" },
];

export default function ClientDetail({ client, onBack, onUpdate }: Props) {
  const [tab, setTab] = useState<Tab>("apercu");
  const [showEdit, setShowEdit] = useState(false);
  const name = clientDisplayName(client);
  const subtitle = clientSubtitle(client);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 px-6 pt-4 pb-0 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 cursor-pointer transition-colors mb-3"
        >
          <ArrowLeft size={13} />
          Retour aux clients
        </button>
        <div className="flex items-end justify-between mb-0">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-gray-900">{name}</h1>
              {client.archive && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-400 rounded-sm font-medium">Archivé</span>
              )}
            </div>
            {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={() => setShowEdit(true)} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 cursor-pointer transition-colors mb-3 border border-gray-200 px-3 py-1.5 rounded-sm hover:bg-gray-50">
            <Pencil size={12} />
            Modifier
          </button>
        </div>
        {/* Tabs */}
        <nav className="flex gap-0 mt-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                tab === id
                  ? "border-[#00365A] text-[#00365A]"
                  : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
              }`}
            >
              {label}
              {id === "chantiers" && client.chantiers.length > 0 && (
                <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-sm font-semibold">
                  {client.chantiers.length}
                </span>
              )}
              {id === "documents" && client.documents.length > 0 && (
                <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-sm font-semibold">
                  {client.documents.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === "apercu" && <AperçuTab client={client} />}
        {tab === "chantiers" && <ChantiersTab client={client} />}
        {tab === "documents" && <DocumentsTab client={client} />}
      </div>

      {showEdit && (
        <EditClientModal
          client={client}
          onClose={() => setShowEdit(false)}
          onSave={(updated) => { onUpdate?.(updated); setShowEdit(false); }}
        />
      )}
    </div>
  );
}
