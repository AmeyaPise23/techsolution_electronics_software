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
const PRODUCT_CREATE_URL = `${API_BASE_URL}/products/save/product`;
const PRODUCT_DELETE_URL = `${API_BASE_URL}/products/delete/product`;

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
  formData.append("price", String(data.price));
  formData.append("stockQuantity", String(data.stockQuantity));
  formData.append("stockStatus", data.stockStatus);

  if (data.purchasePrice !== undefined) {
    formData.append("purchasePrice", String(data.purchasePrice));
  }

  if (data.landingCost !== undefined) {
    formData.append("landingCost", String(data.landingCost));
  }

  if (data.mrp !== undefined) {
    formData.append("mrp", String(data.mrp));
  }

  if (data.discountPrice !== undefined) {
    formData.append("discountPrice", String(data.discountPrice));
  }

  if (data.taxPercentage !== undefined) {
    formData.append("taxPercentage", String(data.taxPercentage));
  }

  if (data.hsnCode) {
    formData.append("hsnCode", data.hsnCode);
  }

  if (data.currency) {
    formData.append("currency", data.currency);
  }

  if (data.taxInclusive !== undefined) {
    formData.append("taxInclusive", String(data.taxInclusive));
  }

  if (data.rating !== undefined) {
    formData.append("rating", String(data.rating));
  }

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
  async getAllProducts(): Promise<ProductFormData[]> {
    return this.listProducts();
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
    const response = await fetch(PRODUCT_DELETE_URL, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
      body: id,
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
