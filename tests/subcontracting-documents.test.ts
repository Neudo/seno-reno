import { writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  getDocument,
  GlobalWorkerOptions,
} from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it } from "vitest";

import {
  contractSchema,
  contractSettingsSchema,
  getContractSettingsDefaults,
  getContractFilenames,
} from "@/features/outils/subcontracting/contract-data";
import { generateContractPdfs } from "@/features/outils/subcontracting/generate-contract-pdfs";

GlobalWorkerOptions.workerSrc = pathToFileURL(
  resolve("node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs"),
).href;

const qaData = contractSchema.parse({
  siteAddress: "Adresse du chantier de test, 89000 Auxerre",
  contractNumber: "QA/2026-001",
  purchaseOrderNumber: "BDC-QA-42",
  principal: {
    name: "Société donneuse d’ordre de test",
    address: "Adresse de la société de test",
    legalForm: "SARL",
    capital: "20 000 €",
    registryCity: "Auxerre",
    registrationNumber: "RCS-TEST-01",
  },
  principalRepresentatives: "Camille Représentant",
  subcontractor: {
    name: "Atelier sous-traitant de test",
    address: "Adresse du siège sous-traitant de test",
    legalForm: "SAS",
    capital: "",
    registryCity: "Sens",
    registrationNumber: "RCS-TEST-02",
  },
  specialties: "Plomberie, chauffage et pose des équipements sanitaires.",
  declarantFirstName: "Élodie",
  declarantLastName: "Déclarant",
  declarantRole: "Présidente",
  signatureCity: "Auxerre",
  signatureDate: "2026-11-05",
  courtCity: "Sens",
});

async function readPdf(bytes: Uint8Array) {
  const task = getDocument({ data: bytes, useSystemFonts: true });
  try {
    const document = await task.promise;
    const pages: string[] = [];
    for (let index = 1; index <= document.numPages; index++) {
      const page = await document.getPage(index);
      const content = await page.getTextContent();
      pages.push(
        content.items
          .flatMap((item) => ("str" in item ? [item.str] : []))
          .join(" "),
      );
    }
    return {
      numPages: document.numPages,
      text: pages.join(" ").replace(/\s+/g, " "),
    };
  } finally {
    await task.destroy();
  }
}

describe("subcontracting PDF pair", () => {
  it("requires real input without copying example identities or assuming a signature date", () => {
    expect(
      contractSettingsSchema.safeParse(getContractSettingsDefaults()).success,
    ).toBe(false);
    expect(
      contractSchema.safeParse({ ...qaData, signatureDate: "2026-02-30" })
        .success,
    ).toBe(false);
    expect(getContractFilenames(" Réf/2026 ")).toEqual({
      contract: "contrat-sous-traitance-Ref-2026.pdf",
      declaration: "declaration-sur-l-honneur-Ref-2026.pdf",
    });
  });

  it("renders both PDFs with separate references, full clauses and the selected signatory", async () => {
    const [contract, declaration] = await generateContractPdfs(qaData);
    expect(contract.kind).toBe("contract");
    expect(declaration.kind).toBe("declaration");
    expect(contract.blob.type).toBe("application/pdf");
    expect(declaration.blob.type).toBe("application/pdf");
    const contractBytes = new Uint8Array(await contract.blob.arrayBuffer());
    const declarationBytes = new Uint8Array(
      await declaration.blob.arrayBuffer(),
    );
    const output = process.env.SENO_CONTRACT_QA_DIR;
    if (output) {
      await Promise.all([
        writeFile(join(output, contract.filename), contractBytes),
        writeFile(join(output, declaration.filename), declarationBytes),
      ]);
    }
    const contractText = await readPdf(contractBytes);
    const declarationText = await readPdf(declarationBytes);
    for (const pdf of [contractText, declarationText]) {
      expect(pdf.text).toContain("QA/2026-001");
      expect(pdf.text).toContain("BDC-QA-42");
      expect(pdf.text).toContain("Adresse du chantier de test");
      expect(pdf.text).toContain("5 novembre 2026");
      expect(pdf.text).not.toMatch(/HUGGY|ONET|MPCP|01341|20250030/);
    }
    expect(contractText.text).toContain("Article 14 : Élection de domicile");
    expect(contractText.text).toContain("tribunal de commerce de Sens");
    expect(contractText.text).toContain(
      "Ce document est établi en double exemplaire.",
    );
    for (let page = 1; page <= contractText.numPages; page++) {
      expect(contractText.text).toContain(`${page} / ${contractText.numPages}`);
    }
    expect(declarationText.text).toContain("Élodie Déclarant");
    expect(declarationText.text).toContain(
      "article 46 du Code des Marchés Publics",
    );
    expect(declarationText.numPages).toBe(1);
  });
});
