import { memo, useState } from "react";
import { Star, Package, ShoppingBag, Check } from "lucide-react";
import { Link, useNavigate } from "react-router";
import type { ProductListingItem } from "../services/productService";
import { getProductImageUrl } from "../services/productService";
import { useCart } from "../context/cart-context";
import { motion } from "motion/react";

interface ProductCardProps {
  product: ProductListingItem;
}

const priceFormatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const formatPrice = (value: number) => priceFormatter.format(value);

function StatusBadge({ product, isInStock }: { product: ProductListingItem; isInStock: boolean }) {
  const hasDiscount = product.discountPrice != null && product.discountPrice < product.price;

  if (!isInStock) {
    return (
      <span className="absolute top-3 left-3 z-10 rounded-full bg-[#f13c1f] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
        Sold Out
      </span>
    );
  }
  if (hasDiscount) {
    const pct = Math.round(((product.price - product.discountPrice!) / product.price) * 100);
    return (
      <span className="absolute top-3 left-3 z-10 rounded-full bg-[#f13c1f] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
        -{pct}%
      </span>
    );
  }
  if (product.rating >= 4.5) {
    return (
      <span className="absolute top-3 left-3 z-10 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
        Hot
      </span>
    );
  }
  if (product.variantCount > 0) {
    return (
      <span className="absolute top-3 left-3 z-10 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
        New
      </span>
    );
  }
  return null;
}

export const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const imageUrl = getProductImageUrl(product.primaryImageId);
  const hasDiscount = product.discountPrice != null && product.discountPrice < product.price;
  const displayPrice = product.variantCount > 0 ? product.startingPrice : product.price;
  const isInStock = product.stockStatus === "in-stock" && product.stockQuantity > 0;
  const [imgError, setImgError] = useState(false);
  const [added, setAdded] = useState(false);

  const filledStars = Math.round(product.rating ?? 0);

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isInStock) return;
    // Variant products need a variant picked on the details page first
    if (product.variantCount > 0) {
      navigate(`/products/${product.id}`);
      return;
    }
    addItem({
      productId: product.id,
      productName: product.name,
      price: hasDiscount ? product.discountPrice! : product.price,
      mrp: hasDiscount ? product.price : undefined,
      quantity: 1,
      maxStock: product.stockQuantity,
      primaryImageId: product.primaryImageId,
      sku: product.sku,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="h-full">
      <Link to={`/products/${product.id}`} className="block h-full">
        <div className="group relative flex h-full flex-col overflow-hidden rounded-md border border-gray-200 bg-white transition-shadow hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
          <StatusBadge product={product} isInStock={isInStock} />

          {/* Image */}
          <div className="relative aspect-square overflow-hidden bg-white p-6">
            {imageUrl && !imgError ? (
              <img
                src={imageUrl}
                alt={product.name}
                className={`size-full object-contain transition-transform duration-300 group-hover:scale-105 ${!isInStock ? "opacity-50" : ""}`}
                loading="lazy"
                decoding="async"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex size-full items-center justify-center rounded bg-gray-50">
                <Package className="size-12 text-gray-300" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col px-4 pb-4">
            {product.brand && (
              <span className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                {product.brand}
              </span>
            )}

            <h3 className="mb-2 line-clamp-2 text-sm font-medium leading-snug text-slate-600 transition-colors group-hover:text-[#f13c1f]">
              {product.name}
            </h3>

            <div className="mt-auto flex items-end justify-between gap-2">
              <div className="min-w-0">
                {/* Price */}
                <div className="flex flex-wrap items-baseline gap-x-1.5">
                  {product.variantCount > 0 && (
                    <span className="text-[11px] text-gray-400">From</span>
                  )}
                  <span className="text-base font-bold text-[#f13c1f]">
                    {formatPrice(hasDiscount ? product.discountPrice! : displayPrice)}
                  </span>
                  {hasDiscount && (
                    <span className="text-xs text-gray-400 line-through">
                      {formatPrice(product.price)}
                    </span>
                  )}
                </div>

                {/* Stars */}
                <div className="mt-1.5 flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`size-3.5 ${i < filledStars ? "fill-[#ffa200] text-[#ffa200]" : "fill-gray-200 text-gray-200"}`}
                    />
                  ))}
                  <span className="ml-1 text-[10px] text-gray-400">
                    ({product.reviewCount.toLocaleString()})
                  </span>
                </div>
              </div>

              {/* Cart button */}
              <button
                onClick={handleCartClick}
                disabled={!isInStock}
                title={
                  !isInStock
                    ? "Out of stock"
                    : product.variantCount > 0
                      ? "Choose options"
                      : "Add to quote"
                }
                className={`flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  added
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : isInStock
                      ? "border-gray-300 bg-white text-slate-600 hover:border-[#f13c1f] hover:bg-[#f13c1f] hover:text-white"
                      : "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300"
                }`}
              >
                {added ? <Check className="size-4" /> : <ShoppingBag className="size-4" />}
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
});
