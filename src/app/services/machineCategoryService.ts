import { authService } from "./authService";

import { API_BASE_URL } from "../config";

export interface MachineCategory {
  id: number;
  name: string;
  code?: string;
  description?: string;
  active: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MachineCategoryFormData {
  name: string;
  code?: string;
  description?: string;
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

export const machineCategoryService = {
  async list(
    query?: string,
    active?: boolean,
    page = 0,
    size = 50
  ): Promise<Page<MachineCategory>> {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (active !== undefined) params.set("active", String(active));
    params.set("page", String(page));
    params.set("size", String(size));
    params.set("sort", "name,asc");
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/machine-categories?${params}`
    );
    return parseJsonResponse<Page<MachineCategory>>(response);
  },

  async listActive(): Promise<MachineCategory[]> {
    const page = await machineCategoryService.list(undefined, true, 0, 500);
    return page.content;
  },

  async get(id: number): Promise<MachineCategory> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/machine-categories/${id}`
    );
    return parseJsonResponse<MachineCategory>(response);
  },

  async create(data: MachineCategoryFormData): Promise<MachineCategory> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/machine-categories`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    return parseJsonResponse<MachineCategory>(response);
  },

  async update(id: number, data: MachineCategoryFormData): Promise<MachineCategory> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/machine-categories/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    return parseJsonResponse<MachineCategory>(response);
  },

  async deactivate(id: number): Promise<void> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/machine-categories/${id}/deactivate`,
      { method: "PATCH" }
    );
    if (!response.ok) throw new Error("Failed to deactivate category");
  },

  async activate(id: number): Promise<void> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/machine-categories/${id}/activate`,
      { method: "PATCH" }
    );
    if (!response.ok) throw new Error("Failed to activate category");
  },
};
