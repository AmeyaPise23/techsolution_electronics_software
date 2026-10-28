// Finance Service - API integration layer
import { authService } from "./authService";

import { API_BASE_URL } from "../config";

// ==================== INTERFACES ====================

export interface KPIData {
  totalRevenue: number;
  grossProfit: number;
  netProfit: number;
  totalExpenses: number;
  outstandingPayments: number;
  cashAvailable: number;
  monthlyRevenue: number;
  monthlyProfit: number;
  profitMargin: number;
  activeCustomers: number;
  totalInvoices: number;
  averageOrderValue: number;
  revenueChange: number;
  profitChange: number;
  expensesChange: number;
}

export interface RevenueData {
  monthly: { month: string; revenue: number; profit: number }[];
  quarterly: { quarter: string; revenue: number }[];
  byProduct: { product: string; revenue: number }[];
  byCategory: { category: string; revenue: number }[];
  byCustomer: { customer: string; revenue: number }[];
  byRegion: { region: string; revenue: number }[];
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  vendor?: string;
  status: "pending" | "approved" | "paid";
  attachments?: string[];
}

export interface ProfitData {
  revenue: number;
  productCost: number;
  grossProfit: number;
  outsourcingCost: number;
  salaries: number;
  marketing: number;
  infrastructure: number;
  operationalExpenses: number;
  taxes: number;
  netProfit: number;
  profitMargin: number;
  operatingMargin: number;
}

export interface ProductProfitability {
  id: string;
  productName: string;
  revenue: number;
  cost: number;
  grossProfit: number;
  netProfit: number;
  margin: number;
}

export interface CustomerProfitability {
  id: string;
  customerName: string;
  revenueGenerated: number;
  costIncurred: number;
  netProfit: number;
  totalOrders: number;
  profitMargin: number;
}

export interface Vendor {
  id: string;
  vendorName: string;
  service: string;
  project: string;
  cost: number;
  invoiceReference: string;
  paymentStatus: "pending" | "paid" | "overdue";
}

export interface InvoiceDashboardData {
  dateFrom: string;
  dateTo: string;
  summary: {
    totalInvoiced: number;
    collected: number;
    outstanding: number;
    overdue: number;
    invoiceCount: number;
    overdueCount: number;
    totalInvoicedChangePercent: number;
    collectedChangePercent: number;
    outstandingChangePercent: number;
  };
  trend: {
    month: string;
    monthStart: string;
    totalInvoiced: number;
    invoiceCount: number;
  }[];
  aging: {
    totalOutstanding: number;
    buckets: {
      label: string;
      fromDays: number;
      toDays?: number;
      amount: number;
      invoiceCount: number;
      percentage: number;
    }[];
  };
}

export interface InvoiceReminderResponse {
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  recipientEmail?: string;
  channel: string;
  balanceDue: number;
  dueDate: string;
  overdue: boolean;
  status: "ready" | "missing_recipient" | string;
  message: string;
  createdAt: string;
}

export interface InvoiceCompanyInfo {
  name: string;
  addressLine1: string;
  addressLine2: string;
  gstin: string;
  pan: string;
  stateName: string;
  stateCode: string;
  email: string;
  phone: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankBranch: string;
  bankUpi: string;
}

export interface Invoice {
  id: string;
  invoicePrefix?: string;
  invoiceNumber: string;
  customer: {
    id?: string;
    name: string;
    company: string;
    email: string;
    phone: string;
    address: string;
    gstNumber?: string;
  };
  invoiceDate: string;
  paymentTermsDays?: number;
  dueDate: string;
  poNumber?: string;
  poDate?: string;
  ewayBillNo?: string;
  vehicleNo?: string;
  items: {
    id?: string;
    productId?: string;
    productName: string;
    productImage?: string;
    category?: string;
    hsnSac?: string;
    uom?: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    gst: number;
    total: number;
    // computed (read-only from backend)
    discountAmount?: number;
    taxableAmount?: number;
    gstAmount?: number;
    cgstAmount?: number;
    sgstAmount?: number;
    igstAmount?: number;
  }[];
  subtotal: number;
  itemDiscountTotal?: number;
  additionalDiscount?: number;
  totalDiscount: number;
  additionalCharges?: number;
  taxableAmount?: number;
  totalGst: number;
  cgstTotal?: number;
  sgstTotal?: number;
  igstTotal?: number;
  roundOffAmount?: number;
  grandTotal: number;
  paymentAmount?: number;
  balanceDue?: number;
  notes?: string;
  termsAndConditions?: string;
  pdfPath?: string;
  downloadUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  status: "draft" | "generated" | "partially_paid" | "paid" | "cancelled";

  // ── Bill-to extras ──
  billToPan?: string;
  billToStateCode?: string;

  // ── Shipping ──
  sameShippingAsBilling?: boolean;
  shipToName?: string;
  shipToCompany?: string;
  shipToAddress?: string;
  shipToState?: string;
  shipToStateCode?: string;

  // ── GST compliance ──
  placeOfSupply?: string;
  rcmApplicable?: boolean;

  // ── Bank ──
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankBranch?: string;
  bankUpi?: string;

  // ── Seal & signature ──
  signatureImagePath?: string;
}

export interface CashFlowData {
  cashInflow: number;
  cashOutflow: number;
  pendingReceivables: number;
  upcomingPayables: number;
  availableCash: number;
  monthlyCashFlow: { month: string; inflow: number; outflow: number }[];
}

// ==================== MOCK DATA (for endpoints not yet backed by API) ====================

interface BackendExpense {
  id: number;
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
  vendor: string | null;
  status: string | null;
  createdAt: string;
  updatedAt: string;
}

function toExpense(b: BackendExpense): Expense {
  return {
    id: String(b.id),
    category: b.category,
    description: b.description,
    amount: b.amount,
    date: b.expenseDate,
    vendor: b.vendor ?? undefined,
    status: (b.status?.toLowerCase() ?? "pending") as Expense["status"],
  };
}

const mockProductProfitability: ProductProfitability[] = [
  {
    id: "1",
    productName: "Premium Wireless Headphones",
    revenue: 524000,
    cost: 262000,
    grossProfit: 262000,
    netProfit: 157200,
    margin: 30.0,
  },
  {
    id: "2",
    productName: "Minimalist Leather Watch",
    revenue: 445000,
    cost: 222500,
    grossProfit: 222500,
    netProfit: 133500,
    margin: 30.0,
  },
  {
    id: "3",
    productName: "Professional Camera",
    revenue: 385000,
    cost: 192500,
    grossProfit: 192500,
    netProfit: 115500,
    margin: 30.0,
  },
];

const mockCustomerProfitability: CustomerProfitability[] = [
  {
    id: "1",
    customerName: "TechCorp Inc.",
    revenueGenerated: 385000,
    costIncurred: 269500,
    netProfit: 115500,
    totalOrders: 45,
    profitMargin: 30.0,
  },
  {
    id: "2",
    customerName: "Global Retail Ltd.",
    revenueGenerated: 325000,
    costIncurred: 227500,
    netProfit: 97500,
    totalOrders: 38,
    profitMargin: 30.0,
  },
];

const mockVendors: Vendor[] = [
  {
    id: "1",
    vendorName: "Dev Solutions Inc.",
    service: "Web Development",
    project: "E-commerce Platform",
    cost: 45000,
    invoiceReference: "INV-2026-001",
    paymentStatus: "paid",
  },
  {
    id: "2",
    vendorName: "Design Studio Pro",
    service: "UI/UX Design",
    project: "Mobile App Redesign",
    cost: 28000,
    invoiceReference: "INV-2026-002",
    paymentStatus: "paid",
  },
  {
    id: "3",
    vendorName: "Cloud Experts",
    service: "Infrastructure Setup",
    project: "AWS Migration",
    cost: 35000,
    invoiceReference: "INV-2026-003",
    paymentStatus: "pending",
  },
];

// ==================== SERVICE ====================

export const financeService = {
  // Overview
  async getOverview(): Promise<KPIData> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/finance/overview`);
    const body = await parseJsonResponse<{ success: boolean; data: KPIData }>(response);
    return body.data;
  },

  // Revenue
  async getRevenueData(): Promise<RevenueData> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/finance/revenue`);
    const body = await parseJsonResponse<{ success: boolean; data: RevenueData }>(response);
    return body.data;
  },

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/finance/expenses`);
    const body = await parseJsonResponse<{ success: boolean; data: BackendExpense[] }>(response);
    return body.data.map(toExpense);
  },

  async createExpense(expense: Omit<Expense, "id">): Promise<Expense> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/finance/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        expenseDate: expense.date,
        vendor: expense.vendor,
        status: expense.status?.toUpperCase(),
      }),
    });
    const body = await parseJsonResponse<{ success: boolean; data: BackendExpense }>(response);
    return toExpense(body.data);
  },

  async updateExpense(id: string, expense: Partial<Expense>): Promise<Expense> {
    const existing = (await this.getExpenses()).find((e) => e.id === id);
    const merged = { ...existing, ...expense };
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/finance/expenses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: merged.category,
        description: merged.description,
        amount: merged.amount,
        expenseDate: merged.date,
        vendor: merged.vendor,
        status: merged.status?.toUpperCase(),
      }),
    });
    const body = await parseJsonResponse<{ success: boolean; data: BackendExpense }>(response);
    return toExpense(body.data);
  },

  async deleteExpense(id: string): Promise<void> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/finance/expenses/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }
  },

  // Profit
  async getProfitData(): Promise<ProfitData> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/finance/profit`);
    const body = await parseJsonResponse<{ success: boolean; data: ProfitData }>(response);
    return body.data;
  },

  async getProductProfitability(): Promise<ProductProfitability[]> {
    // TODO: const response = await fetch(`${API_BASE_URL}/finance/profit/products`);
    // TODO: return response.json();
    return mockProductProfitability;
  },

  async getCustomerProfitability(): Promise<CustomerProfitability[]> {
    // TODO: const response = await fetch(`${API_BASE_URL}/finance/profit/customers`);
    // TODO: return response.json();
    return mockCustomerProfitability;
  },

  // Vendors
  async getVendors(): Promise<Vendor[]> {
    // TODO: const response = await fetch(`${API_BASE_URL}/finance/vendors`);
    // TODO: return response.json();
    return mockVendors;
  },

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/invoices`);
    return parseJsonResponse<Invoice[]>(response);
  },

  /** Phase E: server-side paged/filtered search — used by the list page. */
  async searchInvoices(params: {
    q?: string;
    status?: Invoice["status"];
    customerId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    size?: number;
    sort?: string;
  } = {}): Promise<{
    content: Invoice[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
  }> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    });
    if (!qs.has("page")) qs.set("page", "0");
    if (!qs.has("size")) qs.set("size", "20");
    if (!qs.has("sort")) qs.set("sort", "createdAt,desc");
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/invoices/search?${qs.toString()}`
    );
    return parseJsonResponse(response);
  },

  async getInvoiceDashboard(params: {
    dateFrom?: string;
    dateTo?: string;
    trendMonths?: number;
  } = {}): Promise<InvoiceDashboardData> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") qs.set(key, String(value));
    });
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/invoices/dashboard${suffix}`
    );
    return parseJsonResponse<InvoiceDashboardData>(response);
  },

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/invoices/${id}`);
    if (response.status === 404) {
      return null;
    }
    return parseJsonResponse<Invoice>(response);
  },

  async getInvoiceCompanyInfo(): Promise<InvoiceCompanyInfo> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/invoices/company-info`);
    return parseJsonResponse<InvoiceCompanyInfo>(response);
  },

  async createInvoice(invoice: Omit<Invoice, "id">): Promise<Invoice> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizeInvoicePayload(invoice)),
    });
    return parseJsonResponse<Invoice>(response);
  },

  async uploadSignature(id: string, file: File): Promise<Invoice> {
    const form = new FormData();
    form.append("file", file);
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/invoices/${id}/signature`,
      { method: "POST", body: form }
    );
    return parseJsonResponse<Invoice>(response);
  },

  async deleteSignature(id: string): Promise<Invoice> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/invoices/${id}/signature`,
      { method: "DELETE" }
    );
    return parseJsonResponse<Invoice>(response);
  },

  signatureUrl(fileName: string): string {
    return `${API_BASE_URL}/invoices/signature/${encodeURIComponent(fileName)}`;
  },

  /** Fetch the seal & signature image with auth and return an object URL
   *  usable in an <img> tag. Caller must revoke it when done. */
  async fetchSignatureObjectUrl(fileName: string): Promise<string> {
    const response = await authService.authenticatedFetch(
      this.signatureUrl(fileName)
    );
    if (!response.ok) throw new Error("Failed to load signature image");
    return URL.createObjectURL(await response.blob());
  },

  async generateInvoicePdf(invoiceNumber: string, invoice: Omit<Invoice, "id">): Promise<{ fileName: string; downloadUrl: string }> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/invoices/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizeInvoicePayload({ ...invoice, invoiceNumber })),
    });
    return parseJsonResponse<{ fileName: string; downloadUrl: string }>(response);
  },

  async generateExistingInvoicePdf(id: string): Promise<Invoice> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/invoices/${id}/generate`, {
      method: "POST",
    });
    return parseJsonResponse<Invoice>(response);
  },

  /**
   * Phase D: single call — server regenerates the PDF and streams it in the
   * same response. Frontend just triggers the browser download.
   */
  async downloadInvoicePdfFresh(id: string, invoiceNumber: string): Promise<void> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/invoices/${id}/pdf`
    );
    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  },

  async downloadInvoicePdf(fileName: string): Promise<void> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/invoices/download/${encodeURIComponent(fileName)}`
    );
    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  },

  async updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizeInvoicePayload(invoice)),
    });
    return parseJsonResponse<Invoice>(response);
  },

  async receiveInvoicePayment(id: string, amount: number, notes?: string): Promise<Invoice> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/invoices/${id}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        paymentDate: new Date().toISOString().slice(0, 10),
        notes,
      }),
    });
    return parseJsonResponse<Invoice>(response);
  },

  async sendInvoiceReminder(id: string, message?: string): Promise<InvoiceReminderResponse> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/invoices/${id}/reminders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "email", message }),
    });
    return parseJsonResponse<InvoiceReminderResponse>(response);
  },

  async shareInvoice(id: string, body: { recipientEmail: string; recipientName?: string; note?: string }): Promise<{ channel: string; recipientEmail: string; documentNumber: string; status: string; sharedAt: string }> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/invoices/${id}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await parseJsonResponse<{ success: boolean; message: string; data: { channel: string; recipientEmail: string; documentNumber: string; status: string; sharedAt: string } }>(response);
    return result.data;
  },

  async deleteInvoice(id: string): Promise<void> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/invoices/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }
  },

  // Cash Flow
  async getCashFlow(): Promise<CashFlowData> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/finance/cashflow`);
    const body = await parseJsonResponse<{ success: boolean; data: CashFlowData }>(response);
    return body.data;
  },
};

function normalizeInvoicePayload<T extends Partial<Invoice> | Omit<Invoice, "id">>(invoice: T): T {
  return {
    ...invoice,
    items: invoice.items?.map((item) => ({
      ...item,
      // ensure uom always sent so backend column doesn't NULL out on edit
      uom: item.uom ?? "nos",
      quantity: clampNumber(item.quantity, 1),
      unitPrice: clampNumber(item.unitPrice, 0),
      discount: clampNumber(item.discount, 0, 100),
      gst: clampNumber(item.gst, 0, 100),
    })),
  };
}

function clampNumber(value: number | undefined, min: number, max = Number.POSITIVE_INFINITY): number {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return min;
  }
  return Math.min(max, Math.max(min, numericValue));
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
