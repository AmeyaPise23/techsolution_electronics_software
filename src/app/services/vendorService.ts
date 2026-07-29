import { authService } from "./authService";

const API_BASE_URL = "http://localhost:8080/api";

export interface Vendor {
  id: number;
  name: string;
  code?: string;
  contactPerson?: string;
  mobile?: string;
  alternateMobile?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  specialization?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface VendorFormData {
  name: string;
  code?: string;
  contactPerson?: string;
  mobile?: string;
  alternateMobile?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  specialization?: string;
  active?: boolean;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "Request failed";
    try {
      const body = await response.json();
      message = body.message || body.error || message;
    } catch {}
    throw new Error(message);
  }
  return response.json();
}

export const vendorService = {
  async list(
    query?: string,
    active?: boolean,
    page = 0,
    size = 50
  ): Promise<Page<Vendor>> {
    const qs = new URLSearchParams();
    if (query) qs.set("q", query);
    if (active !== undefined) qs.set("active", String(active));
    qs.set("page", String(page));
    qs.set("size", String(size));
    qs.set("sort", "name,asc");
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/vendors?${qs}`
    );
    return parseJsonResponse<Page<Vendor>>(response);
  },

  async listActive(): Promise<Vendor[]> {
    const p = await vendorService.list(undefined, true, 0, 500);
    return p.content;
  },

  async get(id: number): Promise<Vendor> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/vendors/${id}`
    );
    return parseJsonResponse<Vendor>(response);
  },

  async create(data: VendorFormData): Promise<Vendor> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/vendors`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    return parseJsonResponse<Vendor>(response);
  },

  async update(id: number, data: VendorFormData): Promise<Vendor> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/vendors/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    return parseJsonResponse<Vendor>(response);
  },

  async deactivate(id: number): Promise<void> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/vendors/${id}/deactivate`,
      { method: "PATCH" }
    );
    if (!response.ok) throw new Error("Failed to deactivate vendor");
  },

  async activate(id: number): Promise<void> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/vendors/${id}/activate`,
      { method: "PATCH" }
    );
    if (!response.ok) throw new Error("Failed to activate vendor");
  },

  async spendSummary(): Promise<VendorSpend[]> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/vendors/spend-summary`
    );
    return parseJsonResponse<VendorSpend[]>(response);
  },
};

export interface VendorSpend {
  vendorId: number;
  vendorName: string;
  tripsCount: number;
  openTripsCount: number;
  totalSpend: number;
}
