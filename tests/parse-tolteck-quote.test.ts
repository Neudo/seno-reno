import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it } from "vitest";

import { parseTolteckQuote } from "@/features/outils/bdc/parse-tolteck-quote";

GlobalWorkerOptions.workerSrc = pathToFileURL(
  resolve("node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs"),
).href;

async function fixture(name: string) {
  const bytes = await readFile(resolve("data", name));
  return new File([bytes], name, { type: "application/pdf" });
}

describe("parseTolteckQuote", () => {
  it("extrait un devis Tolteck multi-pages et ignore ses prix", async () => {
    const quote = await parseTolteckQuote(
      await fixture(
        "devis DEV-2026-0072 M. & Mme Raphaël CAMPION et Florie LE BLOAS (5).pdf",
      ),
    );

    expect(quote.quoteNumber).toBe("DEV-2026-0072");
    expect(quote.clientName).toContain("Raphaël CAMPION");
    expect(quote.projectTitle).toBe("Rénovation (extérieurs, RDC, R+1, R+2)");
    expect(quote.projectAddress).toContain("89520 MOÛTIERS");
    expect(quote.lots).toHaveLength(6);
    expect(quote.lots.flatMap((lot) => lot.lines)).toHaveLength(40);
    expect(quote.lots[0]?.designation).toBe(
      "DÉMOLITION / TERRASSEMENT / GROS OEUVRE + évacuation en déchetterie",
    );
    expect(quote.lots[0]?.lines[0]).toMatchObject({
      number: "1.1",
      quantity: "1",
      unit: "u",
    });
    expect(JSON.stringify(quote.lots)).not.toContain("1 500,00");
  });

  it("regroupe les lignes d’un devis sans lots explicites", async () => {
    const quote = await parseTolteckQuote(
      await fixture("devis-test-from-tolteck.pdf"),
    );

    expect(quote.quoteNumber).toBe("DEV-2026-0001");
    expect(quote.projectTitle).toBe("Exemple de chantier");
    expect(quote.lots).toHaveLength(1);
    expect(quote.lots[0]?.designation).toBe("Prestations");
    expect(quote.lots[0]?.lines).toHaveLength(3);
    expect(quote.lots[0]?.lines[1]).toMatchObject({
      designation: "Forfait main d'œuvre",
      quantity: "1",
      unit: "forfait",
    });
  });
});
