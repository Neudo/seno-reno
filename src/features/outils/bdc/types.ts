export type BdcLine = {
  designation: string;
  id: string;
  number: string;
  quantity: string;
  selected: boolean;
  unit: string;
};

export type BdcLot = {
  designation: string;
  id: string;
  lines: BdcLine[];
  number: string;
};

export type ParsedTolteckQuoteSummary = {
  clientName: string;
  fileName: string;
  projectAddress: string;
  projectTitle: string;
  quoteDate: string;
  quoteNumber: string;
  totalHt: number | null;
  totalTtc: number | null;
};

export type ParsedTolteckQuote = ParsedTolteckQuoteSummary & {
  lots: BdcLot[];
};

export type BdcDetails = {
  bdcDate: string;
  bdcNumber: string;
  manager: string;
  projectAddress: string;
  projectReference: string;
  quoteNumber: string;
  subcontractorAddress: string;
  subcontractorCity: string;
  subcontractorContact: string;
  subcontractorEmail: string;
  subcontractorName: string;
  subcontractorPhone: string;
  totalHt: string;
};
