import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router";
import {
  Upload, FileText, ChevronDown, ChevronRight, Plus, Trash2,
  Pencil, Check, X, Eye, ArrowLeft, Printer, CheckSquare, Square,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Ligne {
  id: string;
  numero: string;
  designation: string;
  quantite: string;
  unite: string;
  selected: boolean;
}

interface Lot {
  id: string;
  nom: string;
  lignes: Ligne[];
  open: boolean;
}

interface BDCForm {
  numeroBDC: string;
  numeroDevis: string;
  client: string;
  adresseChantier: string;
  refChantier: string;
  responsable: string;
  date: string;
  destinataire: string;
  adresseDestinataire: string;
  telephoneDestinataire: string;
  emailDestinataire: string;
  totalHT: string;
}

// ─── SENO Info ───────────────────────────────────────────────────────────────

const SENO = {
  logo: "SR",
  raisonSociale: "SENO Rénovation",
  adresse: "12 rue des Artisans, 69003 Lyon",
  telephone: "04 72 XX XX XX",
  email: "contact@seno-renovation.fr",
  site: "www.seno-renovation.fr",
  legal: "SARL au capital de 10 000 € — SIRET 123 456 789 00010 — RCS Lyon B 123 456 789 — APE 4399C",
};

// ─── Mock data (simulated parse) ─────────────────────────────────────────────

const makeMockData = (): { lots: Lot[]; form: Partial<BDCForm> } => ({
  form: {
    numeroBDC: `BDC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
    numeroDevis: "DEV-2026-0142",
    client: "M. Bernard Dupont",
    adresseChantier: "27 chemin du Moulin, 69300 Caluire-et-Cuire",
    refChantier: "Isolation combles + ravalement",
    responsable: "Jordan SENO",
    date: new Date().toISOString().slice(0, 10),
    destinataire: "",
    adresseDestinataire: "",
    telephoneDestinataire: "",
    emailDestinataire: "",
    totalHT: "",
  },
  lots: [
    {
      id: "lot-1", nom: "1 — Démolition / Gros œuvre", open: true,
      lignes: [
        { id: "l1", numero: "1.1", designation: "Démolition cloisons existantes", quantite: "45", unite: "m²", selected: true },
        { id: "l2", numero: "1.2", designation: "Évacuation gravats vers benne", quantite: "3", unite: "T", selected: true },
        { id: "l3", numero: "1.3", designation: "Dépose revêtements de sols", quantite: "60", unite: "m²", selected: true },
      ],
    },
    {
      id: "lot-2", nom: "2 — Cloisons / Plâtrerie / Isolation", open: true,
      lignes: [
        { id: "l4", numero: "2.1", designation: "Pose cloisons Placostil 72/48 — double peau", quantite: "38", unite: "m²", selected: true },
        { id: "l5", numero: "2.2", designation: "Isolation acoustique laine minérale e=45mm", quantite: "38", unite: "m²", selected: true },
        { id: "l6", numero: "2.3", designation: "Doublage isolant murs périphériques", quantite: "24", unite: "m²", selected: true },
        { id: "l7", numero: "2.4", designation: "Enduit de finition lissé sur placo", quantite: "72", unite: "m²", selected: true },
      ],
    },
    {
      id: "lot-3", nom: "3 — Revêtements de sols", open: false,
      lignes: [
        { id: "l8", numero: "3.1", designation: "Ragréage autonivelant — préparation du support", quantite: "60", unite: "m²", selected: true },
        { id: "l9", numero: "3.2", designation: "Carrelage grès cérame 60×60 — pose collée", quantite: "32", unite: "m²", selected: true },
        { id: "l10", numero: "3.3", designation: "Parquet stratifié 8mm — pose flottante", quantite: "28", unite: "m²", selected: true },
      ],
    },
    {
      id: "lot-4", nom: "4 — Plomberie / Sanitaires", open: false,
      lignes: [
        { id: "l11", numero: "4.1", designation: "Alimentation eau froide / eau chaude salle de bain", quantite: "1", unite: "ens.", selected: false },
        { id: "l12", numero: "4.2", designation: "Pose douche à l'italienne — receveur 90×90", quantite: "1", unite: "u", selected: false },
        { id: "l13", numero: "4.3", designation: "Pose WC suspendu avec bâti-support", quantite: "1", unite: "u", selected: false },
      ],
    },
    {
      id: "lot-5", nom: "5 — Électricité / Éclairage", open: false,
      lignes: [
        { id: "l14", numero: "5.1", designation: "Mise en conformité tableau électrique", quantite: "1", unite: "ens.", selected: false },
        { id: "l15", numero: "5.2", designation: "Saignées, fourreaux, câblage neuf", quantite: "60", unite: "m²", selected: false },
        { id: "l16", numero: "5.3", designation: "Pose prises, interrupteurs et luminaires", quantite: "1", unite: "ens.", selected: false },
      ],
    },
  ],
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 8);
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—";
const fmtEuro = (v: string) => {
  const n = parseFloat(v);
  return isNaN(n) ? "—" : n.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";
};

const inputCls = "w-full border border-gray-200 rounded-sm px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:border-[#00365A] transition-colors bg-white";
const labelCls = "text-xs font-medium text-gray-500 block mb-1";

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = ["Import", "Informations", "Prestations", "Prévisualisation"];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((label, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        return (
          <div key={label} className="flex items-center">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-medium ${
              active ? "bg-[#00365A] text-white" : done ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400"
            }`}>
              {done ? <Check size={12} /> : <span className="w-4 h-4 flex items-center justify-center rounded-full border text-[10px] font-bold border-current">{idx}</span>}
              {label}
            </div>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-gray-200 mx-1" />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Upload ───────────────────────────────────────────────────────────

function DropZone({ onFile }: { onFile: (name: string) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = (f: File | null | undefined) => {
    if (f && f.type === "application/pdf") onFile(f.name);
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-0">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files[0]); }}
        className={`w-full max-w-lg border-2 border-dashed rounded-sm p-16 flex flex-col items-center gap-4 transition-colors cursor-pointer ${
          dragging ? "border-[#00365A] bg-blue-50/40" : "border-gray-200 hover:border-gray-400 bg-white"
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <div className="w-14 h-14 bg-[#00365A]/8 rounded-sm flex items-center justify-center">
          <Upload size={24} className="text-[#00365A]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700 mb-1">Déposez un devis Tolteck au format PDF</p>
          <p className="text-xs text-gray-400">ou cliquez pour sélectionner un fichier</p>
        </div>
        <button
          className="text-xs font-medium px-4 py-2 bg-[#00365A] text-white rounded-sm hover:bg-[#004d80] transition-colors"
          onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
        >
          Sélectionner un fichier
        </button>
        <p className="text-[10px] text-gray-300">PDF uniquement — devis Tolteck</p>
      </div>
      <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
    </div>
  );
}

// ─── Step 2: Infos ────────────────────────────────────────────────────────────

function InfosStep({ form, setForm, fileName }: {
  form: BDCForm;
  setForm: React.Dispatch<React.SetStateAction<BDCForm>>;
  fileName: string;
}) {
  const set = (k: keyof BDCForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white border border-gray-200 rounded-sm p-5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-4">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );

  const Row = ({ children }: { children: React.ReactNode }) => (
    <div className="grid grid-cols-2 gap-3">{children}</div>
  );

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div><label className={labelCls}>{label}</label>{children}</div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 rounded-sm px-3 py-2">
        <FileText size={13} className="text-gray-400" />
        <span className="font-medium text-gray-700">{fileName}</span>
        <span className="text-gray-300">—</span>
        <span>Informations détectées depuis le devis. Vérifiez et complétez.</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Colonne gauche */}
        <div className="space-y-4">
          <Section title="Référence BDC">
            <Row>
              <Field label="N° BDC"><input className={inputCls} value={form.numeroBDC} onChange={set("numeroBDC")} /></Field>
              <Field label="N° devis d'origine"><input className={inputCls} value={form.numeroDevis} onChange={set("numeroDevis")} /></Field>
            </Row>
            <Row>
              <Field label="Date"><input className={inputCls} type="date" value={form.date} onChange={set("date")} /></Field>
              <Field label="Responsable"><input className={inputCls} value={form.responsable} onChange={set("responsable")} /></Field>
            </Row>
          </Section>

          <Section title="Chantier">
            <Field label="Client"><input className={inputCls} value={form.client} onChange={set("client")} /></Field>
            <Field label="Référence chantier"><input className={inputCls} value={form.refChantier} onChange={set("refChantier")} /></Field>
            <Field label="Adresse du chantier"><input className={inputCls} value={form.adresseChantier} onChange={set("adresseChantier")} /></Field>
          </Section>
        </div>

        {/* Colonne droite */}
        <div className="space-y-4">
          <Section title="Destinataire du BDC">
            <Field label="Entreprise / sous-traitant"><input className={inputCls} value={form.destinataire} onChange={set("destinataire")} placeholder="Nom de l'entreprise" /></Field>
            <Field label="Adresse"><input className={inputCls} value={form.adresseDestinataire} onChange={set("adresseDestinataire")} placeholder="Adresse complète" /></Field>
            <Row>
              <Field label="Téléphone"><input className={inputCls} type="tel" value={form.telephoneDestinataire} onChange={set("telephoneDestinataire")} /></Field>
              <Field label="Email"><input className={inputCls} type="email" value={form.emailDestinataire} onChange={set("emailDestinataire")} /></Field>
            </Row>
          </Section>

          <Section title="SENO Rénovation (émetteur)">
            <div className="space-y-1 text-xs text-gray-600">
              <p className="font-semibold text-gray-800">{SENO.raisonSociale}</p>
              <p>{SENO.adresse}</p>
              <p>{SENO.telephone} · {SENO.email}</p>
              <p>{SENO.site}</p>
              <p className="text-gray-400 text-[10px] pt-1">{SENO.legal}</p>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Prestations ─────────────────────────────────────────────────────

function PrestationsStep({ lots, setLots, form, setForm }: {
  lots: Lot[];
  setLots: React.Dispatch<React.SetStateAction<Lot[]>>;
  form: BDCForm;
  setForm: React.Dispatch<React.SetStateAction<BDCForm>>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuf, setEditBuf] = useState<Partial<Ligne>>({});

  const updateLot = (lotId: string, update: Partial<Lot>) =>
    setLots((ls) => ls.map((l) => l.id === lotId ? { ...l, ...update } : l));

  const updateLigne = (lotId: string, ligneId: string, update: Partial<Ligne>) =>
    setLots((ls) => ls.map((l) =>
      l.id === lotId ? { ...l, lignes: l.lignes.map((li) => li.id === ligneId ? { ...li, ...update } : li) } : l
    ));

  const deleteLigne = (lotId: string, ligneId: string) =>
    setLots((ls) => ls.map((l) =>
      l.id === lotId ? { ...l, lignes: l.lignes.filter((li) => li.id !== ligneId) } : l
    ));

  const addLigne = (lotId: string) => {
    const newLigne: Ligne = { id: uid(), numero: "", designation: "", quantite: "1", unite: "u", selected: true };
    setLots((ls) => ls.map((l) => l.id === lotId ? { ...l, lignes: [...l.lignes, newLigne], open: true } : l));
    setEditingId(newLigne.id);
    setEditBuf(newLigne);
  };

  const startEdit = (l: Ligne) => { setEditingId(l.id); setEditBuf({ ...l }); };
  const commitEdit = (lotId: string, ligneId: string) => {
    updateLigne(lotId, ligneId, editBuf as Ligne);
    setEditingId(null);
  };

  const toggleLotSelected = (lot: Lot) => {
    const next = !lot.lignes.every((l) => l.selected);
    setLots((ls) => ls.map((l) =>
      l.id === lot.id ? { ...l, lignes: l.lignes.map((li) => ({ ...li, selected: next })) } : l
    ));
  };

  const selectedCount = lots.reduce((s, l) => s + l.lignes.filter((li) => li.selected).length, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-gray-500 bg-white border border-gray-200 rounded-sm px-3 py-2">
        <span>{selectedCount} ligne{selectedCount > 1 ? "s" : ""} sélectionnée{selectedCount > 1 ? "s" : ""} sur {lots.reduce((s, l) => s + l.lignes.length, 0)}</span>
        <div className="flex items-center gap-3">
          <label className={labelCls + " mb-0"}>Total HT du BDC</label>
          <div className="relative">
            <input
              className="border border-gray-200 rounded-sm px-3 py-1 text-sm w-36 text-right pr-8 focus:outline-none focus:border-[#00365A]"
              placeholder="0,00"
              value={form.totalHT}
              onChange={(e) => setForm((f) => ({ ...f, totalHT: e.target.value }))}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">€</span>
          </div>
        </div>
      </div>

      {lots.map((lot) => {
        const allSelected = lot.lignes.length > 0 && lot.lignes.every((l) => l.selected);
        const someSelected = lot.lignes.some((l) => l.selected);
        return (
          <div key={lot.id} className="bg-white border border-gray-200 rounded-sm overflow-hidden">
            {/* Lot header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
              <button
                onClick={() => toggleLotSelected(lot)}
                className="text-gray-400 hover:text-[#00365A] transition-colors cursor-pointer shrink-0"
              >
                {allSelected ? <CheckSquare size={15} className="text-[#00365A]" /> : someSelected ? <CheckSquare size={15} className="text-gray-300" /> : <Square size={15} />}
              </button>
              <button
                onClick={() => updateLot(lot.id, { open: !lot.open })}
                className="flex items-center gap-2 flex-1 text-left cursor-pointer"
              >
                {lot.open ? <ChevronDown size={14} className="text-gray-400 shrink-0" /> : <ChevronRight size={14} className="text-gray-400 shrink-0" />}
                <span className="text-sm font-semibold text-gray-800">{lot.nom}</span>
                <span className="text-xs text-gray-400 ml-1">({lot.lignes.filter(l => l.selected).length}/{lot.lignes.length})</span>
              </button>
              <button
                onClick={() => addLigne(lot.id)}
                className="flex items-center gap-1 text-xs text-[#00365A] hover:text-[#004d80] cursor-pointer transition-colors"
              >
                <Plus size={13} /> Ajouter
              </button>
            </div>

            {/* Lignes */}
            {lot.open && (
              <div>
                {lot.lignes.length === 0 && (
                  <p className="text-xs text-gray-400 italic px-4 py-3">Aucune ligne.</p>
                )}
                {lot.lignes.map((ligne) => {
                  const isEditing = editingId === ligne.id;
                  return (
                    <div key={ligne.id} className={`flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0 ${isEditing ? "bg-blue-50/30" : ligne.selected ? "" : "opacity-50"}`}>
                      {/* Checkbox */}
                      <button
                        onClick={() => updateLigne(lot.id, ligne.id, { selected: !ligne.selected })}
                        className="text-gray-400 hover:text-[#00365A] cursor-pointer shrink-0"
                      >
                        {ligne.selected ? <CheckSquare size={14} className="text-[#00365A]" /> : <Square size={14} />}
                      </button>

                      {isEditing ? (
                        <>
                          <input
                            className="w-14 border border-gray-200 rounded-sm px-2 py-1 text-xs text-center"
                            value={editBuf.numero ?? ""}
                            onChange={(e) => setEditBuf((b) => ({ ...b, numero: e.target.value }))}
                            placeholder="N°"
                          />
                          <input
                            className="flex-1 border border-gray-200 rounded-sm px-2 py-1 text-xs"
                            value={editBuf.designation ?? ""}
                            onChange={(e) => setEditBuf((b) => ({ ...b, designation: e.target.value }))}
                            placeholder="Désignation"
                            autoFocus
                          />
                          <input
                            className="w-20 border border-gray-200 rounded-sm px-2 py-1 text-xs text-center"
                            value={editBuf.quantite ?? ""}
                            onChange={(e) => setEditBuf((b) => ({ ...b, quantite: e.target.value }))}
                            placeholder="Qté"
                          />
                          <input
                            className="w-16 border border-gray-200 rounded-sm px-2 py-1 text-xs text-center"
                            value={editBuf.unite ?? ""}
                            onChange={(e) => setEditBuf((b) => ({ ...b, unite: e.target.value }))}
                            placeholder="Unité"
                          />
                          <button onClick={() => commitEdit(lot.id, ligne.id)} className="text-emerald-600 hover:text-emerald-700 cursor-pointer"><Check size={14} /></button>
                          <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={14} /></button>
                        </>
                      ) : (
                        <>
                          <span className="w-14 text-xs text-gray-400 tabular-nums text-center shrink-0">{ligne.numero}</span>
                          <span className="flex-1 text-sm text-gray-700">{ligne.designation}</span>
                          <span className="w-20 text-sm tabular-nums text-gray-700 text-center shrink-0">{ligne.quantite}</span>
                          <span className="w-16 text-xs text-gray-500 text-center shrink-0">{ligne.unite}</span>
                          <button onClick={() => startEdit(ligne)} className="text-gray-300 hover:text-gray-600 cursor-pointer transition-colors"><Pencil size={13} /></button>
                          <button onClick={() => deleteLigne(lot.id, ligne.id)} className="text-gray-300 hover:text-red-500 cursor-pointer transition-colors"><Trash2 size={13} /></button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 4: Preview ─────────────────────────────────────────────────────────

function Preview({ form, lots }: { form: BDCForm; lots: Lot[] }) {
  const selectedLots = lots.map((l) => ({ ...l, lignes: l.lignes.filter((li) => li.selected) })).filter((l) => l.lignes.length > 0);
  const totalHT = parseFloat(form.totalHT) || 0;

  return (
    <div id="bdc-document" className="bg-white shadow-sm border border-gray-200 rounded-sm mx-auto" style={{ maxWidth: 760, fontFamily: "Arial, sans-serif", fontSize: 11, color: "#1a1a1a" }}>
      {/* Header */}
      <div style={{ background: "#00365A", color: "#fff", padding: "24px 32px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 44, height: 44, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#00365A", fontSize: 13, letterSpacing: 1 }}>
              SR
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13, letterSpacing: 0.5 }}>{SENO.raisonSociale}</p>
              <p style={{ margin: "2px 0 0", opacity: 0.7, fontSize: 10 }}>{SENO.adresse}</p>
              <p style={{ margin: "1px 0 0", opacity: 0.7, fontSize: 10 }}>{SENO.telephone} · {SENO.email}</p>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: 2, opacity: 0.95 }}>BON DE COMMANDE</p>
            <p style={{ margin: "4px 0 0", fontSize: 11, opacity: 0.8 }}>{form.numeroBDC}</p>
            <p style={{ margin: "2px 0 0", fontSize: 10, opacity: 0.65 }}>Date : {fmtDate(form.date)}</p>
          </div>
        </div>
      </div>

      {/* Destinataire + Chantier */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ padding: "20px 24px", borderRight: "1px solid #e5e7eb" }}>
          <p style={{ margin: "0 0 8px", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#6b7280" }}>Destinataire</p>
          <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 12 }}>{form.destinataire || "—"}</p>
          {form.adresseDestinataire && <p style={{ margin: "0 0 2px", color: "#4b5563", fontSize: 10 }}>{form.adresseDestinataire}</p>}
          {form.telephoneDestinataire && <p style={{ margin: "0 0 2px", color: "#4b5563", fontSize: 10 }}>{form.telephoneDestinataire}</p>}
          {form.emailDestinataire && <p style={{ margin: 0, color: "#4b5563", fontSize: 10 }}>{form.emailDestinataire}</p>}
        </div>
        <div style={{ padding: "20px 24px" }}>
          <p style={{ margin: "0 0 8px", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#6b7280" }}>Chantier</p>
          <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 11 }}>{form.refChantier}</p>
          <p style={{ margin: "0 0 2px", color: "#4b5563", fontSize: 10 }}>Client : {form.client}</p>
          <p style={{ margin: "0 0 2px", color: "#4b5563", fontSize: 10 }}>{form.adresseChantier}</p>
          <p style={{ margin: "0 0 2px", color: "#4b5563", fontSize: 10 }}>Devis réf. : {form.numeroDevis}</p>
          <p style={{ margin: 0, color: "#4b5563", fontSize: 10 }}>Responsable : {form.responsable}</p>
        </div>
      </div>

      {/* Lots & Lignes */}
      <div style={{ padding: "0 24px 24px" }}>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "48px 1fr 64px 52px", gap: 8, padding: "10px 8px 6px", borderBottom: "2px solid #00365A", marginTop: 20 }}>
          <p style={{ margin: 0, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: "#00365A" }}>N°</p>
          <p style={{ margin: 0, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: "#00365A" }}>Désignation</p>
          <p style={{ margin: 0, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: "#00365A", textAlign: "center" }}>Qté</p>
          <p style={{ margin: 0, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: "#00365A", textAlign: "center" }}>Unité</p>
        </div>

        {selectedLots.length === 0 && (
          <p style={{ margin: "20px 0", color: "#9ca3af", fontStyle: "italic", textAlign: "center" }}>Aucune prestation sélectionnée.</p>
        )}

        {selectedLots.map((lot, li) => (
          <div key={lot.id}>
            {/* Lot title */}
            <div style={{ background: "#f8fafc", padding: "8px 8px", borderBottom: "1px solid #e5e7eb", marginTop: li === 0 ? 0 : 8 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 11, color: "#00365A" }}>{lot.nom}</p>
            </div>
            {lot.lignes.map((ligne, ri) => (
              <div key={ligne.id} style={{ display: "grid", gridTemplateColumns: "48px 1fr 64px 52px", gap: 8, padding: "7px 8px", borderBottom: "1px solid #f3f4f6", background: ri % 2 === 0 ? "#fff" : "#fafafa" }}>
                <p style={{ margin: 0, color: "#9ca3af", fontSize: 10 }}>{ligne.numero}</p>
                <p style={{ margin: 0, fontSize: 10, color: "#374151" }}>{ligne.designation}</p>
                <p style={{ margin: 0, fontSize: 10, textAlign: "center", color: "#374151" }}>{ligne.quantite}</p>
                <p style={{ margin: 0, fontSize: 10, textAlign: "center", color: "#6b7280" }}>{ligne.unite}</p>
              </div>
            ))}
          </div>
        ))}

        {/* Totaux */}
        <div style={{ marginTop: 24, borderTop: "2px solid #00365A", paddingTop: 12, marginLeft: "auto", width: 240 }}>
          {[
            { label: "Total HT", value: fmtEuro(form.totalHT), bold: false },
            { label: "TVA (0 %)", value: "0,00 €", bold: false },
            { label: "Total TTC", value: fmtEuro(form.totalHT), bold: true },
          ].map(({ label, value, bold }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f3f4f6" }}>
              <p style={{ margin: 0, fontSize: 11, color: bold ? "#00365A" : "#6b7280", fontWeight: bold ? 700 : 400 }}>{label}</p>
              <p style={{ margin: 0, fontSize: 11, fontWeight: bold ? 700 : 500, color: bold ? "#00365A" : "#374151" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Signature zone */}
        <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          {["Bon pour accord — Cachet et signature", "SENO Rénovation — Signature"].map((label) => (
            <div key={label}>
              <p style={{ margin: "0 0 6px", fontSize: 9, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</p>
              <div style={{ height: 60, border: "1px dashed #d1d5db", borderRadius: 2 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: "#f8fafc", borderTop: "1px solid #e5e7eb", padding: "10px 24px" }}>
        <p style={{ margin: 0, fontSize: 8.5, color: "#9ca3af", textAlign: "center" }}>{SENO.legal}</p>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function BDCPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const stepParam = searchParams.get("step");
  const step = stepParam ? (parseInt(stepParam, 10) as 1 | 2 | 3 | 4) : 1;

  const setStep = (newStep: 1 | 2 | 3 | 4 | ((s: 1 | 2 | 3 | 4) => 1 | 2 | 3 | 4)) => {
    const next = typeof newStep === "function" ? newStep(step) : newStep;
    setSearchParams({ step: next.toString() });
  };
  const [fileName, setFileName] = useState("");
  const [form, setForm] = useState<BDCForm>({
    numeroBDC: "", numeroDevis: "", client: "", adresseChantier: "",
    refChantier: "", responsable: "", date: "", destinataire: "",
    adresseDestinataire: "", telephoneDestinataire: "", emailDestinataire: "", totalHT: "",
  });
  const [lots, setLots] = useState<Lot[]>([]);

  const handleFile = (name: string) => {
    setFileName(name);
    const { lots: mockLots, form: mockForm } = makeMockData();
    setLots(mockLots);
    setForm((f) => ({ ...f, ...mockForm }));
    setStep(2);
  };

  const handleGeneratePDF = () => {
    const el = document.getElementById("bdc-document");
    if (!el) return;
    const win = window.open("", "_blank", "width=850,height=1100");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8">
      <title>BDC ${form.numeroBDC}</title>
      <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 20px; background: #fff; }
        @media print { body { padding: 0; } }
      </style>
    </head><body>${el.outerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 400);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-900">Génération Bon de Commande</h1>
            <p className="text-xs text-gray-400 mt-0.5">Importez un devis Tolteck, vérifiez et générez le BDC</p>
          </div>
          {step > 1 && (
            <div className="flex items-center gap-2">
              {step > 2 && (
                <button onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3 | 4)} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-sm cursor-pointer hover:bg-gray-50">
                  <ArrowLeft size={12} /> Retour
                </button>
              )}
              {step < 4 && (
                <button onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3 | 4)} className="text-xs font-medium px-4 py-1.5 bg-[#00365A] text-white rounded-sm hover:bg-[#004d80] cursor-pointer transition-colors">
                  {step === 3 ? "Prévisualiser →" : "Continuer →"}
                </button>
              )}
              {step === 4 && (
                <>
                  <button onClick={() => setStep(3)} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-sm cursor-pointer hover:bg-gray-50">
                    <Pencil size={12} /> Modifier
                  </button>
                  <button onClick={handleGeneratePDF} className="flex items-center gap-1.5 text-xs font-medium px-4 py-1.5 bg-[#00365A] text-white rounded-sm hover:bg-[#004d80] cursor-pointer transition-colors">
                    <Printer size={12} /> Générer le PDF
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-[#F4F5F7] p-6">
        <div className="max-w-5xl mx-auto">
          {step > 1 && <StepBar current={step} />}

          {step === 1 && (
            <div className="flex flex-col" style={{ minHeight: 400 }}>
              <DropZone onFile={handleFile} />
            </div>
          )}
          {step === 2 && <InfosStep form={form} setForm={setForm} fileName={fileName} />}
          {step === 3 && <PrestationsStep lots={lots} setLots={setLots} form={form} setForm={setForm} />}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 rounded-sm px-3 py-2">
                <Eye size={13} className="text-gray-400" />
                <span>Prévisualisation du bon de commande. Vérifiez toutes les informations avant de générer le PDF.</span>
              </div>
              <Preview form={form} lots={lots} />
            </div>
          )}

          {/* Bottom nav for steps 2 & 3 */}
          {(step === 2 || step === 3) && (
            <div className="flex justify-end mt-5">
              <button onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3 | 4)} className="text-sm font-medium px-5 py-2 bg-[#00365A] text-white rounded-sm hover:bg-[#004d80] cursor-pointer transition-colors">
                {step === 3 ? "Prévisualiser →" : "Continuer →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
