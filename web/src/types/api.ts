export type DocumentStatus = "draft" | "finalized";

export interface LineItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  fixedDiscount?: number;
  taxPercent?: number;
}

export interface LineItem extends LineItemInput {
  _id: string;
  subtotalCents: number;
  discountAmountCents: number;
  discountedAmountCents: number;
  taxAmountCents: number;
  lineTotalCents: number;
}

export interface PricingDocument {
  _id: string;
  userId: string;
  title: string;
  customer: string;
  issueDate: string;
  status: DocumentStatus;
  lineItems: LineItem[];
  subtotalCents: number;
  totalDiscountCents: number;
  totalTaxCents: number;
  grandTotalCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentInput {
  title: string;
  customer: string;
  issueDate: string;
  lineItems: LineItemInput[];
}

export type UpdateDocumentInput = CreateDocumentInput;

export interface ReportSummary {
  documentCount: number;
  sumGrandTotalCents: number;
  sumTotalTaxCents: number;
  sumTotalDiscountCents: number;
}

export interface SignupInput {
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
