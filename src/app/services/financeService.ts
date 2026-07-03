// Finance Service - API integration layer
import { authService } from "./authService";

const API_BASE_URL = "http://localhost:8080/api";

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
    quantity: number;
    unitPrice: number;
    discount: number;
    gst: number;
    total: number;
  }[];
  subtotal: number;
  totalDiscount: number;
  additionalCharges?: number;
  taxableAmount?: number;
  totalGst: number;
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
}

export interface CashFlowData {
  cashInflow: number;
  cashOutflow: number;
  pendingReceivables: number;
  upcomingPayables: number;
  availableCash: number;
  monthlyCashFlow: { month: string; inflow: number; outflow: number }[];
}

// ==================== MOCK DATA ====================

const mockKPIData: KPIData = {
  totalRevenue: 2847500,
  grossProfit: 1425000,
  netProfit: 856500,
  totalExpenses: 568500,
  outstandingPayments: 145000,
  cashAvailable: 1250000,
  monthlyRevenue: 475000,
  monthlyProfit: 142500,
  profitMargin: 30.1,
  activeCustomers: 1247,
  totalInvoices: 3458,
  averageOrderValue: 823.5,
  revenueChange: 12.5,
  profitChange: 8.3,
  expensesChange: -5.2,
};

const mockRevenueData: RevenueData = {
  monthly: [
    { month: "Jan", revenue: 385000, profit: 115500 },
    { month: "Feb", revenue: 420000, profit: 126000 },
    { month: "Mar", revenue: 395000, profit: 118500 },
    { month: "Apr", revenue: 445000, profit: 133500 },
    { month: "May", revenue: 475000, profit: 142500 },
    { month: "Jun", revenue: 460000, profit: 138000 },
  ],
  quarterly: [
    { quarter: "Q1", revenue: 1200000 },
    { quarter: "Q2", revenue: 1380000 },
    { quarter: "Q3", revenue: 1450000 },
    { quarter: "Q4", revenue: 1620000 },
  ],
  byProduct: [
    { product: "Premium Wireless Headphones", revenue: 524000 },
    { product: "Minimalist Leather Watch", revenue: 445000 },
    { product: "Professional Camera", revenue: 385000 },
    { product: "Smart Home Hub", revenue: 325000 },
    { product: "Fitness Tracker Pro", revenue: 285000 },
  ],
  byCategory: [
    { category: "Audio", revenue: 725000 },
    { category: "Watches", revenue: 545000 },
    { category: "Cameras", revenue: 485000 },
    { category: "Home", revenue: 425000 },
    { category: "Fitness", revenue: 365000 },
  ],
  byCustomer: [
    { customer: "TechCorp Inc.", revenue: 385000 },
    { customer: "Global Retail Ltd.", revenue: 325000 },
    { customer: "Digital Solutions", revenue: 275000 },
    { customer: "Smart Devices Co.", revenue: 245000 },
    { customer: "Innovation Labs", revenue: 215000 },
  ],
  byRegion: [
    { region: "North America", revenue: 985000 },
    { region: "Europe", revenue: 745000 },
    { region: "Asia Pacific", revenue: 625000 },
    { region: "Latin America", revenue: 285000 },
    { region: "Middle East", revenue: 207500 },
  ],
};

const mockExpenses: Expense[] = [
  {
    id: "1",
    category: "Outsourcing",
    description: "Web development services",
    amount: 45000,
    date: "2026-05-15",
    vendor: "Dev Solutions Inc.",
    status: "paid",
  },
  {
    id: "2",
    category: "Salaries",
    description: "Employee salaries - May",
    amount: 185000,
    date: "2026-05-01",
    status: "paid",
  },
  {
    id: "3",
    category: "Marketing",
    description: "Google Ads campaign",
    amount: 25000,
    date: "2026-05-20",
    vendor: "Google LLC",
    status: "paid",
  },
  {
    id: "4",
    category: "Cloud Hosting",
    description: "AWS hosting fees",
    amount: 8500,
    date: "2026-05-10",
    vendor: "Amazon Web Services",
    status: "paid",
  },
  {
    id: "5",
    category: "Software Licenses",
    description: "Adobe Creative Cloud",
    amount: 3500,
    date: "2026-05-05",
    vendor: "Adobe Inc.",
    status: "paid",
  },
];

const mockProfitData: ProfitData = {
  revenue: 2847500,
  productCost: 1422500,
  grossProfit: 1425000,
  outsourcingCost: 145000,
  salaries: 285000,
  marketing: 85000,
  infrastructure: 35000,
  operationalExpenses: 45000,
  taxes: 28500,
  netProfit: 856500,
  profitMargin: 30.1,
  operatingMargin: 35.2,
};

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

const mockInvoices: Invoice[] = [
  {
    id: "1",
    invoiceNumber: "INV-2026-1001",
    customer: {
      name: "John Doe",
      company: "TechCorp Inc.",
      email: "john@techcorp.com",
      phone: "+1-555-0123",
      address: "123 Tech Street, San Francisco, CA 94102",
      gstNumber: "GST123456789",
    },
    invoiceDate: "2026-05-20",
    dueDate: "2026-06-20",
    items: [
      {
        productName: "Premium Wireless Headphones",
        quantity: 10,
        unitPrice: 349.99,
        discount: 5,
        gst: 18,
        total: 3849.9,
      },
      {
        productName: "Minimalist Leather Watch",
        quantity: 5,
        unitPrice: 299.99,
        discount: 0,
        gst: 18,
        total: 1769.94,
      },
    ],
    subtotal: 5324.94,
    totalDiscount: 174.95,
    totalGst: 958.49,
    grandTotal: 6108.48,
    status: "paid",
  },
  {
    id: "2",
    invoiceNumber: "INV-2026-1002",
    customer: {
      name: "Jane Smith",
      company: "Global Retail Ltd.",
      email: "jane@globalretail.com",
      phone: "+1-555-0124",
      address: "456 Commerce Ave, New York, NY 10001",
    },
    invoiceDate: "2026-05-22",
    dueDate: "2026-06-22",
    items: [
      {
        productName: "Professional Camera",
        quantity: 3,
        unitPrice: 1299.99,
        discount: 10,
        gst: 18,
        total: 4105.17,
      },
    ],
    subtotal: 3899.97,
    totalDiscount: 389.99,
    totalGst: 701.99,
    grandTotal: 4211.97,
    status: "generated",
  },
];

const mockCashFlowData: CashFlowData = {
  cashInflow: 2847500,
  cashOutflow: 1991000,
  pendingReceivables: 145000,
  upcomingPayables: 85000,
  availableCash: 1250000,
  monthlyCashFlow: [
    { month: "Jan", inflow: 385000, outflow: 325000 },
    { month: "Feb", inflow: 420000, outflow: 345000 },
    { month: "Mar", inflow: 395000, outflow: 315000 },
    { month: "Apr", inflow: 445000, outflow: 365000 },
    { month: "May", inflow: 475000, outflow: 385000 },
    { month: "Jun", inflow: 460000, outflow: 355000 },
  ],
};

// ==================== SERVICE ====================

export const financeService = {
  // Overview
  async getOverview(): Promise<KPIData> {
    // TODO: const response = await fetch(`${API_BASE_URL}/finance/overview`);
    // TODO: return response.json();
    return mockKPIData;
  },

  // Revenue
  async getRevenueData(): Promise<RevenueData> {
    // TODO: const response = await fetch(`${API_BASE_URL}/finance/revenue`);
    // TODO: return response.json();
    return mockRevenueData;
  },

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    // TODO: const response = await fetch(`${API_BASE_URL}/finance/expenses`);
    // TODO: return response.json();
    return mockExpenses;
  },

  async createExpense(expense: Omit<Expense, "id">): Promise<Expense> {
    // TODO: const response = await fetch(`${API_BASE_URL}/finance/expenses`, {...});
    // TODO: return response.json();
    const newExpense = { ...expense, id: Date.now().toString() };
    console.log("Create expense:", newExpense);
    return newExpense;
  },

  async updateExpense(id: string, expense: Partial<Expense>): Promise<Expense> {
    // TODO: const response = await fetch(`${API_BASE_URL}/finance/expenses/${id}`, {...});
    // TODO: return response.json();
    console.log("Update expense:", id, expense);
    return { ...mockExpenses[0], ...expense, id };
  },

  async deleteExpense(id: string): Promise<void> {
    // TODO: await fetch(`${API_BASE_URL}/finance/expenses/${id}`, { method: 'DELETE' });
    console.log("Delete expense:", id);
  },

  // Profit
  async getProfitData(): Promise<ProfitData> {
    // TODO: const response = await fetch(`${API_BASE_URL}/finance/profit`);
    // TODO: return response.json();
    return mockProfitData;
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

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/invoices/${id}`);
    if (response.status === 404) {
      return null;
    }
    return parseJsonResponse<Invoice>(response);
  },

  async createInvoice(invoice: Omit<Invoice, "id">): Promise<Invoice> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizeInvoicePayload(invoice)),
    });
    return parseJsonResponse<Invoice>(response);
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
    // TODO: const response = await fetch(`${API_BASE_URL}/finance/cashflow`);
    // TODO: return response.json();
    return mockCashFlowData;
  },
};

function normalizeInvoicePayload<T extends Partial<Invoice> | Omit<Invoice, "id">>(invoice: T): T {
  return {
    ...invoice,
    items: invoice.items?.map((item) => ({
      ...item,
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
