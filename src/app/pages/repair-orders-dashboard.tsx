import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { repairOrderService, RepairDashboardStats } from "../services/repairOrderService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Wrench,
  Clock,
  TrendingUp,
  Users,
  CheckCircle,
  Truck,
  DollarSign,
  Plus,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#06b6d4", "#f59e0b"];

export function RepairOrdersDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<RepairDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await repairOrderService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load repair stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading || !stats) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const summaryCards = [
    {
      title: "Total Repair Orders",
      value: stats.totalRepairOrders,
      icon: Wrench,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Pending Repairs",
      value: stats.pendingRepairs,
      icon: Clock,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "In Progress",
      value: stats.inProgressRepairs,
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Outsourced Repairs",
      value: stats.outsourcedRepairs,
      icon: Users,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
    {
      title: "Completed Repairs",
      value: stats.completedRepairs,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Delivered",
      value: stats.deliveredRepairs,
      icon: Truck,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRepairRevenue),
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-600/10",
    },
    {
      title: "Outsourcing Cost",
      value: formatCurrency(stats.totalOutsourcingCost),
      icon: DollarSign,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Repair Profit",
      value: formatCurrency(stats.repairProfit),
      icon: TrendingUp,
      color: "text-violet-600",
      bgColor: "bg-violet-600/10",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="mb-1">Repair Orders Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and track machine repair orders
          </p>
        </div>
        <Button onClick={() => navigate("/admin/repair-orders/create")}>
          <Plus className="size-4 mr-2" />
          New Repair Order
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryCards.map((card, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{card.title}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`size-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Repairs by Month */}
        <Card>
          <CardHeader>
            <CardTitle>Repairs by Month</CardTitle>
            <CardDescription>Monthly repair order volume</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.repairsByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" name="Repair Orders" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Repairs by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Repairs by Status</CardTitle>
            <CardDescription>Current status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.repairsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.status}: ${entry.count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {stats.repairsByStatus.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Vendor Outsourcing Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Vendor Outsourcing Distribution</CardTitle>
            <CardDescription>Cost breakdown by outsourcing vendor</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.vendorDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vendor" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="cost" fill="#a855f7" name="Outsourcing Cost" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common repair order operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="justify-start h-auto py-4"
              onClick={() => navigate("/admin/repair-orders")}
            >
              <Wrench className="size-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">View All Orders</p>
                <p className="text-xs text-muted-foreground">
                  Browse repair orders
                </p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto py-4"
              onClick={() => navigate("/admin/repair-orders/create")}
            >
              <Plus className="size-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">New Repair Order</p>
                <p className="text-xs text-muted-foreground">
                  Register new machine
                </p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto py-4"
              onClick={() => navigate("/admin/repair-orders?status=pending")}
            >
              <Clock className="size-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">Pending Repairs</p>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingRepairs} waiting
                </p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto py-4"
              onClick={() => navigate("/admin/repair-orders?status=ready")}
            >
              <Truck className="size-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">Ready for Delivery</p>
                <p className="text-xs text-muted-foreground">
                  Check delivery queue
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
