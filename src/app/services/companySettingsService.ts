import { authService } from "./authService";

import { API_BASE_URL } from "../config";

export interface CompanySettings {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  gstin: string;
  pan: string;
  stateName: string;
  stateCode: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankBranch: string;
  bankUpi: string;
}

export interface CompanySettingsUpdate {
  companyName?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  gstNumber?: string;
  pan?: string;
  stateName?: string;
  stateCode?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankBranch?: string;
  bankUpi?: string;
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

export const companySettingsService = {
  async getSettings(): Promise<CompanySettings> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/company/settings`
    );
    return parseJsonResponse<CompanySettings>(response);
  },

  async updateSettings(data: CompanySettingsUpdate): Promise<CompanySettings> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/company/settings`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    return parseJsonResponse<CompanySettings>(response);
  },
};
