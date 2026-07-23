import { authService } from "./authService";

const API_BASE_URL = "http://localhost:8080/api";

export interface CustomerContact {
  id: number;
  customerId: number;
  name: string;
  mobile?: string;
  alternateMobile?: string;
  email?: string;
  department?: string;
  designation?: string;
  isPrimary: boolean;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerContactFormData {
  customerId: number;
  name: string;
  mobile?: string;
  alternateMobile?: string;
  email?: string;
  department?: string;
  designation?: string;
  isPrimary?: boolean;
  active?: boolean;
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

export const customerContactService = {
  async listActiveByCustomer(customerId: number): Promise<CustomerContact[]> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/customers/${customerId}/contacts/active`
    );
    return parseJsonResponse<CustomerContact[]>(response);
  },

  async create(data: CustomerContactFormData): Promise<CustomerContact> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/customer-contacts`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    return parseJsonResponse<CustomerContact>(response);
  },

  async update(id: number, data: CustomerContactFormData): Promise<CustomerContact> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/customer-contacts/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    return parseJsonResponse<CustomerContact>(response);
  },

  async setPrimary(id: number): Promise<CustomerContact> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/customer-contacts/${id}/primary`,
      { method: "PATCH" }
    );
    return parseJsonResponse<CustomerContact>(response);
  },
};
