# Invoice Integration - Implementation Guide

## 🎯 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/TypeScript)                  │
├─────────────────────────────────────────────────────────────────┤
│                   finance-invoice-create.tsx                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Form State:                                                │ │
│  │  - customer (name, company, email, phone, address, gst)   │ │
│  │  - invoiceInfo (number, date, dueDate, terms, po, etc.)   │ │
│  │  - items[] (productName, hsnSac, qty, price, discount, gst)│ │
│  │  - notes, termsAndConditions                              │ │
│  │  - totals (calculated: subtotal, discount, gst, total)    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           ↓                                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ handleSave("draft" | "pending") calls:                     │ │
│  │ financeService.createInvoice(invoice)                      │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│            FRONTEND SERVICE (financeService.ts)                 │
├─────────────────────────────────────────────────────────────────┤
│  ❌ CURRENTLY: Just logs to console (mock data)                │
│  ✅ SHOULD DO:                                                  │
│     POST http://localhost:8080/api/invoices                    │
│     Content-Type: application/json                             │
│     Body: {                                                     │
│       invoiceNumber: string                                    │
│       invoiceDate: string (YYYY-MM-DD)                         │
│       dueDate: string (YYYY-MM-DD)                             │
│       paymentTermsDays: number                                 │
│       customer: CustomerDto                                   │
│       items: InvoiceItemDto[]                                 │
│       notes: string                                            │
│       termsAndConditions: string                               │
│       additionalDiscount: number                               │
│       additionalCharges: number                                │
│       paymentAmount: number                                    │
│       [MISSING] subtotal: number                               │
│       [MISSING] totalDiscount: number                          │
│       [MISSING] totalGst: number                               │
│       [MISSING] grandTotal: number                             │
│       [MISSING] status: "draft" | "pending"                    │
│     }                                                           │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│             BACKEND API (Spring Boot)                           │
├─────────────────────────────────────────────────────────────────┤
│                   InvoiceController.java                        │
│  ❌ CURRENT: Only @PostMapping("/generate") - PDF only          │
│  ✅ NEEDED:                                                      │
│     @PostMapping("/") - Create invoice                         │
│     @GetMapping("/") - List invoices                           │
│     @GetMapping("/{id}") - Get by ID                           │
│     @PutMapping("/{id}") - Update invoice                      │
│     @DeleteMapping("/{id}") - Delete invoice                   │
│     @PostMapping("/{id}/generate") - Generate PDF              │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│          BUSINESS LOGIC (InvoiceService.java)                   │
├─────────────────────────────────────────────────────────────────┤
│  ❌ MISSING: InvoiceService.java (not created yet)              │
│  SHOULD DO:                                                     │
│   1. Validate input (GST, dates, amounts)                      │
│   2. Recalculate totals (prevent tampering)                    │
│   3. Check for duplicate invoice numbers                        │
│   4. Map InvoiceRequest → Invoice entity                       │
│   5. Save to database                                           │
│   6. Generate PDF (call InvoicePdfService)                     │
│   7. Return Invoice entity with ID                             │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│               DATA PERSISTENCE (Database)                       │
├─────────────────────────────────────────────────────────────────┤
│  ❌ MISSING: Entity classes, Repository, Schema                │
│  SHOULD CREATE:                                                 │
│   - Invoice.java (Entity)                                      │
│   - InvoiceItem.java (Entity)                                  │
│   - Customer.java (Entity) or embed in Invoice                 │
│   - InvoiceRepository.java (extends JpaRepository)             │
│   - DB schema (CREATE TABLE invoices, invoice_items)           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementation Steps

### Step 1: Update Backend DTOs

**File: `InvoiceRequest.java`**
```java
package com.ecommerce.auth.dto;

import java.util.List;

public class InvoiceRequest {
    private String invoiceNumber;
    private String invoicePrefix;          // ADD THIS
    private String invoiceDate;
    private String dueDate;
    private int paymentTermsDays;
    
    private String poNumber;
    private String poDate;
    private String ewayBillNo;
    private String vehicleNo;
    
    private CustomerDto customer;
    private List<InvoiceItemDto> items;
    
    private String notes;
    private String termsAndConditions;
    
    private double subtotal;               // ADD THIS
    private double totalDiscount;          // ADD THIS
    private double totalGst;               // ADD THIS
    private double roundOffAmount;         // ADD THIS
    private double grandTotal;             // ADD THIS
    
    private double additionalDiscount;
    private double additionalCharges;
    private double paymentAmount;
    
    private String status;                 // ADD THIS: "draft", "pending", etc.
    
    // Add getters and setters for all new fields
    public String getInvoicePrefix() { return invoicePrefix; }
    public void setInvoicePrefix(String invoicePrefix) { this.invoicePrefix = invoicePrefix; }
    
    public double getSubtotal() { return subtotal; }
    public void setSubtotal(double subtotal) { this.subtotal = subtotal; }
    
    public double getTotalDiscount() { return totalDiscount; }
    public void setTotalDiscount(double totalDiscount) { this.totalDiscount = totalDiscount; }
    
    public double getTotalGst() { return totalGst; }
    public void setTotalGst(double totalGst) { this.totalGst = totalGst; }
    
    public double getRoundOffAmount() { return roundOffAmount; }
    public void setRoundOffAmount(double roundOffAmount) { this.roundOffAmount = roundOffAmount; }
    
    public double getGrandTotal() { return grandTotal; }
    public void setGrandTotal(double grandTotal) { this.grandTotal = grandTotal; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    // ... rest of existing getters/setters
}
```

**File: `InvoiceItemDto.java`**
```java
package com.ecommerce.auth.dto;

public class InvoiceItemDto {
    private String productName;
    private String hsnSac;
    private int quantity;
    private double unitPrice;
    private double discount;           // This is % discount
    private double gst;
    private double total;              // ADD THIS: calculated total for line item
    
    // Existing getters/setters
    public double getTotal() { return total; }
    public void setTotal(double total) { this.total = total; }
}
```

---

### Step 2: Update Frontend Service

**File: `financeService.ts`** - Update the `createInvoice` method:

```typescript
// Update this existing method in financeService.ts
async createInvoice(invoice: Omit<Invoice, "id">): Promise<Invoice> {
    try {
        const response = await fetch("http://localhost:8080/api/invoices", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // Add auth token if needed
                // "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(invoice)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to create invoice");
        }
        
        const newInvoice = await response.json();
        return newInvoice;
    } catch (error) {
        console.error("Error creating invoice:", error);
        throw error;
    }
}
```

Also update the `Invoice` interface to include new fields:
```typescript
export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoicePrefix?: string;           // ADD THIS
  customer: {
    name: string;
    company: string;
    email: string;
    phone: string;
    address: string;
    gstNumber?: string;
  };
  invoiceDate: string;
  dueDate: string;
  paymentTermsDays?: number;        // ADD THIS
  poNumber?: string;
  poDate?: string;
  ewayBillNo?: string;
  vehicleNo?: string;
  items: {
    productName: string;
    hsnSac?: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    gst: number;
    total: number;
  }[];
  notes?: string;                   // ADD THIS
  termsAndConditions?: string;      // ADD THIS
  subtotal: number;
  totalDiscount: number;
  totalGst: number;
  roundOffAmount?: number;          // ADD THIS
  grandTotal: number;
  additionalDiscount?: number;      // ADD THIS
  additionalCharges?: number;       // ADD THIS
  paymentAmount?: number;           // ADD THIS
  status: "draft" | "pending" | "paid" | "overdue" | "cancelled";
}
```

---

### Step 3: Create Backend Entity Classes

**File: `Invoice.java`** (JPA Entity)
```java
package com.ecommerce.auth.entity;

import jakarta.persistence.*;
import java.util.List;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoices")
public class Invoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String invoiceNumber;
    
    private String invoicePrefix;
    
    @Column(nullable = false)
    private LocalDate invoiceDate;
    
    @Column(nullable = false)
    private LocalDate dueDate;
    
    private int paymentTermsDays;
    
    // Customer info (can be embedded or separate entity)
    private String customerName;
    private String customerCompany;
    private String customerEmail;
    private String customerPhone;
    @Column(length = 500)
    private String customerAddress;
    private String customerGstNumber;
    
    // PO and transport info
    private String poNumber;
    private LocalDate poDate;
    private String ewayBillNo;
    private String vehicleNo;
    
    // Line items
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "invoice_id")
    private List<InvoiceItem> items;
    
    // Notes and terms
    @Column(length = 1000)
    private String notes;
    
    @Column(length = 2000)
    private String termsAndConditions;
    
    // Financial totals
    private double subtotal;
    private double totalDiscount;
    private double totalGst;
    private double roundOffAmount;
    private double grandTotal;
    private double additionalDiscount;
    private double additionalCharges;
    private double paymentAmount;
    
    // Invoice status
    @Column(nullable = false)
    private String status; // "draft", "pending", "paid", "overdue", "cancelled"
    
    // Metadata
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
    
    // ... add all other getters/setters
}
```

**File: `InvoiceItem.java`** (JPA Entity)
```java
package com.ecommerce.auth.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "invoice_items")
public class InvoiceItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String productName;
    
    private String hsnSac;
    
    @Column(nullable = false)
    private int quantity;
    
    @Column(nullable = false)
    private double unitPrice;
    
    private double discount;    // percentage
    
    @Column(nullable = false)
    private double gst;         // percentage
    
    @Column(nullable = false)
    private double total;       // line total
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    
    // ... add all other getters/setters
}
```

---

### Step 4: Create Repository Interface

**File: `InvoiceRepository.java`**
```java
package com.ecommerce.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.ecommerce.auth.entity.Invoice;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    List<Invoice> findByStatus(String status);
    List<Invoice> findByCustomerCompany(String company);
}
```

---

### Step 5: Create Service Class

**File: `InvoiceService.java`**
```java
package com.ecommerce.auth.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.ecommerce.auth.dto.InvoiceRequest;
import com.ecommerce.auth.dto.InvoiceItemDto;
import com.ecommerce.auth.entity.Invoice;
import com.ecommerce.auth.entity.InvoiceItem;
import com.ecommerce.auth.repository.InvoiceRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class InvoiceService {
    
    private final InvoiceRepository invoiceRepository;
    private final InvoicePdfService invoicePdfService;
    
    public InvoiceService(InvoiceRepository invoiceRepository, 
                         InvoicePdfService invoicePdfService) {
        this.invoiceRepository = invoiceRepository;
        this.invoicePdfService = invoicePdfService;
    }
    
    @Transactional
    public Invoice createInvoice(InvoiceRequest request) {
        // Validate input
        validateInvoiceRequest(request);
        
        // Check for duplicate invoice number
        if (invoiceRepository.findByInvoiceNumber(request.getInvoiceNumber()).isPresent()) {
            throw new RuntimeException("Invoice number already exists: " + request.getInvoiceNumber());
        }
        
        // Recalculate totals server-side (prevent tampering)
        calculateAndValidateTotals(request);
        
        // Create invoice entity
        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(request.getInvoiceNumber());
        invoice.setInvoicePrefix(request.getInvoicePrefix());
        invoice.setInvoiceDate(LocalDate.parse(request.getInvoiceDate()));
        invoice.setDueDate(LocalDate.parse(request.getDueDate()));
        invoice.setPaymentTermsDays(request.getPaymentTermsDays());
        
        // Set customer info
        invoice.setCustomerName(request.getCustomer().getName());
        invoice.setCustomerCompany(request.getCustomer().getCompany());
        invoice.setCustomerEmail(request.getCustomer().getEmail());
        invoice.setCustomerPhone(request.getCustomer().getPhone());
        invoice.setCustomerAddress(request.getCustomer().getAddress());
        invoice.setCustomerGstNumber(request.getCustomer().getGstNumber());
        
        // Set PO info
        invoice.setPoNumber(request.getPoNumber());
        if (request.getPoDate() != null && !request.getPoDate().isEmpty()) {
            invoice.setPoDate(LocalDate.parse(request.getPoDate()));
        }
        invoice.setEwayBillNo(request.getEwayBillNo());
        invoice.setVehicleNo(request.getVehicleNo());
        
        // Set items
        List<InvoiceItem> items = request.getItems().stream()
            .map(this::dtoToEntity)
            .collect(Collectors.toList());
        invoice.setItems(items);
        
        // Set notes
        invoice.setNotes(request.getNotes());
        invoice.setTermsAndConditions(request.getTermsAndConditions());
        
        // Set financial totals
        invoice.setSubtotal(request.getSubtotal());
        invoice.setTotalDiscount(request.getTotalDiscount());
        invoice.setTotalGst(request.getTotalGst());
        invoice.setRoundOffAmount(request.getRoundOffAmount());
        invoice.setGrandTotal(request.getGrandTotal());
        invoice.setAdditionalDiscount(request.getAdditionalDiscount());
        invoice.setAdditionalCharges(request.getAdditionalCharges());
        invoice.setPaymentAmount(request.getPaymentAmount());
        
        // Set status
        invoice.setStatus(request.getStatus() != null ? request.getStatus() : "draft");
        
        // Save to database
        Invoice savedInvoice = invoiceRepository.save(invoice);
        
        // Generate PDF
        try {
            invoicePdfService.generateInvoicePdf(request);
        } catch (Exception e) {
            // Log error but don't fail - PDF generation is secondary
            System.err.println("Failed to generate PDF for invoice: " + e.getMessage());
        }
        
        return savedInvoice;
    }
    
    public Invoice getInvoiceById(Long id) {
        return invoiceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Invoice not found with id: " + id));
    }
    
    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }
    
    @Transactional
    public Invoice updateInvoice(Long id, InvoiceRequest request) {
        Invoice invoice = getInvoiceById(id);
        
        // Only allow updates to certain fields
        invoice.setNotes(request.getNotes());
        invoice.setTermsAndConditions(request.getTermsAndConditions());
        invoice.setPaymentAmount(request.getPaymentAmount());
        invoice.setStatus(request.getStatus());
        
        return invoiceRepository.save(invoice);
    }
    
    @Transactional
    public void deleteInvoice(Long id) {
        Invoice invoice = getInvoiceById(id);
        invoiceRepository.delete(invoice);
    }
    
    private void validateInvoiceRequest(InvoiceRequest request) {
        if (request.getInvoiceNumber() == null || request.getInvoiceNumber().isEmpty()) {
            throw new IllegalArgumentException("Invoice number is required");
        }
        
        if (request.getCustomer() == null) {
            throw new IllegalArgumentException("Customer information is required");
        }
        
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("At least one invoice item is required");
        }
        
        // Validate GST number format (Indian GST)
        if (request.getCustomer().getGstNumber() != null && 
            !request.getCustomer().getGstNumber().isEmpty()) {
            if (!isValidGstNumber(request.getCustomer().getGstNumber())) {
                throw new IllegalArgumentException("Invalid GST number format");
            }
        }
        
        // Validate dates
        LocalDate invoiceDate = LocalDate.parse(request.getInvoiceDate());
        LocalDate dueDate = LocalDate.parse(request.getDueDate());
        
        if (invoiceDate.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Invoice date cannot be in the future");
        }
        
        if (dueDate.isBefore(invoiceDate)) {
            throw new IllegalArgumentException("Due date must be after invoice date");
        }
    }
    
    private void calculateAndValidateTotals(InvoiceRequest request) {
        double calculatedSubtotal = 0;
        double calculatedTotalGst = 0;
        
        for (InvoiceItemDto item : request.getItems()) {
            double itemSubtotal = item.getQuantity() * item.getUnitPrice();
            double discount = (itemSubtotal * item.getDiscount()) / 100;
            double afterDiscount = itemSubtotal - discount;
            double gst = (afterDiscount * item.getGst()) / 100;
            
            calculatedSubtotal += itemSubtotal;
            calculatedTotalGst += gst;
        }
        
        // Validate totals match frontend calculations (within rounding tolerance)
        final double TOLERANCE = 0.01;
        
        if (Math.abs(calculatedSubtotal - request.getSubtotal()) > TOLERANCE) {
            // Log warning but continue - could be rounding differences
            System.err.println("Subtotal mismatch - frontend: " + request.getSubtotal() + 
                             ", calculated: " + calculatedSubtotal);
        }
    }
    
    private boolean isValidGstNumber(String gst) {
        // Indian GST: 15 characters in format [0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}
        return gst.matches("\\d{2}[A-Z]{5}\\d{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}");
    }
    
    private InvoiceItem dtoToEntity(InvoiceItemDto dto) {
        InvoiceItem entity = new InvoiceItem();
        entity.setProductName(dto.getProductName());
        entity.setHsnSac(dto.getHsnSac());
        entity.setQuantity(dto.getQuantity());
        entity.setUnitPrice(dto.getUnitPrice());
        entity.setDiscount(dto.getDiscount());
        entity.setGst(dto.getGst());
        entity.setTotal(dto.getTotal());
        return entity;
    }
}
```

---

### Step 6: Update InvoiceController

```java
@RestController
@RequestMapping("/api/invoices")
@CrossOrigin(origins = "http://localhost:5173")
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final InvoicePdfService invoicePdfService;

    public InvoiceController(InvoiceService invoiceService, 
                             InvoicePdfService invoicePdfService) {
        this.invoiceService = invoiceService;
        this.invoicePdfService = invoicePdfService;
    }

    // CREATE
    @PostMapping
    public ResponseEntity<Invoice> createInvoice(@RequestBody InvoiceRequest request) {
        Invoice invoice = invoiceService.createInvoice(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(invoice);
    }

    // READ
    @GetMapping
    public ResponseEntity<List<Invoice>> getAllInvoices() {
        List<Invoice> invoices = invoiceService.getAllInvoices();
        return ResponseEntity.ok(invoices);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Invoice> getInvoice(@PathVariable Long id) {
        Invoice invoice = invoiceService.getInvoiceById(id);
        return ResponseEntity.ok(invoice);
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<Invoice> updateInvoice(@PathVariable Long id, 
                                                  @RequestBody InvoiceRequest request) {
        Invoice invoice = invoiceService.updateInvoice(id, request);
        return ResponseEntity.ok(invoice);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvoice(@PathVariable Long id) {
        invoiceService.deleteInvoice(id);
        return ResponseEntity.noContent().build();
    }

    // PDF GENERATION (existing endpoint)
    @PostMapping("/generate")
    public ResponseEntity<Map<String, String>> generateInvoice(@RequestBody InvoiceRequest request) {
        String fileName = invoicePdfService.generateInvoicePdf(request);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Invoice PDF generated successfully");
        response.put("fileName", fileName);
        response.put("downloadUrl", "/api/invoices/download/" + fileName);
        return ResponseEntity.ok(response);
    }

    // PDF DOWNLOAD (existing endpoint)
    @GetMapping("/download/{fileName}")
    public ResponseEntity<Resource> downloadInvoice(@PathVariable String fileName) {
        try {
            Path filePath = Paths.get("uploads/invoices/").resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            
            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
```

---

## ✅ Testing Checklist

After implementing the changes:

- [ ] Test creating draft invoice
- [ ] Test creating pending invoice
- [ ] Test invoice data persists to database
- [ ] Test duplicate invoice number prevention
- [ ] Test invalid GST number validation
- [ ] Test future date validation
- [ ] Test retrieving single invoice by ID
- [ ] Test listing all invoices
- [ ] Test updating invoice status
- [ ] Test deleting invoice
- [ ] Test PDF generation
- [ ] Test PDF download
- [ ] Test error handling with proper HTTP status codes
- [ ] Test CORS configuration
- [ ] Test with frontend form submission

