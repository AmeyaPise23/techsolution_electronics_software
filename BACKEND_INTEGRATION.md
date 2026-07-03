# Backend Integration Guide

This document explains how to integrate the Admin Product Management system with your backend API.

## Overview

The frontend is fully functional and ready for backend integration. All API calls are centralized in the `productService.ts` file, making it easy to connect to your backend.

## Integration Steps

### 1. Update API Base URL

Open `src/app/services/productService.ts` and update the `API_BASE_URL` constant:

```typescript
const API_BASE_URL = "https://your-backend-api.com/api";
```

### 2. API Endpoints Required

Your backend should implement the following REST API endpoints:

#### Get All Products
```
GET /products
Response: ProductFormData[]
```

#### Get Single Product
```
GET /products/:id
Response: ProductFormData
```

#### Create Product
```
POST /products
Body: ProductFormData
Response: ProductFormData (with generated ID)
```

#### Update Product
```
PUT /products/:id
Body: ProductFormData
Response: ProductFormData
```

#### Delete Product
```
DELETE /products/:id
Response: 204 No Content
```

#### Upload Image (Optional)
```
POST /upload
Body: FormData with file
Response: { url: string }
```

### 3. Data Structure

Your backend should handle products with the following TypeScript interface:

```typescript
interface ProductFormData {
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
```

### 4. Uncomment API Calls

In `src/app/services/productService.ts`, uncomment the actual API calls and remove the mock implementations:

**Before:**
```typescript
async getAllProducts(): Promise<ProductFormData[]> {
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_BASE_URL}/products`);
  // return response.json();
  
  return []; // Mock
}
```

**After:**
```typescript
async getAllProducts(): Promise<ProductFormData[]> {
  const response = await fetch(`${API_BASE_URL}/products`);
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
}
```

### 5. Add Authentication (Optional)

If your backend requires authentication, add headers to all fetch calls:

```typescript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getAuthToken()}`,
};

const response = await fetch(`${API_BASE_URL}/products`, { headers });
```

### 6. Error Handling

The frontend already includes error handling with toast notifications. Ensure your backend returns proper HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Server Error

### 7. Image Upload Integration

For image uploads, implement the `uploadImage` function:

```typescript
async uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });
  
  const data = await response.json();
  return data.url; // Return the uploaded image URL
}
```

## Testing

1. Start your backend server
2. Update the `API_BASE_URL` in `productService.ts`
3. Uncomment the API calls
4. Navigate to `/admin/products` in the app
5. Test CRUD operations

## Features Already Implemented

✅ Product form with all required fields
✅ Form validation
✅ Image preview
✅ Dynamic features and specifications
✅ Search and filter functionality
✅ Toast notifications
✅ Loading states
✅ Responsive design
✅ Delete confirmation dialogs
✅ Mobile-friendly admin panel

## Admin Panel Routes

- `/admin` - Dashboard
- `/admin/products` - Product Management
- `/admin/orders` - Orders (placeholder)
- `/admin/settings` - Settings (placeholder)

## Navigation

- Admin panel accessible via navbar icon (LayoutDashboard)
- Sidebar navigation within admin panel
- Mobile-responsive with hamburger menu

## Notes

- All products created through the admin panel will automatically appear on the public Products page (`/products`)
- The form includes all requested fields: SKU, category, brand, pricing, inventory, images, features, specifications, and SEO
- Image URLs can be pasted directly (cloud storage URLs)
- Future enhancement: Replace URL input with actual file upload using the `uploadImage` function
