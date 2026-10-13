import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import { Dialog } from "radix-ui";
import { useEffect, useState } from "react";

import { useAuth } from "@/features/auth/context/AuthProvider";
import type { ChantierDetail } from "@/features/chantiers/api/chantiers-api";
import { getModifiedQuoteSummary } from "@/features/chantiers/lib/modified-quote";
import { getQuoteDocumentUrl } from "@/features/devis/api/quotes-api";

GlobalWorkerOptions.workerSrc = pdfWorker;

const amountFormatter = new Intl.NumberFormat("fr-FR", {
  currency: "EUR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency",
});

function formatAmount(value: number | null) {
  return value === null ? "Non renseigné" : amountFormatter.format(value);
}

type PreviewPage = { height: number; imageUrl: string; width: number };

function QuotePages({ data }: { data: Uint8Array }) {
  const [pages, setPages] = useState<PreviewPage[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    const imageUrls: string[] = [];
    // PDF.js transfers its input to the worker. Preserve the query cache bytes.
    const loadingTask = getDocument({ data: data.slice() });

    const renderPages = async () => {
      try {
        const document = await loadingTask.promise;
        const nextPages: PreviewPage[] = [];

        for (let number = 1; number <= document.numPages; number += 1) {
          if (!isCurrent) return;

          const page = await document.getPage(number);
          const viewport = page.getViewport({ scale: 1.35 });
          const canvas = window.document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Canvas unavailable");

          canvas.height = Math.ceil(viewport.height);
          canvas.width = Math.ceil(viewport.width);
          await page.render({ canvas, canvasContext: context, viewport }).promise;
          const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/png"),
          );
          if (!isCurrent) return;
          if (!blob) throw new Error("Preview unavailable");

          const imageUrl = URL.createObjectURL(blob);
          imageUrls.push(imageUrl);
          nextPages.push({
            height: canvas.height,
            imageUrl,
            width: canvas.width,
          });
          page.cleanup();
          canvas.width = 0;
          canvas.height = 0;
        }

        if (isCurrent) setPages(nextPages);
      } catch {
        if (isCurrent) setError(true);
      }
    };

    void renderPages();
    return () => {
      isCurrent = false;
      void loadingTask.destroy();
      imageUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [data]);

  if (error) {
    return (
      <p role="alert" className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        L’aperçu du devis n’a pas pu être affiché.
      </p>
    );
  }

  if (!pages.length) {
    return <p role="status" className="py-10 text-center text-sm text-slate-500">Chargement du devis…</p>;
  }

  return (
    <div className="grid gap-4">
      {pages.map((page, index) => (
        <img
          alt={`Page ${index + 1} du devis rattaché au chantier`}
          className="block h-auto w-full bg-white shadow-sm"
          height={page.height}
          key={page.imageUrl}
          src={page.imageUrl}
          width={page.width}
        />
      ))}
    </div>
  );
}

export function ModifiedQuotePreview({
  detail,
  onClose,
}: {
  detail: ChantierDetail;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const quote = detail.initialQuote;
  const { acceptedAdjustments, impact, revisedAmount } = getModifiedQuoteSummary(
    detail.chantier.initialSignedQuoteAmount,
    detail.adjustments,
  );
  const previewQuery = useQuery({
    enabled: Boolean(quote),
    queryFn: async ({ signal }) => {
      if (!quote) throw new Error("Devis introuvable.");
      const url = await getQuoteDocumentUrl(quote.documentPath);
      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error("Le devis n’a pas pu être chargé.");
      return new Uint8Array(await response.arrayBuffer());
    },
    queryKey: ["modified-quote-preview", user?.id, quote?.documentPath],
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/35" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col border border-slate-200 bg-white shadow-2xl outline-none">
          <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div>
              <Dialog.Title className="text-lg font-semibold tracking-[-0.02em] text-slate-900">
                Devis modifié
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-slate-500">
                {detail.chantier.name}{quote ? ` · ${quote.quoteNumber}` : ""}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Fermer l’aperçu"
              className="grid size-9 shrink-0 cursor-pointer place-items-center border border-slate-300 text-slate-500 transition-colors hover:bg-slate-50"
            >
              <X aria-hidden="true" className="size-4" />
            </Dialog.Close>
          </header>
          <div className="min-h-0 overflow-y-auto bg-[#f7f8f9] p-3 sm:p-5">
            {quote ? (
              previewQuery.isError ? (
                <div role="alert" className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <p>Le devis n’a pas pu être chargé.</p>
                  <button
                    className="mt-3 cursor-pointer underline"
                    onClick={() => void previewQuery.refetch()}
                    type="button"
                  >
                    Réessayer
                  </button>
                </div>
              ) : previewQuery.data ? (
                <QuotePages data={previewQuery.data} key={previewQuery.dataUpdatedAt} />
              ) : (
                <p role="status" className="py-10 text-center text-sm text-slate-500">Chargement du devis…</p>
              )
            ) : (
              <p className="border border-slate-200 bg-white p-5 text-sm text-slate-600">
                Aucun devis n’est rattaché à ce chantier.
              </p>
            )}

            <section className="mt-4 border border-slate-200 bg-white p-5 sm:p-7">
              <h2 className="text-base font-semibold text-slate-900">Variations acceptées</h2>
              {acceptedAdjustments.length ? (
                <div className="mt-4 divide-y divide-slate-100 border-y border-slate-200">
                  {acceptedAdjustments.map((adjustment) => (
                    <div className="flex items-start justify-between gap-4 py-3" key={adjustment.id}>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">{adjustment.label}</p>
                        {adjustment.description ? (
                          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-500">{adjustment.description}</p>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-sm font-medium text-slate-800">
                        {adjustment.kind === "PLUS" ? "+" : "−"}{formatAmount(adjustment.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">Aucune variation acceptée.</p>
              )}
              <dl className="mt-5 ml-auto grid max-w-sm gap-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Montant du devis rattaché HT</dt>
                  <dd className="shrink-0 font-medium text-slate-800">{formatAmount(detail.chantier.initialSignedQuoteAmount)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Total des variations HT</dt>
                  <dd className="shrink-0 font-medium text-slate-800">{impact < 0 ? "−" : "+"}{formatAmount(Math.abs(impact))}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-slate-200 pt-4 text-base">
                  <dt className="font-semibold text-slate-900">Total modifié HT</dt>
                  <dd className="shrink-0 font-semibold text-seno-700">{formatAmount(revisedAmount)}</dd>
                </div>
              </dl>
            </section>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
