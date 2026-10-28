import { API_BASE_URL } from "../config";

const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user_info";

/** Which sign-in card the credentials came from. Mirrors the backend LoginMode. */
export type LoginMode = "ROOT" | "USER";

export interface LoginRequest {
  /** Email address on the owner card; username on the user card. */
  username: string;
  password: string;
  /** Sent by the user card only. Scopes the lookup to one company. */
  companyCode?: string;
  loginAs?: LoginMode;
}

/** Carries the HTTP status so the sign-in screen can tell the cases apart. */
export class AuthError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }

  /** Too many failed attempts; the account is in its cooling-off period. */
  get isLocked(): boolean {
    return this.status === 423;
  }

  /** The account exists but is switched off. */
  get isDisabled(): boolean {
    return this.status === 403;
  }
}

/**
 * Pull a message out of the backend's ApiResponse envelope
 * ({ success, message, data }). Falls back to the supplied default when the
 * body is empty or not JSON at all.
 */
async function messageFrom(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    return body?.message || body?.error || fallback;
  } catch {
    return fallback;
  }
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  id: number;
  username: string;
  email: string;
  role: string;
  companyId: number;
  companyName: string;
  companyCode: string;
  mustChangePassword: boolean;
}

function toUser(data: LoginResponse): User {
  return {
    id: data.id,
    username: data.username,
    email: data.email,
    role: data.role,
    companyId: data.companyId,
    companyName: data.companyName,
    companyCode: data.companyCode,
    mustChangePassword: data.mustChangePassword,
  };
}

export interface User {
  id?: number;
  username: string;
  email?: string;
  role: string;
  companyId: number;
  companyName: string;
  companyCode: string;
  /** Set after an administrative password reset; forces a change before anything else. */
  mustChangePassword?: boolean;
}

class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        // The backend distinguishes bad credentials (400) from a company that
        // is not active (403) — awaiting approval in the Tenant Access
        // Management console, suspended, or deactivated. Those bodies carry a
        // `message` explaining which; collapsing them into one generic string
        // sends the operator looking for a password problem they don't have.
        const message = await response
          .json()
          .then((body) => (typeof body?.message === "string" ? body.message : null))
          .catch(() => null);

        if (message) {
          throw new Error(message);
        }
        if (response.status === 401) {
          throw new Error("Invalid username or password");
        }
        throw new Error("Login failed. Please try again.");
      }

      const data: LoginResponse = await response.json();

      this.setToken(data.token);
      this.setRefreshToken(data.refreshToken);
      this.setUser(toUser(data));

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  }

  /**
   * Re-read the signed-in account from the server.
   *
   * Local storage records what was true at sign-in. A role change, a disable,
   * or a forced password reset happens server-side and would otherwise stay
   * invisible until the next login.
   */
  async fetchMe(): Promise<User> {
    const response = await this.authenticatedFetch(`${API_BASE_URL}/auth/me`);
    if (!response.ok) {
      throw new AuthError(
        await messageFrom(response, "Could not load your account"),
        response.status
      );
    }
    const data: LoginResponse = await response.json();
    const user = toUser(data);
    this.setUser(user);
    return user;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<string> {
    const response = await this.authenticatedFetch(`${API_BASE_URL}/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!response.ok) {
      throw new AuthError(
        await messageFrom(response, "Could not change your password"),
        response.status
      );
    }
    // Changing the password revokes every session, this one included.
    const body = await response.json().catch(() => ({}));
    return body?.message ?? "Password changed. Please sign in again.";
  }


  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = this.parseJwt(token);
      const currentTime = Date.now() / 1000;

      if (payload.exp && payload.exp < currentTime) {
        this.logout();
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  getCurrentUser(): User | null {
    const userJson = localStorage.getItem(USER_KEY);
    if (!userJson) return null;

    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  setRefreshToken(token: string): void {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    }
  }

  setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  async refreshAccessToken(): Promise<string> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const data = await response.json();
      this.setToken(data.token);

      return data.token;
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  private parseJwt(token: string): any {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );

      return JSON.parse(jsonPayload);
    } catch {
      throw new Error("Invalid token");
    }
  }

  getAuthHeader(): Record<string, string> {
    const token = this.getToken();
    if (token) {
      return {
        Authorization: `Bearer ${token}`,
      };
    }
    return {};
  }

  async authenticatedFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const headers = {
      ...options.headers,
      ...this.getAuthHeader(),
    };

    let response = await fetch(url, { ...options, headers });

    // Only 401 (not authenticated) is worth a token refresh. A 403 means the
    // session is fine and the permission is not — refreshing would not help,
    // and signing the user out over it would be wrong.
    if (response.status === 401) {
      try {
        await this.refreshAccessToken();

        const newHeaders = {
          ...options.headers,
          ...this.getAuthHeader(),
        };
        response = await fetch(url, { ...options, headers: newHeaders });
      } catch {
        this.logout();
        window.location.href = "/admin/login";
        throw new Error("Session expired. Please login again.");
      }
    }

    return response;
  }
}

export const authService = new AuthService();
