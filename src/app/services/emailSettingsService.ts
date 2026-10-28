import { authService } from "./authService";

import { API_BASE_URL } from "../config";

export interface EmailSettings {
  id: number | null;
  provider: string;
  smtpHost: string;
  smtpPort: number;
  emailAddress: string;
  fromName: string;
  useTls: boolean;
  verified: boolean;
  configured: boolean;
}

export interface EmailSettingsUpdate {
  provider: string;
  smtpHost: string;
  smtpPort: number;
  emailAddress: string;
  emailPassword: string;
  fromName?: string;
  useTls: boolean;
}

export interface EmailProvider {
  value: string;
  label: string;
  host: string;
  port: number;
  tls: boolean;
  hint?: string;
}

export const EMAIL_PROVIDERS: EmailProvider[] = [
  { value: "GODADDY", label: "GoDaddy", host: "smtpout.secureserver.net", port: 587, tls: true },
  { value: "HOSTINGER", label: "Hostinger", host: "smtp.hostinger.com", port: 587, tls: true },
  { value: "GMAIL", label: "Gmail", host: "smtp.gmail.com", port: 587, tls: true, hint: "Use your full Gmail address and a 16-character Google App Password (not your regular password). App Passwords require 2-Step Verification. Spaces in the copied password are ignored." },
  { value: "OUTLOOK", label: "Outlook / Office 365", host: "smtp.office365.com", port: 587, tls: true },
  { value: "ZOHO", label: "Zoho Mail", host: "smtp.zoho.in", port: 587, tls: true },
  { value: "YAHOO", label: "Yahoo Mail", host: "smtp.mail.yahoo.com", port: 587, tls: true, hint: "Use an App Password" },
  { value: "CUSTOM", label: "Custom SMTP", host: "", port: 587, tls: true },
];

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }
  return response.json() as Promise<T>;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const emailSettingsService = {
  async getSettings(): Promise<EmailSettings> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/company/email-settings`
    );
    const result = await parseJsonResponse<ApiResponse<EmailSettings>>(response);
    return result.data;
  },

  async saveSettings(data: EmailSettingsUpdate): Promise<EmailSettings> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/company/email-settings`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    const result = await parseJsonResponse<ApiResponse<EmailSettings>>(response);
    return result.data;
  },

  async sendOtp(): Promise<string> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/company/email-settings/send-otp`,
      { method: "POST" }
    );
    const result = await parseJsonResponse<ApiResponse<void>>(response);
    return result.message;
  },

  async verifyOtp(otp: string): Promise<EmailSettings> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/company/email-settings/verify-otp`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      }
    );
    const result = await parseJsonResponse<ApiResponse<EmailSettings>>(response);
    return result.data;
  },

  async sendTestEmail(recipientEmail: string): Promise<string> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/company/email-settings/test`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail }),
      }
    );
    const result = await parseJsonResponse<ApiResponse<void>>(response);
    return result.message;
  },
};
