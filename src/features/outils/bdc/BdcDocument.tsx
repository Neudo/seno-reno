import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import logoData from "@/assets/logo.png?inline";
import type { BdcDetails, BdcLot } from "@/features/outils/bdc/types";

const styles = StyleSheet.create({
  companyAddress: {
    color: "#365363",
    fontSize: 8.5,
    lineHeight: 1.45,
    marginTop: 7,
  },
  detailLabel: {
    color: "#6B7E88",
    fontSize: 7,
    letterSpacing: 0.8,
    marginBottom: 3,
    textTransform: "uppercase",
  },
  detailText: {
    color: "#102C3D",
    fontSize: 9,
    lineHeight: 1.35,
  },
  detailsGrid: {
    borderBottomColor: "#CAD8DD",
    borderBottomWidth: 1,
    borderTopColor: "#CAD8DD",
    borderTopWidth: 1,
    display: "flex",
    flexDirection: "row",
    marginBottom: 20,
    marginTop: 18,
    paddingBottom: 11,
    paddingTop: 11,
  },
  detailWide: {
    flex: 1.7,
    paddingRight: 12,
  },
  detailNarrow: {
    flex: 1,
    paddingRight: 12,
  },
  footer: {
    bottom: 18,
    color: "#6B7E88",
    display: "flex",
    flexDirection: "row",
    fontSize: 7,
    justifyContent: "space-between",
    left: 38,
    position: "absolute",
    right: 38,
  },
  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  lineDesignation: {
    flex: 1,
    fontSize: 8,
    lineHeight: 1.25,
    paddingRight: 8,
  },
  lineNumber: {
    fontSize: 8,
    fontWeight: 700,
    width: 35,
  },
  lineQuantity: {
    fontSize: 8,
    textAlign: "right",
    width: 40,
  },
  lineRow: {
    borderBottomColor: "#E1E8EA",
    borderBottomWidth: 0.5,
    color: "#193746",
    display: "flex",
    flexDirection: "row",
    paddingBottom: 6,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 6,
  },
  lineUnit: {
    fontSize: 8,
    textAlign: "center",
    width: 38,
  },
  lotHeader: {
    backgroundColor: "#DCECF1",
    color: "#00365A",
    display: "flex",
    flexDirection: "row",
    fontSize: 8.5,
    fontWeight: 700,
    letterSpacing: 0.15,
    paddingBottom: 6,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 6,
    textTransform: "uppercase",
  },
  lotNumber: {
    width: 55,
  },
  logo: {
    height: 58,
    objectFit: "contain",
    width: 56,
  },
  orderBox: {
    backgroundColor: "#00365A",
    color: "#FFFFFF",
    minWidth: 180,
    paddingBottom: 11,
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 11,
  },
  orderDate: {
    fontSize: 8,
    marginTop: 5,
  },
  orderTitle: {
    fontSize: 15,
    fontWeight: 700,
  },
  page: {
    backgroundColor: "#FFFFFF",
    color: "#102C3D",
    fontFamily: "Helvetica",
    paddingBottom: 42,
    paddingLeft: 38,
    paddingRight: 38,
    paddingTop: 38,
  },
  pageRule: {
    backgroundColor: "#00365A",
    height: 3,
    marginBottom: 18,
    marginTop: 16,
  },
  recipient: {
    borderLeftColor: "#0B5F87",
    borderLeftWidth: 3,
    marginTop: 17,
    paddingLeft: 11,
  },
  recipientName: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 4,
  },
  recipientText: {
    color: "#365363",
    fontSize: 8.5,
    lineHeight: 1.4,
  },
  tableHeader: {
    backgroundColor: "#00365A",
    color: "#FFFFFF",
    display: "flex",
    flexDirection: "row",
    fontSize: 7.5,
    fontWeight: 700,
    letterSpacing: 0.4,
    paddingBottom: 6,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 6,
    textTransform: "uppercase",
  },
  tableHeaderDesignation: {
    flex: 1,
  },
  tableHeaderNumber: {
    width: 35,
  },
  tableHeaderQuantity: {
    textAlign: "right",
    width: 40,
  },
  tableHeaderUnit: {
    textAlign: "center",
    width: 38,
  },
  totalBox: {
    backgroundColor: "#00365A",
    color: "#FFFFFF",
    display: "flex",
    flexDirection: "row",
    fontSize: 9,
    fontWeight: 700,
    justifyContent: "space-between",
    marginLeft: 210,
    marginTop: 18,
    paddingBottom: 10,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 10,
  },
});

const amountFormatter = new Intl.NumberFormat("fr-FR", {
  currency: "EUR",
  minimumFractionDigits: 2,
  style: "currency",
});

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatBdcAmount(value: string) {
  const compactValue = value.replace(/[^\d,.-]/g, "");
  const decimalSeparatorIndex = Math.max(
    compactValue.lastIndexOf(","),
    compactValue.lastIndexOf("."),
  );
  const normalizedValue =
    decimalSeparatorIndex === -1
      ? compactValue.replace(/[,.]/g, "")
      : `${compactValue.slice(0, decimalSeparatorIndex).replace(/[,.]/g, "")}.${compactValue
          .slice(decimalSeparatorIndex + 1)
          .replace(/[,.]/g, "")}`;
  const amount = Number.parseFloat(normalizedValue);

  return amountFormatter
    .format(Number.isFinite(amount) ? amount : 0)
    .replace(/[\u00A0\u202F]/g, " ");
}

function getSelectedLots(lots: BdcLot[]) {
  return lots
    .map((lot) => ({
      ...lot,
      lines: lot.lines.filter((line) => line.selected),
    }))
    .filter((lot) => lot.lines.length > 0);
}

export function BdcDocument({
  details,
  lots,
}: {
  details: BdcDetails;
  lots: BdcLot[];
}) {
  const selectedLots = getSelectedLots(lots);
  const formattedAmount = formatBdcAmount(details.totalHt);
  const recipientAddress = [
    details.subcontractorContact,
    details.subcontractorAddress,
    details.subcontractorCity,
    details.subcontractorPhone,
    details.subcontractorEmail,
  ].filter(Boolean);

  return (
    <Document
      author="SENO Rénovation"
      subject={details.projectReference}
      title={`Bon de commande ${details.bdcNumber}`}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Image src={logoData} style={styles.logo} />
            <Text style={styles.companyAddress}>
              7, rue des Ferriers{"\n"}
              89130 Villiers-Saint-Benoît{"\n"}
              contact@senoreno.fr · 06 20 27 09 55
            </Text>
          </View>
          <View style={styles.orderBox}>
            <Text style={styles.orderTitle}>BON DE COMMANDE</Text>
            <Text>{details.bdcNumber || "Numéro à renseigner"}</Text>
            <Text style={styles.orderDate}>
              Villiers-Saint-Benoît, le {formatDate(details.bdcDate)}
            </Text>
          </View>
        </View>

        <View style={styles.recipient}>
          <Text style={styles.detailLabel}>Sous-traitant</Text>
          <Text style={styles.recipientName}>
            {details.subcontractorName || "Sous-traitant à renseigner"}
          </Text>
          {recipientAddress.length > 0 ? (
            <Text style={styles.recipientText}>
              {recipientAddress.join("\n")}
            </Text>
          ) : null}
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailNarrow}>
            <Text style={styles.detailLabel}>Devis d’origine</Text>
            <Text style={styles.detailText}>{details.quoteNumber || "-"}</Text>
          </View>
          <View style={styles.detailWide}>
            <Text style={styles.detailLabel}>Référence chantier</Text>
            <Text style={styles.detailText}>
              {details.projectReference || "-"}
            </Text>
            {details.projectAddress ? (
              <Text style={styles.detailText}>{details.projectAddress}</Text>
            ) : null}
          </View>
          <View style={styles.detailNarrow}>
            <Text style={styles.detailLabel}>Responsable</Text>
            <Text style={styles.detailText}>{details.manager || "-"}</Text>
          </View>
        </View>

        <View style={styles.pageRule} />
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderNumber}>N°</Text>
          <Text style={styles.tableHeaderDesignation}>Dénomination</Text>
          <Text style={styles.tableHeaderUnit}>Unité</Text>
          <Text style={styles.tableHeaderQuantity}>Qté</Text>
        </View>

        {selectedLots.map((lot) => (
          <View key={lot.id}>
            <View minPresenceAhead={55} style={styles.lotHeader}>
              <Text style={styles.lotNumber}>
                {lot.number ? `LOT ${lot.number}` : "LOT"}
              </Text>
              <Text>{lot.designation}</Text>
            </View>
            {lot.lines.map((line) => (
              <View key={line.id} style={styles.lineRow} wrap={false}>
                <Text style={styles.lineNumber}>{line.number}</Text>
                <Text style={styles.lineDesignation}>{line.designation}</Text>
                <Text style={styles.lineUnit}>{line.unit}</Text>
                <Text style={styles.lineQuantity}>{line.quantity}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.totalBox} wrap={false}>
          <View>
            <Text>MONTANT TOTAL HT</Text>
            <Text>TVA À 0 %</Text>
            <Text>MONTANT TOTAL TTC</Text>
          </View>
          <View>
            <Text>{formattedAmount}</Text>
            <Text>0,00 €</Text>
            <Text>{formattedAmount}</Text>
          </View>
        </View>

        <View fixed style={styles.footer}>
          <Text>SENO Rénovation · www.senoreno.fr</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
