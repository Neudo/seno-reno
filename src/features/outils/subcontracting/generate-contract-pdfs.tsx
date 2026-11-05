import {
  getContractFilenames,
  type ContractData,
} from "@/features/outils/subcontracting/contract-data";

export type GeneratedContractPdf = {
  blob: Blob;
  filename: string;
  kind: "contract" | "declaration";
};

export async function generateContractPdfs(
  data: ContractData,
): Promise<GeneratedContractPdf[]> {
  const [{ pdf }, { SubcontractingContract, SubcontractingDeclaration }] =
    await Promise.all([
      import("@react-pdf/renderer"),
      import("@/features/outils/subcontracting/SubcontractingDocuments"),
    ]);

  const filenames = getContractFilenames(data.contractNumber);
  const contract = await pdf(<SubcontractingContract data={data} />).toBlob();
  const declaration = await pdf(
    <SubcontractingDeclaration data={data} />,
  ).toBlob();

  return [
    { kind: "contract", blob: contract, filename: filenames.contract },
    { kind: "declaration", blob: declaration, filename: filenames.declaration },
  ];
}
