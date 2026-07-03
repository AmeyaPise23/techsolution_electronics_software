import { useEffect, useState } from "react";
import { financeService, CashFlowData } from "../services/financeService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { TrendingUp, TrendingDown, Wallet, ArrowDownCircle, ArrowUpCircle, Clock } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function FinanceCashFlow() {
  const [cashFlowData, setCashFlowData] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await financeService.getCashFlow();
      setCashFlowData(data);
    } catch (error) {
      console.error("Failed to load cash flow data:", error);
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

  if (loading || !cashFlowData) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const netCashFlow = cashFlowData.cashInflow - cashFlowData.cashOutflow;
  const cashFlowWithNet = cashFlowData.monthlyCashFlow.map((item) => ({
    ...item,
    net: item.inflow - item.outflow,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-1">Cash Flow Analysis</h1>
        <p className="text-muted-foreground">
          Track money movement and cash position
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Cash Inflow</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(cashFlowData.cashInflow)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10">
                <ArrowUpCircle className="size-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Cash Outflow</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(cashFlowData.cashOutflow)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10">
                <ArrowDownCircle className="size-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Net Cash Flow</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(netCashFlow)}
                </p>
                <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                  <TrendingUp className="size-4" />
                  <span>Positive</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10">
                <TrendingUp className="size-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Receivables</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(cashFlowData.pendingReceivables)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-orange-500/10">
                <Clock className="size-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Available Cash</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(cashFlowData.availableCash)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Wallet className="size-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Cash Flow */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Cash Flow</CardTitle>
            <CardDescription>Inflow vs Outflow over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={cashFlowWithNet}>
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
                <Bar dataKey="inflow" fill="#22c55e" name="Inflow" />
                <Bar dataKey="outflow" fill="#f97316" name="Outflow" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Net Cash Flow Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Net Cash Flow Trend</CardTitle>
            <CardDescription>Net cash position over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={cashFlowWithNet}>
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
                <Area
                  type="monotone"
                  dataKey="net"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  name="Net Cash Flow"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cash Flow Forecast */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cash Flow Forecast</CardTitle>
            <CardDescription>
              Projected cash flow for the next 3 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={[
                  ...cashFlowWithNet,
                  { month: "Jul (F)", inflow: 485000, outflow: 375000, net: 110000 },
                  { month: "Aug (F)", inflow: 505000, outflow: 385000, net: 120000 },
                  { month: "Sep (F)", inflow: 520000, outflow: 395000, net: 125000 },
                ]}
              >
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
                  dataKey="inflow"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="Inflow"
                />
                <Line
                  type="monotone"
                  dataKey="outflow"
                  stroke="#f97316"
                  strokeWidth={2}
                  name="Outflow"
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Net (Forecast)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Summary</CardTitle>
          <CardDescription>Key insights and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="size-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium">Positive Cash Flow</p>
                <p className="text-sm text-muted-foreground">
                  Your business is generating more cash than it's spending. Net cash flow
                  is {formatCurrency(netCashFlow)}.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Clock className="size-5 text-orange-500" />
              </div>
              <div>
                <p className="font-medium">Outstanding Receivables</p>
                <p className="text-sm text-muted-foreground">
                  You have {formatCurrency(cashFlowData.pendingReceivables)} in pending
                  receivables. Follow up on outstanding invoices to improve cash position.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Wallet className="size-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium">Healthy Cash Reserves</p>
                <p className="text-sm text-muted-foreground">
                  Current available cash is {formatCurrency(cashFlowData.availableCash)},
                  providing a good buffer for operations.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
