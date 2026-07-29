# Ecommerce Product Module — Architecture Analysis

**Date**: 2026-07-16  
**Scope**: Product catalog, variants, inventory, cart, quotation/invoice flow  
**Compared against**: Shopify, Medusa.js, Saleor, Broadleaf Commerce

---

## 1. Current Architecture

### 1.1 Data Model

```
Category (UUID, self-referencing tree)
    └── NOT linked to Products (Products.category is a plain String)

Products (UUID)
    ├── ProductImage (Long, LONGBLOB byte[])
    ├── ProductFeature (Long, single String)
    ├── ProductSpecification (Long, label + specValue)
    ├── ProductVariant (UUID)
    │       └── Pricing, inventory, attributes all on the variant
    └── ProductReview (Long, no @GeneratedValue!)

Customer (Long)
Quotation (Long) → QuotationItem → snapshot of product data
Invoice (Long) → InvoiceItem → snapshot of product data
```

### 1.2 API Surface

| Endpoint | Auth | Notes |
|----------|------|-------|
| `GET /api/products` | Public | Paged listing with search/filter/sort |
| `GET /api/products/{id}` | Public | Full product detail |
| `GET /api/products/images/{imageId}` | Public | Binary image with 7-day cache |
| `POST /api/products/save/product` | JWT | Multipart form (admin) |
| `DELETE /api/products/delete/product` | JWT | Takes ID as text body |
| `GET /api/quotations/**` | Public | Read quotations |
| `POST /api/quotations` | Public | Create quotation (customer checkout) |
| `PUT/DELETE/PATCH /api/quotations/**` | JWT | Admin operations |

### 1.3 Frontend Architecture

- **React 18 + Vite + TypeScript**, shadcn/ui, Tailwind CSS, motion/react
- **Cart**: Client-side only (React Context + localStorage), no backend persistence
- **Flow**: Product Listing → Product Detail → Add to Cart → Cart → Checkout → Quotation (via `POST /api/quotations`) → Quotation Confirmation
- **Admin**: Separate `/admin` route tree behind `ProtectedRoute` + JWT

### 1.4 What Works Today

- Category → Product → Variant hierarchy renders correctly
- Variant selection updates price/stock/SKU on the detail page
- Server-side search, filtering by category/brand/price/stock, sorting, pagination
- Binary image serving with cache headers (no base64 in JSON)
- Batch primary-image query eliminates N+1 for listing images
- `@EntityGraph` on variants eliminates N+1 for variant loading
- INR formatting with `Intl.NumberFormat("en-IN")` throughout
- Full quotation lifecycle: DRAFT → SENT → ACCEPTED → CONVERTED → Invoice
- GST-aware tax calculation (CGST/SGST/IGST/Cess) in quotations/invoices

---

## 2. Gap Analysis vs. Production Platforms

### 2.1 Product Variants

| Capability | Shopify/Medusa/Saleor | This System | Gap |
|---|---|---|---|
| Option types (Color, Size, etc.) | Dedicated `ProductOption` + `ProductOptionValue` entities | Hard-coded columns: `color`, `size`, `material`, `weight` | Cannot add new attribute types without schema migration |
| Option combinations | Variant = combination of option values, auto-generated | Manual variant creation, no combination logic | Admin must create each variant by hand |
| Variant-level images | Images linked to specific variants | Images linked to product only | Selecting a variant doesn't change the gallery |
| Variant limits | Shopify: 100 variants, Saleor: unlimited | No limit enforced | Not a gap per se, but no validation either |
| SKU uniqueness | Enforced globally | `@Column(unique = true)` on variant only | Product-level SKU has no uniqueness constraint |

### 2.2 Inventory

| Capability | Production Platforms | This System | Gap |
|---|---|---|---|
| Inventory tracking entity | Dedicated `InventoryItem` / `StockLocation` | `stockQuantity` + `stockStatus` as fields on Product AND Variant | No inventory history, no multi-warehouse |
| Stock reservation | Reserves stock on cart/checkout | No reservation at all | Two users can buy the last item simultaneously |
| Stock decrement on order | Automatic on order placement | Never decremented — quotation doesn't touch stock | Stock is display-only |
| Low stock alerts | Configurable thresholds | None | No admin notification when stock runs low |
| Inventory audit trail | Stock movements with reason codes | None | Cannot trace why stock changed |

### 2.3 Pricing

| Capability | Production Platforms | This System | Gap |
|---|---|---|---|
| Price lists / currencies | Multiple price lists, multi-currency | Single price + discountPrice, INR hardcoded | No B2B tiered pricing, no multi-currency storefront |
| Sale / promotion engine | Scheduled promotions, coupon codes | Static `discountPrice` field | No time-based sales, no coupon system |
| Tax calculation | Tax region/zone aware, automatic | `taxPercentage` per variant, manual | No tax zone logic, no automatic HSN→rate mapping |
| Price history | Tracked | None | Cannot audit price changes |

### 2.4 Media / Images

| Capability | Production Platforms | This System | Gap |
|---|---|---|---|
| Storage | Object storage (S3, GCS) with CDN | `LONGBLOB` in MySQL | Images in DB = poor scalability, no CDN, DB backup bloat |
| Image processing | Auto-generate thumbnails, WebP, responsive sizes | Raw upload served as-is | No thumbnails, no format optimization, no srcset |
| Alt text / SEO | Required field | Optional, rarely populated | Accessibility gap |
| Video support | Product videos, 3D models | None | Missing rich media |
| Max file size | Configurable limits | `ImageValidator` exists but details unclear | Need to verify actual limits |

### 2.5 Categorization

| Capability | Production Platforms | This System | Gap |
|---|---|---|---|
| Category ↔ Product FK | Proper FK relationship | `Products.category` = plain String, `Category` entity exists separately | Orphan categories, no referential integrity, no tree navigation |
| Multi-category | Product can belong to multiple categories | Single String field | Product can only be in one category |
| Collection / Tag | Tags, collections, smart collections | None | No cross-cutting product grouping |
| Slug / URL handle | SEO-friendly slugs | None | URLs use UUID (`/products/0bf66925-...`) |

### 2.6 Search

| Capability | Production Platforms | This System | Gap |
|---|---|---|---|
| Full-text search | Elasticsearch / Algolia / MeiliSearch | `LIKE '%query%'` in JPQL | No relevance ranking, no fuzzy matching, poor performance at scale |
| Faceted search | Dynamic facets from product attributes | Brand checkbox + category pills (server provides lists) | No price range facets, no attribute facets |
| Search suggestions | Auto-complete, "did you mean" | None | No typeahead |
| Search analytics | Track queries, click-through | None | Cannot optimize search |

---

## 3. Code Quality Issues

### 3.1 Critical Bugs

| # | Issue | Location | Impact |
|---|---|---|---|
| 1 | **ProductReview has `@Id` but no `@GeneratedValue`** | `ProductReview.java:16` | Inserting a review will fail or require manual ID assignment. Hibernate won't auto-generate the ID. |
| 2 | **ProductReviewCustomerImages has `List<String> imageUrl` without `@ElementCollection`** | `ProductReviewCustomerImages.java` | JPA cannot map a bare `List<String>` to a column — this entity is broken and will cause runtime errors if used. |
| 3 | **`getPagedProductListing` loads ALL products into memory, then filters/paginates in Java** | `ProductService.java:157-213` | With 10K+ products, this will OOM or be extremely slow. Pagination is fake — every request loads the full table. |
| 4 | **No stock validation on quotation creation** | `QuotationServiceImpl.java` | A customer can request 9999 units of an item with only 8 in stock. No quantity-vs-stock check anywhere. |
| 5 | **`POST /api/quotations` is public with no rate limiting** | `SecurityConfig.java:101` | Anyone can spam quotation creation. No CAPTCHA, no throttle, no abuse protection. |

### 3.2 N+1 Query Issues

| # | Issue | Location |
|---|---|---|
| 1 | `reviews` collection lazy-loads per product on `toListingDto` (calls `.size()`) | `ProductService.java:284` |
| 2 | `getProductDetail` fetches a single product by ID — all collections (images, features, specs, variants, reviews) lazy-load as separate queries | `ProductService.java:236-247` |
| 3 | `toDetailDto` iterates `images`, `features`, `specifications`, `variants`, `reviews` — each triggers a lazy load | `ProductService.java:306-388` |
| 4 | `getProductListing` (non-paged) and `getPagedProductListing` don't fetch reviews eagerly but access them in mapping | `ProductService.java:143-154, 162-167` |

### 3.3 Missing Validation

| # | What's Missing | Where |
|---|---|---|
| 1 | Product `price` has `@DecimalMin` but no `@NotNull` — price can be null | `ProductRequestDto.java:44` |
| 2 | Product `stockQuantity` has `@Min(0)` but no `@NotNull` | `ProductRequestDto.java:51` |
| 3 | No validation on `stockStatus` values — any string accepted | `ProductRequestDto.java:53`, `ProductVariantRequestDto.java` |
| 4 | `DELETE /api/products/delete/product` takes a raw text body as the ID — no path variable, no input sanitization | `ProductController.java` |
| 5 | No `@Size` constraint on product `description` field at entity level | `Products.java` |
| 6 | Checkout form allows any string as phone number — no format validation backend or frontend | `CustomerDto.java:22`, `checkout.tsx` |
| 7 | GST number format not validated (should match `\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z\d]`) | `CustomerDto.java:26` |

### 3.4 Transaction Boundaries

| # | Issue | Location |
|---|---|---|
| 1 | `ProductService.getPagedProductListing` is NOT `@Transactional` — lazy collections may fail with `LazyInitializationException` outside of a transaction | `ProductService.java:157` |
| 2 | `ProductService.getProductListing` is NOT `@Transactional` — same risk | `ProductService.java:143` |
| 3 | `ProductService.getProductDetail` is NOT `@Transactional` — lazy loads in `toDetailDto` may fail | `ProductService.java:236` |
| 4 | Only `productRegister` has `@Transactional` in ProductService | `ProductService.java:45` |

### 3.5 Pagination

| # | Issue | Location |
|---|---|---|
| 1 | `getPagedProductListing` loads ALL rows then does `subList(fromIndex, toIndex)` — Java-side pagination, not SQL `LIMIT/OFFSET` | `ProductService.java:210-213` |
| 2 | `getProductListing` returns ALL products with no pagination at all | `ProductService.java:143` |
| 3 | No `Pageable` / Spring Data pagination used anywhere in `ProductsRepository` | `ProductsRepository.java` |

### 3.6 Miscellaneous

| # | Issue | Location |
|---|---|---|
| 1 | Inconsistent Lombok usage — some entities use `@Data/@Builder`, others have manual getters/setters (Invoice, InvoiceItem, CustomerDto, User) | Throughout |
| 2 | `Products` entity is named plural (should be `Product`) | `Products.java` |
| 3 | `API_BASE_URL` hardcoded to `localhost:8080` in `checkout.tsx` and `quotation-confirmation.tsx` — won't work in production | Frontend files |
| 4 | Cart uses `localStorage` only — lost on browser clear, no cross-device sync | `cart-context.tsx` |
| 5 | `updateProduct` in `productService.ts` is a mock that returns the input — never actually calls the backend | `productService.ts:139-145` |
| 6 | `uploadImage` in `productService.ts` is a mock returning `URL.createObjectURL` | `productService.ts:148-158` |
| 7 | `@CrossOrigin` on `QuotationController` duplicates the global CORS config in `SecurityConfig` — may cause conflicts | `QuotationController.java:17` |
| 8 | No global exception handler — uncaught exceptions return Spring's default error JSON, not `ApiResponse` | No `@ControllerAdvice` found |
| 9 | Variant images stored as `productImage` String on QuotationItem — unclear what this references | `QuotationItemDto.java:28` |

---

## 4. Prioritized Gap List

### P0 — Blocking Production

| # | Gap | Why It Blocks |
|---|---|---|
| P0-1 | **Fake pagination** — loads entire product table into memory | Will OOM with realistic catalog size (1K+ products). Must use Spring Data `Pageable` with SQL-level pagination. |
| P0-2 | **No `@Transactional` on read methods** | `LazyInitializationException` will crash product listing/detail pages unpredictably once the OpenEntityManagerInView filter is disabled (it should be disabled in production). |
| P0-3 | **ProductReview missing `@GeneratedValue`** | Reviews cannot be created through JPA — the insert will fail. Dead feature. |
| P0-4 | **Images stored as LONGBLOB in MySQL** | DB will grow to gigabytes fast. Backup/restore becomes painful. No CDN, no caching at edge. Must migrate to object storage (S3/MinIO). |
| P0-5 | **No stock validation or reservation** | Customers can order quantities exceeding available stock. Overselling is guaranteed under concurrent load. |
| P0-6 | **Public `POST /api/quotations` with no abuse protection** | Bot can create millions of quotations. No rate limit, no CAPTCHA, no authentication required. |
| P0-7 | **Category not linked to Product entity** | Plain String field means no referential integrity, no cascading operations, no tree-based navigation. Renaming a category doesn't update products. |

### P1 — Important for Production Quality

| # | Gap | Impact |
|---|---|---|
| P1-1 | **N+1 queries on product detail page** | Each product detail request fires 5+ SQL queries. Acceptable for low traffic but will degrade quickly. |
| P1-2 | **No SEO-friendly URLs** (products use UUID) | Poor discoverability, ugly URLs, bad for Google indexing. Need slug field. |
| P1-3 | **Hard-coded variant attributes** (color, size, material, weight) | Cannot sell products with other attributes (e.g., voltage, capacity, flavor) without schema changes. |
| P1-4 | **No product update API** | `updateProduct` in frontend is a mock. Admin cannot edit products after creation. |
| P1-5 | **No global exception handler** (`@ControllerAdvice`) | Unhandled errors return raw Spring error pages, not structured `ApiResponse` JSON. |
| P1-6 | **`stockStatus` is a free-text String** | No enum validation — values like "in-stock", "In Stock", "IN_STOCK" would all be different. |
| P1-7 | **Hardcoded `localhost:8080`** in frontend files | Won't work when deployed. Need environment variable / Vite proxy. |
| P1-8 | **No order entity** | System goes Product → Quotation → Invoice but there's no Order concept. Cannot track fulfillment, shipping, returns. |
| P1-9 | **Missing `@NotNull` on price and stockQuantity** in ProductRequestDto | Products can be created without a price. |

### P2 — Nice to Have

| # | Gap | Benefit |
|---|---|---|
| P2-1 | Full-text search (Elasticsearch/MeiliSearch) | Relevance ranking, fuzzy matching, typo tolerance |
| P2-2 | Variant-level images | Gallery changes when user selects a color variant |
| P2-3 | Image optimization pipeline (thumbnails, WebP, srcset) | Faster page loads, better Core Web Vitals |
| P2-4 | Multi-currency support | Serve international customers |
| P2-5 | Promotion / coupon engine | Run sales, offer discount codes |
| P2-6 | Wishlist backend persistence | Currently a non-functional button |
| P2-7 | Server-side cart (for logged-in users) | Cross-device cart sync, abandoned cart recovery |
| P2-8 | Product tags / collections | Cross-cutting product grouping beyond categories |
| P2-9 | Review submission API + moderation | Currently no way for customers to leave reviews |
| P2-10 | Inventory audit trail | Track stock movements with reason codes |
| P2-11 | Consistent Lombok usage across all entities/DTOs | Code consistency, less boilerplate |
| P2-12 | Product slug / URL handle | SEO-friendly URLs like `/products/macbook-pro-16` |

---

## 5. Recommended Execution Order

If addressing these gaps, the suggested order is:

1. **P0-2 + P0-1**: Add `@Transactional(readOnly = true)` to read methods + migrate to Spring Data `Pageable` with real SQL pagination. These are the same area of code and should be done together.
2. **P0-3**: Add `@GeneratedValue(strategy = IDENTITY)` to ProductReview.
3. **P0-7**: Make `Products.category` a `@ManyToOne` FK to `Category`, migrate existing String data.
4. **P0-5**: Add stock validation on quotation item creation, implement stock reservation with TTL.
5. **P0-6**: Add rate limiting to public quotation endpoint (Spring Boot Bucket4j or similar).
6. **P0-4**: Migrate image storage to MinIO/S3 with a URL-based reference model.
7. **P1-5 + P1-6 + P1-9**: Add `@ControllerAdvice`, enum for stock status, required-field validation — all quick wins.
8. **P1-4**: Implement product update API (`PUT /api/products/{id}`).
9. **P1-3**: Refactor variants to use dynamic `ProductOption` + `ProductOptionValue` pattern.
10. **P1-8**: Design and implement Order entity + fulfillment workflow.
