import { useEffect, useState } from "react";
import { financeService, ProfitData, ProductProfitability, CustomerProfitability } from "../services/financeService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";

const COLORS = ["#22c55e", "#3b82f6", "#f97316", "#a855f7", "#06b6d4"];

export function FinanceProfit() {
  const [profitData, setProfitData] = useState<ProfitData | null>(null);
  const [productProfit, setProductProfit] = useState<ProductProfitability[]>([]);
  const [customerProfit, setCustomerProfit] = useState<CustomerProfitability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profit, products, customers] = await Promise.all([
        financeService.getProfitData(),
        financeService.getProductProfitability(),
        financeService.getCustomerProfitability(),
      ]);
      setProfitData(profit);
      setProductProfit(products);
      setCustomerProfit(customers);
    } catch (error) {
      console.error("Failed to load profit data:", error);
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

  if (loading || !profitData) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const profitBreakdown = [
    { name: "Revenue", value: profitData.revenue, color: "#22c55e" },
    { name: "Product Cost", value: -profitData.productCost, color: "#f97316" },
    { name: "Gross Profit", value: profitData.grossProfit, color: "#3b82f6" },
    { name: "Outsourcing", value: -profitData.outsourcingCost, color: "#f97316" },
    { name: "Salaries", value: -profitData.salaries, color: "#f97316" },
    { name: "Marketing", value: -profitData.marketing, color: "#f97316" },
    { name: "Infrastructure", value: -profitData.infrastructure, color: "#f97316" },
    { name: "Operations", value: -profitData.operationalExpenses, color: "#f97316" },
    { name: "Taxes", value: -profitData.taxes, color: "#f97316" },
    { name: "Net Profit", value: profitData.netProfit, color: "#8b5cf6" },
  ];

  const monthlyProfit = [
    { month: "Jan", gross: 192500, net: 115500 },
    { month: "Feb", gross: 210000, net: 126000 },
    { month: "Mar", gross: 197500, net: 118500 },
    { month: "Apr", gross: 222500, net: 133500 },
    { month: "May", gross: 237500, net: 142500 },
    { month: "Jun", gross: 230000, net: 138000 },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="mb-1">Profit Analysis</h1>
          <p className="text-muted-foreground">
            Detailed profitability breakdown and analysis
          </p>
        </div>
        <Button>
          <Download className="size-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Gross Profit</p>
            <p className="text-3xl font-bold mb-2">
              {formatCurrency(profitData.grossProfit)}
            </p>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="size-4" />
              <span>50% of Revenue</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Net Profit</p>
            <p className="text-3xl font-bold mb-2">
              {formatCurrency(profitData.netProfit)}
            </p>
            <div className="flex items-center gap-1 text-sm text-blue-600">
              <TrendingUp className="size-4" />
              <span>{profitData.profitMargin.toFixed(1)}% Margin</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Operating Margin</p>
            <p className="text-3xl font-bold mb-2">
              {profitData.operatingMargin.toFixed(1)}%
            </p>
            <div className="flex items-center gap-1 text-sm text-purple-600">
              <TrendingUp className="size-4" />
              <span>Healthy Margin</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit Breakdown Waterfall */}
        <Card>
          <CardHeader>
            <CardTitle>Profit Waterfall</CardTitle>
            <CardDescription>From revenue to net profit</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={profitBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(Math.abs(value))}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value">
                  {profitBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Profit Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Profit Trend</CardTitle>
            <CardDescription>Gross vs Net profit over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyProfit}>
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
                  dataKey="gross"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Gross Profit"
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="Net Profit"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Product Profitability */}
      <Card>
        <CardHeader>
          <CardTitle>Product Profitability</CardTitle>
          <CardDescription>Profitability analysis by product</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Gross Profit</TableHead>
                <TableHead>Net Profit</TableHead>
                <TableHead>Margin %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productProfit.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.productName}</TableCell>
                  <TableCell>{formatCurrency(product.revenue)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatCurrency(product.cost)}
                  </TableCell>
                  <TableCell className="text-green-600">
                    {formatCurrency(product.grossProfit)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(product.netProfit)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={product.margin >= 30 ? "default" : "secondary"}
                    >
                      {product.margin.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Customer Profitability */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Profitability</CardTitle>
          <CardDescription>Most valuable customers by profit</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>Revenue Generated</TableHead>
                <TableHead>Cost Incurred</TableHead>
                <TableHead>Net Profit</TableHead>
                <TableHead>Total Orders</TableHead>
                <TableHead>Profit Margin %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customerProfit.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.customerName}</TableCell>
                  <TableCell>{formatCurrency(customer.revenueGenerated)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatCurrency(customer.costIncurred)}
                  </TableCell>
                  <TableCell className="text-green-600 font-medium">
                    {formatCurrency(customer.netProfit)}
                  </TableCell>
                  <TableCell>{customer.totalOrders}</TableCell>
                  <TableCell>
                    <Badge variant="default">
                      {customer.profitMargin.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
