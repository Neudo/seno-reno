import {
  getDocument,
  GlobalWorkerOptions,
} from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";

import type {
  BdcLine,
  BdcLot,
  ParsedTolteckQuote,
  ParsedTolteckQuoteSummary,
} from "@/features/outils/bdc/types";

GlobalWorkerOptions.workerSrc = pdfWorker;

type PositionedText = {
  text: string;
  x: number;
  y: number;
};

type TextRow = {
  items: PositionedText[];
  page: number;
  pageWidth: number;
  text: string;
  y: number;
};

const NUMBER_PATTERN = /^\d+(?:\.\d+)?$/;
const FOOTER_PATTERN = /Seno Rénovation|Page \d+ \/ \d+|Auxerre B|IBAN/iu;
const TOTAL_PATTERN = /^(?:Sous-total|Total HT|TVA à|Total TTC|Remise)/iu;

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/gu, " ").trim();
}

function joinText(parts: string[]) {
  return normalizeWhitespace(parts.join(" "));
}

function appendText(current: string, continuation: string) {
  if (!continuation) {
    return current;
  }

  return normalizeWhitespace(`${current} ${continuation}`);
}

function isStandaloneHeading(value: string) {
  const letters = value.match(/\p{L}/gu) ?? [];

  if (letters.length < 3 || value.length > 100) {
    return false;
  }

  const uppercaseLetters = letters.filter(
    (letter) => letter === letter.toLocaleUpperCase("fr-FR"),
  );

  return uppercaseLetters.length / letters.length > 0.88;
}

function parseQuantity(value: string) {
  const normalized = normalizeWhitespace(value);

  if (!normalized || /€|%/u.test(normalized)) {
    return null;
  }

  const match = normalized.match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/u);

  if (!match) {
    return null;
  }

  return {
    quantity: match[1]?.replace(",", ".") ?? "1",
    unit: match[2] || "u",
  };
}

function buildRows(page: number, pageWidth: number, items: PositionedText[]) {
  const rows: TextRow[] = [];
  const sortedItems = [...items].sort((first, second) => {
    const verticalDifference = second.y - first.y;
    return Math.abs(verticalDifference) > 2
      ? verticalDifference
      : first.x - second.x;
  });

  for (const item of sortedItems) {
    const row = rows.find(
      (candidate) =>
        candidate.page === page && Math.abs(candidate.y - item.y) <= 2,
    );

    if (row) {
      row.items.push(item);
      row.items.sort((first, second) => first.x - second.x);
      row.text = joinText(row.items.map((entry) => entry.text));
      continue;
    }

    rows.push({
      items: [item],
      page,
      pageWidth,
      text: item.text,
      y: item.y,
    });
  }

  return rows.sort((first, second) => second.y - first.y);
}

function extractMetadata(rows: TextRow[], fileName: string) {
  const firstPageRows = rows.filter((row) => row.page === 1);
  const tableHeader = firstPageRows.find(
    (row) => /Désignation/iu.test(row.text) && /Qté/iu.test(row.text),
  );
  const quoteRow = firstPageRows.find((row) => /Devis n°/iu.test(row.text));
  const dateRow = firstPageRows.find((row) => /En date du/iu.test(row.text));
  const quoteNumber =
    quoteRow?.text.match(/Devis n°\s*([^\s|]+)/iu)?.[1] ??
    firstPageRows
      .map((row) => row.text.match(/\bDEV-\d{4}-\d+\b/iu)?.[0])
      .find(Boolean) ??
    "";
  const quoteDate = dateRow?.text.match(/\d{2}\/\d{2}\/\d{4}/u)?.[0] ?? "";

  const clientName =
    firstPageRows.find(
      (row) =>
        row.y > (tableHeader?.y ?? 0) &&
        row.items.every((item) => item.x > row.pageWidth * 0.48) &&
        !/Devis n°|En date du|Valable/iu.test(row.text),
    )?.text ?? "";

  const addressLabel = firstPageRows.find((row) =>
    /Adresse du projet/iu.test(row.text),
  );
  const projectRows = addressLabel
    ? firstPageRows.filter(
        (row) =>
          row.y < addressLabel.y &&
          row.y > (tableHeader?.y ?? 0) &&
          row.items.some((item) => item.x < row.pageWidth * 0.35),
      )
    : [];

  let splitIndex = projectRows.length - 1;
  for (let index = 0; index < projectRows.length - 1; index += 1) {
    const currentRow = projectRows[index];
    const nextRow = projectRows[index + 1];

    if (currentRow && nextRow && currentRow.y - nextRow.y > 24) {
      splitIndex = index + 1;
      break;
    }
  }

  const projectTitle = projectRows[splitIndex]?.text ?? "";
  const projectAddress = projectRows
    .slice(0, splitIndex)
    .map((row) => row.text)
    .join("\n");

  return {
    clientName,
    fileName,
    projectAddress,
    projectTitle,
    quoteDate,
    quoteNumber,
  };
}

function parseFrenchAmount(value: string) {
  const match = value.match(
    /(?:\d{1,3}(?:[\s\u00a0\u202f.]\d{3})+|\d+)(?:[,.]\d{1,2})?/u,
  );

  if (!match?.[0]) {
    return null;
  }

  const normalized = match[0]
    .replace(/[\s\u00a0\u202f.]/gu, "")
    .replace(",", ".");
  const amount = Number(normalized);

  return Number.isFinite(amount) ? amount : null;
}

function extractTotal(rows: TextRow[], label: "HT" | "TTC") {
  const totalRow = [...rows]
    .reverse()
    .find((row) => new RegExp(`Total\\s+${label}`, "iu").test(row.text));

  if (!totalRow) {
    return null;
  }

  const labelIndex = totalRow.text.search(new RegExp(`Total\\s+${label}`, "iu"));
  return parseFrenchAmount(totalRow.text.slice(labelIndex));
}

function buildSummary(rows: TextRow[], fileName: string): ParsedTolteckQuoteSummary {
  return {
    ...extractMetadata(rows, fileName),
    totalHt: extractTotal(rows, "HT"),
    totalTtc: extractTotal(rows, "TTC"),
  };
}

async function extractRowsFromPdf(file: File) {
  const loadingTask = getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
  });
  const document = await loadingTask.promise;
  const rows: TextRow[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();
      const positionedItems = content.items.flatMap((item) => {
        if (!("str" in item) || !item.str.trim()) {
          return [];
        }

        return [
          {
            text: item.str,
            x: item.transform[4],
            y: item.transform[5],
          },
        ];
      });

      rows.push(...buildRows(pageNumber, viewport.width, positionedItems));
    }
  } finally {
    await loadingTask.destroy();
  }

  return rows;
}

function extractLots(rows: TextRow[]) {
  const lots: BdcLot[] = [];
  let currentLot: BdcLot | null = null;
  let currentLine: BdcLine | null = null;
  let fallbackLot: BdcLot | null = null;
  let previousRow: TextRow | null = null;
  let canContinueLot = false;

  for (const row of rows) {
    const tableHeader =
      /Désignation/iu.test(row.text) && /Qté/iu.test(row.text);

    if (tableHeader || row.y < 54 || FOOTER_PATTERN.test(row.text)) {
      currentLine = null;
      canContinueLot = false;
      previousRow = row;
      continue;
    }

    const numberItem = row.items.find(
      (item) =>
        item.x < row.pageWidth * 0.1 && NUMBER_PATTERN.test(item.text.trim()),
    );
    const rowDesignation = joinText(
      row.items
        .filter(
          (item) =>
            item.x >= row.pageWidth * 0.09 && item.x < row.pageWidth * 0.62,
        )
        .map((item) => item.text),
    );
    const precedingDesignation = previousRow
      ? joinText(
          previousRow.items
            .filter(
              (item) =>
                item.x >= row.pageWidth * 0.09 && item.x < row.pageWidth * 0.62,
            )
            .map((item) => item.text),
        )
      : "";
    const designation =
      rowDesignation ||
      (numberItem &&
      previousRow?.page === row.page &&
      previousRow.y - row.y <= 10
        ? precedingDesignation
        : "");
    const quantity = parseQuantity(
      joinText(
        row.items
          .filter(
            (item) =>
              item.x >= row.pageWidth * 0.62 && item.x < row.pageWidth * 0.7,
          )
          .map((item) => item.text),
      ),
    );

    if (numberItem && designation && quantity) {
      if (!currentLot) {
        fallbackLot ??= {
          designation: "Prestations",
          id: "lot-prestations",
          lines: [],
          number: "",
        };
        currentLot = fallbackLot;
        if (!lots.includes(fallbackLot)) {
          lots.push(fallbackLot);
        }
      }

      currentLine = {
        designation,
        id: `line-${row.page}-${numberItem.text.trim()}-${currentLot.lines.length}`,
        number: numberItem.text.trim(),
        quantity: quantity.quantity,
        selected: true,
        unit: quantity.unit,
      };
      currentLot.lines.push(currentLine);
      canContinueLot = false;
      previousRow = row;
      continue;
    }

    if (numberItem && designation && /^\d+$/u.test(numberItem.text.trim())) {
      currentLot = {
        designation,
        id: `lot-${row.page}-${numberItem.text.trim()}-${lots.length}`,
        lines: [],
        number: numberItem.text.trim(),
      };
      currentLine = null;
      canContinueLot = true;
      lots.push(currentLot);
      previousRow = row;
      continue;
    }

    if (
      currentLine &&
      designation &&
      !TOTAL_PATTERN.test(designation) &&
      !isStandaloneHeading(designation)
    ) {
      currentLine.designation = appendText(
        currentLine.designation,
        rowDesignation,
      );
      canContinueLot = false;
    } else if (
      currentLot &&
      !currentLine &&
      canContinueLot &&
      rowDesignation &&
      !isStandaloneHeading(rowDesignation) &&
      previousRow?.page === row.page &&
      previousRow.y - row.y <= 16
    ) {
      currentLot.designation = appendText(
        currentLot.designation,
        rowDesignation,
      );
    } else {
      canContinueLot = false;
    }

    previousRow = row;
  }

  return lots.filter((lot) => lot.lines.length > 0);
}

export async function parseTolteckQuote(
  file: File,
): Promise<ParsedTolteckQuote> {
  const rows = await extractRowsFromPdf(file);

  const lots = extractLots(rows);

  if (lots.length === 0 || lots.every((lot) => lot.lines.length === 0)) {
    throw new Error(
      "Aucune ligne exploitable n’a été détectée. Vérifie qu’il s’agit bien d’un devis Tolteck contenant du texte.",
    );
  }

  return {
    ...buildSummary(rows, file.name),
    lots,
  };
}

export async function parseTolteckQuoteSummary(
  file: File,
): Promise<ParsedTolteckQuoteSummary> {
  return buildSummary(await extractRowsFromPdf(file), file.name);
}
