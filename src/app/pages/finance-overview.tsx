import { useEffect, useState } from "react";
import { financeService, KPIData } from "../services/financeService";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Wallet,
  Users,
  FileText,
  ShoppingCart,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function FinanceOverview() {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await financeService.getOverview();
      setKpiData(data);
    } catch (error) {
      console.error("Failed to load finance overview:", error);
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

  const formatPercentage = (value: number) => {
    return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  const kpiCards = kpiData
    ? [
        {
          title: "Total Revenue",
          value: formatCurrency(kpiData.totalRevenue),
          change: kpiData.revenueChange,
          icon: DollarSign,
          color: "text-green-500",
          bgColor: "bg-green-500/10",
        },
        {
          title: "Gross Profit",
          value: formatCurrency(kpiData.grossProfit),
          change: kpiData.profitChange,
          icon: TrendingUp,
          color: "text-blue-500",
          bgColor: "bg-blue-500/10",
        },
        {
          title: "Net Profit",
          value: formatCurrency(kpiData.netProfit),
          change: kpiData.profitChange,
          icon: Wallet,
          color: "text-purple-500",
          bgColor: "bg-purple-500/10",
        },
        {
          title: "Total Expenses",
          value: formatCurrency(kpiData.totalExpenses),
          change: kpiData.expensesChange,
          icon: Receipt,
          color: "text-orange-500",
          bgColor: "bg-orange-500/10",
        },
        {
          title: "Outstanding Payments",
          value: formatCurrency(kpiData.outstandingPayments),
          change: 0,
          icon: FileText,
          color: "text-red-500",
          bgColor: "bg-red-500/10",
        },
        {
          title: "Cash Available",
          value: formatCurrency(kpiData.cashAvailable),
          change: 0,
          icon: Wallet,
          color: "text-emerald-500",
          bgColor: "bg-emerald-500/10",
        },
        {
          title: "Monthly Revenue",
          value: formatCurrency(kpiData.monthlyRevenue),
          change: kpiData.revenueChange,
          icon: TrendingUp,
          color: "text-cyan-500",
          bgColor: "bg-cyan-500/10",
        },
        {
          title: "Monthly Profit",
          value: formatCurrency(kpiData.monthlyProfit),
          change: kpiData.profitChange,
          icon: DollarSign,
          color: "text-violet-500",
          bgColor: "bg-violet-500/10",
        },
        {
          title: "Profit Margin",
          value: `${kpiData.profitMargin.toFixed(1)}%`,
          change: 0,
          icon: TrendingUp,
          color: "text-indigo-500",
          bgColor: "bg-indigo-500/10",
        },
        {
          title: "Active Customers",
          value: kpiData.activeCustomers.toLocaleString(),
          change: 0,
          icon: Users,
          color: "text-pink-500",
          bgColor: "bg-pink-500/10",
        },
        {
          title: "Total Invoices",
          value: kpiData.totalInvoices.toLocaleString(),
          change: 0,
          icon: FileText,
          color: "text-amber-500",
          bgColor: "bg-amber-500/10",
        },
        {
          title: "Average Order Value",
          value: formatCurrency(kpiData.averageOrderValue),
          change: 0,
          icon: ShoppingCart,
          color: "text-teal-500",
          bgColor: "bg-teal-500/10",
        },
      ]
    : [];

  const monthlyData = [
    { month: "Jan", revenue: 385000, profit: 115500, expenses: 269500 },
    { month: "Feb", revenue: 420000, profit: 126000, expenses: 294000 },
    { month: "Mar", revenue: 395000, profit: 118500, expenses: 276500 },
    { month: "Apr", revenue: 445000, profit: 133500, expenses: 311500 },
    { month: "May", revenue: 475000, profit: 142500, expenses: 332500 },
    { month: "Jun", revenue: 460000, profit: 138000, expenses: 322000 },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-1">Finance Overview</h1>
        <p className="text-muted-foreground">
          Executive-level financial dashboard and key performance indicators
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">{kpi.title}</p>
                  <p className="text-2xl font-bold mb-2">{kpi.value}</p>
                  {kpi.change !== 0 && (
                    <div
                      className={`flex items-center gap-1 text-sm ${
                        kpi.change > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {kpi.change > 0 ? (
                        <TrendingUp className="size-4" />
                      ) : (
                        <TrendingDown className="size-4" />
                      )}
                      <span>{formatPercentage(kpi.change)}</span>
                    </div>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${kpi.bgColor}`}>
                  <kpi.icon className={`size-6 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & Profit Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Profit Trend</CardTitle>
            <CardDescription>Monthly revenue and profit over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expenses Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Expenses</CardTitle>
            <CardDescription>Expense tracking over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="expenses" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue vs Expenses */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue vs Expenses vs Profit</CardTitle>
            <CardDescription>Comparative analysis of financial metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#22c55e"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#f97316"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
