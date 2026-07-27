import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { financeService, Invoice } from "../services/financeService";
import { Button } from "../components/ui/button";
import { ArrowLeft, Download, Pencil, Printer } from "lucide-react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";

const STATE_NAMES: Record<string, string> = {
  "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab",
  "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana", "07": "Delhi",
  "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar", "19": "West Bengal",
  "21": "Odisha", "23": "Madhya Pradesh", "24": "Gujarat", "27": "Maharashtra",
  "29": "Karnataka", "30": "Goa", "32": "Kerala", "33": "Tamil Nadu",
  "36": "Telangana", "37": "Andhra Pradesh",
};

const money = (v?: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(v ?? 0);

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    draft: { label: "Draft", cls: "" },
    generated: { label: "Generated", cls: "bg-blue-500 hover:bg-blue-500 text-white" },
    partially_paid: { label: "Partially Paid", cls: "bg-amber-500 hover:bg-amber-500 text-white" },
    paid: { label: "Paid", cls: "bg-emerald-600 hover:bg-emerald-600 text-white" },
    cancelled: { label: "Cancelled", cls: "bg-destructive text-white" },
  };
  const entry = map[status] ?? { label: status, cls: "" };
  return entry.cls ? (
    <Badge className={entry.cls}>{entry.label}</Badge>
  ) : (
    <Badge variant="outline">{entry.label}</Badge>
  );
}

function stateLabel(code?: string) {
  if (!code) return "";
  const name = STATE_NAMES[code];
  return name ? `${name} (Code: ${code})` : `Code: ${code}`;
}

export function FinanceInvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const data = await financeService.getInvoiceById(id);
        if (cancelled) return;
        if (!data) {
          setLoadError(`Invoice #${id} not found`);
        } else {
          setInvoice(data);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Failed to load invoice");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    setDownloading(true);
    try {
      await financeService.downloadInvoicePdfFresh(invoice.id, invoice.invoiceNumber);
      toast.success("Invoice downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to download invoice");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (loadError || !invoice) {
    return (
      <div className="p-6 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/finance/invoices")}
        >
          <ArrowLeft className="size-4 mr-2" /> Back to invoices
        </Button>
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <div className="font-medium">Could not load invoice</div>
          <div className="text-muted-foreground mt-1">
            {loadError ?? "Invoice not found."}
          </div>
        </div>
      </div>
    );
  }

  const sameShipping =
    invoice.sameShippingAsBilling === undefined || invoice.sameShippingAsBilling === true;

  const canEdit = invoice.status !== "paid" && invoice.status !== "cancelled";

  return (
    <div className="p-6 space-y-6">
      {/* Header (hidden on print) */}
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
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="m-0">{invoice.invoiceNumber}</h1>
              {statusBadge(invoice.status)}
            </div>
            <p className="text-muted-foreground">
              Issued {fmtDate(invoice.invoiceDate)} · Due {fmtDate(invoice.dueDate)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button
              variant="outline"
              onClick={() => navigate(`/admin/finance/invoices/${invoice.id}/edit`)}
            >
              <Pencil className="size-4 mr-2" /> Edit
            </Button>
          )}
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="size-4 mr-2" /> Print
          </Button>
          <Button onClick={handleDownloadPDF} disabled={downloading}>
            <Download className="size-4 mr-2" />
            {downloading ? "Downloading…" : "Download PDF"}
          </Button>
        </div>
      </div>

      {/* Invoice document (styled like the PDF) */}
      <Card className="max-w-5xl mx-auto p-8 print:shadow-none print:border-0 print:p-0">
        {/* Top header: seller (left) + TAX INVOICE + meta (right) */}
        <div className="flex flex-col sm:flex-row justify-between gap-8 mb-6 pb-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-blue-700 mb-2 m-0">
              Techsolution
            </h2>
            <p className="text-sm">Hinjewadi Phase 1, Pune</p>
            <p className="text-sm">Maharashtra - 411057</p>
            <p className="text-sm">
              <span className="font-medium">GSTIN:</span> 27AAACE1234F1Z5{" "}
              <span className="text-muted-foreground">|</span>{" "}
              <span className="font-medium">PAN:</span> AAACE1234F
            </p>
            <p className="text-sm">
              <span className="font-medium">State:</span> Maharashtra (Code: 27)
            </p>
            <p className="text-sm">
              <span className="font-medium">Email:</span> billing@techsolution.com{" "}
              <span className="text-muted-foreground">|</span>{" "}
              <span className="font-medium">Phone:</span> +91-9876543210
            </p>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold mb-3 m-0">TAX INVOICE</h1>
            <div className="grid grid-cols-2 gap-x-4 text-sm">
              <div className="font-medium text-left sm:text-right">Invoice No:</div>
              <div className="text-right">{invoice.invoiceNumber}</div>
              <div className="font-medium text-left sm:text-right">Date:</div>
              <div className="text-right">{fmtDate(invoice.invoiceDate)}</div>
              <div className="font-medium text-left sm:text-right">Due Date:</div>
              <div className="text-right">{fmtDate(invoice.dueDate)}</div>
              {invoice.placeOfSupply && (
                <>
                  <div className="font-medium text-left sm:text-right">
                    Place of Supply:
                  </div>
                  <div className="text-right">{invoice.placeOfSupply}</div>
                </>
              )}
              {invoice.rcmApplicable && (
                <>
                  <div className="font-medium text-left sm:text-right">RCM:</div>
                  <div className="text-right">Applicable</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* PARTIES */}
        <section className="mb-6">
          <h3 className="text-sm font-semibold text-blue-700 mb-2 uppercase tracking-wide">
            Parties
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border rounded-md p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                BILL TO
              </p>
              <p className="font-semibold">
                {invoice.customer.company || invoice.customer.name}
              </p>
              {invoice.customer.company && invoice.customer.name && (
                <p className="text-sm">{invoice.customer.name}</p>
              )}
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {invoice.customer.address}
              </p>
              {invoice.billToStateCode && (
                <p className="text-sm mt-1">
                  <span className="font-medium">State:</span>{" "}
                  {stateLabel(invoice.billToStateCode)}
                </p>
              )}
              {invoice.customer.gstNumber && (
                <p className="text-sm">
                  <span className="font-medium">GSTIN:</span>{" "}
                  {invoice.customer.gstNumber}
                </p>
              )}
              {invoice.billToPan && (
                <p className="text-sm">
                  <span className="font-medium">PAN:</span> {invoice.billToPan}
                </p>
              )}
              {invoice.customer.email && (
                <p className="text-sm text-muted-foreground">
                  {invoice.customer.email}
                </p>
              )}
            </div>
            <div className="border rounded-md p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                SHIP TO
              </p>
              {sameShipping ? (
                <>
                  <p className="font-semibold">
                    {invoice.customer.company || invoice.customer.name}
                  </p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {invoice.customer.address}
                  </p>
                  <p className="text-sm italic text-muted-foreground mt-2">
                    (Same as billing)
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold">
                    {invoice.shipToCompany || invoice.shipToName || "-"}
                  </p>
                  {invoice.shipToCompany && invoice.shipToName && (
                    <p className="text-sm">{invoice.shipToName}</p>
                  )}
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {invoice.shipToAddress}
                  </p>
                  {invoice.shipToStateCode && (
                    <p className="text-sm mt-1">
                      <span className="font-medium">State:</span>{" "}
                      {stateLabel(invoice.shipToStateCode)}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* ITEMS */}
        <section className="mb-6">
          <h3 className="text-sm font-semibold text-blue-700 mb-2 uppercase tracking-wide">
            Items & Charges
          </h3>
          <div className="overflow-x-auto border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-blue-700 text-white">
                <tr>
                  <th className="px-2 py-2 text-left">#</th>
                  <th className="px-2 py-2 text-left">Description</th>
                  <th className="px-2 py-2 text-center">HSN/SAC</th>
                  <th className="px-2 py-2 text-center">Qty</th>
                  <th className="px-2 py-2 text-center">UoM</th>
                  <th className="px-2 py-2 text-right">Rate (₹)</th>
                  <th className="px-2 py-2 text-right">Taxable (₹)</th>
                  <th className="px-2 py-2 text-right">CGST</th>
                  <th className="px-2 py-2 text-right">SGST</th>
                  <th className="px-2 py-2 text-right">IGST</th>
                  <th className="px-2 py-2 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((it, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-2 py-2 align-top">{i + 1}</td>
                    <td className="px-2 py-2 align-top">{it.productName}</td>
                    <td className="px-2 py-2 text-center align-top">
                      {it.hsnSac || "-"}
                    </td>
                    <td className="px-2 py-2 text-center align-top">
                      {it.quantity}
                    </td>
                    <td className="px-2 py-2 text-center align-top text-muted-foreground">
                      {it.uom ?? "-"}
                    </td>
                    <td className="px-2 py-2 text-right align-top">
                      {money(it.unitPrice)}
                    </td>
                    <td className="px-2 py-2 text-right align-top">
                      {money(it.taxableAmount)}
                    </td>
                    <td className="px-2 py-2 text-right align-top">
                      {money(it.cgstAmount)}
                    </td>
                    <td className="px-2 py-2 text-right align-top">
                      {money(it.sgstAmount)}
                    </td>
                    <td className="px-2 py-2 text-right align-top">
                      {money(it.igstAmount)}
                    </td>
                    <td className="px-2 py-2 text-right font-medium align-top">
                      {money(it.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Payment + Summary */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-semibold text-blue-700 mb-2 uppercase tracking-wide">
              Payment Details
            </h3>
            <div className="border rounded-md p-4 space-y-1 text-sm">
              <div>
                <span className="font-medium">Bank Name:</span>{" "}
                {invoice.bankName || "HDFC Bank"}
              </div>
              <div>
                <span className="font-medium">Account Name:</span> Techsolution
              </div>
              <div>
                <span className="font-medium">Account Number:</span>{" "}
                {invoice.bankAccountNumber || "50200012345678"}
              </div>
              <div>
                <span className="font-medium">IFSC Code:</span>{" "}
                {invoice.bankIfsc || "HDFC0001234"}
              </div>
              <div>
                <span className="font-medium">Branch:</span>{" "}
                {invoice.bankBranch || "Hinjewadi, Pune"}
              </div>
              <div>
                <span className="font-medium">UPI ID:</span>{" "}
                {invoice.bankUpi || "techsolution@hdfcbank"}
              </div>
            </div>

            {invoice.termsAndConditions && (
              <>
                <h3 className="text-sm font-semibold text-blue-700 mt-4 mb-2 uppercase tracking-wide">
                  Terms & Conditions
                </h3>
                <ul className="text-xs space-y-1 list-disc pl-5">
                  {invoice.termsAndConditions
                    .split(/\r?\n/)
                    .filter((l) => l.trim())
                    .map((l, i) => (
                      <li key={i}>{l.trim()}</li>
                    ))}
                </ul>
              </>
            )}

            {/* Signatory (matches the PDF footer layout) */}
            <div className="mt-8">
              <p className="text-sm">
                For <span className="font-semibold">Techsolution</span>
              </p>
              <div className="border-t border-gray-400 mt-8 w-56" />
              <p className="text-sm font-semibold mt-1">
                {invoice.signatoryName || "Authorized Signatory"}
              </p>
              {invoice.signatoryName && (
                <p className="text-xs text-muted-foreground">
                  Authorized Signatory
                </p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-blue-700 mb-2 uppercase tracking-wide">
              Summary
            </h3>
            <div className="border rounded-md">
              <div className="grid grid-cols-2 text-sm">
                <div className="p-3 border-b">Subtotal</div>
                <div className="p-3 border-b text-right">{money(invoice.subtotal)}</div>

                <div className="p-3 border-b">Discount</div>
                <div className="p-3 border-b text-right text-red-600">
                  ({money(invoice.totalDiscount)})
                </div>

                <div className="p-3 border-b font-semibold">Taxable Amount</div>
                <div className="p-3 border-b text-right font-semibold">
                  {money(invoice.taxableAmount)}
                </div>

                <div className="p-3 border-b">CGST Total</div>
                <div className="p-3 border-b text-right">
                  {money(invoice.cgstTotal)}
                </div>

                <div className="p-3 border-b">SGST Total</div>
                <div className="p-3 border-b text-right">
                  {money(invoice.sgstTotal)}
                </div>

                <div className="p-3 border-b">IGST Total</div>
                <div className="p-3 border-b text-right">
                  {money(invoice.igstTotal)}
                </div>

                {(invoice.additionalCharges ?? 0) > 0 && (
                  <>
                    <div className="p-3 border-b">Additional Charges</div>
                    <div className="p-3 border-b text-right">
                      {money(invoice.additionalCharges)}
                    </div>
                  </>
                )}

                {(invoice.roundOffAmount ?? 0) !== 0 && (
                  <>
                    <div className="p-3 border-b">Round Off</div>
                    <div className="p-3 border-b text-right">
                      {money(invoice.roundOffAmount)}
                    </div>
                  </>
                )}

                <div className="p-3 bg-blue-50 text-blue-700 font-bold text-base">
                  GRAND TOTAL
                </div>
                <div className="p-3 bg-blue-50 text-blue-700 font-bold text-base text-right">
                  {money(invoice.grandTotal)}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-1 text-sm">
              <div>
                <span className="font-medium">Amount in Words:</span>
              </div>
              <div className="italic text-muted-foreground">
                {/* Simple client-side words are omitted; the PDF renders the
                  authoritative version. Just show currency here. */}
                {money(invoice.grandTotal)}
              </div>
            </div>

            <div className="mt-4 border rounded-md">
              <div className="grid grid-cols-2 text-sm">
                <div className="p-3 bg-blue-50 border-b font-medium">
                  Amount Paid:
                </div>
                <div className="p-3 bg-blue-50 border-b text-right">
                  {money(invoice.paymentAmount)}
                </div>
                <div
                  className={`p-3 font-semibold ${
                    (invoice.balanceDue ?? 0) > 0
                      ? "bg-red-50 text-red-700"
                      : "bg-blue-50"
                  }`}
                >
                  Balance Due:
                </div>
                <div
                  className={`p-3 text-right font-semibold ${
                    (invoice.balanceDue ?? 0) > 0
                      ? "bg-red-50 text-red-700"
                      : "bg-blue-50"
                  }`}
                >
                  {money(invoice.balanceDue)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {invoice.notes && (
          <section className="mb-4">
            <p className="text-sm">
              <span className="font-semibold">Notes:</span> {invoice.notes}
            </p>
          </section>
        )}

        <p className="text-xs text-muted-foreground italic text-center pt-4 border-t">
          This is a computer-generated invoice and does not require a physical
          signature.
        </p>
      </Card>
    </div>
  );
}
