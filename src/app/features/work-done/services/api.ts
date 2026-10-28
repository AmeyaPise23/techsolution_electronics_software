import { authService } from "../../../services/authService";
import { API_BASE_URL } from "../../../config";

const API = `${API_BASE_URL}/wm`;

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export async function wmGet<T>(path: string): Promise<T> {
  const res = await authService.authenticatedFetch(`${API}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  const body: ApiResponse<T> = await res.json();
  return body.data;
}

export async function wmPost<T>(path: string, payload: unknown): Promise<T> {
  const res = await authService.authenticatedFetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  const body: ApiResponse<T> = await res.json();
  return body.data;
}

export async function wmPatch<T>(path: string, payload?: unknown): Promise<T> {
  const res = await authService.authenticatedFetch(`${API}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`);
  const body: ApiResponse<T> = await res.json();
  return body.data;
}

export async function wmPostMultipart<T>(path: string, formData: FormData): Promise<T> {
  const res = await authService.authenticatedFetch(`${API}${path}`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  const body: ApiResponse<T> = await res.json();
  return body.data;
}

export function s(v: unknown): string {
  return v == null ? "" : String(v);
}
