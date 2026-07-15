import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Copy,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  ArrowRightLeft,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
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
import { useNavigate } from "react-router";

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

export function SalesQuotations() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<number | null>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [quotationToConvert, setQuotationToConvert] = useState<number | null>(null);

  const loadQuotations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await quotationService.getQuotations();
      setQuotations(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load quotations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuotations();
  }, [loadQuotations]);

  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch =
      !searchQuery ||
      q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customer?.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.salesPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.projectName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async () => {
    if (!quotationToDelete) return;
    try {
      await quotationService.deleteQuotation(quotationToDelete);
      setQuotations((prev) => prev.filter((q) => q.id !== quotationToDelete));
      toast.success("Quotation deleted");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    } finally {
      setDeleteDialogOpen(false);
      setQuotationToDelete(null);
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      const dup = await quotationService.duplicateQuotation(id);
      setQuotations((prev) => [dup, ...prev]);
      toast.success("Quotation duplicated");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to duplicate");
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const updated = await quotationService.updateStatus(id, status);
      setQuotations((prev) => prev.map((q) => (q.id === id ? updated : q)));
      toast.success(`Quotation marked as ${status}`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    }
  };

  const handleConvert = async () => {
    if (!quotationToConvert) return;
    try {
      const updated = await quotationService.convertToInvoice(quotationToConvert);
      setQuotations((prev) =>
        prev.map((q) => (q.id === quotationToConvert ? updated : q))
      );
      toast.success(`Converted to invoice ${updated.convertedInvoiceNumber}`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to convert");
    } finally {
      setConvertDialogOpen(false);
      setQuotationToConvert(null);
    }
  };

  const totalAmount = quotations.reduce((s, q) => s + (q.grandTotal || 0), 0);
  const acceptedAmount = quotations
    .filter((q) => q.status === "accepted" || q.status === "converted")
    .reduce((s, q) => s + (q.grandTotal || 0), 0);
  const pendingAmount = quotations
    .filter((q) => q.status === "sent" || q.status === "viewed")
    .reduce((s, q) => s + (q.grandTotal || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="mb-1">Quotations</h1>
          <p className="text-muted-foreground">
            Create and manage sales quotations for your clients
          </p>
        </div>
        <Button onClick={() => navigate("/admin/quotations/create")}>
          <Plus className="size-4 mr-2" />
          New Quotation
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground">Total Quotations</p>
          <p className="text-2xl font-bold mt-1">{quotations.length}</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground">Total Value</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground">Accepted</p>
          <p className="text-2xl font-bold mt-1 text-green-600">
            {formatCurrency(acceptedAmount)}
          </p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold mt-1 text-orange-500">
            {formatCurrency(pendingAmount)}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by number, client, sales person, project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="viewed">Viewed</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quotation #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Valid Till</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Sales Person</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Loading quotations...
                  </TableCell>
                </TableRow>
              ) : filteredQuotations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <div className="size-14 rounded-full bg-muted flex items-center justify-center">
                        <FileText className="size-7 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground mt-2">
                        No quotations found
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => navigate("/admin/quotations/create")}
                      >
                        <Plus className="size-4 mr-2" />
                        Create your first quotation
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuotations.map((q) => {
                  const cfg = statusConfig[q.status] || statusConfig.draft;
                  return (
                    <TableRow key={q.id}>
                      <TableCell className="font-medium">
                        {q.quotationNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{q.customer?.name || "-"}</p>
                          {q.customer?.company && (
                            <p className="text-xs text-muted-foreground">
                              {q.customer.company}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {q.quotationDate
                          ? new Date(q.quotationDate).toLocaleDateString("en-IN")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {q.validTill
                          ? new Date(q.validTill).toLocaleDateString("en-IN")
                          : "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(q.grandTotal)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {q.salesPerson || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {q.convertedInvoiceNumber || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View"
                            onClick={() => navigate(`/admin/quotations/${q.id}`)}
                          >
                            <Eye className="size-4" />
                          </Button>
                          {q.status !== "converted" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Edit"
                              onClick={() =>
                                navigate(`/admin/quotations/${q.id}/edit`)
                              }
                            >
                              <Pencil className="size-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Duplicate"
                            onClick={() => handleDuplicate(q.id)}
                          >
                            <Copy className="size-4" />
                          </Button>
                          {q.status === "draft" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Send"
                              onClick={() => handleStatusChange(q.id, "sent")}
                            >
                              <Send className="size-4" />
                            </Button>
                          )}
                          {(q.status === "sent" || q.status === "viewed") && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Accept"
                                onClick={() => handleStatusChange(q.id, "accepted")}
                              >
                                <CheckCircle2 className="size-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Reject"
                                onClick={() => handleStatusChange(q.id, "rejected")}
                              >
                                <XCircle className="size-4 text-red-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Mark Expired"
                                onClick={() => handleStatusChange(q.id, "expired")}
                              >
                                <Clock className="size-4 text-orange-500" />
                              </Button>
                            </>
                          )}
                          {(q.status === "accepted" || q.status === "sent") &&
                            !q.convertedInvoiceId && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Convert to Invoice"
                                onClick={() => {
                                  setQuotationToConvert(q.id);
                                  setConvertDialogOpen(true);
                                }}
                              >
                                <ArrowRightLeft className="size-4 text-blue-600" />
                              </Button>
                            )}
                          {q.status !== "converted" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete"
                              onClick={() => {
                                setQuotationToDelete(q.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quotation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this quotation and all its data. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <AlertDialogAction onClick={handleConvert}>Convert</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
