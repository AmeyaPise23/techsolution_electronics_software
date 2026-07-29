import { authService } from "./authService";

const API_BASE_URL = "http://localhost:8080/api";

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  role: string;
  enabled: boolean;
  createdAt: string;
  lastLogin: string | null;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface UpdateUserData {
  email?: string;
  password?: string;
  role?: string;
  enabled?: boolean;
}

export interface PagedResponse<T> {
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

export const userService = {
  async listUsers(page = 0, size = 20): Promise<PagedResponse<UserInfo>> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/users?page=${page}&size=${size}`
    );
    return parseJsonResponse<PagedResponse<UserInfo>>(response);
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
