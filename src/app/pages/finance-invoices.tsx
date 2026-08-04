import { useCallback, useEffect, useMemo, useState } from "react";
import { financeService, Invoice, InvoiceDashboardData } from "../services/financeService";
import {
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Hourglass,
  IndianRupee,
  Loader2,
  Mail,
  MoreHorizontal,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Send,
  Share2,
  ShoppingCart,
  SlidersHorizontal,
  Trash2,
  TriangleAlert,
  WalletCards,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import type { LucideIcon } from "lucide-react";

const PAGE_SIZE = 10;

const metricCards: {
  key: "total" | "collected" | "outstanding" | "overdue";
  label: string;
  icon: LucideIcon;
  tint: string;
  iconTint: string;
}[] = [
  {
    key: "total",
    label: "Total Invoiced",
    icon: ReceiptText,
    tint: "border-blue-200 bg-gradient-to-br from-blue-50/95 to-white shadow-blue-100/50",
    iconTint: "bg-blue-100 text-blue-700",
  },
  {
    key: "collected",
    label: "Collected",
    icon: WalletCards,
    tint: "border-emerald-200 bg-gradient-to-br from-emerald-50/95 to-white shadow-emerald-100/50",
    iconTint: "bg-emerald-100 text-emerald-700",
  },
  {
    key: "outstanding",
    label: "Outstanding",
    icon: Hourglass,
    tint: "border-orange-200 bg-gradient-to-br from-orange-50/95 to-white shadow-orange-100/50",
    iconTint: "bg-orange-100 text-orange-800",
  },
  {
    key: "overdue",
    label: "Overdue",
    icon: TriangleAlert,
    tint: "border-rose-200 bg-gradient-to-br from-rose-50/95 to-white shadow-rose-100/50",
    iconTint: "bg-rose-100 text-rose-700",
  },
];

const money = (value?: number, maximumFractionDigits = 2) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits,
  }).format(value ?? 0);

const compactMoney = (value?: number) => {
  const amount = value ?? 0;
  if (amount >= 10000000) return `${money(amount / 10000000, 2)}Cr`;
  if (amount >= 100000) return `${money(amount / 100000, 2)}L`;
  return money(amount, amount >= 1000 ? 0 : 2);
};

const fmtDate = (date?: string) =>
  date ? new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

const safeDate = (date?: string) => {
  if (!date) return undefined;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const daysBetween = (from?: string, to?: string) => {
  const start = safeDate(from);
  const end = safeDate(to);
  if (!start || !end) return undefined;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
};

const localDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const periodRange = (period: string) => {
  const now = new Date();
  if (period === "last-month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { dateFrom: localDate(start), dateTo: localDate(end) };
  }
  if (period === "quarter") {
    const quarterStart = Math.floor(now.getMonth() / 3) * 3;
    return { dateFrom: localDate(new Date(now.getFullYear(), quarterStart, 1)), dateTo: localDate(now) };
  }
  if (period === "year") {
    return { dateFrom: localDate(new Date(now.getFullYear(), 0, 1)), dateTo: localDate(now) };
  }
  return { dateFrom: localDate(new Date(now.getFullYear(), now.getMonth(), 1)), dateTo: localDate(now) };
};

function statusBadge(status: string) {
  const map: Record<
    string,
    { label: string; cls: string; variant?: "default" | "outline" | "secondary" | "destructive" }
  > = {
    draft: { label: "Draft", cls: "border-slate-300 bg-slate-50 text-slate-700", variant: "outline" },
    generated: { label: "Generated", cls: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
    partially_paid: { label: "Partially Paid", cls: "bg-amber-100 text-amber-700 hover:bg-amber-100" },
    paid: { label: "Paid", cls: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" },
    cancelled: { label: "Cancelled", cls: "border-rose-200 bg-rose-50 text-rose-700", variant: "outline" },
  };
  const entry = map[status] ?? { label: status, cls: "" };
  return entry.cls ? (
    <Badge className={`rounded-md px-2.5 py-0.5 text-xs font-semibold ${entry.cls}`}>
      {entry.label}
    </Badge>
  ) : (
    <Badge variant={entry.variant ?? "outline"}>{entry.label}</Badge>
  );
}

function initials(name?: string) {
  return (name || "NA")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function MetricCard({
  label,
  value,
  note,
  Icon,
  tint,
  iconTint,
  danger,
}: {
  label: string;
  value: string;
  note: string;
  Icon: LucideIcon;
  tint: string;
  iconTint: string;
  danger?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-5 shadow-sm ${tint}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="mt-2 text-[28px] font-bold leading-none tracking-normal text-slate-950 md:text-[32px]">
            {value}
          </p>
        </div>
        <div className={`flex size-12 shrink-0 items-center justify-center rounded-full ${iconTint}`}>
          <Icon className="size-6" />
        </div>
      </div>
      <p className={`mt-4 text-sm font-semibold ${danger ? "text-red-600" : "text-teal-700"}`}>
        {note}
      </p>
    </div>
  );
}

const TREND_PERIODS = [
  { value: 3, label: "3 Months" },
  { value: 6, label: "6 Months" },
  { value: 9, label: "9 Months" },
  { value: 12, label: "12 Months" },
] as const;

function TrendChart({
  trendData,
  trendMonths,
  onTrendMonthsChange,
}: {
  trendData?: InvoiceDashboardData["trend"];
  trendMonths: number;
  onTrendMonthsChange: (months: number) => void;
}) {
  const trend = useMemo(() => {
    if (!trendData?.length) return [];
    return trendData.map((item) => ({
      month: item.month,
      value: (item.totalInvoiced ?? 0),
    }));
  }, [trendData]);

  const maxValue = Math.max(...trend.map((item) => item.value), 1);

  const ySteps = 5;
  const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => {
    const val = maxValue - (maxValue / ySteps) * i;
    return compactMoney(val);
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-base font-bold text-slate-950">Invoice Trend</h2>
        <Select value={String(trendMonths)} onValueChange={(v) => onTrendMonthsChange(Number(v))}>
          <SelectTrigger className="h-8 w-[130px] rounded-lg border-slate-200 text-xs text-slate-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TREND_PERIODS.map((p) => (
              <SelectItem key={p.value} value={String(p.value)}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {trend.length === 0 ? (
        <div className="flex min-h-[214px] items-center justify-center text-sm text-slate-500">
          No invoice data for this period
        </div>
      ) : (
        <div className="grid min-h-[214px] grid-cols-[48px_1fr] gap-3">
          <div className="flex flex-col justify-between pb-7 pt-1 text-[11px] font-medium text-slate-600">
            {yLabels.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>
          <div className="relative">
            <div className="absolute inset-x-0 top-0 bottom-7 flex flex-col justify-between">
              {Array.from({ length: ySteps + 1 }).map((_, index) => (
                <span key={index} className="border-t border-dashed border-slate-200" />
              ))}
            </div>
            <div className="relative z-10 flex h-full items-end justify-between gap-1 pb-7">
              {trend.map((item, index) => (
                <div key={item.month} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <div
                    className="w-full max-w-6 rounded-t-md bg-gradient-to-t from-blue-300 to-blue-600 shadow-sm shadow-blue-100"
                    style={{ height: `${Math.max(6, (item.value / maxValue) * 166)}px` }}
                    title={`${item.month}: ${money(item.value, 0)}`}
                  />
                  <span className="text-[11px] font-medium text-slate-700">{item.month}</span>
                  {index === trend.length - 1 && item.value > 0 && (
                    <span className="absolute right-3 top-0 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-800 shadow-sm">
                      {compactMoney(item.value)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AgingPanel({
  invoices,
  agingData,
}: {
  invoices: Invoice[];
  agingData?: InvoiceDashboardData["aging"];
}) {
  const aging = useMemo(() => {
    const colors = ["#22c55e", "#fbbf24", "#f97316", "#ef4444"];
    if (agingData?.buckets?.length) {
      return agingData.buckets.map((bucket, index) => ({
        label: bucket.label,
        value: bucket.amount ?? 0,
        percentage: bucket.percentage ?? 0,
        color: colors[index] ?? "#64748b",
      }));
    }

    const buckets = [
      { label: "0 - 30 Days", value: 0, color: "#22c55e" },
      { label: "31 - 60 Days", value: 0, color: "#fbbf24" },
      { label: "61 - 90 Days", value: 0, color: "#f97316" },
      { label: "90+ Days", value: 0, color: "#ef4444" },
    ];

    invoices.forEach((invoice) => {
      if (!["generated", "partially_paid"].includes(invoice.status)) return;
      const balance = (invoice.balanceDue ?? invoice.grandTotal) ?? 0;
      if (balance <= 0) return;
      const days = daysBetween(invoice.invoiceDate, invoice.dueDate) ?? invoice.paymentTermsDays ?? 0;
      const bucketIndex = days <= 30 ? 0 : days <= 60 ? 1 : days <= 90 ? 2 : 3;
      buckets[bucketIndex].value += balance;
    });

    return buckets;
  }, [invoices, agingData]);

  const total = aging.reduce((sum, item) => sum + item.value, 0);
  const segments = aging.reduce(
    (acc, item) => {
      const start = acc.cursor;
      const pct = total > 0 ? (item.value / total) * 100 : item.label === "0 - 30 Days" ? 100 : 0;
      acc.parts.push(`${item.color} ${start}% ${start + pct}%`);
      acc.cursor += pct;
      return acc;
    },
    { cursor: 0, parts: [] as string[] },
  );
  const ring = `conic-gradient(${segments.parts.join(", ")})`;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-slate-950">Outstanding Aging</h2>
      <div className="mt-5 grid items-center gap-8 md:grid-cols-[220px_1fr]">
        <div className="mx-auto flex size-[190px] items-center justify-center rounded-full p-5" style={{ background: ring }}>
          <div className="flex size-full flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
            <span className="text-2xl font-bold text-slate-950">{compactMoney(total)}</span>
            <span className="mt-1 text-xs font-semibold text-slate-700">Total Outstanding</span>
          </div>
        </div>
        <div className="space-y-4">
          {aging.map((item) => {
            const pct = "percentage" in item
              ? Math.round(item.percentage)
              : total > 0
                ? Math.round((item.value / total) * 100)
                : item.label === "0 - 30 Days" ? 100 : 0;
            return (
              <div key={item.label} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 text-sm">
                <span className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="font-medium text-slate-700">{item.label}</span>
                <span className="font-bold text-slate-950">
                  {compactMoney(item.value)} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function FinanceInvoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [dashboard, setDashboard] = useState<InvoiceDashboardData | null>(null);
  const [trendMonths, setTrendMonths] = useState(12);

  const [payDialog, setPayDialog] = useState<Invoice | null>(null);
  const [paying, setPaying] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [shareDialog, setShareDialog] = useState<Invoice | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareNote, setShareNote] = useState("");

  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("this-month");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const range = periodRange(periodFilter);
      const result = await financeService.searchInvoices({
        q: searchQuery.trim() || undefined,
        status:
          statusFilter !== "all"
            ? (statusFilter as Invoice["status"])
            : undefined,
        ...range,
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
  }, [searchQuery, statusFilter, periodFilter, page]);

  const loadDashboard = useCallback(async () => {
    try {
      const range = periodRange(periodFilter);
      setDashboard(await financeService.getInvoiceDashboard({ ...range, trendMonths }));
    } catch (e) {
      setDashboard(null);
      toast.error(e instanceof Error ? e.message : "Failed to load invoice dashboard");
    }
  }, [periodFilter, trendMonths]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const timer = setTimeout(() => setPage(0), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, periodFilter]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [invoices]);

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

  const handleMarkPaid = async () => {
    if (!payDialog) return;
    setPaying(true);
    try {
      const balance = payDialog.balanceDue ?? payDialog.grandTotal ?? 0;
      await financeService.receiveInvoicePayment(payDialog.id, balance);
      toast.success(`${payDialog.invoiceNumber} marked as paid`);
      setPayDialog(null);
      load();
      loadDashboard();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to mark as paid");
    } finally {
      setPaying(false);
    }
  };

  const handleGenerate = async (invoice: Invoice) => {
    try {
      await financeService.generateExistingInvoicePdf(invoice.id);
      toast.success(`${invoice.invoiceNumber} saved & generated`);
      load();
      loadDashboard();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate invoice");
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

  const openShareDialog = (invoice: Invoice) => {
    setShareDialog(invoice);
    setShareEmail(invoice.customer?.email || "");
    setShareNote("");
  };

  const handleShare = async () => {
    if (!shareDialog || !shareEmail.trim()) return;
    setSharing(true);
    try {
      await financeService.shareInvoice(shareDialog.id, {
        recipientEmail: shareEmail.trim(),
        recipientName: shareDialog.customer?.company || shareDialog.customer?.name,
        note: shareNote.trim() || undefined,
      });
      toast.success(`Invoice ${shareDialog.invoiceNumber} sent to ${shareEmail.trim()}`);
      setShareDialog(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to share invoice");
    } finally {
      setSharing(false);
    }
  };

  const fallbackStats = useMemo(() => {
    const now = new Date();
    const total = invoices.reduce((sum, invoice) => sum + (invoice.grandTotal ?? 0), 0);
    const collected = invoices
      .filter((invoice) => invoice.status === "paid")
      .reduce((sum, invoice) => sum + (invoice.grandTotal ?? 0), 0);
    const outstanding = invoices
      .filter((invoice) => invoice.status === "generated" || invoice.status === "partially_paid")
      .reduce((sum, invoice) => sum + ((invoice.balanceDue ?? invoice.grandTotal) ?? 0), 0);
    const overdueInvoices = invoices.filter((invoice) => {
      const dueDate = safeDate(invoice.dueDate);
      return dueDate && dueDate < now && ((invoice.balanceDue ?? invoice.grandTotal) ?? 0) > 0;
    });
    const overdue = overdueInvoices.reduce((sum, invoice) => sum + ((invoice.balanceDue ?? invoice.grandTotal) ?? 0), 0);

    return {
      total,
      collected,
      outstanding,
      overdue,
      overdueCount: overdueInvoices.length,
    };
  }, [invoices]);

  const stats = dashboard
    ? {
        total: dashboard.summary.totalInvoiced,
        collected: dashboard.summary.collected,
        outstanding: dashboard.summary.outstanding,
        overdue: dashboard.summary.overdue,
        overdueCount: dashboard.summary.overdueCount,
        totalChange: dashboard.summary.totalInvoicedChangePercent,
        collectedChange: dashboard.summary.collectedChangePercent,
        outstandingChange: dashboard.summary.outstandingChangePercent,
      }
    : {
        ...fallbackStats,
        totalChange: 18,
        collectedChange: 14,
        outstandingChange: -5,
      };

  const firstVisible = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const lastVisible = Math.min(totalElements, page * PAGE_SIZE + invoices.length);

  return (
    <div className="min-h-full px-4 py-5 text-slate-950 md:px-8 md:py-7">
      <div className="mx-auto max-w-[1680px] space-y-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>Sales</span>
              <ChevronRight className="size-3" />
              <span className="text-slate-950">Invoices</span>
            </div>
            <h1 className="text-[38px] font-bold leading-none tracking-normal text-slate-950 md:text-[42px]">
              Invoices
            </h1>
            <p className="mt-2 text-base text-slate-600">Track, manage and collect your receivables</p>
          </div>
          <div className="flex items-center gap-3" />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => navigate("/admin/finance/invoices/create")}
            className="h-11 rounded-lg bg-[#071a3a] px-5 text-white shadow-lg shadow-slate-300 hover:bg-[#0b2551]"
          >
            <Plus className="size-4" />
            Create Invoice
          </Button>
        </div>

        <button
          onClick={() => setDashboardOpen((prev) => !prev)}
          className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm transition-colors hover:bg-slate-50"
        >
          <span className="text-sm font-semibold text-slate-700">Dashboard Overview</span>
          <ChevronDown className={`size-4 text-slate-500 transition-transform duration-200 ${dashboardOpen ? "rotate-180" : ""}`} />
        </button>

        {dashboardOpen && (
          <div className="flex flex-col gap-5">
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {metricCards.map((card) => {
                const Icon = card.icon;
                const value =
                  card.key === "total"
                    ? compactMoney(stats.total)
                    : card.key === "collected"
                      ? compactMoney(stats.collected)
                      : card.key === "outstanding"
                        ? compactMoney(stats.outstanding)
                        : compactMoney(stats.overdue);
                const note =
                  card.key === "overdue"
                    ? `${stats.overdueCount} invoices need attention`
                    : card.key === "outstanding"
                      ? `${Math.abs(stats.outstandingChange).toFixed(0)}% vs previous period`
                      : card.key === "collected"
                        ? `${Math.abs(stats.collectedChange).toFixed(0)}% vs previous period`
                        : `${Math.abs(stats.totalChange).toFixed(0)}% vs previous period`;
                return (
                  <MetricCard
                    key={card.key}
                    label={card.label}
                    value={value}
                    note={note}
                    Icon={Icon}
                    tint={card.tint}
                    iconTint={card.iconTint}
                    danger={card.key === "overdue" || (card.key === "outstanding" && stats.outstandingChange > 0)}
                  />
                );
              })}
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.15fr_.75fr]">
              <TrendChart trendData={dashboard?.trend} trendMonths={trendMonths} onTrendMonthsChange={setTrendMonths} />
              <AgingPanel invoices={invoices} agingData={dashboard?.aging} />
            </div>

            <div className="flex flex-col gap-4 rounded-xl bg-[#eaf1fb] p-4 shadow-sm md:flex-row md:items-center">
              <h2 className="min-w-[150px] text-base font-bold text-slate-950">Quick Actions</h2>
              <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Button variant="outline" className="h-11 rounded-lg border-slate-200 bg-white text-sm shadow-sm" onClick={() => navigate("/admin/finance/invoices/create")}>
                  <FileText className="size-4 text-blue-600" />
                  New Invoice
                </Button>
                <Button variant="outline" className="h-11 rounded-lg border-slate-200 bg-white text-sm shadow-sm" onClick={() => navigate("/admin/quotations")}>
                  <FileText className="size-4 text-blue-600" />
                  From Quotation
                </Button>
                <Button variant="outline" className="h-11 rounded-lg border-slate-200 bg-white text-sm shadow-sm" onClick={() => navigate("/admin/orders")}>
                  <ShoppingCart className="size-4 text-emerald-600" />
                  From Sales Order
                </Button>
                <Button variant="outline" className="h-11 rounded-lg border-slate-200 bg-white text-sm shadow-sm">
                  <IndianRupee className="size-4 text-emerald-700" />
                  Receive Payment
                </Button>
                <Button variant="outline" className="h-11 rounded-lg border-slate-200 bg-white text-sm shadow-sm">
                  <Send className="size-4 text-red-600" />
                  Send Reminder
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative md:w-[540px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Search invoices by number, customer, PO, e-way bill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 rounded-lg border-slate-200 bg-white pl-10 text-sm shadow-sm"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-11 rounded-lg border-slate-200 bg-white text-sm shadow-sm sm:w-[140px]">
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
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="h-11 rounded-lg border-slate-200 bg-white text-sm shadow-sm sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="h-11 rounded-lg border-slate-200 bg-white text-sm shadow-sm">
              <SlidersHorizontal className="size-4" />
              Filters
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 bg-slate-100/80 hover:bg-slate-100/80">
                  <TableHead className="h-10 w-10 px-3">
                    <Checkbox
                      checked={invoices.length > 0 && selectedIds.size === invoices.length}
                      onCheckedChange={(checked) => {
                        setSelectedIds(checked ? new Set(invoices.map((i) => i.id)) : new Set());
                      }}
                    />
                  </TableHead>
                  <TableHead className="h-10 px-5 text-xs font-bold text-slate-700">Invoice</TableHead>
                  <TableHead className="h-10 px-5 text-xs font-bold text-slate-700">Customer</TableHead>
                  <TableHead className="h-10 px-5 text-xs font-bold text-slate-700">Invoice Date</TableHead>
                  <TableHead className="h-10 px-5 text-xs font-bold text-slate-700">Due Date</TableHead>
                  <TableHead className="h-10 px-5 text-right text-xs font-bold text-slate-700">Amount</TableHead>
                  <TableHead className="h-10 px-5 text-right text-xs font-bold text-slate-700">Balance Due</TableHead>
                  <TableHead className="h-10 px-5 text-xs font-bold text-slate-700">Status</TableHead>
                  <TableHead className="h-10 px-5 text-right text-xs font-bold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-sm text-slate-500">
                      Loading invoices...
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <p className="text-sm text-slate-500">
                          {totalElements === 0 ? "No invoices yet" : "No invoices match your filter"}
                        </p>
                        {totalElements === 0 && (
                          <Button variant="outline" onClick={() => navigate("/admin/finance/invoices/create")}>
                            <Plus className="size-4" />
                            Create your first invoice
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => {
                    const customerName = invoice.customer?.company || invoice.customer?.name || "Unknown Customer";
                    const termDays = invoice.paymentTermsDays ?? daysBetween(invoice.invoiceDate, invoice.dueDate);
                    return (
                      <TableRow
                        key={invoice.id}
                        className="cursor-pointer border-slate-200 hover:bg-blue-50/30"
                        onClick={() => navigate(`/admin/finance/invoices/${invoice.id}`)}
                      >
                        <TableCell className="w-10 px-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(invoice.id)}
                            onCheckedChange={(checked) => {
                              setSelectedIds((prev) => {
                                const next = new Set(prev);
                                checked ? next.add(invoice.id) : next.delete(invoice.id);
                                return next;
                              });
                            }}
                          />
                        </TableCell>
                        <TableCell className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                              <FileText className="size-4" />
                            </div>
                            <span className="font-bold text-slate-950">{invoice.invoiceNumber}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                              {initials(customerName)}
                            </div>
                            <div>
                              <p className="font-bold leading-tight text-slate-950">{customerName}</p>
                              <p className="mt-0.5 text-xs font-medium text-slate-500">
                                {invoice.customer?.address || invoice.customer?.email || "Customer details"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-3 font-semibold text-slate-800">{fmtDate(invoice.invoiceDate)}</TableCell>
                        <TableCell className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">{fmtDate(invoice.dueDate)}</span>
                            {termDays !== undefined && (
                              <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">
                                {termDays} days
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-3 text-right font-bold text-slate-950">
                          {money(invoice.grandTotal)}
                        </TableCell>
                        <TableCell
                          className={`px-5 py-3 text-right font-bold ${
                            (invoice.balanceDue ?? 0) > 0 ? "text-orange-600" : "text-slate-500"
                          }`}
                        >
                          {money(invoice.balanceDue)}
                        </TableCell>
                        <TableCell className="px-5 py-3">
                          {invoice.status === "paid" || invoice.status === "cancelled" || invoice.status === "draft" ? (
                            statusBadge(invoice.status)
                          ) : (
                            <button
                              className="cursor-pointer rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"
                              onClick={(event) => {
                                event.stopPropagation();
                                setPayDialog(invoice);
                              }}
                            >
                              Pending
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="relative px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-full text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                              onClick={(event) => {
                                event.stopPropagation();
                                navigate(`/admin/finance/invoices/${invoice.id}`);
                              }}
                              title="View"
                            >
                              <Eye className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-full text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDownloadPDF(invoice);
                              }}
                              title="Download PDF"
                            >
                              <Download className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-full text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                              onClick={(event) => {
                                event.stopPropagation();
                                navigate(`/admin/finance/invoices/${invoice.id}/edit`);
                              }}
                              title="Edit"
                              disabled={invoice.status === "paid" || invoice.status === "cancelled"}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-full text-slate-600 hover:bg-green-50 hover:text-green-700"
                              onClick={(event) => {
                                event.stopPropagation();
                                openShareDialog(invoice);
                              }}
                              title="Share"
                              disabled={invoice.status === "draft"}
                            >
                              <Share2 className="size-4" />
                            </Button>
                            <div className="relative">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-full text-slate-600 hover:bg-slate-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActionMenuId((current) => (current === invoice.id ? null : invoice.id));
                                }}
                                title="More actions"
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                              {actionMenuId === invoice.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-40"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActionMenuId(null);
                                    }}
                                  />
                                  <div
                                    className="absolute right-0 top-full z-50 mt-1 w-44 rounded-md border border-slate-200 bg-white p-1 shadow-lg"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {invoice.status === "draft" && (
                                      <button
                                        type="button"
                                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                                        onClick={() => {
                                          setActionMenuId(null);
                                          handleGenerate(invoice);
                                        }}
                                      >
                                        <Send className="size-4 text-blue-600" />
                                        Save
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
                                      onClick={() => {
                                        setActionMenuId(null);
                                        handleDelete(invoice.id, invoice.invoiceNumber);
                                      }}
                                    >
                                      <Trash2 className="size-4" />
                                      Delete
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing {firstVisible}-{lastVisible} of {totalElements} invoices
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-lg border-slate-200"
                  disabled={page === 0}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 3) }).map((_, index) => (
                  <Button
                    key={index}
                    variant={page === index ? "default" : "outline"}
                    size="icon"
                    className={`size-8 rounded-lg ${page === index ? "bg-blue-600 text-white hover:bg-blue-700" : "border-slate-200 bg-white"}`}
                    onClick={() => setPage(index)}
                  >
                    {index + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-lg border-slate-200"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((current) => current + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={!!payDialog} onOpenChange={(open) => { if (!open) setPayDialog(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as Paid</DialogTitle>
            <DialogDescription>
              Confirm full payment for invoice <span className="font-semibold text-slate-950">{payDialog?.invoiceNumber}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Customer</span>
              <span className="font-medium text-slate-950">
                {payDialog?.customer?.company || payDialog?.customer?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice Total</span>
              <span className="font-medium text-slate-950">{money(payDialog?.grandTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Balance Due</span>
              <span className="font-bold text-emerald-700">
                {money(payDialog?.balanceDue ?? payDialog?.grandTotal)}
              </span>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPayDialog(null)} disabled={paying}>
              Cancel
            </Button>
            <Button
              onClick={handleMarkPaid}
              disabled={paying}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle className="size-4 mr-2" />
              {paying ? "Processing..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!shareDialog} onOpenChange={(open) => { if (!open) setShareDialog(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="size-5 text-blue-600" />
              Share Invoice
            </DialogTitle>
            <DialogDescription>
              Send invoice <span className="font-semibold text-slate-950">{shareDialog?.invoiceNumber}</span> to the customer via email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer</span>
                <span className="font-medium text-slate-950">
                  {shareDialog?.customer?.company || shareDialog?.customer?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount</span>
                <span className="font-bold text-slate-950">{money(shareDialog?.grandTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Due Date</span>
                <span className="font-medium text-slate-950">
                  {shareDialog?.dueDate ? new Date(shareDialog.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Recipient Email</label>
              <Input
                type="email"
                placeholder="customer@example.com"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Note <span className="text-slate-400">(optional)</span></label>
              <textarea
                className="flex min-h-[72px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add a message to include in the email..."
                value={shareNote}
                onChange={(e) => setShareNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShareDialog(null)} disabled={sharing}>
              Cancel
            </Button>
            <Button
              onClick={handleShare}
              disabled={sharing || !shareEmail.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sharing ? (
                <><Loader2 className="size-4 mr-2 animate-spin" /> Sending...</>
              ) : (
                <><Send className="size-4 mr-2" /> Send Invoice</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
