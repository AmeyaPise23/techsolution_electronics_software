export interface VariantChip {
  id: string;
  name: string;
  price: number;
  stockStatus: string;
}

export interface ProductListingItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  sku: string;
  price: number;
  discountPrice?: number;
  rating: number;
  reviewCount: number;
  stockQuantity: number;
  stockStatus: string;
  primaryImageId: number | null;
  startingPrice: number;
  variantCount: number;
  variants: VariantChip[];
}

export interface FilterOptions {
  brands: string[];
  categories: string[];
}

export interface PagedProductResponse {
  products: ProductListingItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  filters: FilterOptions;
}

export interface ProductListingParams {
  q?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: string;
  page?: number;
  size?: number;
}

export interface ProductDetailImage {
  id: number;
  fileName: string;
  primary: boolean;
  sortOrder: number;
  altText: string | null;
}

export interface ProductDetailVariant {
  id: string;
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
  currency: string;
  taxInclusive: boolean;
  stockQuantity: number;
  stockStatus: string;
  active: boolean;
}

export interface ProductDetailReview {
  id: number;
  name: string;
  rating: number;
  reviewDate: string;
  comment: string;
}

export interface ProductDetail {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  description: string;
  fullDescription: string;
  price: number;
  discountPrice: number | null;
  taxPercentage: number | null;
  rating: number;
  reviewCount: number;
  stockQuantity: number;
  stockStatus: string;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  images: ProductDetailImage[];
  features: string[];
  specifications: { label: string; value: string }[];
  variants: ProductDetailVariant[];
  reviews: ProductDetailReview[];
}

export interface ProductFormData {
  id?: string;
  name: string;
  sku: string;
  category: string;
  subcategory?: string;
  brand: string;
  description: string;
  fullDescription: string;
  price: number;
  purchasePrice?: number;
  landingCost?: number;
  mrp?: number;
  discountPrice?: number;
  taxPercentage?: number;
  hsnCode?: string;
  currency?: string;
  taxInclusive?: boolean;
  stockQuantity: number;
  stockStatus: "in-stock" | "out-of-stock" | "pre-order";
  image?: string;
  imageFile?: File;
  images: string[];
  galleryImageFiles?: File[];
  features: string[];
  specifications: { label: string; value: string }[];
  metaTitle?: string;
  metaDescription?: string;
  rating?: number;
  reviews?: number;
  inStock?: boolean;
  createdAt?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface BackendProductImage {
  imageData?: string;
  fileName?: string;
  contentType?: string;
  primary?: boolean;
  sortOrder?: number;
}

interface BackendProductFeature {
  feature?: string;
}

interface BackendProductSpecification {
  label?: string;
  specValue?: string;
  value?: string;
}

interface BackendProduct {
  id?: string;
  name?: string;
  sku?: string;
  category?: string;
  brand?: string;
  description?: string;
  fullDescription?: string;
  price?: number | string;
  purchasePrice?: number | string;
  landingCost?: number | string;
  mrp?: number | string;
  discountPrice?: number | string;
  taxPercentage?: number;
  hsnCode?: string;
  currency?: string;
  taxInclusive?: boolean;
  rating?: number;
  stockQuantity?: number;
  stockStatus?: ProductFormData["stockStatus"] | string;
  image?: string;
  images?: BackendProductImage[];
  features?: BackendProductFeature[];
  specifications?: BackendProductSpecification[];
  metaTitle?: string;
  metaDescription?: string;
  createdAt?: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";

const PRODUCT_LIST_URL = `${API_BASE_URL}/products/products/list.json`;
const PRODUCT_LISTING_URL = `${API_BASE_URL}/products`;
const PRODUCT_CREATE_URL = `${API_BASE_URL}/products/save/product`;
const PRODUCT_DELETE_URL = `${API_BASE_URL}/products`;

export function getProductImageUrl(imageId: number | null): string {
  if (!imageId) return "";
  return `${API_BASE_URL}/products/images/${imageId}`;
}

function toNumber(value: number | string | undefined, fallback = 0): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function toStockStatus(status: string | undefined): ProductFormData["stockStatus"] {
  if (status === "out-of-stock" || status === "pre-order") return status;
  return "in-stock";
}

function toImageSource(image?: BackendProductImage): string | undefined {
  if (!image?.imageData) return undefined;
  return `data:${image.contentType || "image/jpeg"};base64,${image.imageData}`;
}

function mapBackendProduct(product: BackendProduct): ProductFormData {
  const sortedImages = [...(product.images ?? [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );
  const imageSources = sortedImages
    .map(toImageSource)
    .filter((image): image is string => Boolean(image));
  const primaryImage =
    toImageSource(sortedImages.find((image) => image.primary)) ||
    imageSources[0] ||
    product.image ||
    "";
  const stockStatus = toStockStatus(product.stockStatus);
  const stockQuantity = product.stockQuantity ?? 0;

  return {
    id: product.id,
    name: product.name ?? "",
    sku: product.sku ?? "",
    category: product.category ?? "",
    brand: product.brand ?? "",
    description: product.description ?? "",
    fullDescription: product.fullDescription ?? "",
    price: toNumber(product.price),
    purchasePrice:
      product.purchasePrice === undefined ? undefined : toNumber(product.purchasePrice),
    landingCost:
      product.landingCost === undefined ? undefined : toNumber(product.landingCost),
    mrp: product.mrp === undefined ? undefined : toNumber(product.mrp),
    discountPrice:
      product.discountPrice === undefined
        ? undefined
        : toNumber(product.discountPrice),
    taxPercentage: product.taxPercentage,
    hsnCode: product.hsnCode,
    currency: product.currency,
    taxInclusive: product.taxInclusive,
    stockQuantity,
    stockStatus,
    image: primaryImage,
    images: imageSources.length > 0 ? imageSources : primaryImage ? [primaryImage] : [],
    features: (product.features ?? [])
      .map((feature) => feature.feature)
      .filter((feature): feature is string => Boolean(feature)),
    specifications: (product.specifications ?? [])
      .map((specification) => ({
        label: specification.label ?? "",
        value: specification.value ?? specification.specValue ?? "",
      }))
      .filter((specification) => specification.label || specification.value),
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    rating: product.rating ?? 0,
    reviews: 0,
    inStock: stockStatus === "in-stock" && stockQuantity > 0,
    createdAt: product.createdAt,
  };
}

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

function buildProductFormData(data: ProductFormData): FormData {
  const formData = new FormData();

  formData.append("name", data.name);
  formData.append("sku", data.sku);
  formData.append("category", data.category);
  formData.append("brand", data.brand || "");
  formData.append("description", data.description);
  formData.append("fullDescription", data.fullDescription || "");

  if (data.metaTitle) {
    formData.append("metaTitle", data.metaTitle);
  }

  if (data.metaDescription) {
    formData.append("metaDescription", data.metaDescription);
  }

  if (data.imageFile) {
    formData.append("image", data.imageFile);
  }

  data.galleryImageFiles?.forEach((file) => {
    formData.append("galleryImages", file);
  });

  data.features.forEach((feature, index) => {
    formData.append(`features[${index}]`, feature);
  });

  data.specifications.forEach((specification, index) => {
    formData.append(`specifications[${index}].label`, specification.label);
    formData.append(`specifications[${index}].value`, specification.value);
  });

  return formData;
}

export const productService = {
  async getProductListing(params?: ProductListingParams): Promise<PagedProductResponse> {
    const url = new URL(PRODUCT_LISTING_URL);
    if (params) {
      if (params.q) url.searchParams.set("q", params.q);
      if (params.category) url.searchParams.set("category", params.category);
      if (params.brand) url.searchParams.set("brand", params.brand);
      if (params.minPrice != null) url.searchParams.set("minPrice", String(params.minPrice));
      if (params.maxPrice != null) url.searchParams.set("maxPrice", String(params.maxPrice));
      if (params.inStock != null) url.searchParams.set("inStock", String(params.inStock));
      if (params.sort) url.searchParams.set("sort", params.sort);
      if (params.page != null) url.searchParams.set("page", String(params.page));
      if (params.size != null) url.searchParams.set("size", String(params.size));
    }
    const response = await fetch(url.toString());
    return parseApiResponse<PagedProductResponse>(response);
  },

  async getAllProducts(): Promise<ProductFormData[]> {
    return this.listProducts();
  },

  async getProductDetail(id: string): Promise<ProductDetail> {
    const response = await fetch(`${PRODUCT_LISTING_URL}/${id}`);
    return parseApiResponse<ProductDetail>(response);
  },

  async getProductById(id: string): Promise<ProductFormData | null> {
    const products = await this.getAllProducts();
    return products.find((product) => product.id === id) ?? null;
  },

  async createProduct(data: ProductFormData): Promise<ProductFormData> {
    const token = localStorage.getItem("auth_token");
    const formData = buildProductFormData(data);

    const response = await fetch(PRODUCT_CREATE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const product = await parseApiResponse<BackendProduct>(response);
    return mapBackendProduct(product);
  },

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

  async deleteProduct(id: string): Promise<void> {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(`${PRODUCT_DELETE_URL}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    await parseApiResponse<ApiResponse<void>>(response);
  },

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

  async listProducts(): Promise<ProductFormData[]> {
    const response = await fetch(PRODUCT_LIST_URL);
    const products = await parseApiResponse<BackendProduct[]>(response);
    return products.map(mapBackendProduct);
  },
};
