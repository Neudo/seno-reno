import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { BdcDocument, formatBdcAmount } from "@/features/outils/bdc/BdcDocument";

describe("formatBdcAmount", () => {
  it("uses standard spaces in the PDF currency string", () => {
    expect(formatBdcAmount("32000,00")).toBe("32 000,00 €");
  });

  it("removes accidental separators from a typed amount", () => {
    expect(formatBdcAmount("32/000,00")).toBe("32 000,00 €");
  });

  it("renders a PDF after formatting the amount", async () => {
    const buffer = await renderToBuffer(
      createElement(BdcDocument, {
        details: {
          bdcDate: "2026-09-07",
          bdcNumber: "BDC-2026-001",
          manager: "Pierre-Emmanuel Martin",
          projectAddress: "12 rue de la Paix, 75000 Paris",
          projectReference: "Rénovation appartement",
          subcontractorAddress: "4 rue des Artisans",
          subcontractorCity: "89000 Auxerre",
          subcontractorContact: "Jean Dupont",
          subcontractorEmail: "jean@example.com",
          subcontractorName: "Entreprise Dupont",
          subcontractorPhone: "06 00 00 00 00",
          totalHt: "32/000,00",
        },
        lots: [
          {
            designation: "Peinture",
            id: "lot-1",
            lines: [
              {
                designation: "Préparation des supports",
                id: "line-1",
                number: "1.1",
                quantity: "1",
                selected: true,
                unit: "forfait",
              },
            ],
            number: "1",
          },
        ],
      }),
    );

    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
  });
});
