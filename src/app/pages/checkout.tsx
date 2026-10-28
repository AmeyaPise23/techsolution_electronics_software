import { useState } from "react";
import { useNavigate } from "react-router";
import { Navbar } from "../components/navbar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { ArrowLeft, Loader2, Package, CheckCircle2 } from "lucide-react";
import { useCart } from "../context/cart-context";
import { getProductImageUrl } from "../services/productService";
import { toast } from "sonner";

import { API_BASE_URL } from "../config";

const priceFormatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const formatPrice = (value: number) => priceFormatter.format(value);

interface CustomerForm {
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  gstNumber: string;
  remarks: string;
}

export function Checkout() {
  const navigate = useNavigate();
  const { items, totalItems, totalPrice, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ quotationNumber: string; id: number } | null>(null);
  const [form, setForm] = useState<CustomerForm>({
    name: "",
    company: "",
    email: "",
    phone: "",
    address: "",
    gstNumber: "",
    remarks: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerForm, string>>>({});

  if (items.length === 0 && !submitted) {
    navigate("/cart");
    return null;
  }

  function validate(): boolean {
    const next: Partial<Record<keyof CustomerForm, string>> = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.company.trim()) next.company = "Company is required";
    if (!form.email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Invalid email address";
    if (!form.phone.trim()) next.phone = "Phone is required";
    if (!form.address.trim()) next.address = "Address is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function updateField(field: keyof CustomerForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const quotationItems = items.map((item, index) => ({
        productId: item.productId,
        productName: item.variantName
          ? `${item.productName} — ${item.variantName}`
          : item.productName,
        description: item.variantName ? `Variant: ${item.variantName}` : undefined,
        hsnSac: item.hsnCode || "",
        quantity: item.quantity,
        unit: "PCS",
        unitPrice: item.price,
        discountPercent: 0,
        discountAmount: 0,
        taxPercent: item.taxPercentage ?? 0,
        sortOrder: index + 1,
      }));

      const payload = {
        quotationDate: new Date().toISOString().split("T")[0],
        validTill: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        status: "DRAFT",
        currency: "INR",
        exchangeRate: 1,
        customerRemarks: form.remarks || undefined,
        customer: {
          name: form.name,
          company: form.company,
          email: form.email,
          phone: form.phone,
          address: form.address,
          gstNumber: form.gstNumber || undefined,
        },
        items: quotationItems,
        additionalDiscount: 0,
        shippingCharges: 0,
        packingCharges: 0,
        otherCharges: 0,
        autoRoundOff: true,
      };

      const response = await fetch(`${API_BASE_URL}/quotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || "Failed to submit quotation request");
      }

      const data = await response.json();
      setSubmitted({ quotationNumber: data.quotationNumber, id: data.id });
      clearCart();
      toast.success("Quotation request submitted successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-lg mx-auto text-center">
            <CheckCircle2 className="size-20 mx-auto mb-6 text-green-500" />
            <h1 className="text-3xl font-bold mb-2">Quotation Submitted!</h1>
            <p className="text-muted-foreground mb-6">
              Your quotation request <span className="font-semibold text-foreground">{submitted.quotationNumber}</span> has been submitted successfully. Our team will review it and get back to you shortly.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate("/products")} variant="outline">
                Continue Shopping
              </Button>
              <Button onClick={() => navigate(`/quotation/${submitted.id}`)}>
                View Quotation
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/cart")}
          className="mb-6 -ml-2 gap-1"
        >
          <ArrowLeft className="size-4" />
          Back to Cart
        </Button>

        <h1 className="text-2xl lg:text-3xl font-bold mb-8">Checkout — Request Quotation</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Customer Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>We'll use this to send your quotation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        placeholder="John Doe"
                      />
                      {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company *</Label>
                      <Input
                        id="company"
                        value={form.company}
                        onChange={(e) => updateField("company", e.target.value)}
                        placeholder="Acme Corp"
                      />
                      {errors.company && <p className="text-xs text-red-500">{errors.company}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        placeholder="john@acme.com"
                      />
                      {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        value={form.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        placeholder="+91 98765 43210"
                      />
                      {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Billing Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      value={form.address}
                      onChange={(e) => updateField("address", e.target.value)}
                      placeholder="Street address, city, state, PIN code"
                      rows={3}
                    />
                    {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gstNumber">GST Number (optional)</Label>
                    <Input
                      id="gstNumber"
                      value={form.gstNumber}
                      onChange={(e) => updateField("gstNumber", e.target.value)}
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Additional Remarks</CardTitle>
                  <CardDescription>Any special requirements or notes for this order</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={form.remarks}
                    onChange={(e) => updateField("remarks", e.target.value)}
                    placeholder="e.g., delivery timeline, custom specifications..."
                    rows={3}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                  <CardDescription>{totalItems} item{totalItems !== 1 ? "s" : ""}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {items.map((item) => {
                      const imageUrl = getProductImageUrl(item.primaryImageId);
                      return (
                        <div key={`${item.productId}-${item.variantId ?? ""}`} className="flex gap-3">
                          <div className="size-12 rounded-md overflow-hidden bg-muted shrink-0">
                            {imageUrl ? (
                              <img src={imageUrl} alt={item.productName} className="size-full object-cover" />
                            ) : (
                              <div className="size-full flex items-center justify-center">
                                <Package className="size-5 opacity-30" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.productName}</p>
                            {item.variantName && (
                              <p className="text-xs text-muted-foreground">{item.variantName}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {formatPrice(item.price)} x {item.quantity}
                            </p>
                          </div>
                          <span className="text-sm font-medium whitespace-nowrap">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatPrice(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxes & Shipping</span>
                      <span className="text-xs text-muted-foreground">Included in quotation</span>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Estimated Total</span>
                      <span>{formatPrice(totalPrice)}</span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full gap-2"
                    size="lg"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Request Quotation"
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    By submitting, you agree to receive a quotation from our team. No payment is required now.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
