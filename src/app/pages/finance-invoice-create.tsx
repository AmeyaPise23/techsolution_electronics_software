import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { financeService, Invoice } from "../services/financeService";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Plus, X, ArrowLeft, Truck, Percent, Landmark, Stamp, Upload } from "lucide-react";
import { toast } from "sonner";

interface InvoiceItem {
  productName: string;
  hsnSac: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  gst: number;
  uom: string;
  total: number;
}

// Indian states with GST state codes.
const INDIAN_STATES: { code: string; name: string }[] = [
  { code: "01", name: "Jammu & Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
];

const UOM_OPTIONS: string[] = [
  "nos", "pcs", "kg", "gm", "ltr", "ml",
  "mtr", "cm", "hrs", "days", "months", "years",
  "box", "pack", "set", "unit",
];

const DEFAULT_TERMS = `1. Warranty - 3 Months from Date of Invoice
2. Payment - 45 Days from the date of Invoice
3. Taxes - 18% CGST & SGST(GST applicable as government guidelines)
4. Delivery - 2 to 3 working Days from the date of confirmation PO
5. Transport charges - Nil
6. Warranty has been voided in case of burn,broken or fault occur high electricity
7. Subject to Jurisdiction of the Courts at Pune Only`;

/**
 * Seal & Signature upload widget.
 *
 * The file <input> is positioned as a transparent overlay directly on top of
 * the click surface (drop-zone or Replace button) rather than being hidden
 * elsewhere in the tree. This matters:
 *   • Chrome scrolls the focused input into view when the user activates the
 *     picker. A hidden `sr-only` input lives at position (0,0) of its offset
 *     parent, so the scroll container ends up jumping past all content —
 *     the user sees the page blank/scrolled-to-nothing. Overlay = no jump.
 *   • Some Linux + Chromium builds don't repaint the surface behind the
 *     native file dialog cleanly. We snapshot the scroll position on click
 *     and restore it when focus returns, so even if the dialog quirk fires
 *     the user lands back where they were.
 */
function SealSignatureUpload({
  sealPreview,
  existingSealPath,
  onFileChosen,
  onRemove,
}: {
  sealPreview: string;
  existingSealPath: string;
  onFileChosen: (file: File) => void;
  onRemove: () => void;
}) {
  const scrollSnapshotRef = useRef<{ el: Element; top: number } | null>(null);

  const handlePickerOpen = () => {
    const main = document.querySelector("main");
    if (main) {
      scrollSnapshotRef.current = { el: main, top: main.scrollTop };
    }
    const restore = () => {
      const snap = scrollSnapshotRef.current;
      if (snap) (snap.el as HTMLElement).scrollTop = snap.top;
      window.removeEventListener("focus", restore);
    };
    window.addEventListener("focus", restore);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    e.target.value = ""; // allow re-selecting the same file later
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      toast.error("Seal & signature image must be under 2MB");
      return;
    }
    onFileChosen(f);
  };

  const overlayInput = (extraClass = "") => (
    <input
      type="file"
      accept="image/png,image/jpeg"
      className={`absolute inset-0 h-full w-full opacity-0 cursor-pointer ${extraClass}`}
      onClick={handlePickerOpen}
      onChange={handleChange}
      aria-label="Seal and signature image"
    />
  );

  if (sealPreview || existingSealPath) {
    return (
      <div className="flex items-center gap-5">
        <div className="border rounded-lg bg-white p-3 shadow-sm">
          {sealPreview ? (
            <img
              src={sealPreview}
              alt="Seal & signature preview"
              className="h-20 max-w-56 object-contain"
            />
          ) : (
            <div className="h-20 w-40 flex items-center justify-center text-xs text-muted-foreground">
              Loading…
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="relative inline-flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-muted/40 text-sm font-normal cursor-pointer">
            <Upload className="size-4" />
            Replace
            {overlayInput()}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive justify-start"
            onClick={onRemove}
          >
            <X className="size-4 mr-1" />
            Remove
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-8 hover:border-primary/50 hover:bg-muted/30 transition-colors text-center cursor-pointer">
      <Stamp className="size-8 text-muted-foreground pointer-events-none" />
      <span className="text-sm font-medium pointer-events-none">
        Upload signature &amp; stamp image
      </span>
      <span className="text-xs text-muted-foreground font-normal pointer-events-none">
        PNG or JPG, up to 2MB — a transparent background looks best on the invoice
      </span>
      {overlayInput()}
    </div>
  );
}

export function FinanceInvoiceCreate() {
  const navigate = useNavigate();
  const { id: editingId } = useParams();
  const isEditing = !!editingId;
  const [loadingInvoice, setLoadingInvoice] = useState<boolean>(isEditing);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [customer, setCustomer] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    address: "",
    gstNumber: "",
  });

  const [invoiceInfo, setInvoiceInfo] = useState({
    invoicePrefix: "TS/26-27/",
    invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    invoiceDate: new Date().toISOString().split("T")[0],
    paymentTermsDays: 30,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    poNumber: "",
    poDate: "",
    ewayBillNo: "",
    vehicleNo: "",
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      productName: "",
      hsnSac: "",
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      gst: 18,
      uom: "nos",
      total: 0,
    },
  ]);

  // Notes / Terms toggles
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [showTerms, setShowTerms] = useState(true);
  const [termsAndConditions, setTermsAndConditions] = useState(DEFAULT_TERMS);

  // Discount / Additional charges toggles
  const [showDiscount, setShowDiscount] = useState(false);
  const [additionalDiscount, setAdditionalDiscount] = useState(0);
  const [showAdditionalCharges, setShowAdditionalCharges] = useState(false);
  const [additionalCharges, setAdditionalCharges] = useState(0);

  const [autoRoundOff, setAutoRoundOff] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState(0);

  // ── Shipping (GST) ──
  const [shipping, setShipping] = useState({
    sameAsBilling: true,
    address: "",
    state: "",
    stateCode: "",
  });

  // ── Tax & GST Compliance ──
  const [tax, setTax] = useState({
    placeOfSupply: "",
    rcmApplicable: false,
    customerPan: "",
  });

  // ── Payment / Bank Details ──
  const [payment, setPayment] = useState({
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branch: "",
    upiId: "",
  });

  // ── Seal & signature (stamp image printed below Terms & Conditions) ──
  const [sealFile, setSealFile] = useState<File | null>(null);
  const [sealPreview, setSealPreview] = useState<string>("");
  const [existingSealPath, setExistingSealPath] = useState<string>("");
  const [removeSeal, setRemoveSeal] = useState(false);

  // Load the stored seal image for preview when editing.
  useEffect(() => {
    if (!existingSealPath) return;
    let cancelled = false;
    let url = "";
    (async () => {
      try {
        url = await financeService.fetchSignatureObjectUrl(existingSealPath);
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        setSealPreview(url);
      } catch {
        // Missing image is not fatal — the upload zone is shown instead.
      }
    })();
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [existingSealPath]);

  // Keep shipping in sync with billing when "same as billing" is checked.
  useEffect(() => {
    if (!shipping.sameAsBilling) return;
    setShipping((prev) => ({
      ...prev,
      address: customer.address,
      state: prev.state, // state / stateCode aren't on the billing customer today
      stateCode: prev.stateCode,
    }));
  }, [customer.address, shipping.sameAsBilling]);

  // ── Edit-mode loader ──
  useEffect(() => {
    if (!editingId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingInvoice(true);
        setLoadError(null);
        const inv = await financeService.getInvoiceById(editingId);
        if (cancelled) return;
        if (!inv) {
          setLoadError(`Invoice #${editingId} not found`);
          return;
        }
        setCustomer({
          name: inv.customer?.name ?? "",
          company: inv.customer?.company ?? "",
          email: inv.customer?.email ?? "",
          phone: inv.customer?.phone ?? "",
          address: inv.customer?.address ?? "",
          gstNumber: inv.customer?.gstNumber ?? "",
        });
        // Prefix and number are stored independently on the backend now — no
        // string-slicing acrobatics.
        setInvoiceInfo({
          invoicePrefix: inv.invoicePrefix ?? "TS/26-27/",
          invoiceNumber: inv.invoiceNumber ?? "",
          invoiceDate: inv.invoiceDate ?? new Date().toISOString().split("T")[0],
          paymentTermsDays: inv.paymentTermsDays ?? 30,
          dueDate: inv.dueDate ?? new Date().toISOString().split("T")[0],
          poNumber: inv.poNumber ?? "",
          poDate: inv.poDate ?? "",
          ewayBillNo: inv.ewayBillNo ?? "",
          vehicleNo: inv.vehicleNo ?? "",
        });
        setItems(
          (inv.items ?? []).length > 0
            ? inv.items.map((it) => ({
                productName: it.productName ?? "",
                hsnSac: it.hsnSac ?? "",
                quantity: it.quantity ?? 1,
                unitPrice: it.unitPrice ?? 0,
                discount: it.discount ?? 0,
                gst: it.gst ?? 0,
                uom: (it as { uom?: string }).uom ?? "nos",
                total: it.total ?? 0,
              }))
            : [
                {
                  productName: "",
                  hsnSac: "",
                  quantity: 1,
                  unitPrice: 0,
                  discount: 0,
                  gst: 18,
                  // Matches the default applied to loaded items above; without
                  // it a blank invoice row carried no unit of measure.
                  uom: "nos",
                  total: 0,
                },
              ]
        );
        setNotes(inv.notes ?? "");
        setShowNotes(!!inv.notes);
        setTermsAndConditions(inv.termsAndConditions ?? DEFAULT_TERMS);
        setExistingSealPath(inv.signatureImagePath ?? "");
        if ((inv.additionalCharges ?? 0) > 0) {
          setShowAdditionalCharges(true);
          setAdditionalCharges(inv.additionalCharges ?? 0);
        }
        setPaymentAmount(inv.paymentAmount ?? 0);
      } catch (e) {
        if (!cancelled) {
          const msg =
            e instanceof Error ? e.message : "Failed to load invoice for editing";
          toast.error(msg);
          setLoadError(msg);
        }
      } finally {
        if (!cancelled) setLoadingInvoice(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editingId]);

  const addItem = () => {
    setItems([
      ...items,
      {
        productName: "",
        hsnSac: "",
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        gst: 18,
        uom: "nos",
        total: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    let normalizedValue = value;
    if (field === "quantity") {
      normalizedValue = clampNumber(value, 1);
    }
    if (field === "unitPrice") {
      normalizedValue = clampNumber(value, 0);
    }
    if (field === "discount" || field === "gst") {
      normalizedValue = clampNumber(value, 0, 100);
    }

    newItems[index] = { ...newItems[index], [field]: normalizedValue };

    // Recalculate total for this item
    const item = newItems[index];
    const subtotal = item.quantity * item.unitPrice;
    const discountAmount = (subtotal * item.discount) / 100;
    const afterDiscount = subtotal - discountAmount;
    const gstAmount = (afterDiscount * item.gst) / 100;
    item.total = afterDiscount + gstAmount;

    setItems(newItems);
  };

  const clampNumber = (value: number, min: number, max = Number.POSITIVE_INFINITY) => {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
  };

  // Updates Payment Terms (days) and auto-recalculates Due Date from Invoice Date
  const updatePaymentTerms = (days: number) => {
    const newDueDate = new Date(
      new Date(invoiceInfo.invoiceDate).getTime() + days * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .split("T")[0];
    setInvoiceInfo({ ...invoiceInfo, paymentTermsDays: days, dueDate: newDueDate });
  };

  const calculateTotals = () => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const totalItemDiscount = items.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice * item.discount) / 100,
      0
    );
    const afterItemDiscount = subtotal - totalItemDiscount;
    const taxableAmount = afterItemDiscount - additionalDiscount + additionalCharges;

    const totalGst = items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemDiscount = (itemSubtotal * item.discount) / 100;
      const itemAfterDiscount = itemSubtotal - itemDiscount;
      return sum + (itemAfterDiscount * item.gst) / 100;
    }, 0);

    const totalBeforeRoundOff = taxableAmount + totalGst;
    const roundedTotal = Math.round(totalBeforeRoundOff);
    const roundOffAmount = autoRoundOff ? roundedTotal - totalBeforeRoundOff : 0;
    const grandTotal = autoRoundOff ? roundedTotal : totalBeforeRoundOff;

    return {
      subtotal,
      totalDiscount: totalItemDiscount + additionalDiscount,
      additionalCharges,
      taxableAmount,
      totalGst,
      roundOffAmount,
      grandTotal,
    };
  };

  const totals = calculateTotals();
  const balanceDue = totals.grandTotal - paymentAmount;

  const handleSave = async (status: "draft" | "generated") => {
    try {
      // Validate required fields
      if (!customer.name || !customer.company || !customer.email) {
        toast.error("Please fill in all required customer fields");
        return;
      }
      // Drop blank placeholder rows — a labour/charges-only invoice is valid.
      const filledItems = items.filter((it) => it.productName.trim() !== "");
      if (filledItems.length === 0 && additionalCharges <= 0) {
        toast.error(
          "Add at least one product or enter additional charges (e.g. labour)"
        );
        return;
      }
      const invalidItemIndex = filledItems.findIndex(
        (item) =>
          item.quantity <= 0 ||
          item.unitPrice <= 0 ||
          item.discount < 0 ||
          item.discount > 100 ||
          item.gst < 0 ||
          item.gst > 100
      );
      if (invalidItemIndex !== -1) {
        toast.error(`Please check product row ${invalidItemIndex + 1}. GST and discount must be 0-100%.`);
        return;
      }

      const invoice = {
        // Store prefix and number separately end-to-end (Phase E fix — no more
        // string-concat + string-split round trip that broke edit-mode when a
        // prefix was ever changed).
        invoicePrefix: invoiceInfo.invoicePrefix,
        invoiceNumber: invoiceInfo.invoiceNumber,
        customer: {
          ...customer,
          pan: tax.customerPan,
          state: shipping.state,
          stateCode: shipping.stateCode,
        },
        invoiceDate: invoiceInfo.invoiceDate,
        dueDate: invoiceInfo.dueDate,
        paymentTermsDays: invoiceInfo.paymentTermsDays,
        poNumber: invoiceInfo.poNumber,
        poDate: invoiceInfo.poDate,
        ewayBillNo: invoiceInfo.ewayBillNo,
        vehicleNo: invoiceInfo.vehicleNo,
        // Shipping (GST)
        shipping: {
          sameAsBilling: shipping.sameAsBilling,
          address: shipping.sameAsBilling ? customer.address : shipping.address,
          state: shipping.state,
          stateCode: shipping.stateCode,
        },
        // Tax & GST
        placeOfSupply: tax.placeOfSupply,
        rcmApplicable: tax.rcmApplicable,
        // Bank / payment
        bankName: payment.bankName,
        bankAccountNumber: payment.accountNumber,
        bankIfsc: payment.ifscCode,
        bankBranch: payment.branch,
        bankUpi: payment.upiId,
        items: filledItems,
        notes,
        termsAndConditions,
        subtotal: totals.subtotal,
        totalDiscount: totals.totalDiscount,
        additionalCharges: totals.additionalCharges,
        totalGst: totals.totalGst,
        roundOffAmount: totals.roundOffAmount,
        grandTotal: totals.grandTotal,
        paymentAmount,
        status,
      } as unknown as Omit<Invoice, "id">;

      // Save invoice first — the seal image is attached to its id afterwards.
      const saved = isEditing && editingId
        ? await financeService.updateInvoice(editingId, invoice)
        : await financeService.createInvoice(invoice);

      if (saved.id) {
        try {
          if (sealFile) {
            await financeService.uploadSignature(String(saved.id), sealFile);
          } else if (removeSeal && existingSealPath) {
            await financeService.deleteSignature(String(saved.id));
          }
        } catch (e) {
          toast.error(
            e instanceof Error
              ? `Invoice saved but seal & signature update failed: ${e.message}`
              : "Invoice saved but seal & signature update failed"
          );
        }
      }

      toast.success(
        `Invoice ${
          status === "draft" ? "saved as draft" : isEditing ? "updated" : "created"
        } successfully`
      );
      navigate(
        isEditing && editingId
          ? `/admin/finance/invoices/${editingId}`
          : "/admin/finance/invoices"
      );
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create invoice");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (isEditing && loadError) {
    return (
      <div className="p-6 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/finance/invoices")}
        >
          <ArrowLeft className="size-4 mr-2" />
          Back to invoices
        </Button>
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <div className="font-medium">Could not open invoice for editing</div>
          <div className="text-muted-foreground mt-1">{loadError}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/finance/invoices")}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="mb-1">
            {isEditing ? "Edit Invoice" : "Create Invoice"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing
              ? loadingInvoice
                ? "Loading invoice…"
                : "Review and modify the invoice before saving."
              : "Generate a new invoice for your customer"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>Enter customer details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name *</Label>
                  <Input
                    id="company"
                    value={customer.company}
                    onChange={(e) =>
                      setCustomer({ ...customer, company: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Billing Address *</Label>
                <Textarea
                  id="address"
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstNumber">GST Number</Label>
                <Input
                  id="gstNumber"
                  value={customer.gstNumber}
                  onChange={(e) =>
                    setCustomer({ ...customer, gstNumber: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Shipping Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="size-4" />
                Shipping Details
              </CardTitle>
              <CardDescription>
                Where the goods/services will be delivered
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sameAsBilling"
                  checked={shipping.sameAsBilling}
                  onCheckedChange={(v) => {
                    const checked = v === true;
                    setShipping((prev) => ({
                      ...prev,
                      sameAsBilling: checked,
                      address: checked ? customer.address : prev.address,
                    }));
                  }}
                />
                <Label htmlFor="sameAsBilling" className="cursor-pointer">
                  Same as billing address
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shippingAddress">Shipping Address</Label>
                <Textarea
                  id="shippingAddress"
                  value={
                    shipping.sameAsBilling ? customer.address : shipping.address
                  }
                  onChange={(e) =>
                    setShipping({ ...shipping, address: e.target.value })
                  }
                  disabled={shipping.sameAsBilling}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shipState">Customer State</Label>
                  <Select
                    value={shipping.state}
                    onValueChange={(v) => {
                      const s = INDIAN_STATES.find((x) => x.name === v);
                      setShipping({
                        ...shipping,
                        state: v,
                        stateCode: s?.code ?? shipping.stateCode,
                      });
                    }}
                  >
                    <SelectTrigger id="shipState">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((s) => (
                        <SelectItem key={s.code} value={s.name}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shipStateCode">State Code</Label>
                  <Input
                    id="shipStateCode"
                    value={shipping.stateCode}
                    onChange={(e) =>
                      setShipping({ ...shipping, stateCode: e.target.value })
                    }
                    placeholder="e.g., 27"
                    maxLength={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tax & GST Compliance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="size-4" />
                Tax & GST Compliance
              </CardTitle>
              <CardDescription>
                Place of supply, RCM and customer PAN
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="placeOfSupply">Place of Supply *</Label>
                  <Select
                    value={tax.placeOfSupply}
                    onValueChange={(v) =>
                      setTax({ ...tax, placeOfSupply: v })
                    }
                  >
                    <SelectTrigger id="placeOfSupply">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((s) => (
                        <SelectItem key={s.code} value={s.name}>
                          {s.code} — {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPan">Customer PAN</Label>
                  <Input
                    id="customerPan"
                    value={tax.customerPan}
                    onChange={(e) =>
                      setTax({
                        ...tax,
                        customerPan: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="AAACE1234F"
                    maxLength={10}
                    className="uppercase"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reverse Charge Mechanism (RCM)</Label>
                <RadioGroup
                  value={tax.rcmApplicable ? "yes" : "no"}
                  onValueChange={(v) =>
                    setTax({ ...tax, rcmApplicable: v === "yes" })
                  }
                  className="flex gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="no" id="rcm-no" />
                    <Label htmlFor="rcm-no" className="cursor-pointer">
                      No
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="yes" id="rcm-yes" />
                    <Label htmlFor="rcm-yes" className="cursor-pointer">
                      Yes
                    </Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  Enable if the recipient is liable to pay tax under reverse
                  charge.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Information */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Information</CardTitle>
              <CardDescription>Invoice date and details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                  <Input
                    id="invoicePrefix"
                    value={invoiceInfo.invoicePrefix}
                    onChange={(e) =>
                      setInvoiceInfo({ ...invoiceInfo, invoicePrefix: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input
                    id="invoiceNumber"
                    value={invoiceInfo.invoiceNumber}
                    onChange={(e) =>
                      setInvoiceInfo({ ...invoiceInfo, invoiceNumber: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceDate">Sales Invoice Date</Label>
                  <Input
                    id="invoiceDate"
                    type="date"
                    value={invoiceInfo.invoiceDate}
                    onChange={(e) =>
                      setInvoiceInfo({ ...invoiceInfo, invoiceDate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Payment Terms (days)</Label>
                  <Input
                    id="paymentTerms"
                    type="number"
                    min={0}
                    value={invoiceInfo.paymentTermsDays}
                    onChange={(e) => updatePaymentTerms(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={invoiceInfo.dueDate}
                    onChange={(e) =>
                      setInvoiceInfo({ ...invoiceInfo, dueDate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information (PO / E-Way / Vehicle) */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>PO, e-way bill and transport details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="poNumber">PO No</Label>
                  <Input
                    id="poNumber"
                    value={invoiceInfo.poNumber}
                    onChange={(e) =>
                      setInvoiceInfo({ ...invoiceInfo, poNumber: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="poDate">PO Date</Label>
                  <Input
                    id="poDate"
                    type="date"
                    value={invoiceInfo.poDate}
                    onChange={(e) =>
                      setInvoiceInfo({ ...invoiceInfo, poDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ewayBillNo">E-Way Bill No</Label>
                  <Input
                    id="ewayBillNo"
                    value={invoiceInfo.ewayBillNo}
                    onChange={(e) =>
                      setInvoiceInfo({ ...invoiceInfo, ewayBillNo: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleNo">Vehicle No</Label>
                  <Input
                    id="vehicleNo"
                    value={invoiceInfo.vehicleNo}
                    onChange={(e) =>
                      setInvoiceInfo({ ...invoiceInfo, vehicleNo: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Products & Services</CardTitle>
                  <CardDescription>Add items to the invoice</CardDescription>
                </div>
                <Button onClick={addItem} variant="outline" size="sm">
                  <Plus className="size-4 mr-2" />
                  Add Row
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-2 space-y-2">
                      <Label className="text-xs">Product</Label>
                      <Input
                        placeholder="Product name"
                        value={item.productName}
                        onChange={(e) =>
                          updateItem(index, "productName", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label className="text-xs">HSN/SAC</Label>
                      <Input
                        placeholder="HSN/SAC"
                        value={item.hsnSac}
                        onChange={(e) => updateItem(index, "hsnSac", e.target.value)}
                      />
                    </div>
                    <div className="col-span-1 space-y-2">
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, "quantity", parseInt(e.target.value))
                        }
                      />
                    </div>
                    <div className="col-span-1 space-y-2">
                      <Label className="text-xs">UoM</Label>
                      <Select
                        value={item.uom}
                        onValueChange={(v) => updateItem(index, "uom", v)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UOM_OPTIONS.map((u) => (
                            <SelectItem key={u} value={u}>
                              {u}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1 space-y-2">
                      <Label className="text-xs">Unit Price</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(index, "unitPrice", parseFloat(e.target.value))
                        }
                      />
                    </div>
                    <div className="col-span-1 space-y-2">
                      <Label className="text-xs">Discount %</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={item.discount}
                        onChange={(e) =>
                          updateItem(index, "discount", parseFloat(e.target.value))
                        }
                      />
                    </div>
                    <div className="col-span-1 space-y-2">
                      <Label className="text-xs">GST %</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={item.gst}
                        onChange={(e) =>
                          updateItem(index, "gst", parseFloat(e.target.value))
                        }
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label className="text-xs">Total</Label>
                      <p className="text-sm font-medium pt-2">
                        {formatCurrency(item.total)}
                      </p>
                    </div>
                    <div className="col-span-1 pt-6">
                      {items.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                        >
                          <X className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notes & Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Notes & Terms</CardTitle>
              <CardDescription>Optional notes and terms shown on the invoice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {showNotes ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notes">Notes</Label>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setShowNotes(false);
                        setNotes("");
                      }}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes for this invoice"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => setShowNotes(true)}
                >
                  + Add Notes
                </button>
              )}

              {showTerms ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="terms">Terms and Conditions</Label>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setShowTerms(false)}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <Textarea
                    id="terms"
                    rows={8}
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => setShowTerms(true)}
                >
                  + Add Terms and Conditions
                </button>
              )}
            </CardContent>
          </Card>

          {/* Seal & Signature */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stamp className="size-4" />
                Seal & Signature
              </CardTitle>
              <CardDescription>
                Authorised signatory&apos;s signature with company stamp —
                printed on the invoice below Terms &amp; Conditions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SealSignatureUpload
                sealPreview={sealPreview}
                existingSealPath={existingSealPath}
                onFileChosen={(f) => {
                  if (sealPreview.startsWith("blob:")) {
                    URL.revokeObjectURL(sealPreview);
                  }
                  setSealFile(f);
                  setSealPreview(URL.createObjectURL(f));
                  setRemoveSeal(false);
                }}
                onRemove={() => {
                  if (sealPreview.startsWith("blob:")) {
                    URL.revokeObjectURL(sealPreview);
                  }
                  setSealFile(null);
                  setSealPreview("");
                  if (existingSealPath) setRemoveSeal(true);
                }}
              />
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="size-4" />
                Payment Details
              </CardTitle>
              <CardDescription>
                Bank remittance info shown on the invoice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bank */}
              <div>
                <h4 className="text-sm font-medium mb-3">Bank Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      value={payment.bankName}
                      onChange={(e) =>
                        setPayment({ ...payment, bankName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      value={payment.accountNumber}
                      onChange={(e) =>
                        setPayment({
                          ...payment,
                          accountNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ifsc">IFSC Code</Label>
                    <Input
                      id="ifsc"
                      value={payment.ifscCode}
                      onChange={(e) =>
                        setPayment({
                          ...payment,
                          ifscCode: e.target.value.toUpperCase(),
                        })
                      }
                      className="uppercase"
                      maxLength={11}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch</Label>
                    <Input
                      id="branch"
                      value={payment.branch}
                      onChange={(e) =>
                        setPayment({ ...payment, branch: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="upi">UPI ID</Label>
                    <Input
                      id="upi"
                      value={payment.upiId}
                      onChange={(e) =>
                        setPayment({ ...payment, upiId: e.target.value })
                      }
                      placeholder="name@bank"
                    />
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() =>
                navigate(
                  isEditing && editingId
                    ? `/admin/finance/invoices/${editingId}`
                    : "/admin/finance/invoices"
                )
              }
              disabled={loadingInvoice}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSave("draft")}
              disabled={loadingInvoice}
            >
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSave("generated")}
              disabled={loadingInvoice}
            >
              {isEditing ? "Save Invoice" : "Create Invoice"}
            </Button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
              <CardDescription>Live preview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 pb-4 border-b">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(totals.totalDiscount)}
                  </span>
                </div>

                {showDiscount ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="h-8"
                      value={additionalDiscount}
                      onChange={(e) => setAdditionalDiscount(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setShowDiscount(false);
                        setAdditionalDiscount(0);
                      }}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    onClick={() => setShowDiscount(true)}
                  >
                    + Add Discount
                  </button>
                )}

                {showAdditionalCharges ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="h-8"
                      value={additionalCharges}
                      onChange={(e) => setAdditionalCharges(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setShowAdditionalCharges(false);
                        setAdditionalCharges(0);
                      }}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    onClick={() => setShowAdditionalCharges(true)}
                  >
                    + Add Additional Charges
                  </button>
                )}

                <div className="flex justify-between text-sm pt-2">
                  <span className="text-muted-foreground">Taxable Amount</span>
                  <span className="font-medium">{formatCurrency(totals.taxableAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST</span>
                  <span className="font-medium">{formatCurrency(totals.totalGst)}</span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="autoRoundOff"
                    className="size-4"
                    checked={autoRoundOff}
                    onChange={(e) => setAutoRoundOff(e.target.checked)}
                  />
                  <Label htmlFor="autoRoundOff" className="text-sm cursor-pointer">
                    Auto Round Off
                  </Label>
                  {autoRoundOff && totals.roundOffAmount !== 0 && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      {totals.roundOffAmount > 0 ? "+" : ""}
                      {formatCurrency(totals.roundOffAmount)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount</span>
                <span>{formatCurrency(totals.grandTotal)}</span>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <Label htmlFor="paymentAmount" className="text-sm">
                  Enter Payment Amount
                </Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Balance Due</span>
                  <span className="font-medium">{formatCurrency(balanceDue)}</span>
                </div>
              </div>

              <div className="pt-4 space-y-2 text-sm text-muted-foreground border-t">
                <p>
                  <span className="font-medium">Invoice #:</span>{" "}
                  {invoiceInfo.invoicePrefix}
                  {invoiceInfo.invoiceNumber}
                </p>
                <p>
                  <span className="font-medium">Date:</span>{" "}
                  {new Date(invoiceInfo.invoiceDate).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-medium">Due:</span>{" "}
                  {new Date(invoiceInfo.dueDate).toLocaleDateString()}
                </p>
                {invoiceInfo.poNumber && (
                  <p>
                    <span className="font-medium">PO No:</span> {invoiceInfo.poNumber}
                  </p>
                )}
                {customer.company && (
                  <p>
                    <span className="font-medium">To:</span> {customer.company}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
