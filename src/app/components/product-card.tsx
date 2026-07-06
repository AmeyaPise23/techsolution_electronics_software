import { Star, ShoppingCart } from "lucide-react";
import { Link } from "react-router";
import type { ProductFormData } from "../services/productService";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { motion } from "motion/react";

interface ProductCardProps {
  product: ProductFormData;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={`/products/${product.id}`}>
        <div className="group relative overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg">
          {/* Product Image */}
          <div className="aspect-square overflow-hidden bg-muted">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="size-full flex items-center justify-center text-sm text-muted-foreground">
                No image
              </div>
            )}
            {!product.inStock && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <Badge variant="secondary" className="text-sm">
                  Out of Stock
                </Badge>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="p-4 space-y-3">
            {/* Category Badge */}
            <Badge variant="secondary" className="text-xs">
              {product.category}
            </Badge>

            {/* Product Name */}
            <h3 className="font-semibold line-clamp-1">{product.name}</h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>

            {/* Rating */}
            <div className="flex items-center gap-1">
              <div className="flex items-center">
                <Star className="size-4 fill-yellow-400 text-yellow-400" />
                <span className="ml-1 text-sm font-medium">{product.rating ?? 0}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                ({(product.reviews ?? 0).toLocaleString()} reviews)
              </span>
            </div>

            {/* Price and CTA */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-2xl font-bold">${product.price}</span>
              <Button
                size="sm"
                className="gap-2"
                disabled={!product.inStock}
                onClick={(e) => {
                  e.preventDefault();
                  // Add to cart logic would go here
                }}
              >
                <ShoppingCart className="size-4" />
                <span className="hidden sm:inline">Add</span>
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
