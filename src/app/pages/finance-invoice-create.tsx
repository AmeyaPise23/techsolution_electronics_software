import { useState } from "react";
import { useNavigate } from "react-router";
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
import { Plus, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface InvoiceItem {
  productName: string;
  hsnSac: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  gst: number;
  total: number;
}

const DEFAULT_TERMS = `1. Warranty - 3 Months from Date of Invoice
2. Payment - 45 Days from the date of Invoice
3. Taxes - 18% CGST & SGST(GST applicable as government guidelines)
4. Delivery - 2 to 3 working Days from the date of confirmation PO
5. Transport charges - Nil
6. Warranty has been voided in case of burn,broken or fault occur high electricity
7. Subject to Jurisdiction of the Courts at Pune Only`;

export function FinanceInvoiceCreate() {
  const navigate = useNavigate();
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
      if (items.length === 0 || items[0].productName === "") {
        toast.error("Please add at least one invoice item");
        return;
      }
      const invalidItemIndex = items.findIndex(
        (item) =>
          !item.productName ||
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
        invoicePrefix: invoiceInfo.invoicePrefix,
        invoiceNumber: `${invoiceInfo.invoicePrefix}${invoiceInfo.invoiceNumber}`,
        customer,
        invoiceDate: invoiceInfo.invoiceDate,
        dueDate: invoiceInfo.dueDate,
        paymentTermsDays: invoiceInfo.paymentTermsDays,
        poNumber: invoiceInfo.poNumber,
        poDate: invoiceInfo.poDate,
        ewayBillNo: invoiceInfo.ewayBillNo,
        vehicleNo: invoiceInfo.vehicleNo,
        items,
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
      } as Omit<Invoice, "id">;

      await financeService.createInvoice(invoice);
      toast.success(`Invoice ${status === "draft" ? "saved as draft" : "created"} successfully`);
      navigate("/admin/finance/invoices");
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
          <h1 className="mb-1">Create Invoice</h1>
          <p className="text-muted-foreground">Generate a new invoice for your customer</p>
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
                    <div className="col-span-2 space-y-2">
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

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => navigate("/admin/finance/invoices")}>
              Cancel
            </Button>
            <Button variant="outline" onClick={() => handleSave("draft")}>
              Save as Draft
            </Button>
            <Button onClick={() => handleSave("generated")}>Create Invoice</Button>
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
