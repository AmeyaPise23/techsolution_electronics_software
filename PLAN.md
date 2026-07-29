# Implementation Plan — Production-Ready Product Module

**Date**: 2026-07-16 | **Revised**: 2026-07-17  
**Prerequisite**: Read [ANALYSIS.md](ANALYSIS.md) first.  
**Architecture constraint**: B2B quotation-based system. INR only.  
**Migration strategy**: Introduce Flyway (currently `ddl-auto=update`, no migration tool).

> **Convention**: Each milestone has its own git branch off `main`. Merge to
> `main` only after all tests pass and manual checklist is verified.

---

## Pre-work: Adopt Flyway

Before M1, Flyway must be set up so all subsequent schema changes are versioned.

### Steps

1. Add `org.flywaydb:flyway-core` + `org.flywaydb:flyway-mysql` to `pom.xml`
   (note: `spring-boot-starter-flyway` is not a real artifact).
2. Set properties in `application.properties`:
   ```properties
   spring.flyway.enabled=true
   spring.flyway.baseline-on-migrate=true
   spring.flyway.baseline-version=1
   ```
3. Change `spring.jpa.hibernate.ddl-auto` from `update` to `validate` — Hibernate
   will verify entities match the schema but never auto-alter tables.
4. Create `backend/src/main/resources/db/migration/` directory.
5. `V1__baseline.sql` must contain the **FULL current schema** (all CREATE TABLE
   statements), not be empty. This ensures fresh databases (CI, Testcontainers,
   new dev machines) can build the complete schema from scratch, since
   `ddl-auto=validate` creates nothing.

### Generating V1__baseline.sql

```bash
mysqldump --no-data --skip-comments --skip-add-drop-table \
  -u root -p techsolution > V1__baseline.sql
```

Then manually clean up: remove `AUTO_INCREMENT=N` values, add `IF NOT EXISTS`
guards, and append the seed data (admin user insert from `data.sql`).

On an **existing** database, Flyway's `baseline-on-migrate=true` with
`baseline-version=1` marks V1 as already applied (skips it). On a **fresh**
database, Flyway runs V1 to create everything.

### Risk

Switching from `ddl-auto=update` to `validate` means any entity/schema mismatch
will fail on startup. Must verify boot on BOTH an existing DB and a fresh empty DB.

### Verification

Must prove both:
1. App starts cleanly against the **existing** database (Flyway baselines, skips V1).
2. App starts cleanly against a **completely fresh empty** database (Flyway runs V1).

---

## M1: Foundations

**Branch**: `m1/foundations`  
**Addresses**: P0-1, P0-2, P0-3, P1-5, P1-6, P1-9, ANALYSIS §3.1 #1-2, §3.3 #1-4, §3.4, §3.5

### Schema changes

**`V2__m1_foundations.sql`**:

```sql
-- 1. Fix ProductReview: add auto-increment
ALTER TABLE product_reviews MODIFY id BIGINT NOT NULL AUTO_INCREMENT;

-- 2. Fix ProductReviewCustomerImages: add join table for List<String>
CREATE TABLE review_customer_image_urls (
    review_image_id BIGINT NOT NULL,
    image_url VARCHAR(2048) NOT NULL,
    FOREIGN KEY (review_image_id) REFERENCES product_review_customer_images(id)
        ON DELETE CASCADE
);

-- 3. Normalize stock_status values to enum-compatible format
UPDATE products SET stock_status = 'IN_STOCK' WHERE LOWER(stock_status) LIKE '%in%stock%';
UPDATE products SET stock_status = 'OUT_OF_STOCK' WHERE LOWER(stock_status) LIKE '%out%';
UPDATE products SET stock_status = 'PRE_ORDER' WHERE LOWER(stock_status) LIKE '%pre%order%';
UPDATE products SET stock_status = 'IN_STOCK' WHERE stock_status IS NULL;

UPDATE product_variants SET stock_status = 'IN_STOCK' WHERE LOWER(stock_status) LIKE '%in%stock%';
UPDATE product_variants SET stock_status = 'OUT_OF_STOCK' WHERE LOWER(stock_status) LIKE '%out%';
UPDATE product_variants SET stock_status = 'PRE_ORDER' WHERE LOWER(stock_status) LIKE '%pre%order%';
UPDATE product_variants SET stock_status = 'IN_STOCK' WHERE stock_status IS NULL;

-- 4. Backfill null price and stock_quantity
UPDATE products SET price = 0 WHERE price IS NULL;
UPDATE products SET stock_quantity = 0 WHERE stock_quantity IS NULL;
```

### Entities / DTOs touched

| File | Change |
|------|--------|
| `ProductReview.java` | Add `@GeneratedValue(strategy = IDENTITY)` to `id`. Add `@JsonIgnore` on `product` field. |
| `ProductReviewCustomerImages.java` | Add `@ElementCollection` + `@CollectionTable(name = "review_customer_image_urls", joinColumns = @JoinColumn(name = "review_image_id"))` on `imageUrl`. Add Lombok annotations. |
| `StockStatus.java` (NEW enum) | `IN_STOCK`, `OUT_OF_STOCK`, `PRE_ORDER`, `DISCONTINUED`. With `@JsonValue` for lowercase-hyphenated serialization (`in-stock`, etc.) and `@JsonCreator` for deserialization. |
| `StockStatusConverter.java` (NEW) | `Converter<String, StockStatus>` registered via `WebMvcConfigurer` for multipart form binding. `@JsonValue`/`@JsonCreator` alone won't work for `@ModelAttribute` form binding — Spring MVC uses Converters, not Jackson, for form data. |
| `Products.java` | Change `stockStatus` from `String` to `@Enumerated(EnumType.STRING) StockStatus`. |
| `ProductVariant.java` | Same `stockStatus` → `StockStatus` change. |
| `ProductRequestDto.java` | Add `@NotNull` to `price` and `stockQuantity`. Change `stockStatus` to `StockStatus` type. |

### API changes

| Endpoint | Change |
|----------|--------|
| `GET /api/products` | Now uses real SQL `LIMIT/OFFSET` via Spring Data `Pageable`. Response shape **unchanged** (`PagedProductResponse`). |
| `DELETE /api/products/delete/product` | **Changed to** `DELETE /api/products/{id}`. Path variable instead of text body. |
| All error responses | Now return `ApiResponse<Void>` with `success: false` and `message` field via `@ControllerAdvice`. HTTP status codes preserved. |

### Backend implementation

1. **`@Transactional(readOnly = true)`** — Add to `ProductService` at class level for read methods. Keep `@Transactional` (writable) on `productRegister`.

2. **Real pagination** — Rewrite `ProductsRepository`:
   - Add `Page<Products> findAll(Specification<Products> spec, Pageable pageable)` by extending `JpaSpecificationExecutor<Products>`.
   - Create `ProductSpecification.java` — builds `Specification<Products>` from search/category/brand/price/inStock params. Joins `variants` for search.
   - Remove `findAllWithVariants()` and `searchWithVariants()` (full-table-load methods).
   - Rewrite `getPagedProductListing` to pass `Pageable` + `Specification` to the repository. The `@EntityGraph(attributePaths = {"variants"})` moves to the `findAll(Specification, Pageable)` override.
   - For filter options (brands/categories), keep the existing `findDistinctBrands()`/`findDistinctCategories()` queries — they're cheap aggregate queries.

3. **`@ControllerAdvice`** — New `GlobalExceptionHandler.java`:
   - `ResourceNotFoundException` → 404
   - `QuotationValidationException` / `MethodArgumentNotValidException` → 400
   - `FileStorageException` → 500
   - Generic `Exception` → 500
   - All return `ApiResponse<Void>` with `success: false`.

4. **Delete endpoint** — Change `ProductController`:
   ```java
   // Before: @DeleteMapping("/delete/product") + @RequestBody String productId
   // After:  @DeleteMapping("/{id}") + @PathVariable String id
   ```

### Tests to write

| Test | What it verifies |
|------|------------------|
| `ProductServiceTest.getPagedProductListing_withFilters` | SQL-level pagination returns correct page; total count matches filter. |
| `ProductServiceTest.getPagedProductListing_searchByName` | LIKE search via Specification hits DB, not Java. |
| `ProductServiceTest.getProductDetail_notFound` | Returns 404 `ApiResponse` with `success: false`. |
| `ProductControllerTest.deleteProduct_pathVariable` | `DELETE /api/products/{id}` works; old URL 404s. |
| `GlobalExceptionHandlerTest` | Each exception type maps to correct HTTP status + `ApiResponse` shape. |
| `ProductReviewRepositoryTest.save` | Auto-generates `id` on insert. |
| `StockStatusSerializationTest` | `IN_STOCK` serializes to `"in-stock"` in JSON AND binds from `"in-stock"` in form data via the Converter. |

### Frontend impact

| File | Change needed |
|------|---------------|
| `productService.ts` | Update `PRODUCT_DELETE_URL` from `…/delete/product` to `…/products/${id}`. Change `deleteProduct()` to send `DELETE /api/products/${id}` with no body. Remove `Content-Type: text/plain` header. |
| `productService.ts` | `stockStatus` string values stay the same (`in-stock`, `out-of-stock`, `pre-order`) because the enum uses `@JsonValue` — **no frontend type changes needed**. |
| Error handling (all pages) | Error responses now always have `{ success: false, message: "..." }` shape — frontend's existing `parseApiResponse` already handles this. No change. |

### Breakage risk

**Medium** — The delete endpoint URL change is breaking. The frontend must be
updated in the same deploy. All other changes are backward-compatible.

### Manual verification checklist

- [ ] `GET /api/products?page=0&size=2` returns exactly 2 products and correct `totalElements`
- [ ] `GET /api/products?q=test&page=0&size=10` searches at SQL level (check `show-sql` log for `LIMIT`)
- [ ] `GET /api/products?category=SomeCategory&brand=SomeBrand` filters correctly
- [ ] `GET /api/products/{id}` returns full detail with variants, images, reviews
- [ ] `GET /api/products/nonexistent-uuid` returns 404 with `{ success: false, message: "..." }`
- [ ] `DELETE /api/products/{id}` deletes the product (admin JWT required)
- [ ] Insert a `ProductReview` via SQL console — `id` auto-increments
- [ ] Frontend product listing loads, paginated, filters work
- [ ] Frontend admin product delete works with new URL
- [ ] `StockStatus` values render correctly in frontend (`in-stock` badge)

---

## M2: Category FK + Slugs

**Branch**: `m2/category-fk-slugs`  
**Addresses**: P0-7, P1-2

### Schema changes

Strictly ordered migration chain (Flyway Java migrations use underscore naming):

**`V3__m2_add_slug_and_category_id_columns.sql`**:

```sql
-- Add nullable slug columns
ALTER TABLE products ADD COLUMN slug VARCHAR(300);
ALTER TABLE categories ADD COLUMN slug VARCHAR(300);

-- Add nullable category_id FK column (constraint added AFTER data migration)
ALTER TABLE products ADD COLUMN category_id VARCHAR(255);

-- Unique indexes (added after data population in V3_3)
```

**`V3_1__GenerateSlugs.java`** (Flyway Java migration):
- Product slug = `slugify(name) + "-" + first8CharsOfUUID`.
- Category slug = `slugify(name)`.
- Handles duplicates with numeric suffix.
- Idempotent: skips rows that already have slugs.

**`V3_2__MigrateCategoryFk.java`** (Flyway Java migration):
- `SELECT DISTINCT category FROM products WHERE category IS NOT NULL`
- For each: case-insensitive match to `categories.name`. If none found, auto-create
  a new Category row and log it.
- `UPDATE products SET category_id = ? WHERE LOWER(category) = LOWER(?)`

**`V3_3__m2_add_constraints.sql`**:

```sql
-- Add FK constraint (data is now populated)
ALTER TABLE products ADD CONSTRAINT fk_product_category
    FOREIGN KEY (category_id) REFERENCES categories(id);

-- Add unique indexes on slugs
ALTER TABLE products ADD UNIQUE INDEX uq_product_slug (slug);
ALTER TABLE categories ADD UNIQUE INDEX uq_category_slug (slug);
```

**Note**: The legacy `products.category` String column is NOT dropped. It is
mapped `insertable=false, updatable=false` in the entity — no `@PostLoad`
(avoids dirty-checking risk causing spurious UPDATEs). Category name is derived
in the DTO mapper from `categoryEntity.getName()`, falling back to the legacy
column if the FK is null.

### Entities / DTOs touched

| File | Change |
|------|--------|
| `Products.java` | Add `@ManyToOne(fetch = LAZY) @JoinColumn(name = "category_id") Category categoryEntity`. Add `String slug`. Legacy `String category` field gains `@Column(insertable = false, updatable = false)`. |
| `Category.java` | Add `String slug`. |
| `ProductRequestDto.java` | Change `category` from `@NotBlank String` to `@NotBlank String categoryId` (UUID). |
| `ProductListingDto.java` | Add `String slug`, `String categorySlug`. Keep `String category` (name). |
| `ProductDetailDto.java` | Add `String slug`, `String categoryId`, `String categorySlug`. |
| `CategoryResponseDto.java` | Add `String slug`. |
| DTO mapper | Derive `category` name from `categoryEntity.getName()`, fall back to legacy `category` column if FK is null. |

### API changes

| Endpoint | Change |
|----------|--------|
| `GET /api/products/{idOrSlug}` | Accept UUID **or** slug. Service tries `findById` first, falls back to `findBySlug`. |
| `GET /api/categories` | Response now includes `slug` per category. |
| `POST /api/products/save/product` | `category` field becomes `categoryId` (UUID reference). |
| `GET /api/products` | Filter param `category` now accepts category slug **or** name (backward compat). Response includes `slug` and `categorySlug` per product. |

### Tests to write

| Test | What it verifies |
|------|------------------|
| `ProductServiceTest.getProductDetail_bySlug` | Slug lookup returns same product as UUID lookup. |
| `ProductServiceTest.createProduct_withCategoryId` | FK is set, category name populated. |
| `ProductServiceTest.createProduct_invalidCategoryId` | Returns 400 with message. |
| `CategorySlugMigrationTest` | V3_1 creates slugs for all existing categories. |
| `CategoryFkMigrationTest` | V3_2 populates category_id; handles duplicate names, NULL category, unmatched strings. |
| `ProductSlugUniquenessTest` | Two products with same name get different slugs. |

### Frontend impact

| File | Change needed |
|------|---------------|
| `productService.ts` | Add `slug` to `ProductListingItem` and `ProductDetail` types. |
| `products.tsx` | Product card links use `/products/${slug}` instead of UUID. Keep UUID as fallback. |
| `product-details.tsx` | Fetch by `idOrSlug` param — works with both UUID and slug URLs. |
| `productService.ts` → `createProduct()` | Send `categoryId` (UUID) instead of `category` (string). |
| Admin product form | Category field → `<Select>` populated from `GET /api/categories`, sending UUID. |
| `routes.tsx` | `products/:id` → `products/:idOrSlug`. |

### Breakage risk

**High** — The `category` → `categoryId` change in `POST /api/products` breaks
the admin product creation form. Frontend must be updated simultaneously.
Storefront (read-only) is not affected.

### Manual verification checklist

- [ ] Existing products have `category_id` populated after migration
- [ ] `SELECT COUNT(*) FROM products WHERE category_id IS NULL` → 0
- [ ] `GET /api/products?category=electronics` still works (by name)
- [ ] `GET /api/products/some-product-slug` returns the product
- [ ] `GET /api/products/uuid-here` still works
- [ ] `POST /api/products/save/product` with `categoryId` creates product with FK
- [ ] `POST /api/products/save/product` with invalid `categoryId` returns 400
- [ ] Frontend product detail page loads via slug URL
- [ ] Old UUID product URLs still load

---

## M3: Image Storage Migration (LONGBLOB → MinIO)

**Branch**: `m3/image-storage`  
**Addresses**: P0-4

### Schema changes

**`V4__m3_image_storage.sql`**:

```sql
ALTER TABLE product_images ADD COLUMN storage_key VARCHAR(500);
ALTER TABLE product_images ADD COLUMN url VARCHAR(1000);
ALTER TABLE product_images ADD COLUMN thumbnail_key VARCHAR(500);
ALTER TABLE product_images ADD COLUMN thumbnail_url VARCHAR(1000);
-- image_data (LONGBLOB) is NOT dropped — kept for migration period.
-- Drop via a later cleanup migration after production verification.
```

### MinIO bucket policy

The `product-images` bucket uses a **public-read** policy so image URLs can
be served directly to browsers without authentication or signed URLs:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": ["s3:GetObject"],
    "Resource": ["arn:aws:s3:::product-images/*"]
  }]
}
```

**Alternative — presigned URLs**: If images should not be publicly accessible
(e.g., B2B catalog with restricted access), use presigned URLs with a TTL
(e.g., 1 hour). Trade-off: presigned URLs are not CDN-cacheable because each
URL is unique and time-limited. For a public product catalog, direct public-read
URLs are preferred.

### New dependencies

- `io.minio:minio:8.5.x` in `pom.xml`
- MinIO config: `minio.endpoint`, `minio.access-key`, `minio.secret-key`, `minio.bucket`

### Entities / DTOs touched

| File | Change |
|------|--------|
| `ProductImage.java` | Add `storageKey`, `url`, `thumbnailKey`, `thumbnailUrl`. `imageData` becomes `@Nullable`. |
| `ProductDetailDto.ImageDto` | Add `String url`, `String thumbnailUrl`. |
| `ProductListingDto` | Add `String primaryImageThumbnailUrl`. |
| New: `MinioStorageService.java` | Upload, delete, public URL. Config via env vars. |
| New: `ImageProcessingService.java` | Thumbnail generation (300×300 via Thumbnailator, preserve aspect ratio). |
| New: `ImageMigrationJob.java` | Gated by `app.images.migrate-on-startup=false`. Migrates blobs → MinIO in batches of 50. Resumable (skips rows where `storageKey` is already set). Nulls `imageData` only after upload + verification GET. |
| `ProductController.java` | `GET /api/products/images/{imageId}` returns 302 to MinIO URL when `url` is set; binary fallback when only `imageData`. |

### API changes

| Endpoint | Change |
|----------|--------|
| `GET /api/products/images/{imageId}` | 302 redirect to MinIO URL for migrated images. Binary fallback for unmigrated. Transparent to browsers. |
| `POST /api/products/save/product` | Image upload goes to MinIO, not LONGBLOB. |
| `ProductDetailDto` | `ImageDto` gains `url`, `thumbnailUrl`. |

### Tests to write

| Test | What it verifies |
|------|------------------|
| `MinioStorageServiceTest` | Upload/download/delete against Testcontainers MinIO. |
| `ImageProcessingServiceTest` | Thumbnail ≤ 300×300, aspect ratio preserved. |
| `ProductControllerTest.getImage_redirect` | Migrated image → 302 with Location header. |
| `ProductControllerTest.getImage_legacy` | Unmigrated image → 200 with binary body. |
| `ImageMigrationJobTest` | Migrates blob, sets keys/urls, nulls imageData after verification. Resumable on re-run. |

### Frontend impact

| File | Change needed |
|------|---------------|
| `productService.ts` | Add `url?`, `thumbnailUrl?` to `ProductDetailImage`. |
| Product card | Prefer `primaryImageThumbnailUrl` when available; fall back to `/images/{id}`. |
| `product-details.tsx` | Use `image.url` for gallery when available; fall back to `getProductImageUrl(id)`. |

### Breakage risk

**Low** — 302 redirect is transparent. Fallback path serves from DB during migration.

### Manual verification checklist

- [ ] MinIO container running and accessible
- [ ] New product upload stores image in MinIO bucket
- [ ] `GET /api/products/images/{id}` redirects to MinIO URL for new images
- [ ] Old images still load via binary fallback
- [ ] Migration job (when enabled) migrates existing blobs
- [ ] Thumbnails generated and accessible
- [ ] Frontend images load end-to-end (no broken images)

---

## M4: Stock Integrity

**Branch**: `m4/stock-integrity`  
**Addresses**: P0-5

### Design decisions

- **Validate** stock at quotation creation — reject if `quantity > available stock`.
- **Decrement** stock only when quotation converts to invoice (`convertToInvoice`).
- **No cart-level reservation** (B2B system — quotation is the commitment point).
- **Atomic conditional UPDATE** for stock decrement (not `@Version`):
  ```sql
  UPDATE product_variants SET stock_quantity = stock_quantity - :qty
  WHERE id = :id AND stock_quantity >= :qty
  ```
  Check affected row count: 0 rows = insufficient stock → rollback entire conversion.
- **`@Version`** on entities is for admin-edit protection only (prevents concurrent
  admin edits from silently overwriting). It is NOT used in the stock decrement
  path — an unrelated concurrent admin edit (e.g., changing a product description)
  must not 409 an invoice conversion.

### Schema changes

**`V5__m4_stock_integrity.sql`**:

```sql
-- 1. Version columns for optimistic locking (admin-edit protection only)
ALTER TABLE products ADD COLUMN version BIGINT DEFAULT 0 NOT NULL;
ALTER TABLE product_variants ADD COLUMN version BIGINT DEFAULT 0 NOT NULL;

-- 2. Stock movement audit table
CREATE TABLE stock_movements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id VARCHAR(255) NOT NULL,
    variant_id VARCHAR(255),
    quantity_change INT NOT NULL,
    quantity_before INT NOT NULL,
    quantity_after INT NOT NULL,
    reason VARCHAR(50) NOT NULL,
    reference_type VARCHAR(50),
    reference_id VARCHAR(255),
    notes VARCHAR(1000),
    created_by VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id),
    INDEX idx_stock_movement_product (product_id),
    INDEX idx_stock_movement_variant (variant_id),
    INDEX idx_stock_movement_reason (reason)
);

-- 3. Track variant on quotation items for precise stock
ALTER TABLE quotation_items ADD COLUMN variant_id VARCHAR(255);
ALTER TABLE quotation_items ADD CONSTRAINT fk_qi_variant
    FOREIGN KEY (variant_id) REFERENCES product_variants(id);
```

### Entities / DTOs touched

| File | Change |
|------|--------|
| `Products.java` | Add `@Version Long version`. |
| `ProductVariant.java` | Add `@Version Long version`. |
| New: `StockMovement.java` | Entity. `StockMovementReason` enum: `QUOTATION_CONVERSION`, `MANUAL_ADJUSTMENT`, `PRODUCT_CREATION`, `RETURN`. |
| New: `StockMovementRepository.java` | `findByProductId`, `findByVariantId`. |
| New: `StockService.java` | `validateStock(items)`, `decrementStock(quotation, username)` using atomic UPDATE + row count check. |
| `QuotationItem.java` | Add `@ManyToOne ProductVariant variant`. |
| `QuotationItemDto.java` | Add `String variantId` (nullable). |

### API changes

| Endpoint | Change |
|----------|--------|
| `POST /api/quotations` | Validates stock. Returns 400: `"Item 2: requested 50 but only 8 in stock"`. |
| `POST /api/quotations/{id}/convert-to-invoice` | Decrements stock atomically. Returns 409 on insufficient stock. |
| New: `GET /api/admin/stock-movements?productId=X` | Admin-only, paginated. |

### Stock decrement implementation

In `QuotationServiceImpl.convertToInvoice`:
1. For each `QuotationItem`, call `StockService.decrementStock`:
   - Execute: `@Modifying @Query("UPDATE ProductVariant v SET v.stockQuantity = v.stockQuantity - :qty WHERE v.id = :id AND v.stockQuantity >= :qty")`
   - If affected rows == 0 → throw `InsufficientStockException` (the whole
     transaction rolls back, no partial decrement).
   - Read the new `stockQuantity`; if 0, set `stockStatus = OUT_OF_STOCK`.
   - Record `StockMovement` with `quantity_before`, `quantity_after`,
     reason `QUOTATION_CONVERSION`, reference `INVOICE:{invoiceNumber}`.
2. If only `productId` (no variant), apply same logic to `Products.stockQuantity`.
3. Entire conversion is `@Transactional` — any failure rolls back invoice + all decrements.

### Tests to write

| Test | What it verifies |
|------|------------------|
| `StockServiceTest.validateStock_sufficient` | No exception. |
| `StockServiceTest.validateStock_insufficient` | Throws with item index + quantities. |
| `QuotationServiceTest.createQuotation_exceedsStock` | Returns 400. |
| `QuotationServiceTest.convertToInvoice_decrementsStock` | `stockQuantity` reduced. `StockMovement` created. |
| `QuotationServiceTest.convertToInvoice_concurrentConflict` | Two threads converting quotations consuming last units — one succeeds, one fails. Final stock ≥ 0. |
| `StockMovementRepositoryTest` | Audit trail queryable by product/variant/reference. |

### Frontend impact

| File | Change needed |
|------|---------------|
| `checkout.tsx` | Include `variantId` in quotation items (already on `CartItem`). Handle 400 stock error in toast. |

### Breakage risk

**Low** — `variantId` on quotation items is additive (nullable). Stock validation
is new behavior that only rejects previously-invalid requests.

### Manual verification checklist

- [ ] Create quotation with quantity ≤ stock → succeeds
- [ ] Create quotation with quantity > stock → 400 with specific item error
- [ ] Convert quotation to invoice → stock decremented, movement logged
- [ ] Convert same quotation again → error (already converted)
- [ ] Concurrent conversion test → one succeeds, one gets 409, stock ≥ 0
- [ ] `GET /api/admin/stock-movements?productId=X` shows history

---

## M5: Security Hardening

**Branch**: `m5/security`  
**Addresses**: P0-6, ANALYSIS §3.3 #5-7, §3.6 #7

### New dependencies

- `com.bucket4j:bucket4j-core:8.x` in `pom.xml`

### Entities / DTOs touched

| File | Change |
|------|--------|
| `CustomerDto.java` | `phone`: `@Pattern(regexp = "^[6-9]\\d{9}$")`. `gstNumber`: custom `@ValidGst` annotation (allows null/empty, validates pattern when present). |
| `QuotationController.java` | Remove class-level `@CrossOrigin` (line 17). |
| New: `RateLimitFilter.java` | Servlet filter on `POST /api/quotations`. 5 req/min per client IP. |
| `SecurityConfig.java` | Register rate limit filter. |

### Rate limit — IP resolution

The client IP **must** resolve from `X-Forwarded-For` when behind a reverse
proxy (nginx, load balancer). Controlled by property:

```properties
# application.properties
app.rate-limit.trust-forwarded-header=false
# application-prod.properties (behind nginx)
app.rate-limit.trust-forwarded-header=true
```

When `true`, the filter reads the first IP from `X-Forwarded-For`. When `false`,
it uses `request.getRemoteAddr()`. The trusted-proxy list (which proxies are
allowed to set `X-Forwarded-For`) can be extended later; for now the boolean
toggle is sufficient since the single reverse proxy (nginx) is trusted.

### API changes

| Endpoint | Change |
|----------|--------|
| `POST /api/quotations` | Rate-limited: 5 req/min per IP. 429 with `ApiResponse` when exceeded. |
| `POST /api/quotations` | Customer validation rejects invalid phone/GST formats with 400. |

### Tests to write

| Test | What it verifies |
|------|------------------|
| `RateLimitFilterTest` | 5 requests succeed, 6th → 429. Resets after 1 minute. |
| `CustomerDtoValidationTest` | Valid Indian phone passes. Invalid fails. |
| `CustomerDtoValidationTest` | Valid GST passes. Invalid fails. Empty/null passes. |
| `QuotationControllerCorsTest` | CORS works without `@CrossOrigin` on controller. |

### Frontend impact

| File | Change needed |
|------|---------------|
| `checkout.tsx` | Client-side phone validation (10 digits, starts 6-9). GST format validation for non-empty values. Handle 429 with toast. |

### Breakage risk

**Low** — Additive behavior. Previously accepted invalid phone/GST will now be rejected.

### Manual verification checklist

- [ ] 5 quotation submissions succeed; 6th → 429
- [ ] Wait 1 minute → can submit again
- [ ] Invalid phone → 400
- [ ] Invalid GST → 400
- [ ] Empty GST → succeeds
- [ ] CORS works on `POST /api/quotations` from frontend origin

---

## M6: Product Update API + Frontend Wiring

**Branch**: `m6/product-update`  
**Addresses**: P1-4, P1-7, ANALYSIS §3.6 #3, #5, #6

### Schema changes

None.

### Entities / DTOs touched

| File | Change |
|------|--------|
| New: `ProductUpdateDto.java` | Same fields as `ProductRequestDto` but all `@Nullable` (partial update). Plus `List<MultipartFile> newGalleryImages`, `List<Long> removeImageIds`. |

### API changes

| Endpoint | Change |
|----------|--------|
| New: `PUT /api/products/{id}` | Partial update. `multipart/form-data`. JWT required. Only non-null fields applied. |

### Backend implementation

`ProductService.updateProduct(String id, ProductUpdateDto dto)`:
1. Find product by ID or throw 404.
2. For each non-null field in `dto`, update the entity.
3. If `categoryId` present, look up `Category`, set FK. 400 on unknown.
4. New images → upload to MinIO (or LONGBLOB if M3 not done).
5. `removeImageIds` → delete `ProductImage` rows + MinIO objects.
6. Features/specifications replaced only when provided.
7. Slug does NOT change on rename (immutable after creation).

### Tests to write

| Test | What it verifies |
|------|------------------|
| `ProductServiceTest.updateProduct_partialName` | Only name changes; other fields preserved. |
| `ProductServiceTest.updateProduct_addImages` | New images added to gallery. |
| `ProductServiceTest.updateProduct_removeImages` | Images deleted from DB + storage. |
| `ProductServiceTest.updateProduct_notFound` | 404. |
| `ProductControllerTest.updateProduct_unauthorized` | 401 without JWT. |

### Frontend impact

| File | Change needed |
|------|---------------|
| `productService.ts` | Replace mock `updateProduct()` with real `PUT /api/products/${id}`. Replace mock `uploadImage()`. |
| `checkout.tsx` | Replace hardcoded `API_BASE_URL` with `import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api"`. |
| `quotation-confirmation.tsx` | Same env var replacement. |
| `.env.development` (NEW) | `VITE_API_BASE_URL=http://localhost:8080/api` |
| `.env.example` (NEW) | `VITE_API_BASE_URL=http://localhost:8080/api` |
| Admin product form | Wire Save (edit mode) to real `updateProduct()`. |

### Breakage risk

**Low** — New endpoint, mocks replaced with real calls.

### Manual verification checklist

- [ ] `PUT /api/products/{id}` with only `name` → only name changes
- [ ] `PUT /api/products/{id}` with new images → added
- [ ] `PUT /api/products/{id}` with `removeImageIds` → deleted
- [ ] `PUT /api/products/{id}` without JWT → 401
- [ ] Admin edit product → save → persisted after refresh
- [ ] Build frontend → grep `dist/` for `localhost:8080` → absent (except fallback)

---

## M7: Dynamic Variant Attributes

**Branch**: `m7/dynamic-variants`  
**Addresses**: P1-3

### Design

Replace hard-coded `color`/`size`/`material`/`weight` columns with dynamic
`ProductOption` → `ProductOptionValue` → variant junction:

```
Product (1) ──→ (N) ProductOption        ("Color", "Size", "Voltage")
ProductOption (1) ──→ (N) ProductOptionValue  ("Red", "XL", "220V")
ProductVariant (N) ←──→ (N) ProductOptionValue (junction table)
```

### Schema changes

**`V6__m7_dynamic_variants.sql`**:

```sql
CREATE TABLE product_options (
    id VARCHAR(255) PRIMARY KEY,
    product_id VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200),
    sort_order INT DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY uq_product_option (product_id, name)
);

CREATE TABLE product_option_values (
    id VARCHAR(255) PRIMARY KEY,
    option_id VARCHAR(255) NOT NULL,
    value VARCHAR(200) NOT NULL,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (option_id) REFERENCES product_options(id) ON DELETE CASCADE,
    UNIQUE KEY uq_option_value (option_id, value)
);

CREATE TABLE variant_option_values (
    variant_id VARCHAR(255) NOT NULL,
    option_value_id VARCHAR(255) NOT NULL,
    PRIMARY KEY (variant_id, option_value_id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    FOREIGN KEY (option_value_id) REFERENCES product_option_values(id) ON DELETE CASCADE
);
```

**`V6_1__MigrateVariantAttributes.java`** (Flyway Java migration):
- For each product with variants using non-null color/size/material/weight:
  create `ProductOption` rows (only for attributes actually used), distinct
  `ProductOptionValue` rows, and `variant_option_values` junction rows.
- Idempotent: skips products that already have options.

**`V6_2__drop_variant_attribute_columns.sql`** — **DEFERRED**. Not created in
this milestone. Drop `color`/`size`/`material`/`weight` only after transition
period is verified in production.

### Entities / DTOs touched

| File | Change |
|------|--------|
| New: `ProductOption.java` | Entity. `@ManyToOne Product`, `name`, `displayName`, `sortOrder`, `@OneToMany List<ProductOptionValue>`. |
| New: `ProductOptionValue.java` | Entity. `@ManyToOne ProductOption`, `value`, `sortOrder`. |
| `ProductVariant.java` | Keep legacy `color`/`size`/`material`/`weight` (transition). Add `@ManyToMany Set<ProductOptionValue> optionValues`. On save: mirror Color/Size/Material/Weight option values into legacy columns. |
| `ProductDetailDto.VariantDto` | Keep legacy fields. Add `List<OptionValueDto> options` = `[{optionName, value}]`. |
| `ProductDetailDto` | Add product-level `List<OptionDto> options` = `[{id, name, displayName, values}]`. |

### API changes

| Endpoint | Change |
|----------|--------|
| `GET /api/products/{id}` | Response gains `options[]` at product and variant level. Legacy fields still populated during transition. |
| `POST /api/products/save/product` | Accepts `options[]` definitions + variant option references. |
| `PUT /api/products/{id}` | Can add/remove options and values. |
| New: `GET /api/products/{id}/options` | Product options + values (variant creation UI). |

### Tests to write

| Test | What it verifies |
|------|------------------|
| `MigrateVariantAttributesTest` | Existing color/size migrated to option/value tables. |
| `ProductServiceTest.createProduct_withDynamicOptions` | Options/values created, variants linked. |
| `ProductServiceTest.getProductDetail_hasOptions` | Response includes both levels. |
| `ProductServiceTest.createVariant_duplicateCombo` | Rejected with 400. |
| `LegacyTransitionTest` | Legacy fields populated for Color/Size/Material/Weight options. |

### Frontend impact

| File | Change needed |
|------|---------------|
| `productService.ts` | `ProductDetailVariant` gains `options[]`. `ProductDetail` gains `options[]`. |
| `product-details.tsx` | Dynamic option selectors from `product.options` instead of hard-coded dropdowns. Selected combination resolves active variant. |
| Admin form | Dynamic Options builder (add option names + values, create variants). |
| `cart-context.tsx` | `variantName` = human-readable label from option values. No structural change. |

### Breakage risk

**High** — Most disruptive milestone. Legacy fields kept for transition.
Frontend must be updated for dynamic selectors.

### Manual verification checklist

- [ ] Existing variants have options migrated from legacy columns
- [ ] `GET /api/products/{id}` returns `options[]` at both levels
- [ ] New product with custom option (Voltage: 110V/220V) → creates correctly
- [ ] Variant selection in frontend uses dynamic option groups
- [ ] Old products' variants still selectable
- [ ] Legacy fields still populated during transition
- [ ] **Reminder**: V6_2 (column drop) is deliberately deferred

---

## Milestone Dependency Graph

```
Pre-work (Flyway) ─→ M1 ─→ M2 ─→ M3
                       │         ↗
                       ├→ M4 ──/
                       ├→ M5
                       └→ M6 ─→ M7
```

- **M1** is prerequisite for everything.
- **M2** and **M4** can run in parallel after M1.
- **M3** can start after M1, benefits from M2 (slug-based image URLs).
- **M5** can start immediately after M1.
- **M6** depends on M1, best done after M3 (so uploads use MinIO).
- **M7** is last — most disruptive, benefits from all prior infrastructure.

## Total estimated scope

| Milestone | New files | Modified files | Flyway migrations | Risk |
|-----------|-----------|---------------|-------------------|------|
| Pre-work  | 1         | 2             | 1 (baseline)      | Medium |
| M1        | 3         | ~10           | 1                 | Medium |
| M2        | 2         | ~8            | 4 (2 SQL + 2 Java)| High |
| M3        | 3         | ~5            | 1                 | Low |
| M4        | 3         | ~5            | 1                 | Low |
| M5        | 1         | ~4            | 0                 | Low |
| M6        | 3         | ~5            | 0                 | Low |
| M7        | 3         | ~8            | 3 (1 SQL + 1 Java + 1 deferred) | High |
