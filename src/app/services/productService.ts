// Product Service - Placeholder for backend API integration
// Replace these functions with actual API calls when backend is ready

import { products as sampleProducts } from "../data/products";

export interface ProductFormData {
  id?: string;
  name: string;
  sku: string;
  category: string;
  brand: string;
  description: string;
  fullDescription: string;
  price: number;
  discountPrice?: number;
  taxPercentage?: number;
  stockQuantity: number;
  stockStatus: "in-stock" | "out-of-stock" | "pre-order";
  images: string[];
  features: string[];
  specifications: { label: string; value: string }[];
  metaTitle?: string;
  metaDescription?: string;
  rating?: number;
  reviews?: number;
  inStock?: boolean;
  createdAt?: string;
}

// TODO: Replace with your backend URL
const API_BASE_URL = "https://your-backend-api.com/api";

export const productService = {
  // Get all products
  async getAllProducts(): Promise<ProductFormData[]> {
    // TODO: Replace with actual API call
    // const response = await fetch(`${API_BASE_URL}/products`);
    // return response.json();

    // Mock implementation - returns sample products from existing data
    return sampleProducts.map(product => ({
      id: product.id,
      name: product.name,
      sku: `SKU-${product.id}`,
      category: product.category,
      brand: product.category,
      description: product.description,
      fullDescription: product.description,
      price: product.price,
      stockQuantity: product.inStock ? 100 : 0,
      stockStatus: product.inStock ? "in-stock" as const : "out-of-stock" as const,
      images: product.images,
      features: product.features,
      specifications: product.specifications,
      rating: product.rating,
      reviews: product.reviews,
      inStock: product.inStock,
      createdAt: "2026-05-01T00:00:00Z",
    }));
  },

  // Get single product by ID
  async getProductById(id: string): Promise<ProductFormData | null> {
    // TODO: Replace with actual API call
    // const response = await fetch(`${API_BASE_URL}/products/${id}`);
    // return response.json();

    // Mock implementation
    const product = sampleProducts.find(p => p.id === id);
    if (!product) return null;

    return {
      id: product.id,
      name: product.name,
      sku: `SKU-${product.id}`,
      category: product.category,
      brand: product.category,
      description: product.description,
      fullDescription: product.description,
      price: product.price,
      stockQuantity: product.inStock ? 100 : 0,
      stockStatus: product.inStock ? "in-stock" as const : "out-of-stock" as const,
      images: product.images,
      features: product.features,
      specifications: product.specifications,
      rating: product.rating,
      reviews: product.reviews,
      inStock: product.inStock,
      createdAt: "2026-05-01T00:00:00Z",
    };
  },

  // Create new product
// Create new product
async createProduct(data: ProductFormData): Promise<ProductFormData> {
  const token = localStorage.getItem("auth_token");

  const response = await fetch(
    "http://localhost:8080/api/products/save/product",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(errorMessage || "Failed to create product");
  }

  const newProduct: ProductFormData = await response.json();

  console.log("Product created successfully:", newProduct);

  return newProduct;
},

  // Update existing product
  async updateProduct(id: string, data: ProductFormData): Promise<ProductFormData> {
    // TODO: Replace with actual API call
    // const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data),
    // });
    // return response.json();

    // Mock implementation
    console.log("Update product:", id, data);
    return { ...data, id };
  },

  // Delete product
  async deleteProduct(id: string): Promise<void> {
    // TODO: Replace with actual API call
    // await fetch(`${API_BASE_URL}/products/${id}`, {
    //   method: 'DELETE',
    // });

    // Mock implementation
    console.log("Delete product:", id);
  },

  // Upload image (for future use)
  async uploadImage(file: File): Promise<string> {
    // TODO: Replace with actual image upload
    // const formData = new FormData();
    // formData.append('file', file);
    // const response = await fetch(`${API_BASE_URL}/upload`, {
    //   method: 'POST',
    //   body: formData,
    // });
    // const data = await response.json();
    // return data.url;

    // Mock implementation - returns a placeholder URL
    return URL.createObjectURL(file);
  },
};
