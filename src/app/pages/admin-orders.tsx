import { ShoppingCart } from "lucide-react";

export function AdminOrders() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-1">Orders</h1>
        <p className="text-muted-foreground">
          Manage customer orders and fulfillment
        </p>
      </div>

      {/* Empty State */}
      <div className="rounded-lg border border-border bg-card p-12">
        <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <ShoppingCart className="size-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2">No orders yet</h3>
          <p className="text-muted-foreground">
            Orders will appear here once customers start purchasing your products.
            Set up your products to get started.
          </p>
        </div>
      </div>
    </div>
  );
}
