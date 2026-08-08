export enum DocumentStatus {
  DRAFT = "draft",
  FINALIZED = "finalized",
}

export enum DiscountType {
  PERCENT = "percent",
  FIXED = "fixed",
}

/**
 * All money fields are integer cents. Never use floats for authoritative
 * money values
 */
export interface LineItemCalculation {
  subtotalCents: number;
  discountAmountCents: number;
  discountedAmountCents: number;
  taxAmountCents: number;
  lineTotalCents: number;
}

export interface DocumentTotals {
  subtotalCents: number;
  totalDiscountCents: number;
  totalTaxCents: number;
  grandTotalCents: number;
}

export interface ReportSummary {
  documentCount: number;
  sumGrandTotalCents: number;
  sumTotalTaxCents: number;
  sumTotalDiscountCents: number;
}
