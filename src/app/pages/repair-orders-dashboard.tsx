import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  repairService,
  RepairOrderStats,
  RecentActivity,
} from "../services/repairService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Wrench,
  Clock,
  TrendingUp,
  Truck,
  IndianRupee,
  Plus,
  Activity,
  ArrowRight,
  CheckCircle2,
  Warehouse,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  received: "Received",
  inspection: "Under Inspection",
  waiting_for_customer_approval: "Waiting for Approval",
  waiting_for_parts: "Waiting for Parts",
  under_repair: "Under Repair",
  testing: "Testing",
  quality_check: "Quality Check",
  ready_for_delivery: "Ready for Invoice",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

const ACTION_LABELS: Record<string, string> = {
  created: "New Repair Received",
  updated: "Repair Updated",
  status_changed: "Status Changed",
  priority_changed: "Priority Changed",
  engineer_assigned: "Engineer Assigned",
  item_added: "Part Added",
  item_removed: "Part Removed",
  item_updated: "Part Updated",
  observation_added: "Observation Added",
  cost_updated: "Cost Updated",
  sent_to_vendor: "Sent to Vendor",
  returned_from_vendor: "Returned from Vendor",
  converted_to_invoice: "Converted to Invoice",
  cancelled: "Cancelled",
  delivered: "Delivered",
  completed: "Completed",
};

const CHART_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f97316",
  "#a855f7",
  "#06b6d4",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
  "#ec4899",
  "#64748b",
];

const fmtMoney = (v?: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v ?? 0);

const fmtDateTime = (d?: string) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

export function RepairOrdersDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<RepairOrderStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [s, a] = await Promise.all([
          repairService.getStats(),
          repairService.getRecentActivities(15),
        ]);
        if (!cancelled) {
          setStats(s);
          setActivities(a);
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(
            e instanceof Error ? e.message : "Failed to load dashboard"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !stats) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const sc = stats.statusCounts || {};
  const summaryCards = [
    {
      title: "Total Repair Orders",
      value: stats.totalOrders,
      icon: Wrench,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      onClick: () => navigate("/admin/repair-orders/list"),
    },
    {
      title: "Active Orders",
      value: stats.activeOrders,
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "New / Received",
      value: sc.received || 0,
      icon: Clock,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      onClick: () =>
        navigate("/admin/repair-orders/list?status=received"),
    },
    {
      title: "Under Repair",
      value: sc.under_repair || 0,
      icon: Wrench,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      onClick: () =>
        navigate("/admin/repair-orders/list?status=under_repair"),
    },
    {
      title: "Ready for Invoice",
      value: sc.ready_for_delivery || 0,
      icon: CheckCircle2,
      color: "text-teal-500",
      bgColor: "bg-teal-500/10",
      onClick: () =>
        navigate("/admin/repair-orders/list?status=ready_for_delivery"),
    },
    {
      title: "Currently With Vendor",
      value: stats.currentlyWithVendor,
      icon: Warehouse,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      onClick: () =>
        navigate("/admin/repair-orders/list?outsourceStatus=sent_to_vendor"),
    },
    {
      title: "Delivered",
      value: sc.delivered || 0,
      icon: Truck,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Total Revenue",
      value: fmtMoney(stats.totalRevenue),
      icon: IndianRupee,
      color: "text-green-600",
      bgColor: "bg-green-600/10",
    },
    {
      title: "Profit",
      value: fmtMoney(stats.totalProfit),
      icon: IndianRupee,
      color:
        stats.totalProfit < 0 ? "text-destructive" : "text-emerald-600",
      bgColor:
        stats.totalProfit < 0 ? "bg-destructive/10" : "bg-emerald-600/10",
    },
  ];

  const chartData = Object.entries(sc)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ status: STATUS_LABELS[k] || k, count: v }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="mb-1">Repair Dashboard</h1>
          <p className="text-muted-foreground">
            Live KPIs and recent activity across all repair orders
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/admin/repair-orders/list")}
          >
            View All Orders
          </Button>
          <Button
            onClick={() => navigate("/admin/repair-orders/create")}
          >
            <Plus className="size-4 mr-2" />
            New Repair Order
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((c) => {
          const Icon = c.icon;
          return (
            <Card
              key={c.title}
              className={c.onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
              onClick={c.onClick}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <div
                    className={`size-10 rounded-lg flex items-center justify-center ${c.bgColor}`}
                  >
                    <Icon className={`size-5 ${c.color}`} />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{c.title}</p>
                <p className="text-2xl font-bold">{c.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Repairs by Status</CardTitle>
            <CardDescription>Current distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No repair orders yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="status"
                    tick={{ fontSize: 11 }}
                    angle={-30}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Financial pie */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
            <CardDescription>All-time totals</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.totalPartsCost +
              stats.totalLabourCharges +
              stats.totalOutsourcingCost ===
            0 ? (
              <p className="text-sm text-muted-foreground">No cost data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Parts", value: stats.totalPartsCost },
                      { name: "Labour", value: stats.totalLabourCharges },
                      {
                        name: "Outsourcing",
                        value: stats.totalOutsourcingCost,
                      },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={40}
                    outerRadius={80}
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#a855f7" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => fmtMoney(v)}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4" />
              Recent Repair Activity
            </CardTitle>
            <CardDescription>
              Latest events across all repair orders
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/repair-orders/list")}
          >
            View all
            <ArrowRight className="size-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No repair activity yet. Create a repair order to get started.
            </p>
          ) : (
            <div className="divide-y">
              {activities.map((a) => (
                <div
                  key={a.id}
                  className="py-3 flex items-start gap-3 cursor-pointer hover:bg-muted/30 -mx-6 px-6"
                  onClick={() =>
                    navigate(`/admin/repair-orders/${a.repairOrderId}`)
                  }
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">
                        {ACTION_LABELS[a.action] || a.action}
                      </Badge>
                      <span className="font-medium">{a.repairNumber}</span>
                      {a.customerName && (
                        <span className="text-muted-foreground text-sm">
                          · {a.customerName}
                        </span>
                      )}
                    </div>
                    <div className="text-sm mt-1">
                      {a.toStatus && (
                        <span>
                          {a.fromStatus
                            ? `${STATUS_LABELS[a.fromStatus] || a.fromStatus} → `
                            : ""}
                          <span className="font-medium">
                            {STATUS_LABELS[a.toStatus] || a.toStatus}
                          </span>
                        </span>
                      )}
                      {a.deviceName && (
                        <span className="text-muted-foreground">
                          {a.toStatus ? " · " : ""}
                          {a.deviceName}
                        </span>
                      )}
                    </div>
                    {a.remarks && (
                      <p className="text-xs text-muted-foreground italic mt-1">
                        {a.remarks}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {fmtDateTime(a.performedAt)}
                    {a.performedBy && (
                      <div className="text-right">by {a.performedBy}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
