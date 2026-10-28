import { authService } from "./authService";

import { API_BASE_URL } from "../config";

export type SystemRole = "ROLE_ROOT" | "ROLE_ADMIN" | "ROLE_USER";
export type WorkRole = "MANAGER" | "HR" | "EMPLOYEE";

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: SystemRole;
  workRole: WorkRole;
  companyId: number;
  enabled: boolean;
  createdAt: string;
  lastLogin: string | null;
  passwordUpdatedAt: string | null;
  lockedUntil: string | null;
  /** True only while a lockout is actually in force. */
  locked: boolean;
  mustChangePassword: boolean;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role: SystemRole;
  fullName?: string;
  phone?: string;
  workRole?: WorkRole;
}

/**
 * Note there is no `password` here. Setting someone else's password is a
 * distinct act with distinct consequences — it applies the password policy and
 * ends that user's sessions — so it goes through `resetPassword` instead.
 */
export interface UpdateUserData {
  email?: string;
  fullName?: string;
  phone?: string;
  role?: SystemRole;
  workRole?: WorkRole;
  enabled?: boolean;
}

export interface UpdateProfileData {
  fullName?: string;
  phone?: string;
  email?: string;
}

export interface UserAuditEntry {
  id: number;
  action: string;
  actorUserId: number | null;
  actorUsername: string | null;
  targetUserId: number | null;
  detail: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface ListUsersParams {
  page?: number;
  size?: number;
  search?: string;
  role?: SystemRole | "";
  enabled?: boolean;
}

/** The root account is the company owner: visible everywhere, editable nowhere. */
export function isRoot(user: Pick<UserInfo, "role">): boolean {
  return user.role === "ROLE_ROOT";
}


export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/**
 * Successful responses are the DTO itself; failures come back in the backend's
 * ApiResponse envelope ({ success, message, data }), where validation errors
 * put a field→message map in `data`. The previous parser read only `message`
 * and dropped that map, so "Email is already registered" surfaced but
 * per-field validation did not.
 */
async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "Request failed";
    try {
      const body = await response.json();
      message = body?.message || body?.error || message;

      const fieldErrors = body?.data;
      if (fieldErrors && typeof fieldErrors === "object" && !Array.isArray(fieldErrors)) {
        const details = Object.entries(fieldErrors)
          .map(([field, error]) => `${field}: ${error}`)
          .join("; ");
        if (details) message = details;
      }
    } catch {
      /* Not JSON — keep the generic message. */
    }
    throw new Error(message);
  }
  return response.json();
}

export const userService = {
  async listUsers(params: ListUsersParams = {}): Promise<PagedResponse<UserInfo>> {
    const query = new URLSearchParams();
    query.set("page", String(params.page ?? 0));
    query.set("size", String(params.size ?? 20));
    if (params.search) query.set("search", params.search);
    if (params.role) query.set("role", params.role);
    if (params.enabled !== undefined) query.set("enabled", String(params.enabled));

    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/users?${query.toString()}`
    );
    return parseJsonResponse<PagedResponse<UserInfo>>(response);
  },

  async getMe(): Promise<UserInfo> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/users/me`);
    return parseJsonResponse<UserInfo>(response);
  },

  async updateMe(data: UpdateProfileData): Promise<UserInfo> {
    const response = await authService.authenticatedFetch(`${API_BASE_URL}/users/me`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return parseJsonResponse<UserInfo>(response);
  },

  async getUser(id: number): Promise<UserInfo> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/users/${id}`
    );
    return parseJsonResponse<UserInfo>(response);
  },

  async createUser(data: CreateUserData): Promise<UserInfo> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/users`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    return parseJsonResponse<UserInfo>(response);
  },

  async updateUser(id: number, data: UpdateUserData): Promise<UserInfo> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/users/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    return parseJsonResponse<UserInfo>(response);
  },

  /** Sets a new password, ends the user's sessions, and clears any lockout. */
  async resetPassword(
    id: number,
    newPassword: string,
    requireChangeOnNextLogin = true
  ): Promise<void> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/users/${id}/reset-password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword, requireChangeOnNextLogin }),
      }
    );
    await parseJsonResponse<{ message: string }>(response);
  },

  async unlockUser(id: number): Promise<UserInfo> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/users/${id}/unlock`,
      { method: "POST" }
    );
    return parseJsonResponse<UserInfo>(response);
  },

  async listAudit(id: number, page = 0, size = 25): Promise<PagedResponse<UserAuditEntry>> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/users/${id}/audit?page=${page}&size=${size}`
    );
    return parseJsonResponse<PagedResponse<UserAuditEntry>>(response);
  },

  async deleteUser(id: number): Promise<void> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/users/${id}`,
      { method: "DELETE" }
    );
    if (!response.ok) {
      let message = "Failed to delete user";
      try {
        const body = await response.json();
        message = body.message || message;
      } catch {}
      throw new Error(message);
    }
  },
};
