import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cog,
  Eye,
  Filter,
  Flag,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  Receipt,
  Search,
  Truck,
  User as UserIcon,
  Wrench,
  X,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  repairService,
  type OutsourceStatusApi,
  type RepairOrderSummary,
  type RepairPriorityApi,
  type RepairStatusApi,
} from "../../services/repairService";
import { clientService, type Client } from "../../services/clientService";
import {
  machineCategoryService,
  type MachineCategory,
} from "../../services/machineCategoryService";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import type { RepairViewConfig, StatCardConfig } from "./views";

const PAGE_SIZE = 20;

const STAT_ICONS = {
  receipt: Receipt,
  calendar: Calendar,
  clock: Clock,
  alert: AlertCircle,
  wrench: Wrench,
  truck: Truck,
  check: CheckCircle2,
  x: XCircle,
} as const;

const PRIORITY_PILL: Record<RepairPriorityApi, string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-100",
  normal: "bg-amber-50 text-amber-700 border-amber-100",
  high: "bg-rose-50 text-rose-700 border-rose-100",
  urgent: "bg-red-50 text-red-700 border-red-100",
};

const PRIORITY_LABEL: Record<RepairPriorityApi, string> = {
  low: "Low",
  normal: "Medium",
  high: "High",
  urgent: "Urgent",
};

const DATE_RANGES = [
  { value: "any", label: "Any date" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
] as const;

type DateRange = (typeof DATE_RANGES)[number]["value"];

/** iso date (yyyy-mm-dd) N days ago from today. */
function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function receivedRangeFor(range: DateRange): { from?: string; to?: string } {
  const today = new Date().toISOString().split("T")[0];
  switch (range) {
    case "today":
      return { from: today, to: today };
    case "7d":
      return { from: daysAgoISO(7), to: today };
    case "30d":
      return { from: daysAgoISO(30), to: today };
    default:
      return {};
  }
}

function initialsOf(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "?";
}

/** Deterministic pastel from a string — used for avatar backgrounds. */
function pastelFor(seed: string): string {
  const palette = [
    "bg-indigo-100 text-indigo-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-sky-100 text-sky-700",
    "bg-rose-100 text-rose-700",
    "bg-violet-100 text-violet-700",
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

function Avatar({ name, small = false }: { name?: string; small?: boolean }) {
  const size = small ? "size-7 text-[11px]" : "size-8 text-[12px]";
  return (
    <span
      className={`inline-flex ${size} items-center justify-center rounded-full font-semibold ${pastelFor(name || "?")}`}
    >
      {initialsOf(name)}
    </span>
  );
}

function StatCard({
  cfg,
  value,
}: {
  cfg: StatCardConfig;
  value: number;
}) {
  const Icon = STAT_ICONS[cfg.icon];
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${cfg.tint}`}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[13px] text-slate-500">{cfg.label}</p>
        <p className="mt-0.5 text-[22px] font-bold leading-tight text-slate-900">
          {value.toLocaleString()}
        </p>
        <p className="text-[11px] font-medium text-slate-400">Orders</p>
      </div>
    </div>
  );
}

const OUTSOURCE_STATUSES: OutsourceStatusApi[] = [
  "none",
  "sent_to_vendor",
  "returned_from_vendor",
];

function readOutsourceStatus(v: string | null): OutsourceStatusApi | undefined {
  if (!v) return undefined;
  return OUTSOURCE_STATUSES.includes(v as OutsourceStatusApi)
    ? (v as OutsourceStatusApi)
    : undefined;
}

export function RepairOrdersView({ view }: { view: RepairViewConfig }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // URL-driven filter — set by the outsourcing page's "View Open Trips" link
  // (?outsourceStatus=sent_to_vendor). Not part of the in-page filter row.
  const outsourceStatus = readOutsourceStatus(
    searchParams.get("outsourceStatus")
  );

  // ── Data ──
  const [orders, setOrders] = useState<RepairOrderSummary[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Masters (for filters) ──
  const [customers, setCustomers] = useState<Client[]>([]);
  const [categories, setCategories] = useState<MachineCategory[]>([]);

  // ── Filters ──
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [priority, setPriority] = useState<string>("any");
  const [customerId, setCustomerId] = useState<string>("any");
  const [categoryId, setCategoryId] = useState<string>("any");
  const [engineer, setEngineer] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange>("any");

  // Cancellation flow: row-level "Move to Cancellation" → confirm → PATCH status.
  const [cancelTarget, setCancelTarget] = useState<RepairOrderSummary | null>(
    null
  );
  const [cancelling, setCancelling] = useState(false);

  // Reset local filters when the view (route) changes so stale filters don't
  // leak between Pending/Ongoing/etc.
  useEffect(() => {
    setPage(0);
    setSearchQuery("");
    setPriority("any");
    setCustomerId("any");
    setCategoryId("any");
    setEngineer("");
    setDateRange("any");
  }, [view.key]);

  // Debounce page reset when text filters change.
  useEffect(() => {
    const t = setTimeout(() => setPage(0), 300);
    return () => clearTimeout(t);
  }, [searchQuery, engineer]);

  // Load master data once.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [c, m] = await Promise.all([
          clientService.getClients(),
          machineCategoryService.listActive(),
        ]);
        if (!mounted) return;
        setCustomers(c);
        setCategories(m);
      } catch {
        /* filters degrade gracefully to text-only */
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load global stats. Refetch when the view changes since sidebar sections
  // may care about slightly different snapshots.
  useEffect(() => {
    let mounted = true;
    setStatsLoading(true);
    repairService
      .getStats()
      .then((s) => {
        if (mounted) setStatusCounts(s.statusCounts || {});
      })
      .catch(() => {
        /* stats are best-effort — leave counts at 0 */
      })
      .finally(() => {
        if (mounted) setStatsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [view.key]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const range = receivedRangeFor(dateRange);
      const result = await repairService.search({
        q: searchQuery.trim() || undefined,
        // "all" is a sentinel for "no filter"; the backend accepts it but
        // dropping it keeps URLs shorter.
        statusGroup: view.group !== "all" ? view.group : undefined,
        priority:
          priority !== "any" ? (priority as RepairPriorityApi) : undefined,
        customerId: customerId !== "any" ? Number(customerId) : undefined,
        machineCategoryId:
          categoryId !== "any" ? Number(categoryId) : undefined,
        assignedEngineer: engineer.trim() || undefined,
        outsourceStatus,
        receivedFrom: range.from,
        receivedTo: range.to,
        page,
        size: PAGE_SIZE,
        sort: "createdAt,desc",
      });
      setOrders(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to load repair orders"
      );
    } finally {
      setLoading(false);
    }
  }, [
    view.group,
    searchQuery,
    priority,
    customerId,
    categoryId,
    engineer,
    outsourceStatus,
    dateRange,
    page,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await repairService.updateStatus(
        cancelTarget.id,
        "cancelled",
        "Cancelled from orders list"
      );
      toast.success(`${cancelTarget.repairNumber} moved to Cancelled`);
      setCancelTarget(null);
      // Once cancelled, the row drops out of every group except All/Cancelled
      // because backend RepairStatusGroup only includes CANCELLED in the
      // cancelled bucket. Refresh so the current view reflects that.
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  const statValues = useMemo(
    () =>
      view.stats.map((s) => ({
        cfg: s,
        value: s.compute({ totalElements, statusCounts }),
      })),
    [view.stats, totalElements, statusCounts]
  );

  const paginationWindow = useMemo(() => {
    const window: number[] = [];
    const start = Math.max(0, page - 1);
    const end = Math.min(totalPages - 1, start + 2);
    for (let p = start; p <= end; p++) window.push(p);
    return window;
  }, [page, totalPages]);

  const firstIdx = orders.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const lastIdx = page * PAGE_SIZE + orders.length;

  return (
    <div className="min-h-full bg-slate-50/60">
      {/* ── Header ── */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-4 px-6 py-5">
          <div className="flex-1 min-w-[220px]">
            <h1 className="text-[22px] font-bold leading-tight text-slate-900">
              {view.title}
            </h1>
            <p className="mt-0.5 text-[13px] text-slate-500">{view.subtitle}</p>
          </div>

          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by RO #, customer, machine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 rounded-full border-slate-200 bg-slate-50 pl-9 pr-16"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
              Ctrl + K
            </span>
          </div>

          <button
            type="button"
            className="relative flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-900"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              5
            </span>
          </button>

          <Button
            className="h-10 gap-2 rounded-lg bg-blue-600 px-4 hover:bg-blue-700"
            onClick={() => navigate("/admin/repair-orders/create")}
          >
            <Plus className="size-4" />
            New Repair Order
          </Button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto max-w-[1500px] space-y-5 px-6 py-6">
        {/* Stat cards */}
        <div
          className={`grid grid-cols-1 gap-4 ${view.stats.length >= 4 ? "sm:grid-cols-2 xl:grid-cols-4" : `sm:grid-cols-${Math.min(view.stats.length, 3)}`}`}
        >
          {statValues.map(({ cfg, value }) => (
            <StatCard
              key={cfg.key}
              cfg={cfg}
              value={statsLoading && cfg.key !== "total" && cfg.key !== "totalPending" ? 0 : value}
            />
          ))}
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="min-w-[160px] flex-1 md:flex-none md:w-[180px]">
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              <SelectTrigger className="h-10">
                <span className="flex items-center gap-2">
                  <Calendar className="size-4 text-slate-400" />
                  <SelectValue />
                </span>
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[140px] flex-1 md:flex-none md:w-[160px]">
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="h-10">
                <span className="flex items-center gap-2">
                  <Flag className="size-4 text-slate-400" />
                  <SelectValue placeholder="Priority" />
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[180px] flex-1 md:flex-none md:w-[200px]">
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger className="h-10">
                <span className="flex items-center gap-2">
                  <UserIcon className="size-4 text-slate-400" />
                  <SelectValue placeholder="Customer" />
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">All customers</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.company || c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[180px] flex-1 md:flex-none md:w-[200px]">
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-10">
                <span className="flex items-center gap-2">
                  <Cog className="size-4 text-slate-400" />
                  <SelectValue placeholder="Machine Category" />
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">All categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[180px] flex-1 md:flex-none md:w-[200px]">
            <div className="relative">
              <UserIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Assigned to"
                value={engineer}
                onChange={(e) => setEngineer(e.target.value)}
                className="h-10 pl-9"
              />
            </div>
          </div>

          <Button variant="outline" size="sm" className="ml-auto h-10 gap-2">
            <Filter className="size-4" />
            Filters
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-left text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3">RO #</th>
                  <th className="px-5 py-3">Date Received</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Machine</th>
                  <th className="px-5 py-3">Issue Summary</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Assigned To</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-slate-500">
                      Loading repair orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-500">
                        <Package className="size-6 text-slate-300" />
                        <p>No repair orders in this view</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate("/admin/repair-orders/create")
                          }
                        >
                          <Plus className="mr-2 size-4" /> Create a repair order
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => {
                    const received = o.receivedDate
                      ? new Date(o.receivedDate)
                      : null;
                    const receivedDate = received
                      ? received.toLocaleDateString(undefined, {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "-";
                    const receivedTime = o.createdAt
                      ? new Date(o.createdAt).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "";
                    const priorityKey = (o.priority as RepairPriorityApi) || "normal";
                    const customerLabel =
                      o.customerCompany || o.customerName || `#${o.customerId}`;
                    const isCancelled = o.status === "cancelled";
                    // Muted classes applied to non-headline cells on cancelled rows.
                    // Keeps the row scannable while making it clearly de-emphasised.
                    const mutedCell = isCancelled ? "text-slate-400" : "";
                    const mutedStrong = isCancelled
                      ? "text-slate-500"
                      : "text-slate-900";
                    return (
                      <tr
                        key={o.id}
                        className={`border-b border-slate-100 last:border-b-0 transition-colors ${
                          isCancelled
                            ? "bg-red-50/30 hover:bg-red-50/50"
                            : "hover:bg-slate-50/50"
                        }`}
                      >
                        <td
                          className={`px-5 py-4 ${
                            isCancelled
                              ? "border-l-4 border-red-400"
                              : "border-l-4 border-transparent"
                          }`}
                        >
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              className={`self-start text-[13.5px] font-semibold hover:underline ${
                                isCancelled
                                  ? "text-slate-500 line-through decoration-red-300/60"
                                  : "text-blue-600"
                              }`}
                              onClick={() =>
                                navigate(`/admin/repair-orders/${o.id}`)
                              }
                            >
                              {o.repairNumber}
                            </button>
                            {isCancelled && (
                              <span className="inline-flex w-fit items-center gap-1 rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-red-700">
                                <XCircle className="size-3" /> Cancelled
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={`px-5 py-4 ${mutedCell || "text-slate-600"}`}>
                          <div
                            className={`font-medium ${
                              isCancelled ? "text-slate-500" : "text-slate-800"
                            }`}
                          >
                            {receivedDate}
                          </div>
                          {receivedTime && (
                            <div
                              className={`text-[12px] ${
                                isCancelled ? "text-slate-400" : "text-slate-500"
                              }`}
                            >
                              {receivedTime}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={isCancelled ? "opacity-60" : ""}>
                              <Avatar name={customerLabel} small />
                            </div>
                            <div className="min-w-0">
                              <div className={`truncate font-medium ${mutedStrong}`}>
                                {customerLabel}
                              </div>
                              {o.contactPersonName && (
                                <div
                                  className={`truncate text-[12px] ${
                                    isCancelled
                                      ? "text-slate-400"
                                      : "text-slate-500"
                                  }`}
                                >
                                  {o.contactPersonName}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className={`font-medium ${mutedStrong}`}>
                            {o.deviceName}
                          </div>
                          {o.deviceModelNumber && (
                            <div
                              className={`text-[12px] ${
                                isCancelled ? "text-slate-400" : "text-slate-500"
                              }`}
                            >
                              {o.deviceModelNumber}
                            </div>
                          )}
                        </td>
                        <td className="max-w-[260px] px-5 py-4">
                          <p
                            className={`line-clamp-2 ${
                              isCancelled ? "text-slate-400" : "text-slate-600"
                            }`}
                          >
                            {getIssueSummary(o)}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          {isCancelled ? (
                            <span className="text-[12px] text-slate-400">—</span>
                          ) : (
                            <span
                              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[12px] font-semibold ${PRIORITY_PILL[priorityKey]}`}
                            >
                              {PRIORITY_LABEL[priorityKey]}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {o.assignedEngineer ? (
                            <div className="flex items-center gap-2">
                              <div className={isCancelled ? "opacity-60" : ""}>
                                <Avatar name={o.assignedEngineer} small />
                              </div>
                              <span
                                className={
                                  isCancelled ? "text-slate-500" : "text-slate-800"
                                }
                              >
                                {o.assignedEngineer}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">
                              {isCancelled ? "—" : "Unassigned"}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/admin/repair-orders/${o.id}`)
                              }
                              className="flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                              aria-label="View"
                            >
                              <Eye className="size-4" />
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className="flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                                  aria-label="Row actions"
                                >
                                  <MoreVertical className="size-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem
                                  onSelect={() =>
                                    navigate(`/admin/repair-orders/${o.id}`)
                                  }
                                >
                                  <Eye className="mr-2 size-4" />
                                  View details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() =>
                                    navigate(
                                      `/admin/repair-orders/${o.id}/edit`
                                    )
                                  }
                                >
                                  <Pencil className="mr-2 size-4" />
                                  Edit order
                                </DropdownMenuItem>
                                {o.status !== "cancelled" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onSelect={() => setCancelTarget(o)}
                                      className="text-red-600 focus:text-red-700"
                                    >
                                      <X className="mr-2 size-4" />
                                      Move to Cancellation
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalElements > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3">
              <p className="text-[12.5px] text-slate-500">
                Showing {firstIdx} to {lastIdx} of {totalElements} orders
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="size-4" />
                </button>
                {paginationWindow.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`flex size-8 items-center justify-center rounded-md text-[13px] font-semibold ${
                      p === page
                        ? "bg-blue-600 text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {p + 1}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Cancel confirmation ── */}
      <AlertDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => {
          if (!open && !cancelling) setCancelTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this repair order?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelTarget ? (
                <>
                  <span className="font-semibold text-slate-900">
                    {cancelTarget.repairNumber}
                  </span>{" "}
                  — {cancelTarget.deviceName}
                  {cancelTarget.customerCompany || cancelTarget.customerName
                    ? ` for ${cancelTarget.customerCompany || cancelTarget.customerName}`
                    : ""}
                  . Once cancelled, the order will only appear under{" "}
                  <span className="font-medium">All Orders</span> and{" "}
                  <span className="font-medium">Cancelled</span>, and its
                  status can no longer be changed.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>
              Keep order
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={cancelling}
              onClick={(e) => {
                // Radix closes the dialog on Action click by default; prevent
                // that so the "Cancelling..." spinner stays visible until the
                // PATCH resolves, and we close it explicitly in the handler.
                e.preventDefault();
                confirmCancel();
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {cancelling ? "Cancelling…" : "Move to Cancellation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function getIssueSummary(o: RepairOrderSummary): string {
  // RepairOrderSummary is loose ([key: string]: unknown on parent). The
  // problem/complaint fields aren't declared but are commonly present.
  const anyO = o as unknown as {
    problemDescription?: string;
    customerComplaint?: string;
  };
  return (
    anyO.problemDescription ||
    anyO.customerComplaint ||
    "—"
  );
}

/** Type-only re-export so callers don't need to reach into the module tree. */
export type { RepairStatusApi };
