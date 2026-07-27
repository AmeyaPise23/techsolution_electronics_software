import { useCallback, useEffect, useState } from "react";
import { financeService, Invoice } from "../services/financeService";
import { Plus, Search, Eye, Download, Pencil, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router";

const PAGE_SIZE = 20;

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string; variant?: "default" | "outline" | "secondary" | "destructive" }> = {
    draft: { label: "Draft", cls: "", variant: "outline" },
    generated: { label: "Generated", cls: "bg-blue-500 hover:bg-blue-500 text-white" },
    partially_paid: { label: "Partially Paid", cls: "bg-amber-500 hover:bg-amber-500 text-white" },
    paid: { label: "Paid", cls: "bg-emerald-600 hover:bg-emerald-600 text-white" },
    cancelled: { label: "Cancelled", cls: "", variant: "outline" },
  };
  const entry = map[status] ?? { label: status, cls: "" };
  return entry.cls ? (
    <Badge className={entry.cls}>{entry.label}</Badge>
  ) : (
    <Badge variant={entry.variant ?? "outline"}>{entry.label}</Badge>
  );
}

const money = (v?: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(v ?? 0);

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-IN") : "-";

export function FinanceInvoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await financeService.searchInvoices({
        q: searchQuery.trim() || undefined,
        status:
          statusFilter !== "all"
            ? (statusFilter as Invoice["status"])
            : undefined,
        page,
        size: PAGE_SIZE,
      });
      setInvoices(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Debounce search input; reset to page 0 when filters change.
  useEffect(() => {
    const t = setTimeout(() => setPage(0), 300);
    return () => clearTimeout(t);
  }, [searchQuery, statusFilter]);

  const handleDelete = async (id: string, invoiceNumber: string) => {
    if (!confirm(`Delete invoice ${invoiceNumber}? Paid/partially-paid invoices must be cancelled instead.`)) return;
    try {
      await financeService.deleteInvoice(id);
      toast.success(`Invoice ${invoiceNumber} deleted`);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete invoice");
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      await financeService.downloadInvoicePdfFresh(invoice.id, invoice.invoiceNumber);
      toast.success(`Downloaded ${invoice.invoiceNumber}.pdf`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to download invoice");
    }
  };

  // Stats limited to the visible page.
  const pageTotal = invoices.reduce((s, i) => s + (i.grandTotal ?? 0), 0);
  const pagePaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + (i.grandTotal ?? 0), 0);
  const pageOutstanding = invoices
    .filter((i) => i.status === "generated" || i.status === "partially_paid")
    .reduce((s, i) => s + ((i.balanceDue ?? i.grandTotal) ?? 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="mb-1">Invoices</h1>
          <p className="text-muted-foreground">
            {totalElements} total{totalElements === 1 ? " invoice" : " invoices"}
          </p>
        </div>
        <Button onClick={() => navigate("/admin/finance/invoices/create")}>
          <Plus className="size-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Stats (current page) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">On this page</p>
          <p className="text-2xl font-bold">{invoices.length}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Page value</p>
          <p className="text-2xl font-bold">{money(pageTotal)}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Paid (page)</p>
          <p className="text-2xl font-bold text-green-600">{money(pagePaid)}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Outstanding (page)</p>
          <p className="text-2xl font-bold text-orange-600">
            {money(pageOutstanding)}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by number, customer, PO, e-way bill, email, phone…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="generated">Generated</SelectItem>
            <SelectItem value="partially_paid">Partially Paid</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoices Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Grand Total</TableHead>
                <TableHead className="text-right">Balance Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading invoices…
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-muted-foreground">
                        {totalElements === 0 ? "No invoices yet" : "No invoices match your filter"}
                      </p>
                      {totalElements === 0 && (
                        <Button
                          variant="outline"
                          onClick={() => navigate("/admin/finance/invoices/create")}
                        >
                          <Plus className="size-4 mr-2" />
                          Create your first invoice
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {invoice.customer?.company || invoice.customer?.name}
                        </p>
                        {invoice.customer?.company && invoice.customer?.name && (
                          <p className="text-sm text-muted-foreground">
                            {invoice.customer.name}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{fmtDate(invoice.invoiceDate)}</TableCell>
                    <TableCell>{fmtDate(invoice.dueDate)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {money(invoice.grandTotal)}
                    </TableCell>
                    <TableCell
                      className={`text-right ${
                        (invoice.balanceDue ?? 0) > 0
                          ? "text-orange-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      {money(invoice.balanceDue)}
                    </TableCell>
                    <TableCell>{statusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            navigate(`/admin/finance/invoices/${invoice.id}`)
                          }
                          title="View"
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadPDF(invoice)}
                          title="Download PDF"
                        >
                          <Download className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            navigate(`/admin/finance/invoices/${invoice.id}/edit`)
                          }
                          title="Edit"
                          disabled={
                            invoice.status === "paid" ||
                            invoice.status === "cancelled"
                          }
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleDelete(invoice.id, invoice.invoiceNumber)
                          }
                          title="Delete"
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
