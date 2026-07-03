import { Package, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { productService } from "../services/productService";

export function AdminDashboard() {
  const navigate = useNavigate();
  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    productService.getAllProducts().then(products => {
      setProductCount(products.length);
    });
  }, []);

  const stats = [
    {
      title: "Total Products",
      value: productCount.toString(),
      icon: Package,
      description: "Active products in catalog",
      color: "text-blue-500",
    },
    {
      title: "Total Orders",
      value: "0",
      icon: ShoppingCart,
      description: "Orders this month",
      color: "text-green-500",
    },
    {
      title: "Revenue",
      value: "$0",
      icon: DollarSign,
      description: "Total revenue this month",
      color: "text-purple-500",
    },
    {
      title: "Growth",
      value: "0%",
      icon: TrendingUp,
      description: "Compared to last month",
      color: "text-orange-500",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-1">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your admin dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="p-6 rounded-lg border border-border bg-card hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold mb-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </div>
              <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                <stat.icon className="size-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="justify-start h-auto py-4"
            onClick={() => navigate("/admin/products")}
          >
            <Package className="size-5 mr-3" />
            <div className="text-left">
              <p className="font-medium">Manage Products</p>
              <p className="text-xs text-muted-foreground">
                Add, edit, or delete products
              </p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="justify-start h-auto py-4"
            onClick={() => navigate("/admin/orders")}
          >
            <ShoppingCart className="size-5 mr-3" />
            <div className="text-left">
              <p className="font-medium">View Orders</p>
              <p className="text-xs text-muted-foreground">
                Check recent orders
              </p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="justify-start h-auto py-4"
            onClick={() => navigate("/admin/settings")}
          >
            <TrendingUp className="size-5 mr-3" />
            <div className="text-left">
              <p className="font-medium">View Analytics</p>
              <p className="text-xs text-muted-foreground">
                Check performance metrics
              </p>
            </div>
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4">Recent Activity</h2>
        <div className="text-center py-8 text-muted-foreground">
          <p>No recent activity to display</p>
        </div>
      </div>
    </div>
  );
}
