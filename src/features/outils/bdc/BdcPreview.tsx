import { pdf } from "@react-pdf/renderer";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import { useEffect, useState } from "react";

import { BdcDocument } from "@/features/outils/bdc/BdcDocument";
import type { BdcDetails, BdcLot } from "@/features/outils/bdc/types";

GlobalWorkerOptions.workerSrc = pdfWorker;

type PreviewPage = {
  height: number;
  imageUrl: string;
  width: number;
};

export function BdcPreview({
  details,
  lots,
}: {
  details: BdcDetails;
  lots: BdcLot[];
}) {
  const [pages, setPages] = useState<PreviewPage[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    const renderPreview = async () => {
      setError(false);
      setPages([]);

      try {
        const blob = await pdf(<BdcDocument details={details} lots={lots} />).toBlob();
        const pdfDocument = await getDocument({
          data: new Uint8Array(await blob.arrayBuffer()),
        }).promise;
        const nextPages: PreviewPage[] = [];

        for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
          const page = await pdfDocument.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1.35 });
          const canvas = window.document.createElement("canvas");
          const context = canvas.getContext("2d");

          if (!context) {
            throw new Error("Canvas unavailable");
          }

          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvas, canvasContext: context, viewport }).promise;
          nextPages.push({
            height: viewport.height,
            imageUrl: canvas.toDataURL("image/png"),
            width: viewport.width,
          });
          page.cleanup();
        }

        if (isCurrent) {
          setPages(nextPages);
        }
      } catch {
        if (isCurrent) {
          setError(true);
        }
      }
    };

    void renderPreview();

    return () => {
      isCurrent = false;
    };
  }, [details, lots]);

  if (error) {
    return (
      <p className="p-6 text-center text-sm text-slate-600">
        L’aperçu n’a pas pu être chargé. Vous pouvez néanmoins revenir à l’étape de
        validation ou générer le PDF.
      </p>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="grid min-h-full place-items-center p-6 text-sm text-slate-500">
        Génération de l’aperçu…
      </div>
    );
  }

  return (
    <div className="px-3 pb-3 pt-3 sm:px-5 sm:pb-5 sm:pt-5">
      {pages.map((page, index) => (
        <div
          className="mb-4 bg-white shadow-[0_12px_30px_rgb(15_23_42_/_0.14)] last:mb-0"
          key={page.imageUrl}
        >
          <img
            alt={`Page ${index + 1} du bon de commande`}
            className="block h-auto w-full"
            height={page.height}
            src={page.imageUrl}
            width={page.width}
          />
        </div>
      ))}
    </div>
  );
}
