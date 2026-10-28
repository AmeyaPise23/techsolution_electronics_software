export interface VariantResponseDto {
  id: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  color: string | null;
  size: string | null;
  material: string | null;
  weight: string | null;
  purchasePrice: number | null;
  landingCost: number | null;
  mrp: number | null;
  price: number;
  discountPrice: number | null;
  taxPercentage: number | null;
  hsnCode: string | null;
  currency: string | null;
  taxInclusive: boolean;
  stockQuantity: number;
  stockStatus: string;
  active: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface VariantRequestDto {
  productId: string;
  variantName: string;
  sku: string;
  color?: string;
  size?: string;
  material?: string;
  weight?: string;
  purchasePrice?: number;
  landingCost?: number;
  mrp?: number;
  price: number;
  discountPrice?: number;
  taxPercentage?: number;
  hsnCode?: string;
  currency?: string;
  taxInclusive?: boolean;
  stockQuantity: number;
  stockStatus: string;
  active?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

import { authService } from "./authService";
import { API_BASE_URL } from "../config";

const VARIANT_BASE_URL = `${API_BASE_URL}/variants`;
const authFetch = authService.authenticatedFetch.bind(authService);

async function parseApiResponse<T>(response: Response): Promise<T> {
  const responseBody = await response.json();
  if (!response.ok) {
    throw new Error(responseBody?.message || "Request failed");
  }
  if (responseBody?.success === false) {
    throw new Error(responseBody?.message || "Request failed");
  }
  return (responseBody.data ?? responseBody) as T;
}

export const variantService = {
  async getVariantsByProduct(productId: string): Promise<VariantResponseDto[]> {
    const response = await fetch(`${VARIANT_BASE_URL}/product/${productId}`);
    return parseApiResponse<VariantResponseDto[]>(response);
  },

  async createVariant(data: VariantRequestDto): Promise<VariantResponseDto> {
    const response = await authFetch(VARIANT_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return parseApiResponse<VariantResponseDto>(response);
  },

  async updateVariant(
    variantId: string,
    data: VariantRequestDto
  ): Promise<VariantResponseDto> {
    const response = await authFetch(`${VARIANT_BASE_URL}/${variantId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return parseApiResponse<VariantResponseDto>(response);
  },

  async deleteVariant(variantId: string): Promise<void> {
    const response = await authFetch(`${VARIANT_BASE_URL}/${variantId}`, {
      method: "DELETE",
    });
    await parseApiResponse<void>(response);
  },
};
