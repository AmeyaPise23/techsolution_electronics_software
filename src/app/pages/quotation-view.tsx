import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Printer,
  Pencil,
  Copy,
  Send,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  Clock,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  quotationService,
  Quotation,
  QuotationStatus,
} from "../services/quotationService";
import { toast } from "sonner";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount || 0);

const statusConfig: Record<
  QuotationStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  draft: { label: "Draft", variant: "outline" },
  sent: { label: "Sent", variant: "secondary" },
  viewed: { label: "Viewed", variant: "secondary" },
  accepted: { label: "Accepted", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  expired: { label: "Expired", variant: "outline" },
  converted: { label: "Converted", variant: "default" },
};

export function QuotationView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    quotationService
      .getQuotationById(Number(id))
      .then(setQuotation)
      .catch(() => toast.error("Failed to load quotation"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (status: string) => {
    if (!quotation) return;
    try {
      const updated = await quotationService.updateStatus(quotation.id, status);
      setQuotation(updated);
      toast.success(`Quotation marked as ${status}`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    }
  };

  const handleDuplicate = async () => {
    if (!quotation) return;
    try {
      const dup = await quotationService.duplicateQuotation(quotation.id);
      toast.success("Duplicated as " + dup.quotationNumber);
      navigate(`/admin/quotations/${dup.id}`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to duplicate");
    }
  };

  const handleConvert = async () => {
    if (!quotation) return;
    try {
      const updated = await quotationService.convertToInvoice(quotation.id);
      setQuotation(updated);
      toast.success(`Converted to invoice ${updated.convertedInvoiceNumber}`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to convert");
    } finally {
      setConvertDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Quotation not found.</p>
      </div>
    );
  }

  const cfg = statusConfig[quotation.status] || statusConfig.draft;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/quotations")}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="mb-0">{quotation.quotationNumber}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={cfg.variant}>{cfg.label}</Badge>
              {quotation.convertedInvoiceNumber && (
                <span className="text-xs text-muted-foreground">
                  Invoice: {quotation.convertedInvoiceNumber}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="size-4 mr-1" />
            Print
          </Button>
          {quotation.status !== "converted" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate(`/admin/quotations/${quotation.id}/edit`)
              }
            >
              <Pencil className="size-4 mr-1" />
              Edit
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDuplicate}>
            <Copy className="size-4 mr-1" />
            Duplicate
          </Button>
          {quotation.status === "draft" && (
            <Button size="sm" onClick={() => handleStatusChange("sent")}>
              <Send className="size-4 mr-1" />
              Send
            </Button>
          )}
          {(quotation.status === "sent" || quotation.status === "viewed") && (
            <>
              <Button
                size="sm"
                onClick={() => handleStatusChange("accepted")}
              >
                <CheckCircle2 className="size-4 mr-1" />
                Accept
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("rejected")}
              >
                <XCircle className="size-4 mr-1" />
                Reject
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("expired")}
              >
                <Clock className="size-4 mr-1" />
                Expire
              </Button>
            </>
          )}
          {(quotation.status === "accepted" || quotation.status === "sent") &&
            !quotation.convertedInvoiceId && (
              <Button size="sm" onClick={() => setConvertDialogOpen(true)}>
                <ArrowRightLeft className="size-4 mr-1" />
                Convert to Invoice
              </Button>
            )}
        </div>
      </div>

      {/* Quotation Document */}
      <div className="max-w-4xl mx-auto rounded-lg border border-border bg-card p-8 print:shadow-none print:border-0">
        {/* Doc Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-bold">QUOTATION</h2>
            <p className="text-muted-foreground mt-1">
              {quotation.quotationNumber}
            </p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Your Company Name</p>
            <p>Your Address Line 1</p>
            <p>City, State - PIN</p>
            <p>GSTIN: YOUR-GST-NUMBER</p>
          </div>
        </div>

        {/* Customer & Quotation Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
              Bill To (Client)
            </h3>
            <p className="font-medium">{quotation.customer?.name}</p>
            {quotation.customer?.company && (
              <p className="text-sm">{quotation.customer.company}</p>
            )}
            {quotation.customer?.address && (
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {quotation.customer.address}
              </p>
            )}
            {quotation.customer?.email && (
              <p className="text-sm text-muted-foreground">
                {quotation.customer.email}
              </p>
            )}
            {quotation.customer?.phone && (
              <p className="text-sm text-muted-foreground">
                {quotation.customer.phone}
              </p>
            )}
            {quotation.customer?.gstNumber && (
              <p className="text-sm text-muted-foreground">
                GSTIN: {quotation.customer.gstNumber}
              </p>
            )}
          </div>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span>
                {quotation.quotationDate
                  ? new Date(quotation.quotationDate).toLocaleDateString("en-IN")
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valid Till:</span>
              <span>
                {quotation.validTill
                  ? new Date(quotation.validTill).toLocaleDateString("en-IN")
                  : "-"}
              </span>
            </div>
            {quotation.salesPerson && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sales Person:</span>
                <span>{quotation.salesPerson}</span>
              </div>
            )}
            {quotation.referenceNumber && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ref #:</span>
                <span>{quotation.referenceNumber}</span>
              </div>
            )}
            {quotation.projectName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Project:</span>
                <span>{quotation.projectName}</span>
              </div>
            )}
            {quotation.paymentTerms && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Terms:</span>
                <span>{quotation.paymentTerms}</span>
              </div>
            )}
            {quotation.warranty && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Warranty:</span>
                <span>{quotation.warranty}</span>
              </div>
            )}
          </div>
        </div>

        {/* Ship To (if different) */}
        {quotation.shipToAddress && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
              Ship To
            </h3>
            <p className="text-sm">
              {quotation.shipToName}
              {quotation.shipToCompany && ` - ${quotation.shipToCompany}`}
            </p>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {quotation.shipToAddress}
            </p>
          </div>
        )}

        {/* Items Table */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-2 font-semibold">#</th>
                <th className="text-left py-2 font-semibold">Product</th>
                <th className="text-left py-2 font-semibold">HSN</th>
                <th className="text-right py-2 font-semibold">Qty</th>
                <th className="text-right py-2 font-semibold">Price</th>
                <th className="text-right py-2 font-semibold">Disc %</th>
                <th className="text-right py-2 font-semibold">Tax %</th>
                <th className="text-right py-2 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items?.map((item, i) => (
                <tr key={item.id || i} className="border-b border-border">
                  <td className="py-2 text-muted-foreground">{i + 1}</td>
                  <td className="py-2">
                    <p className="font-medium">{item.productName}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {item.hsnSac || "-"}
                  </td>
                  <td className="py-2 text-right">
                    {item.quantity} {item.unit || ""}
                  </td>
                  <td className="py-2 text-right">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="py-2 text-right">{item.discountPercent}%</td>
                  <td className="py-2 text-right">{item.taxPercent}%</td>
                  <td className="py-2 text-right font-medium">
                    {formatCurrency(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-72 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(quotation.subtotal)}</span>
            </div>
            {quotation.totalDiscount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Discount</span>
                <span>-{formatCurrency(quotation.totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxable Amount</span>
              <span>{formatCurrency(quotation.taxableAmount)}</span>
            </div>
            {quotation.cgstTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">CGST</span>
                <span>{formatCurrency(quotation.cgstTotal)}</span>
              </div>
            )}
            {quotation.sgstTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">SGST</span>
                <span>{formatCurrency(quotation.sgstTotal)}</span>
              </div>
            )}
            {quotation.igstTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">IGST</span>
                <span>{formatCurrency(quotation.igstTotal)}</span>
              </div>
            )}
            {quotation.cessTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">CESS</span>
                <span>{formatCurrency(quotation.cessTotal)}</span>
              </div>
            )}
            {(quotation.shippingCharges > 0 ||
              quotation.packingCharges > 0 ||
              quotation.otherCharges > 0) && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Charges</span>
                <span>
                  {formatCurrency(
                    (quotation.shippingCharges || 0) +
                      (quotation.packingCharges || 0) +
                      (quotation.otherCharges || 0)
                  )}
                </span>
              </div>
            )}
            {quotation.roundOffAmount !== 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Round Off</span>
                <span>{formatCurrency(quotation.roundOffAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t-2 border-border pt-2">
              <span>Grand Total</span>
              <span>{formatCurrency(quotation.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Terms & Notes */}
        {quotation.paymentTerms && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1">
              Payment Terms
            </h3>
            <p className="text-sm whitespace-pre-line">{quotation.paymentTerms}</p>
          </div>
        )}
        {quotation.deliveryTerms && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1">
              Delivery Terms
            </h3>
            <p className="text-sm whitespace-pre-line">
              {quotation.deliveryTerms}
            </p>
          </div>
        )}
        {quotation.notes && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1">
              Notes
            </h3>
            <p className="text-sm whitespace-pre-line">{quotation.notes}</p>
          </div>
        )}
        {quotation.termsAndConditions && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1">
              Terms & Conditions
            </h3>
            <p className="text-sm whitespace-pre-line">
              {quotation.termsAndConditions}
            </p>
          </div>
        )}
      </div>

      {/* Activity Log */}
      {quotation.activityLogs && quotation.activityLogs.length > 0 && (
        <div className="max-w-4xl mx-auto rounded-lg border border-border bg-card p-6 print:hidden">
          <h2 className="text-lg font-semibold mb-4">Activity History</h2>
          <div className="space-y-3">
            {quotation.activityLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 text-sm border-b border-border pb-3 last:border-0"
              >
                <div className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{log.action}</span>
                    {log.performedBy && (
                      <span className="text-muted-foreground">
                        by {log.performedBy}
                      </span>
                    )}
                  </div>
                  {log.remarks && (
                    <p className="text-muted-foreground text-xs mt-0.5">
                      {log.remarks}
                    </p>
                  )}
                  {log.performedAt && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(log.performedAt).toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Convert Dialog */}
      <AlertDialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert to Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new invoice from this quotation and mark it as
              converted. The quotation cannot be converted again after this.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConvert}>
              Convert
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
