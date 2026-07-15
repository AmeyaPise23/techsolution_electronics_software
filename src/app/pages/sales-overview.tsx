import {
  BarChart3,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";

export function SalesOverview() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="mb-1">Sales Overview</h1>
        <p className="text-muted-foreground">
          Monitor your sales performance at a glance
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total Sales</p>
            <DollarSign className="size-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold mt-2">$0.00</p>
          <p className="text-xs text-muted-foreground mt-1">This month</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Orders</p>
            <ShoppingCart className="size-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold mt-2">0</p>
          <p className="text-xs text-muted-foreground mt-1">This month</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Products</p>
            <Package className="size-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold mt-2">0</p>
          <p className="text-xs text-muted-foreground mt-1">Active listings</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Clients</p>
            <Users className="size-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold mt-2">0</p>
          <p className="text-xs text-muted-foreground mt-1">Total registered</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="size-5 text-muted-foreground" />
            <h2 className="font-semibold">Sales Trend</h2>
          </div>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="size-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sales data will appear here</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="size-5 text-muted-foreground" />
            <h2 className="font-semibold">Recent Orders</h2>
          </div>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <div className="text-center">
              <ShoppingCart className="size-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No recent orders</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
