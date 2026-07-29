import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Navbar } from "../components/navbar";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { CheckCircle2, Clock, FileText, ArrowLeft, Loader2 } from "lucide-react";

const API_BASE_URL = "http://localhost:8080/api";

const priceFormatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const formatPrice = (value: number) => priceFormatter.format(value);

interface QuotationData {
  id: number;
  quotationNumber: string;
  quotationDate: string;
  validTill?: string;
  status: string;
  customer: {
    name: string;
    company: string;
    email: string;
    phone: string;
    address: string;
    gstNumber?: string;
  };
  items: Array<{
    productName: string;
    description?: string;
    hsnSac?: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    discountPercent: number;
    discountAmount: number;
    taxPercent: number;
    taxAmount: number;
    lineTotal: number;
  }>;
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  customerRemarks?: string;
  createdAt?: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Under Review", variant: "secondary" },
  sent: { label: "Sent", variant: "default" },
  viewed: { label: "Viewed", variant: "outline" },
  accepted: { label: "Accepted", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  expired: { label: "Expired", variant: "destructive" },
  converted: { label: "Converted to Invoice", variant: "default" },
};

export function QuotationConfirmation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<QuotationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/quotations/${id}`);
        if (!res.ok) throw new Error("Quotation not found");
        const data = await res.json();
        setQuotation(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load quotation");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container mx-auto px-4 py-16 flex justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container mx-auto px-4 py-16 text-center">
          <FileText className="size-16 mx-auto mb-4 text-muted-foreground opacity-40" />
          <h2 className="text-xl font-bold mb-2">Quotation not found</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => navigate("/products")}>Back to Products</Button>
        </main>
      </div>
    );
  }

  const status = statusConfig[quotation.status.toLowerCase()] ?? statusConfig.draft;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/products")}
          className="mb-6 -ml-2 gap-1"
        >
          <ArrowLeft className="size-4" />
          Back to Products
        </Button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-8 text-green-500" />
            <div>
              <h1 className="text-2xl font-bold">{quotation.quotationNumber}</h1>
              <p className="text-sm text-muted-foreground">
                Submitted on {new Date(quotation.quotationDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <Badge variant={status.variant} className="text-sm px-3 py-1 w-fit">
            {status.label}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items + Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items Table */}
            <Card>
              <CardHeader>
                <CardTitle>Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Tax</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotation.items.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <p className="font-medium text-sm">{item.productName}</p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            )}
                            {item.hsnSac && (
                              <p className="text-xs text-muted-foreground">HSN: {item.hsnSac}</p>
                            )}
                          </TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatPrice(item.unitPrice)}</TableCell>
                          <TableCell className="text-right">
                            {item.taxPercent > 0 ? `${item.taxPercent}%` : "—"}
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatPrice(item.lineTotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Remarks */}
            {quotation.customerRemarks && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Remarks</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{quotation.customerRemarks}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(quotation.subtotal)}</span>
                </div>
                {quotation.totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(quotation.totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatPrice(quotation.totalTax)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-bold text-lg">
                  <span>Grand Total</span>
                  <span>{formatPrice(quotation.grandTotal)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle>Your Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium">{quotation.customer.name}</p>
                <p className="text-muted-foreground">{quotation.customer.company}</p>
                <p className="text-muted-foreground">{quotation.customer.email}</p>
                <p className="text-muted-foreground">{quotation.customer.phone}</p>
                <p className="text-muted-foreground">{quotation.customer.address}</p>
                {quotation.customer.gstNumber && (
                  <p className="text-muted-foreground">GST: {quotation.customer.gstNumber}</p>
                )}
              </CardContent>
            </Card>

            {/* Validity */}
            {quotation.validTill && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="size-4" />
                    Validity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    This quotation is valid until{" "}
                    <span className="font-medium text-foreground">
                      {new Date(quotation.validTill).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
