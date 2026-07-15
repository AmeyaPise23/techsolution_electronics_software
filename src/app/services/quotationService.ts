import { authService } from "./authService";

const API_BASE_URL = "http://localhost:8080/api";

// ==================== INTERFACES ====================

export interface QuotationCustomer {
  id?: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  gstNumber?: string;
}

export interface QuotationItem {
  id?: number;
  productId?: string;
  productName: string;
  productImage?: string;
  description?: string;
  hsnSac?: string;
  warehouse?: string;
  batchNumber?: string;
  serialNumber?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  lineTotal: number;
  remarks?: string;
  sortOrder?: number;
}

export interface QuotationActivityLog {
  id: number;
  action: string;
  performedBy: string;
  remarks: string;
  performedAt: string;
}

export interface QuotationAttachment {
  id: number;
  fileName: string;
  filePath: string;
  contentType: string;
  fileSize: number;
  uploadedAt: string;
}

export type QuotationStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "accepted"
  | "rejected"
  | "expired"
  | "converted";

export interface Quotation {
  id: number;
  quotationNumber: string;
  quotationDate: string;
  validTill?: string;
  status: QuotationStatus;

  salesPerson?: string;
  branch?: string;
  currency?: string;
  exchangeRate?: number;

  referenceNumber?: string;
  customerPoNumber?: string;
  customerPoDate?: string;
  rfqNumber?: string;
  enquiryNumber?: string;
  projectName?: string;
  deliveryLocation?: string;
  expectedDeliveryDate?: string;
  leadTime?: string;
  deliveryDays?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  warranty?: string;
  freightCharges?: number;
  installationCharges?: number;

  internalRemarks?: string;
  customerRemarks?: string;
  notes?: string;
  termsAndConditions?: string;

  customer: QuotationCustomer;
  shipToName?: string;
  shipToCompany?: string;
  shipToAddress?: string;
  placeOfSupply?: string;

  items: QuotationItem[];

  subtotal: number;
  itemDiscountTotal: number;
  additionalDiscount: number;
  totalDiscount: number;
  taxableAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  cessTotal: number;
  totalTax: number;
  shippingCharges: number;
  packingCharges: number;
  otherCharges: number;
  roundOffAmount: number;
  grandTotal: number;

  attachments?: QuotationAttachment[];
  activityLogs?: QuotationActivityLog[];

  convertedInvoiceId?: number;
  convertedInvoiceNumber?: string;

  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ==================== SERVICE ====================

export const quotationService = {
  async getQuotations(query?: string, status?: string): Promise<Quotation[]> {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (status && status !== "all") params.set("status", status);
    const url = `${API_BASE_URL}/quotations${params.toString() ? "?" + params : ""}`;
    const response = await authService.authenticatedFetch(url);
    return parseJsonResponse<Quotation[]>(response);
  },

  async getQuotationById(id: number): Promise<Quotation | null> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/quotations/${id}`
    );
    if (response.status === 404) return null;
    return parseJsonResponse<Quotation>(response);
  },

  async createQuotation(data: Record<string, unknown>): Promise<Quotation> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/quotations`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizePayload(data)),
      }
    );
    return parseJsonResponse<Quotation>(response);
  },

  async updateQuotation(
    id: number,
    data: Record<string, unknown>
  ): Promise<Quotation> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/quotations/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizePayload(data)),
      }
    );
    return parseJsonResponse<Quotation>(response);
  },

  async deleteQuotation(id: number): Promise<void> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/quotations/${id}`,
      { method: "DELETE" }
    );
    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }
  },

  async duplicateQuotation(id: number): Promise<Quotation> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/quotations/${id}/duplicate`,
      { method: "POST" }
    );
    return parseJsonResponse<Quotation>(response);
  },

  async updateStatus(
    id: number,
    status: string,
    remarks?: string
  ): Promise<Quotation> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/quotations/${id}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, remarks }),
      }
    );
    return parseJsonResponse<Quotation>(response);
  },

  async convertToInvoice(id: number): Promise<Quotation> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/quotations/${id}/convert-to-invoice`,
      { method: "POST" }
    );
    return parseJsonResponse<Quotation>(response);
  },
};

// ==================== HELPERS ====================

function normalizePayload(data: Record<string, unknown>): Record<string, unknown> {
  const items = data.items as Array<Record<string, unknown>> | undefined;
  if (items) {
    data.items = items.map((item) => ({
      ...item,
      quantity: clamp(item.quantity as number, 1, 999999),
      unitPrice: clamp(item.unitPrice as number, 0, 999999999),
      discountPercent: clamp(item.discountPercent as number, 0, 100),
      taxPercent: clamp(item.taxPercent as number, 0, 100),
    }));
  }
  return data;
}

function clamp(value: number, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
  return response.json();
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return body.message || body.error || "Request failed";
  } catch {
    return "Request failed";
  }
}
