# Invoice Functionality - Frontend to Backend Mapping

## 🔍 Overview
This document provides a comprehensive mapping between the frontend invoice creation form (`finance-invoice-create.tsx`) and the backend invoice processing system.

---

## 📋 API Endpoints

### Currently Implemented (Backend)
```
POST   /api/invoices/generate     - Generate PDF from invoice data
GET    /api/invoices/download/{fileName} - Download generated PDF
```

### Required (NOT Implemented)
```
POST   /api/invoices              - Create/Save invoice to database
GET    /api/invoices              - List all invoices
GET    /api/invoices/{id}         - Get invoice by ID
PUT    /api/invoices/{id}         - Update invoice
DELETE /api/invoices/{id}         - Delete invoice
```

---

## 🔄 Data Flow Mapping

### Frontend Form State → Backend Request

#### **Invoice Information**
| Frontend Field | Frontend State | Backend DTO | Status |
|---|---|---|---|
| Invoice Prefix | `invoiceInfo.invoicePrefix` | ❌ Not in DTO | **MISSING** |
| Invoice Number | `invoiceInfo.invoiceNumber` | `InvoiceRequest.invoiceNumber` | ✅ Mapped |
| Invoice Date | `invoiceInfo.invoiceDate` | `InvoiceRequest.invoiceDate` | ✅ Mapped |
| Due Date | `invoiceInfo.dueDate` | `InvoiceRequest.dueDate` | ✅ Mapped |
| Payment Terms (Days) | `invoiceInfo.paymentTermsDays` | `InvoiceRequest.paymentTermsDays` | ✅ Mapped |

#### **Customer Information**
| Frontend Field | Frontend State | Backend DTO | Status |
|---|---|---|---|
| Customer Name | `customer.name` | `CustomerDto.name` | ✅ Mapped |
| Company Name | `customer.company` | `CustomerDto.company` | ✅ Mapped |
| Email | `customer.email` | `CustomerDto.email` | ✅ Mapped |
| Phone | `customer.phone` | `CustomerDto.phone` | ✅ Mapped |
| Address | `customer.address` | `CustomerDto.address` | ✅ Mapped |
| GST Number | `customer.gstNumber` | `CustomerDto.gstNumber` | ✅ Mapped |

#### **Additional Information (PO/E-Way/Vehicle)**
| Frontend Field | Frontend State | Backend DTO | Status |
|---|---|---|---|
| PO Number | `invoiceInfo.poNumber` | `InvoiceRequest.poNumber` | ✅ Mapped |
| PO Date | `invoiceInfo.poDate` | `InvoiceRequest.poDate` | ✅ Mapped |
| E-Way Bill No | `invoiceInfo.ewayBillNo` | `InvoiceRequest.ewayBillNo` | ✅ Mapped |
| Vehicle No | `invoiceInfo.vehicleNo` | `InvoiceRequest.vehicleNo` | ✅ Mapped |

#### **Invoice Items**
| Frontend Field | Frontend State | Backend DTO | Status |
|---|---|---|---|
| Product Name | `item.productName` | `InvoiceItemDto.productName` | ✅ Mapped |
| HSN/SAC Code | `item.hsnSac` | `InvoiceItemDto.hsnSac` | ✅ Mapped |
| Quantity | `item.quantity` | `InvoiceItemDto.quantity` | ✅ Mapped |
| Unit Price | `item.unitPrice` | `InvoiceItemDto.unitPrice` | ✅ Mapped |
| Discount % | `item.discount` | `InvoiceItemDto.discount` | ✅ Mapped |
| GST % | `item.gst` | `InvoiceItemDto.gst` | ✅ Mapped |
| **Line Item Total** | `item.total` (calculated) | ❌ Not in DTO | **MISSING** |

#### **Financial Calculations (Summary)**
| Frontend Field | Frontend State | Backend DTO | Status |
|---|---|---|---|
| Subtotal | `totals.subtotal` | ❌ Not in DTO | **MISSING** |
| Item Discounts | `totals.totalDiscount` | ❌ Not in DTO | **MISSING** |
| Additional Discount | `additionalDiscount` | `InvoiceRequest.additionalDiscount` | ✅ Mapped |
| Additional Charges | `additionalCharges` | `InvoiceRequest.additionalCharges` | ✅ Mapped |
| Taxable Amount | `totals.taxableAmount` | ❌ Not in DTO | **MISSING** |
| Total GST | `totals.totalGst` | ❌ Not in DTO | **MISSING** |
| Round Off Amount | `totals.roundOffAmount` | ❌ Not in DTO | **MISSING** |
| Grand Total | `totals.grandTotal` | ❌ Not in DTO | **MISSING** |
| Payment Amount | `paymentAmount` | `InvoiceRequest.paymentAmount` | ✅ Mapped |

#### **Notes & Terms**
| Frontend Field | Frontend State | Backend DTO | Status |
|---|---|---|---|
| Notes | `notes` | `InvoiceRequest.notes` | ✅ Mapped |
| Terms & Conditions | `termsAndConditions` | `InvoiceRequest.termsAndConditions` | ✅ Mapped |

#### **Invoice Status** (NOT IN REQUEST DTO)
| Frontend Field | Frontend State | Backend DTO | Status |
|---|---|---|---|
| Status | `status` ("draft" \| "pending") | ❌ Not in DTO | **MISSING** |

---

## ⚠️ Issues & Gaps Found

### 1. **Missing Fields in Backend DTOs**
The following calculated fields from the frontend are NOT captured in `InvoiceRequest.java`:
- `subtotal` - Sum of all items before discounts
- `totalDiscount` - Total discount from all items
- `totalGst` - Total GST from all items
- `roundOffAmount` - Auto round-off adjustment
- `grandTotal` - Final amount due
- `invoicePrefix` - Invoice number prefix
- `status` - Invoice status (draft/pending/paid)
- `item.total` - Line item total in `InvoiceItemDto`

### 2. **Service Layer Issues**
- **financeService.ts** is using mock data only
- `createInvoice()` method just logs to console, doesn't call backend
- No actual HTTP requests to `/api/invoices/generate`
- All CRUD operations marked with TODO comments

### 3. **Backend Controller Limitations**
- `InvoiceController` only handles PDF generation
- No database persistence layer
- No endpoints for:
  - Creating/storing invoice records
  - Retrieving invoices
  - Updating invoices
  - Deleting invoices
  - Listing invoices

### 4. **Frontend Calculation Logic**
The frontend performs complex calculations that need backend validation:
```javascript
// Item calculations
subtotal = quantity × unitPrice
discountAmount = (subtotal × discount%) / 100
afterDiscount = subtotal - discountAmount
gstAmount = (afterDiscount × gst%) / 100
itemTotal = afterDiscount + gstAmount

// Summary calculations
totalItemDiscount = sum of all item discounts
afterItemDiscount = subtotal - totalItemDiscount
taxableAmount = afterItemDiscount - additionalDiscount + additionalCharges
totalGst = sum of all item GSTs
roundOffAmount = autoRound ? roundedTotal - beforeRound : 0
grandTotal = taxableAmount + totalGst + roundOffAmount
balanceDue = grandTotal - paymentAmount
```

These calculations should be **validated/recalculated on backend** to prevent tampering.

### 5. **Missing Validations**
Frontend has no backend-enforced validation for:
- Customer email format
- GST number format (India-specific: 15 chars)
- Minimum/maximum amounts
- Duplicate invoice numbers
- Invoice date cannot be in future
- Due date must be after invoice date

---

## 📊 Current State Summary

| Component | Status | Issues |
|-----------|--------|--------|
| **Frontend Form** | ✅ Fully Functional | None - UI is complete |
| **Frontend Service** | ⚠️ Partial | Using mock data, no backend calls |
| **Backend Controller** | ⚠️ Partial | PDF generation only, no CRUD |
| **Backend DTOs** | ⚠️ Incomplete | Missing calculated fields |
| **Database Layer** | ❌ Missing | No persistence |
| **API Integration** | ❌ Incomplete | No actual data flow |

---

## 🎯 Recommended Next Steps

### Priority 1: Extend Backend DTOs
Add missing fields to `InvoiceRequest.java`:
```java
private double subtotal;
private double totalDiscount;
private double totalGst;
private double roundOffAmount;
private double grandTotal;
private String status; // "draft", "pending", "paid", etc.
private String invoicePrefix;
```

Add `total` field to `InvoiceItemDto.java`:
```java
private double total;
```

### Priority 2: Implement Backend Service
Create `InvoiceService.java` with methods:
- `saveInvoice(InvoiceRequest)` - Persist to database
- `getInvoice(id)` - Retrieve by ID
- `listInvoices()` - Get all invoices
- `updateInvoice(id, InvoiceRequest)` - Update existing
- `deleteInvoice(id)` - Delete record

### Priority 3: Add Backend CRUD Endpoints
Extend `InvoiceController.java`:
```java
@PostMapping - Create invoice
@GetMapping - List invoices
@GetMapping("/{id}") - Get by ID
@PutMapping("/{id}") - Update
@DeleteMapping("/{id}") - Delete
```

### Priority 4: Update Frontend Service
Connect `financeService.ts` methods to actual backend:
```typescript
async createInvoice(invoice) {
  const response = await fetch(`${API_BASE_URL}/invoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invoice)
  });
  return response.json();
}
```

### Priority 5: Add Server-Side Validation
- Validate GST format (Indian GST: `\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}`)
- Verify email format
- Recalculate totals server-side
- Prevent duplicate invoice numbers

---

## 🔗 Integration Checklist

- [ ] Extend `InvoiceRequest` with missing fields
- [ ] Extend `InvoiceItemDto` with `total` field
- [ ] Create database entity models for invoices
- [ ] Create `InvoiceService` with business logic
- [ ] Add CRUD endpoints to `InvoiceController`
- [ ] Update `financeService.ts` to call real API
- [ ] Add input validation (frontend + backend)
- [ ] Add error handling
- [ ] Test end-to-end flow
- [ ] Add database migrations/schema

---

## 📝 Files Involved

### Frontend
- [finance-invoice-create.tsx](src/app/pages/finance-invoice-create.tsx) - Form UI
- [financeService.ts](src/app/services/financeService.ts) - API integration layer

### Backend
- [InvoiceController.java](backend/src/main/java/com/ecommerce/auth/controller/InvoiceController.java) - REST endpoints
- [InvoiceRequest.java](backend/src/main/java/com/ecommerce/auth/dto/InvoiceRequest.java) - Request DTO
- [InvoiceItemDto.java](backend/src/main/java/com/ecommerce/auth/dto/InvoiceItemDto.java) - Item DTO
- [CustomerDto.java](backend/src/main/java/com/ecommerce/auth/dto/CustomerDto.java) - Customer DTO
- [InvoicePdfService.java](backend/src/main/java/com/ecommerce/auth/service/InvoicePdfService.java) - PDF generation

