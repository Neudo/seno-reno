import { pdf } from "@react-pdf/renderer";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Download,
  FileText,
  LoaderCircle,
  Plus,
  Trash2,
  UploadCloud,
} from "lucide-react";
import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import { BdcDocument } from "@/features/outils/bdc/BdcDocument";
import { BdcPreview } from "@/features/outils/bdc/BdcPreview";
import { parseTolteckQuote } from "@/features/outils/bdc/parse-tolteck-quote";
import type {
  BdcDetails,
  BdcLine,
  BdcLot,
  ParsedTolteckQuote,
} from "@/features/outils/bdc/types";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/lib/utils";

const today = new Date().toISOString().slice(0, 10);

const textareaClassName =
  "min-h-20 w-full resize-y rounded-none border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const workflowSteps = [
  "Import",
  "Validation des données",
  "Prévisualisation & génération",
];

function WizardProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <ol className="grid border border-slate-200 bg-white sm:grid-cols-3">
      {workflowSteps.map((label, index) => {
        const stepNumber = index + 1;
        const isCurrent = stepNumber === step;
        const isComplete = stepNumber < step;

        return (
          <li
            aria-current={isCurrent ? "step" : undefined}
            className={cn(
              "flex items-center gap-3 px-4 py-3",
              index < workflowSteps.length - 1 &&
                "border-b border-slate-200 sm:border-b-0 sm:border-r",
              isCurrent && "bg-seno-50",
            )}
            key={label}
          >
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center border text-xs font-semibold",
                isComplete && "border-seno-700 bg-seno-700 text-white",
                isCurrent && "border-seno-700 bg-white text-seno-700",
                !isComplete && !isCurrent && "border-slate-300 text-slate-400",
              )}
            >
              {isComplete ? <Check className="size-3.5" /> : stepNumber}
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                isCurrent || isComplete ? "text-slate-900" : "text-slate-400",
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function buildInitialDetails(quote: ParsedTolteckQuote): BdcDetails {
  const quoteSuffix = quote.quoteNumber.match(/(\d+)$/u)?.[1];
  const year =
    quote.quoteNumber.match(/DEV-(\d{4})/iu)?.[1] ?? today.slice(0, 4);

  return {
    bdcDate: today,
    bdcNumber: `BDC-${year}-${quoteSuffix ?? "001"}`,
    manager: "Pierre-Emmanuel de Leusse",
    projectAddress: quote.projectAddress,
    projectReference: quote.projectTitle || quote.clientName,
    quoteNumber: quote.quoteNumber,
    subcontractorAddress: "",
    subcontractorCity: "",
    subcontractorContact: "",
    subcontractorEmail: "",
    subcontractorName: "",
    subcontractorPhone: "",
    totalHt: "",
  };
}

function countLines(lots: BdcLot[]) {
  return lots.reduce((total, lot) => total + lot.lines.length, 0);
}

function countSelectedLines(lots: BdcLot[]) {
  return lots.reduce(
    (total, lot) => total + lot.lines.filter((line) => line.selected).length,
    0,
  );
}

function Field({
  className,
  id,
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  className?: string;
  id: keyof BdcDetails;
  label: string;
  onChange: (field: keyof BdcDetails, value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        onChange={(event) => onChange(id, event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </div>
  );
}

function UploadPanel({
  error,
  isParsing,
  onFile,
}: {
  error: string | null;
  isParsing: boolean;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const submitFile = (file?: File) => {
    if (file) {
      onFile(file);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    submitFile(event.dataTransfer.files[0]);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    submitFile(event.target.files?.[0]);
    event.target.value = "";
  };

  return (
    <div className="mx-auto mt-8 max-w-3xl">
      <div
        className={cn(
          "group relative grid min-h-80 place-items-center border border-dashed bg-white px-8 py-14 text-center transition-colors",
          isDragging
            ? "border-seno-500 bg-seno-50"
            : "border-slate-300 hover:border-seno-500",
        )}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={handleChange}
          ref={inputRef}
          type="file"
        />
        <div>
          <div className="mx-auto grid size-14 place-items-center bg-seno-700 text-white transition-transform group-hover:-translate-y-1">
            {isParsing ? (
              <LoaderCircle className="size-6 animate-spin" />
            ) : (
              <UploadCloud className="size-6" strokeWidth={1.7} />
            )}
          </div>
          <h2 className="mt-6 text-xl font-semibold tracking-[-0.025em] text-slate-900">
            {isParsing ? "Lecture du devis…" : "Déposer un devis Tolteck"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Le PDF est analysé localement pour retrouver le chantier, les lots,
            les désignations, les quantités et les unités.
          </p>
          <Button
            className="mt-6"
            disabled={isParsing}
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            <FileText className="size-4" />
            Choisir un PDF
          </Button>
          <p className="mt-4 text-xs text-slate-400">
            PDF avec texte sélectionnable · 20 Mo maximum
          </p>
        </div>
      </div>

      {error ? (
        <Alert className="mt-4" variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

function LotEditor({
  lot,
  onAddLine,
  onDeleteLine,
  onLotChange,
  onLineChange,
  onToggleLot,
}: {
  lot: BdcLot;
  onAddLine: (lotId: string) => void;
  onDeleteLine: (lotId: string, lineId: string) => void;
  onLotChange: (lotId: string, value: string) => void;
  onLineChange: (
    lotId: string,
    lineId: string,
    field: keyof Pick<
      BdcLine,
      "designation" | "number" | "quantity" | "selected" | "unit"
    >,
    value: string | boolean,
  ) => void;
  onToggleLot: (lotId: string, selected: boolean) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const selectedCount = lot.lines.filter((line) => line.selected).length;
  const allSelected =
    selectedCount === lot.lines.length && lot.lines.length > 0;

  return (
    <section className="border border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-3 py-3">
        <input
          aria-label={`Sélectionner ${lot.designation}`}
          checked={allSelected}
          className="size-4 accent-[#00365A]"
          onChange={(event) => onToggleLot(lot.id, event.target.checked)}
          type="checkbox"
        />
        <button
          aria-expanded={isOpen}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={() => setIsOpen((open) => !open)}
          type="button"
        >
          <span className="shrink-0 text-xs font-semibold tracking-[0.12em] text-seno-500">
            {lot.number ? `LOT ${lot.number}` : "LOT"}
          </span>
          <span className="truncate text-sm font-semibold text-slate-900">
            {lot.designation}
          </span>
          <span className="ml-auto shrink-0 text-xs text-slate-400">
            {selectedCount}/{lot.lines.length}
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-slate-400 transition-transform",
              !isOpen && "-rotate-90",
            )}
          />
        </button>
      </div>

      {isOpen ? (
        <div className="p-3">
          <div className="mb-3 grid gap-2 sm:grid-cols-[90px_1fr]">
            <Input disabled value={lot.number || "-"} />
            <Input
              aria-label="Nom du lot"
              onChange={(event) => onLotChange(lot.id, event.target.value)}
              value={lot.designation}
            />
          </div>

          <div className="grid gap-2">
            {lot.lines.map((line) => (
              <div
                className={cn(
                  "grid gap-2 border border-slate-200 p-2 transition-opacity sm:grid-cols-[22px_60px_minmax(0,1fr)_66px_62px_32px]",
                  !line.selected && "opacity-55",
                )}
                key={line.id}
              >
                <input
                  aria-label={`Inclure la ligne ${line.number}`}
                  checked={line.selected}
                  className="mt-2 size-4 accent-[#00365A]"
                  onChange={(event) =>
                    onLineChange(
                      lot.id,
                      line.id,
                      "selected",
                      event.target.checked,
                    )
                  }
                  type="checkbox"
                />
                <Input
                  aria-label="Numéro de ligne"
                  onChange={(event) =>
                    onLineChange(lot.id, line.id, "number", event.target.value)
                  }
                  value={line.number}
                />
                <textarea
                  aria-label="Désignation"
                  className="min-h-24 w-full resize-y rounded-none border border-input bg-transparent px-3 py-2 text-sm leading-5 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  onChange={(event) =>
                    onLineChange(
                      lot.id,
                      line.id,
                      "designation",
                      event.target.value,
                    )
                  }
                  rows={3}
                  value={line.designation}
                />
                <Input
                  aria-label="Quantité"
                  inputMode="decimal"
                  onChange={(event) =>
                    onLineChange(
                      lot.id,
                      line.id,
                      "quantity",
                      event.target.value,
                    )
                  }
                  value={line.quantity}
                />
                <Input
                  aria-label="Unité"
                  onChange={(event) =>
                    onLineChange(lot.id, line.id, "unit", event.target.value)
                  }
                  value={line.unit}
                />
                <Button
                  aria-label={`Supprimer la ligne ${line.number}`}
                  className="text-slate-400 hover:text-destructive"
                  onClick={() => onDeleteLine(lot.id, line.id)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          <button
            className="mt-3 flex cursor-pointer items-center gap-1.5 py-1 text-xs text-gray-400 transition-colors hover:text-[#00365A]"
            onClick={() => onAddLine(lot.id)}
            type="button"
          >
            <Plus aria-hidden="true" className="size-3" />
            Ajouter une ligne
          </button>
        </div>
      ) : null}
    </section>
  );
}

export function BdcGenerator() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [quote, setQuote] = useState<ParsedTolteckQuote | null>(null);
  const [lots, setLots] = useState<BdcLot[]>([]);
  const [details, setDetails] = useState<BdcDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const selectedLineCount = useMemo(() => countSelectedLines(lots), [lots]);
  const totalLineCount = useMemo(() => countLines(lots), [lots]);
  const totalAmount = Number.parseFloat(
    details?.totalHt.replace(",", ".") ?? "",
  );
  const canGenerate = Boolean(
    details?.bdcNumber.trim() &&
    details.subcontractorName.trim() &&
    selectedLineCount > 0 &&
    Number.isFinite(totalAmount) &&
    totalAmount > 0,
  );

  const importFile = async (file: File) => {
    setError(null);
    setDownloaded(false);

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Le fichier sélectionné n’est pas un PDF.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError("Le PDF dépasse la limite de 20 Mo.");
      return;
    }

    setIsParsing(true);

    try {
      const parsedQuote = await parseTolteckQuote(file);
      setQuote(parsedQuote);
      setLots(parsedQuote.lots);
      setDetails(buildInitialDetails(parsedQuote));
      setStep(2);
    } catch (parseError) {
      setError(
        parseError instanceof Error
          ? parseError.message
          : "Le devis n’a pas pu être analysé.",
      );
    } finally {
      setIsParsing(false);
    }
  };

  const updateDetails = (field: keyof BdcDetails, value: string) => {
    setDownloaded(false);
    setDetails((current) =>
      current ? { ...current, [field]: value } : current,
    );
  };

  const updateLot = (lotId: string, designation: string) => {
    setDownloaded(false);
    setLots((current) =>
      current.map((lot) => (lot.id === lotId ? { ...lot, designation } : lot)),
    );
  };

  const updateLine = (
    lotId: string,
    lineId: string,
    field: keyof Pick<
      BdcLine,
      "designation" | "number" | "quantity" | "selected" | "unit"
    >,
    value: string | boolean,
  ) => {
    setDownloaded(false);
    setLots((current) =>
      current.map((lot) =>
        lot.id === lotId
          ? {
              ...lot,
              lines: lot.lines.map((line) =>
                line.id === lineId ? { ...line, [field]: value } : line,
              ),
            }
          : lot,
      ),
    );
  };

  const toggleLot = (lotId: string, selected: boolean) => {
    setDownloaded(false);
    setLots((current) =>
      current.map((lot) =>
        lot.id === lotId
          ? {
              ...lot,
              lines: lot.lines.map((line) => ({ ...line, selected })),
            }
          : lot,
      ),
    );
  };

  const addLine = (lotId: string) => {
    setDownloaded(false);
    setLots((current) =>
      current.map((lot) => {
        if (lot.id !== lotId) {
          return lot;
        }

        const nextNumber = lot.number
          ? `${lot.number}.${lot.lines.length + 1}`
          : `${lot.lines.length + 1}`;
        return {
          ...lot,
          lines: [
            ...lot.lines,
            {
              designation: "Nouvelle prestation",
              id: `line-${crypto.randomUUID()}`,
              number: nextNumber,
              quantity: "1",
              selected: true,
              unit: "u",
            },
          ],
        };
      }),
    );
  };

  const deleteLine = (lotId: string, lineId: string) => {
    setDownloaded(false);
    setLots((current) =>
      current.map((lot) =>
        lot.id === lotId
          ? { ...lot, lines: lot.lines.filter((line) => line.id !== lineId) }
          : lot,
      ),
    );
  };

  const generatePdf = async () => {
    if (!details || !canGenerate) {
      return;
    }

    setIsGenerating(true);
    setDownloaded(false);

    try {
      const blob = await pdf(
        <BdcDocument details={details} lots={lots} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${details.bdcNumber || "bon-de-commande"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setDownloaded(true);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!quote || !details) {
    return (
      <div className="mt-7">
        <WizardProgress step={1} />
        <UploadPanel error={error} isParsing={isParsing} onFile={importFile} />
      </div>
    );
  }

  return (
    <div className="mt-7">
      <WizardProgress step={step} />

      {step === 2 ? (
        <div className="mx-auto mt-5 max-w-7xl">
          <div className="grid gap-5">
            <section className="border border-slate-200 bg-white p-4 sm:p-5">
              <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-seno-500">
                    01 · IDENTIFICATION
                  </p>
                  <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-slate-900">
                    Bon de commande et chantier
                  </h2>
                </div>
                <span className="bg-seno-50 px-2 py-1 text-xs font-medium text-seno-700">
                  TVA 0 %
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="bdcNumber"
                  label="Numéro du BDC"
                  onChange={updateDetails}
                  value={details.bdcNumber}
                />
                <Field
                  id="bdcDate"
                  label="Date d’émission"
                  onChange={updateDetails}
                  type="date"
                  value={details.bdcDate}
                />
                <Field
                  id="quoteNumber"
                  label="Devis d’origine"
                  onChange={updateDetails}
                  value={details.quoteNumber}
                />
                <Field
                  id="manager"
                  label="Responsable"
                  onChange={updateDetails}
                  value={details.manager}
                />
                <Field
                  className="sm:col-span-2"
                  id="projectReference"
                  label="Référence chantier"
                  onChange={updateDetails}
                  value={details.projectReference}
                />
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="projectAddress">Adresse du chantier</Label>
                  <textarea
                    className={textareaClassName}
                    id="projectAddress"
                    onChange={(event) =>
                      updateDetails("projectAddress", event.target.value)
                    }
                    value={details.projectAddress}
                  />
                </div>
              </div>
            </section>

            <section className="border border-slate-200 bg-white p-4 sm:p-5">
              <div className="mb-5 border-b border-slate-200 pb-4">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-seno-500">
                  02 · DESTINATAIRE
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-slate-900">
                  Sous-traitant
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  className="sm:col-span-2"
                  id="subcontractorName"
                  label="Société *"
                  onChange={updateDetails}
                  placeholder="Nom du sous-traitant"
                  value={details.subcontractorName}
                />
                <Field
                  className="sm:col-span-2"
                  id="subcontractorContact"
                  label="Contact"
                  onChange={updateDetails}
                  placeholder="Prénom et nom"
                  value={details.subcontractorContact}
                />
                <Field
                  className="sm:col-span-2"
                  id="subcontractorAddress"
                  label="Adresse"
                  onChange={updateDetails}
                  value={details.subcontractorAddress}
                />
                <Field
                  className="sm:col-span-2"
                  id="subcontractorCity"
                  label="Code postal et ville"
                  onChange={updateDetails}
                  value={details.subcontractorCity}
                />
                <Field
                  id="subcontractorPhone"
                  label="Téléphone"
                  onChange={updateDetails}
                  type="tel"
                  value={details.subcontractorPhone}
                />
                <Field
                  id="subcontractorEmail"
                  label="E-mail"
                  onChange={updateDetails}
                  type="email"
                  value={details.subcontractorEmail}
                />
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-seno-500">
                    03 · CONTENU
                  </p>
                  <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-slate-900">
                    Lots et prestations
                  </h2>
                </div>
                <p className="text-xs text-slate-500">
                  {selectedLineCount} sur {totalLineCount} lignes incluses
                </p>
              </div>
              <div className="grid gap-3">
                {lots.map((lot) => (
                  <LotEditor
                    key={lot.id}
                    lot={lot}
                    onAddLine={addLine}
                    onDeleteLine={deleteLine}
                    onLineChange={updateLine}
                    onLotChange={updateLot}
                    onToggleLot={toggleLot}
                  />
                ))}
              </div>
            </section>

            <section className="border border-seno-700 bg-seno-700 p-4 text-white sm:p-5">
              <div className="grid gap-4 sm:grid-cols-[1fr_220px] sm:items-end">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-white/60">
                    04 · MONTANT
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">
                    Total négocié avec le sous-traitant
                  </h2>
                  <p className="mt-1 text-sm text-white/60">
                    Les prix unitaires du devis client ne figurent jamais dans
                    le BDC.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label className="text-white" htmlFor="totalHt">
                    Montant total HT *
                  </Label>
                  <div className="relative">
                    <Input
                      className="border-white/30 bg-white pr-10 text-right text-base font-semibold text-slate-900"
                      id="totalHt"
                      inputMode="decimal"
                      min="0"
                      onChange={(event) =>
                        updateDetails("totalHt", event.target.value)
                      }
                      placeholder="0,00"
                      step="0.01"
                      type="number"
                      value={details.totalHt}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-sm font-medium text-slate-500">
                      €
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <div className="sticky flex justify-end bottom-[-29px] right-0 bg-slate-200 p-4">
              <Button
                className="h-10 justify-end px-4"
                disabled={!canGenerate}
                onClick={() => setStep(3)}
                type="button"
              >
                Prévisualiser le BDC
                <ArrowRight className="size-4" />
              </Button>
            </div>
            {!canGenerate ? (
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Renseigne la société, un montant HT positif et conserve au moins
                une ligne pour poursuivre.
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <section className="mx-auto mt-5 max-w-5xl border border-slate-200 bg-white">
          <header className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.16em] text-seno-500">
                ÉTAPE 3 · APERÇU A4
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-slate-900">
                Prévisualisation & génération
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Vérifie la mise en page finale avant de télécharger le bon de
                commande.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setStep(2)}
                size="sm"
                type="button"
                variant="outline"
              >
                <ArrowLeft className="size-4" />
                Modifier les données
              </Button>
            </div>
          </header>

          <div className="bg-slate-200 p-3 sm:p-5">
            <div className="mx-auto h-[960px] max-w-3xl overflow-y-auto bg-slate-300">
              <BdcPreview details={details} lots={lots} />
            </div>
          </div>

          <footer className="flex flex-col gap-4 border-t border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">
                {selectedLineCount} prestation{selectedLineCount > 1 ? "s" : ""}{" "}
                · TVA à 0 %
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {details.subcontractorName} · {details.totalHt || "0"} € HT
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <Button
                className="h-11 justify-between px-4"
                disabled={!canGenerate || isGenerating}
                onClick={() => void generatePdf()}
                type="button"
              >
                {isGenerating ? "Génération en cours…" : "Générer le PDF"}
                {isGenerating ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
              </Button>
              {downloaded ? (
                <p className="flex items-center gap-1.5 text-xs text-emerald-700">
                  <Check className="size-3.5" />
                  PDF généré et téléchargé.
                </p>
              ) : null}
            </div>
          </footer>
        </section>
      )}
    </div>
  );
}
