const API_BASE_URL = "http://localhost:8080/api";

const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user_info";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  username: string;
  email: string;
  role: string;
  companyId: number;
  companyName: string;
  companyCode: string;
}

export interface User {
  username: string;
  role: string;
  companyId: number;
  companyName: string;
  companyCode: string;
}

export interface CompanyRegistrationRequest {
  companyName: string;
  companyEmail: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  adminUsername: string;
  adminEmail: string;
  adminPassword: string;
}

export interface CompanyRegistrationResponse {
  companyId: number;
  companyName: string;
  companyCode: string;
  userId: number;
  username: string;
  email: string;
  role: string;
  token: string;
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
        if (response.status === 401) {
          throw new Error("Invalid username or password");
        }
        throw new Error("Login failed. Please try again.");
      }

      const data: LoginResponse = await response.json();

      this.setToken(data.token);
      this.setRefreshToken(data.refreshToken);
      this.setUser({
        username: data.username,
        role: data.role,
        companyId: data.companyId,
        companyName: data.companyName,
        companyCode: data.companyCode,
      });

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  }

  async registerCompany(
    request: CompanyRegistrationRequest
  ): Promise<CompanyRegistrationResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || "Registration failed. Please try again."
      );
    }

    const data: CompanyRegistrationResponse = await response.json();

    this.setToken(data.token);
    this.setUser({
      username: data.username,
      role: data.role,
      companyId: data.companyId,
      companyName: data.companyName,
      companyCode: data.companyCode,
    });

    return data;
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
