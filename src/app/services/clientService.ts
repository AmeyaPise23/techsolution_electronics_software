import { authService } from "./authService";

const API_BASE_URL = "http://localhost:8080/api";

export interface Client {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  gstNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientFormData {
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  gstNumber?: string;
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

export const clientService = {
  async getClients(query?: string): Promise<Client[]> {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    const url = `${API_BASE_URL}/clients${params.toString() ? "?" + params : ""}`;
    const response = await authService.authenticatedFetch(url);
    return parseJsonResponse<Client[]>(response);
  },

  async getClientById(id: number): Promise<Client | null> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/clients/${id}`
    );
    if (response.status === 404) return null;
    return parseJsonResponse<Client>(response);
  },

  async createClient(data: ClientFormData): Promise<Client> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/clients`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    return parseJsonResponse<Client>(response);
  },

  async updateClient(id: number, data: ClientFormData): Promise<Client> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/clients/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    return parseJsonResponse<Client>(response);
  },

  async deleteClient(id: number): Promise<void> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/clients/${id}`,
      { method: "DELETE" }
    );
    if (!response.ok) {
      throw new Error("Failed to delete client");
    }
  },
};
