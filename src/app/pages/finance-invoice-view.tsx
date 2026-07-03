import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { financeService, Invoice } from "../services/financeService";
import { Button } from "../components/ui/button";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";

export function FinanceInvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadInvoice(id);
    }
  }, [id]);

  const loadInvoice = async (invoiceId: string) => {
    try {
      setLoading(true);
      const data = await financeService.getInvoiceById(invoiceId);
      setInvoice(data);
    } catch (error) {
      console.error("Failed to load invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    
    try {
      toast.loading("Generating PDF...");
      
      const updatedInvoice = await financeService.generateExistingInvoicePdf(invoice.id);
      const fileName = updatedInvoice.pdfPath || updatedInvoice.downloadUrl?.split("/").pop();
      if (!fileName) {
        throw new Error("PDF file name was not returned by the server");
      }
      
      await financeService.downloadInvoicePdf(fileName);
      toast.dismiss();
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      console.error("Failed to download invoice:", error);
      toast.dismiss();
      toast.error("Failed to download invoice");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default">Paid</Badge>;
      case "generated":
        return <Badge variant="secondary">Generated</Badge>;
      case "partially_paid":
        return <Badge variant="secondary">Partially Paid</Badge>;
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Invoice not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header - No Print */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/finance/invoices")}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="mb-1">Invoice {invoice.invoiceNumber}</h1>
            <p className="text-muted-foreground">View and print invoice details</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="size-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleDownloadPDF}>
            <Download className="size-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Invoice Card */}
      <Card className="max-w-4xl mx-auto p-8 print:shadow-none print:border-0">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">INVOICE</h2>
            <p className="text-sm text-muted-foreground">
              Invoice #{invoice.invoiceNumber}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-lg">Your Company Name</p>
            <p className="text-sm text-muted-foreground">123 Business Street</p>
            <p className="text-sm text-muted-foreground">City, State 12345</p>
            <p className="text-sm text-muted-foreground">Tax ID: 123-456-789</p>
          </div>
        </div>

        {/* Customer & Invoice Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-sm font-semibold mb-2">Bill To:</p>
            <p className="font-medium">{invoice.customer.name}</p>
            <p className="text-sm text-muted-foreground">{invoice.customer.company}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {invoice.customer.address}
            </p>
            <p className="text-sm text-muted-foreground">{invoice.customer.email}</p>
            <p className="text-sm text-muted-foreground">{invoice.customer.phone}</p>
            {invoice.customer.gstNumber && (
              <p className="text-sm text-muted-foreground mt-2">
                GST: {invoice.customer.gstNumber}
              </p>
            )}
          </div>

          <div className="text-right">
            <div className="mb-4 print:hidden">{getStatusBadge(invoice.status)}</div>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-medium">Invoice Date:</span>{" "}
                {new Date(invoice.invoiceDate).toLocaleDateString()}
              </p>
              <p className="text-sm">
                <span className="font-medium">Due Date:</span>{" "}
                {new Date(invoice.dueDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-3 text-sm font-semibold">Product</th>
                <th className="text-center py-3 text-sm font-semibold">Qty</th>
                <th className="text-right py-3 text-sm font-semibold">Price</th>
                <th className="text-right py-3 text-sm font-semibold">Discount</th>
                <th className="text-right py-3 text-sm font-semibold">GST</th>
                <th className="text-right py-3 text-sm font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className="border-b border-border">
                  <td className="py-3 text-sm">{item.productName}</td>
                  <td className="py-3 text-sm text-center">{item.quantity}</td>
                  <td className="py-3 text-sm text-right">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="py-3 text-sm text-right">{item.discount}%</td>
                  <td className="py-3 text-sm text-right">{item.gst}%</td>
                  <td className="py-3 text-sm text-right font-medium">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount:</span>
              <span className="font-medium text-red-600">
                -{formatCurrency(invoice.totalDiscount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST:</span>
              <span className="font-medium">{formatCurrency(invoice.totalGst)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-border">
              <span>Total:</span>
              <span>{formatCurrency(invoice.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-2">
            <span className="font-medium">Payment Terms:</span> Payment due within 30
            days
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Note:</span> Thank you for your business!
          </p>
        </div>
      </Card>
    </div>
  );
}
