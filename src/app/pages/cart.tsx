import { Link, useNavigate } from "react-router";
import { Navbar } from "../components/navbar";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Package } from "lucide-react";
import { useCart } from "../context/cart-context";
import { getProductImageUrl } from "../services/productService";
import { motion, AnimatePresence } from "motion/react";

const priceFormatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const formatPrice = (value: number) => priceFormatter.format(value);

export function Cart() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-md mx-auto text-center">
            <ShoppingBag className="size-20 mx-auto mb-6 text-muted-foreground opacity-30" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Browse our products and add items to your cart to get started.
            </p>
            <Button onClick={() => navigate("/products")} size="lg" className="gap-2">
              <ShoppingBag className="size-5" />
              Continue Shopping
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Shopping Cart</h1>
            <p className="text-muted-foreground mt-1">{totalItems} item{totalItems !== 1 ? "s" : ""} in your cart</p>
          </div>
          <Button variant="outline" size="sm" onClick={clearCart}>
            Clear Cart
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {items.map((item) => {
                const imageUrl = getProductImageUrl(item.primaryImageId);
                const lineTotal = item.price * item.quantity;
                return (
                  <motion.div
                    key={`${item.productId}-${item.variantId ?? ""}`}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {/* Image */}
                          <Link to={`/products/${item.productId}`} className="shrink-0">
                            <div className="size-24 sm:size-28 rounded-lg overflow-hidden bg-muted">
                              {imageUrl ? (
                                <img src={imageUrl} alt={item.productName} className="size-full object-cover" />
                              ) : (
                                <div className="size-full flex items-center justify-center">
                                  <Package className="size-8 opacity-30" />
                                </div>
                              )}
                            </div>
                          </Link>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <Link to={`/products/${item.productId}`} className="hover:underline">
                              <h3 className="font-semibold text-sm sm:text-base line-clamp-2">{item.productName}</h3>
                            </Link>
                            {item.variantName && (
                              <p className="text-xs text-muted-foreground mt-0.5">Variant: {item.variantName}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-0.5">SKU: <span className="font-mono">{item.sku}</span></p>

                            {/* Price */}
                            <div className="flex items-baseline gap-2 mt-2">
                              <span className="font-bold">{formatPrice(item.price)}</span>
                              {item.mrp && item.mrp > item.price && (
                                <span className="text-xs text-muted-foreground line-through">{formatPrice(item.mrp)}</span>
                              )}
                            </div>

                            {/* Quantity + Remove */}
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="size-8"
                                  onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="size-3" />
                                </Button>
                                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="size-8"
                                  onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                                  disabled={item.quantity >= item.maxStock}
                                >
                                  <Plus className="size-3" />
                                </Button>
                                <span className="text-xs text-muted-foreground hidden sm:inline">
                                  ({item.maxStock} available)
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => removeItem(item.productId, item.variantId)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Line Total (desktop) */}
                          <div className="hidden sm:flex flex-col items-end justify-center">
                            <span className="font-bold text-lg">{formatPrice(lineTotal)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={`${item.productId}-${item.variantId ?? ""}`} className="flex justify-between text-sm">
                      <span className="truncate max-w-[60%] text-muted-foreground">
                        {item.productName} x{item.quantity}
                      </span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>Taxes</span>
                    <span className="text-xs">Calculated at checkout</span>
                  </div>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Estimated Total</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                </div>
                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={() => navigate("/checkout")}
                >
                  Proceed to Checkout
                  <ArrowRight className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/products")}
                >
                  Continue Shopping
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
