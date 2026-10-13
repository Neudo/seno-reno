import { useState, useRef } from "react";
import { Upload, X, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import type { Devis, StatutDevis } from "./devisTypes";
import { STATUT_LABELS } from "./devisTypes";

type Step = "drop" | "verify" | "done";

const STATUTS_IMPORT: StatutDevis[] = ["a-envoyer", "envoye"];

// Simulate detected data from a PDF
function simulateDetection(fileName: string): Partial<Devis> {
  const num = Math.floor(Math.random() * 10) + 73;
  return {
    numero: `DEV-2026-00${num}`,
    client: "Nouveau client",
    projet: "Projet à compléter",
    adresse: "",
    date: new Date().toISOString().slice(0, 10),
    montantHT: 0,
    montantTTC: 0,
    statut: "envoye",
    pdfNom: fileName,
  };
}

export default function ImportDevisModal({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (d: Omit<Devis, "id" | "interactions">) => void;
}) {
  const [step, setStep] = useState<Step>("drop");
  const [dragging, setDragging] = useState(false);
  const [form, setForm] = useState<Partial<Devis>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".pdf")) return;
    const detected = simulateDetection(file.name);
    setForm(detected);
    setStep("verify");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const set = (k: keyof Devis, v: string | number) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const canConfirm =
    form.numero && form.client && form.projet && form.date && form.statut;

  const confirm = () => {
    onImport({
      numero: form.numero!,
      client: form.client!,
      clientEmail: form.clientEmail,
      clientTel: form.clientTel,
      projet: form.projet!,
      adresse: form.adresse ?? "",
      date: form.date!,
      montantHT: Number(form.montantHT ?? 0),
      montantTTC: Number(form.montantTTC ?? 0),
      statut: form.statut ?? "envoye",
      pdfNom: form.pdfNom,
      derniereAction: `Importé le ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "2-digit" })}`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-sm shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            {step === "drop" ? "Importer un devis" : "Vérification des informations"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>

        {step === "drop" && (
          <div className="px-6 py-8">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-sm cursor-pointer transition-colors flex flex-col items-center justify-center py-12 px-6 text-center ${
                dragging
                  ? "border-[#00365A] bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Upload size={28} className="text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-600">
                Déposez le PDF ici ou cliquez pour parcourir
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Devis généré depuis Tolteck au format PDF
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <div className="mt-4 flex items-start gap-2 bg-blue-50 rounded-sm px-3 py-2.5">
              <AlertCircle size={13} className="text-[#00365A] shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-700">
                Les informations du devis seront détectées automatiquement. Vous pourrez les vérifier avant validation.
              </p>
            </div>
          </div>
        )}

        {step === "verify" && (
          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {form.pdfNom && (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-sm px-3 py-2">
                <FileText size={14} className="text-[#00365A]" />
                <span className="text-sm text-gray-700 truncate">{form.pdfNom}</span>
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0 ml-auto" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="N° Devis"
                value={form.numero ?? ""}
                onChange={(v) => set("numero", v)}
                mono
              />
              <FormField
                label="Date"
                type="date"
                value={form.date ?? ""}
                onChange={(v) => set("date", v)}
              />
              <FormField
                label="Client"
                value={form.client ?? ""}
                onChange={(v) => set("client", v)}
                span2
              />
              <FormField
                label="Projet / description"
                value={form.projet ?? ""}
                onChange={(v) => set("projet", v)}
                span2
              />
              <FormField
                label="Adresse du chantier"
                value={form.adresse ?? ""}
                onChange={(v) => set("adresse", v)}
                span2
              />
              <FormField
                label="Montant HT (€)"
                type="number"
                value={String(form.montantHT ?? "")}
                onChange={(v) => set("montantHT", Number(v))}
              />
              <FormField
                label="Montant TTC (€)"
                type="number"
                value={String(form.montantTTC ?? "")}
                onChange={(v) => set("montantTTC", Number(v))}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">
                Statut initial
              </label>
              <select
                value={form.statut ?? "envoye"}
                onChange={(e) => set("statut", e.target.value)}
                className="text-sm border border-gray-200 rounded-sm px-2.5 py-1.5 bg-white w-full focus:outline-none focus:border-[#00365A]"
              >
                {STATUTS_IMPORT.map((s) => (
                  <option key={s} value={s}>
                    {STATUT_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={step === "verify" ? () => setStep("drop") : onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {step === "verify" ? "Retour" : "Annuler"}
          </button>
          {step === "verify" && (
            <button
              onClick={confirm}
              disabled={!canConfirm}
              className="px-5 py-1.5 bg-[#00365A] text-white text-sm font-medium rounded-sm hover:bg-[#004A7A] disabled:opacity-40 transition-colors"
            >
              Valider et créer le devis
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  mono,
  span2,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  mono?: boolean;
  span2?: boolean;
}) {
  return (
    <div className={span2 ? "col-span-2" : ""}>
      <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-2.5 py-1.5 border border-gray-200 rounded-sm text-sm bg-white focus:outline-none focus:border-[#00365A] transition-colors ${
          mono ? "font-mono" : ""
        }`}
      />
    </div>
  );
}
