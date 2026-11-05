import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";

import {
  declarationStatements,
  getContractArticles,
} from "@/features/outils/subcontracting/contract-clauses";
import {
  formatContractDate,
  type ContractData,
  type ContractParty,
} from "@/features/outils/subcontracting/contract-data";

const navy = "#00365A";
const ink = "#1A1C1E";
const muted = "#526372";
const rule = "#D9E1E7";
const panel = "#F4F5F7";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    color: ink,
    fontFamily: "Helvetica",
    fontSize: 10.5,
    lineHeight: 1.35,
    paddingTop: 37,
    paddingBottom: 47,
    paddingHorizontal: 40,
  },
  header: {
    backgroundColor: navy,
    color: "#FFFFFF",
    marginBottom: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  title: { fontSize: 19, fontWeight: 700 },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  cell: { flex: 1 },
  metadata: {
    backgroundColor: panel,
    borderWidth: 0.6,
    borderColor: rule,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 13,
    gap: 8,
  },
  label: {
    color: muted,
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 0.55,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  value: { fontSize: 10.5, color: ink },
  parties: { flexDirection: "row", gap: 10, marginBottom: 12 },
  party: {
    flex: 1,
    borderColor: rule,
    borderWidth: 0.6,
    padding: 10,
  },
  name: {
    color: navy,
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 4,
  },
  partyDetails: { fontSize: 9.6, marginBottom: 4 },
  article: { marginTop: 7 },
  heading: {
    color: navy,
    fontSize: 11.1,
    fontWeight: 700,
    marginBottom: 3,
  },
  paragraph: { marginBottom: 4 },
  bullet: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 3,
    paddingLeft: 3,
  },
  bulletMarker: { color: navy, width: 8 },
  bulletText: { flex: 1 },
  signing: { marginTop: 11 },
  signatureBox: {
    borderColor: rule,
    borderWidth: 0.6,
    flex: 1,
    minHeight: 65,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  singleSignature: { width: "58%", minHeight: 90, flex: 0, marginTop: 10 },
  signingNote: { color: muted, fontSize: 9, marginBottom: 7 },
  footer: {
    borderTopColor: rule,
    borderTopWidth: 0.6,
    color: muted,
    flexDirection: "row",
    fontSize: 8,
    justifyContent: "space-between",
    left: 40,
    paddingTop: 5,
    position: "absolute",
    right: 40,
    // A4 is 841.89 pt tall; keep this below the 47 pt reserved body margin.
    top: 804,
  },
});

function Field({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <View style={wide ? undefined : styles.cell}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function DocumentLayout({
  data,
  title,
  children,
}: {
  data: ContractData;
  title: string;
  children: ReactNode;
}) {
  return (
    <Page
      layout={({ children: content, pageNumber, totalPages }) => (
        <>
          {content}
          <View style={styles.footer}>
            <Text>{title}</Text>
            <Text>{`${pageNumber ?? 1} / ${totalPages ?? pageNumber ?? 1}`}</Text>
          </View>
        </>
      )}
      size="A4"
      style={styles.page}
    >
      <View wrap={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.metadata}>
          <View style={styles.row}>
            <Field label="Contrat n°" value={data.contractNumber} />
            <Field
              label="Bon de commande n°"
              value={data.purchaseOrderNumber}
            />
          </View>
          <Field label="Adresse du chantier" value={data.siteAddress} wide />
        </View>
      </View>
      {children}
    </Page>
  );
}

function PartyCard({
  party,
  isPrincipal,
  representatives,
}: {
  party: ContractParty;
  isPrincipal?: boolean;
  representatives?: string;
}) {
  const legalDetails = [
    party.legalForm,
    party.capital ? `au capital de ${party.capital}` : "",
    `ayant son siège social ${party.address}`,
    `enregistrée au Registre du Commerce et des sociétés de ${party.registryCity} sous le numéro ${party.registrationNumber}.`,
  ].filter(Boolean);

  return (
    <View style={styles.party}>
      <Text style={styles.label}>
        {isPrincipal ? "Société donneuse d’ordre" : "Sous-traitant"}
      </Text>
      <Text style={styles.name}>{party.name}</Text>
      <Text style={styles.partyDetails}>{legalDetails.join(", ")}</Text>
      {representatives ? (
        <Text style={styles.partyDetails}>
          Représentée par {representatives}.
        </Text>
      ) : null}
      <Text style={styles.partyDetails}>
        {isPrincipal
          ? "Ci-après dénommée LA SOCIETE,"
          : "Ci-après dénommé Le SOUS-TRAITANT,"}
      </Text>
    </View>
  );
}

function Bullet({ children }: { children: string }) {
  return (
    <View style={styles.bullet} wrap={false}>
      <Text style={styles.bulletMarker}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

function SignatureLine({ data }: { data: ContractData }) {
  return (
    <Text style={styles.paragraph}>
      Fait à {data.signatureCity}, le {formatContractDate(data.signatureDate)}
    </Text>
  );
}

export function SubcontractingContract({ data }: { data: ContractData }) {
  const title = "Contrat de sous-traitance";
  return (
    <Document
      author={data.principal.name}
      subject={data.siteAddress}
      title={`${title} n° ${data.contractNumber}`}
    >
      <DocumentLayout data={data} title={title}>
        <View style={styles.parties} wrap={false}>
          <PartyCard
            isPrincipal
            party={data.principal}
            representatives={data.principalRepresentatives}
          />
          <PartyCard party={data.subcontractor} />
        </View>
        <Text minPresenceAhead={35} style={styles.heading}>
          Il a été préalablement exposé que :
        </Text>
        <Text style={styles.paragraph}>
          La société {data.principal.name} est une entreprise proposant
          l’exploitation de toutes activités liées à l’entretien, à la
          rénovation et à l’agrandissement d’une construction et de toutes
          prestations de services dans ce domaine à une clientèle composée
          essentiellement de particuliers.
        </Text>
        <Text style={styles.paragraph}>
          Le SOUS-TRAITANT est une entreprise du secteur des métiers du
          bâtiment, reconnue dans la ou les spécialités de : {data.specialties}
        </Text>
        <Text style={styles.paragraph}>
          Pour compléter la gamme des services offerts à sa clientèle, la
          SOCIETE a souhaité faire appel au SOUS-TRAITANT.
        </Text>
        <Text style={styles.paragraph}>
          Le SOUS-TRAITANT a manifesté son intérêt pour travailler pour la
          SOCIETE.
        </Text>
        <Text style={styles.paragraph}>
          Ceci exposé, il a été convenu ce qui suit.
        </Text>

        {getContractArticles(data).map((article, index) => (
          <View key={article.title} style={styles.article}>
            <View wrap={false}>
              <Text style={styles.heading}>
                Article {index + 1} : {article.title}
              </Text>
              <Text style={styles.paragraph}>{article.paragraphs[0]}</Text>
            </View>
            {article.paragraphs.slice(1).map((paragraph) => (
              <Text key={paragraph} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
            {article.items?.map((item) => (
              <Bullet key={item}>{item}</Bullet>
            ))}
          </View>
        ))}

        <View style={styles.signing} wrap={false}>
          <SignatureLine data={data} />
          <Text style={styles.signingNote}>
            Ce document est établi en double exemplaire.
          </Text>
          <View style={styles.row}>
            <View style={styles.signatureBox}>
              <Text style={styles.label}>Signature du sous-traitant</Text>
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.label}>Signature de la société</Text>
            </View>
          </View>
        </View>
      </DocumentLayout>
    </Document>
  );
}

export function SubcontractingDeclaration({ data }: { data: ContractData }) {
  const title = "Déclaration sur l’honneur";
  const signatory = `${data.declarantFirstName} ${data.declarantLastName}`;
  return (
    <Document
      author={data.subcontractor.name}
      subject={data.siteAddress}
      title={`${title} - Contrat n° ${data.contractNumber}`}
    >
      <DocumentLayout data={data} title={title}>
        <View style={styles.metadata} wrap={false}>
          <View style={styles.row}>
            <Field label="Société" value={data.subcontractor.name} />
            <Field label="Qualité" value={data.declarantRole} />
          </View>
          <View style={styles.row}>
            <Field label="Nom" value={data.declarantLastName} />
            <Field label="Prénom" value={data.declarantFirstName} />
          </View>
          <Field label="Adresse" value={data.subcontractor.address} wide />
        </View>
        <Text minPresenceAhead={32} style={styles.heading}>
          Je soussigné(e), {signatory}, atteste sur l’honneur :
        </Text>
        {declarationStatements.map((statement) => (
          <Bullet key={statement}>{statement}</Bullet>
        ))}
        <View style={styles.signing} wrap={false}>
          <SignatureLine data={data} />
          <View style={[styles.signatureBox, styles.singleSignature]}>
            <Text style={styles.label}>Signature et tampon</Text>
          </View>
        </View>
      </DocumentLayout>
    </Document>
  );
}
