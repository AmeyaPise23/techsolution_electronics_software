import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { Navbar } from "../components/navbar";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "../components/ui/table";
import { Star, ShoppingCart, Heart, Share2, Check, ChevronLeft, Package, Truck, Shield } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  productService,
  getProductImageUrl,
  type ProductDetail,
  type ProductDetailVariant,
} from "../services/productService";
import { useCart } from "../context/cart-context";

const priceFormatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const formatPrice = (value: number) => priceFormatter.format(value);

export function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductDetailVariant | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    async function loadProduct() {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await productService.getProductDetail(id);
        setProduct(data);
        setSelectedImage(0);
        if (data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
      } catch (error) {
        console.error(error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 animate-pulse">
            <div className="space-y-4">
              <div className="aspect-square rounded-xl bg-muted" />
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => <div key={i} className="aspect-square rounded-lg bg-muted" />)}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-10 bg-muted rounded w-1/3" />
              <div className="h-20 bg-muted rounded" />
              <div className="h-12 bg-muted rounded" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <Package className="size-16 mx-auto mb-4 text-muted-foreground opacity-40" />
          <h2 className="mb-4">Product not found</h2>
          <Button onClick={() => navigate("/products")}>Back to Products</Button>
        </div>
      </div>
    );
  }

  const imageUrls = product.images.map((img) => ({
    url: getProductImageUrl(img.id),
    alt: img.altText || product.name,
  }));

  const activePrice = selectedVariant?.price ?? product.price;
  const activeDiscountPrice = selectedVariant?.discountPrice ?? product.discountPrice;
  const activeMrp = selectedVariant?.mrp ?? null;
  const activeSku = selectedVariant?.sku ?? product.sku;
  const activeStock = selectedVariant?.stockQuantity ?? product.stockQuantity;
  const activeStockStatus = selectedVariant?.stockStatus ?? product.stockStatus;
  const isInStock = activeStockStatus === "in-stock" && activeStock > 0;
  const hasDiscount = activeDiscountPrice != null && activeDiscountPrice < activePrice;
  const displayPrice = hasDiscount ? activeDiscountPrice : activePrice;
  const strikePrice = hasDiscount ? activePrice : activeMrp && activeMrp > activePrice ? activeMrp : null;
  const discountPercent = strikePrice ? Math.round(((strikePrice - displayPrice) / strikePrice) * 100) : 0;

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/products">Products</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {product.category && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to={`/products?category=${encodeURIComponent(product.category)}`}>
                        {product.category}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{product.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/products")}
          className="mb-6 -ml-2"
        >
          <ChevronLeft className="size-4" />
          Back to Products
        </Button>

        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
          {/* Left: Images */}
          <div className="space-y-4">
            <motion.div
              key={selectedImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="aspect-square overflow-hidden rounded-xl border bg-muted"
            >
              {imageUrls[selectedImage] ? (
                <img
                  src={imageUrls[selectedImage].url}
                  alt={imageUrls[selectedImage].alt}
                  className="size-full object-cover"
                />
              ) : (
                <div className="size-full flex items-center justify-center text-muted-foreground">
                  <Package className="size-20 opacity-30" />
                </div>
              )}
            </motion.div>

            {imageUrls.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {imageUrls.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                      selectedImage === index
                        ? "border-primary ring-1 ring-primary"
                        : "border-transparent hover:border-muted-foreground/30"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`${product.name} ${index + 1}`}
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="space-y-5">
            {/* Brand & Category */}
            <div className="flex items-center gap-2">
              {product.brand && (
                <span className="text-sm font-semibold text-primary uppercase tracking-wide">
                  {product.brand}
                </span>
              )}
              <Badge variant="secondary">{product.category}</Badge>
            </div>

            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-bold leading-tight">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`size-5 ${
                      i < Math.floor(product.rating ?? 0)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
                <span className="ml-2 font-medium">{(product.rating ?? 0).toFixed(1)}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {product.reviewCount.toLocaleString()} review{product.reviewCount !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-bold">{formatPrice(displayPrice)}</span>
              {strikePrice && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(strikePrice)}
                </span>
              )}
              {discountPercent > 0 && (
                <Badge className="bg-red-500 hover:bg-red-500 text-white">
                  {discountPercent}% OFF
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Inclusive of all taxes</p>

            {/* Variant Selector */}
            {product.variants.length > 0 && (
              <div className="space-y-3">
                <span className="text-sm font-medium">
                  Variant: <span className="text-primary">{selectedVariant?.variantName}</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => {
                    const isSelected = selectedVariant?.id === variant.id;
                    const variantInStock = variant.stockStatus === "in-stock" && variant.stockQuantity > 0;
                    return (
                      <button
                        key={variant.id}
                        onClick={() => {
                          setSelectedVariant(variant);
                          setQuantity(1);
                        }}
                        className={`relative px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 text-primary"
                            : variantInStock
                              ? "border-border hover:border-primary/50"
                              : "border-border opacity-50 cursor-not-allowed"
                        }`}
                        disabled={!variantInStock && !isSelected}
                      >
                        <span>{variant.variantName}</span>
                        <span className="block text-xs font-normal text-muted-foreground mt-0.5">
                          {formatPrice(variant.discountPrice ?? variant.price)}
                        </span>
                        {!variantInStock && (
                          <span className="absolute -top-2 -right-2 text-[9px] bg-red-100 text-red-600 px-1 rounded">
                            Out
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SKU */}
            <div className="text-xs text-muted-foreground">
              SKU: <span className="font-mono">{activeSku}</span>
            </div>

            {/* Description */}
            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {isInStock ? (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="size-5" />
                  <span className="font-medium">In Stock ({activeStock} available)</span>
                </div>
              ) : (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="font-medium">Quantity:</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={!isInStock}
                >
                  -
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(activeStock, quantity + 1))}
                  disabled={!isInStock || quantity >= activeStock}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1 gap-2"
                disabled={!isInStock}
                onClick={() => {
                  const primaryImg = product.images.find((img) => img.primary);
                  addItem({
                    productId: product.id,
                    productName: product.name,
                    variantId: selectedVariant?.id,
                    variantName: selectedVariant?.variantName,
                    price: displayPrice,
                    mrp: strikePrice ?? undefined,
                    quantity,
                    maxStock: activeStock,
                    primaryImageId: primaryImg?.id ?? product.images[0]?.id ?? null,
                    sku: activeSku,
                    hsnCode: selectedVariant?.hsnCode,
                    taxPercentage: selectedVariant?.taxPercentage ?? product.taxPercentage,
                  });
                  toast.success(`${product.name} added to cart`);
                }}
              >
                <ShoppingCart className="size-5" />
                Add to Cart
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="flex-1"
                disabled={!isInStock}
                onClick={() => {
                  const primaryImg = product.images.find((img) => img.primary);
                  addItem({
                    productId: product.id,
                    productName: product.name,
                    variantId: selectedVariant?.id,
                    variantName: selectedVariant?.variantName,
                    price: displayPrice,
                    mrp: strikePrice ?? undefined,
                    quantity,
                    maxStock: activeStock,
                    primaryImageId: primaryImg?.id ?? product.images[0]?.id ?? null,
                    sku: activeSku,
                    hsnCode: selectedVariant?.hsnCode,
                    taxPercentage: selectedVariant?.taxPercentage ?? product.taxPercentage,
                  });
                  navigate("/checkout");
                }}
              >
                Buy Now
              </Button>
            </div>

            {/* Secondary Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Heart className="size-4" />
                Wishlist
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="size-4" />
                Share
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t">
              <div className="flex flex-col items-center text-center gap-1">
                <Truck className="size-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Free Delivery</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1">
                <Shield className="size-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Warranty</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1">
                <Package className="size-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Secure Packing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Variant Details Table (if variant selected) */}
        {selectedVariant && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Variant Details — {selectedVariant.variantName}</CardTitle>
              <CardDescription>Pricing and attributes for the selected variant</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  {selectedVariant.sku && (
                    <TableRow>
                      <TableCell className="font-medium w-1/3">SKU</TableCell>
                      <TableCell className="font-mono">{selectedVariant.sku}</TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell className="font-medium">Price</TableCell>
                    <TableCell>{formatPrice(selectedVariant.price)}</TableCell>
                  </TableRow>
                  {selectedVariant.mrp && (
                    <TableRow>
                      <TableCell className="font-medium">MRP</TableCell>
                      <TableCell className="line-through text-muted-foreground">{formatPrice(selectedVariant.mrp)}</TableCell>
                    </TableRow>
                  )}
                  {selectedVariant.color && (
                    <TableRow>
                      <TableCell className="font-medium">Color</TableCell>
                      <TableCell>{selectedVariant.color}</TableCell>
                    </TableRow>
                  )}
                  {selectedVariant.size && (
                    <TableRow>
                      <TableCell className="font-medium">Size</TableCell>
                      <TableCell>{selectedVariant.size}</TableCell>
                    </TableRow>
                  )}
                  {selectedVariant.material && (
                    <TableRow>
                      <TableCell className="font-medium">Material</TableCell>
                      <TableCell>{selectedVariant.material}</TableCell>
                    </TableRow>
                  )}
                  {selectedVariant.weight && (
                    <TableRow>
                      <TableCell className="font-medium">Weight</TableCell>
                      <TableCell>{selectedVariant.weight}</TableCell>
                    </TableRow>
                  )}
                  {selectedVariant.hsnCode && (
                    <TableRow>
                      <TableCell className="font-medium">HSN Code</TableCell>
                      <TableCell className="font-mono">{selectedVariant.hsnCode}</TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell className="font-medium">Availability</TableCell>
                    <TableCell>
                      <span className={isInStock ? "text-green-600" : "text-red-500"}>
                        {isInStock ? `${activeStock} in stock` : "Out of stock"}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Features Section */}
        {product.features.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Key Features</CardTitle>
              <CardDescription>What makes this product special</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="size-5 text-green-600 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Full Description */}
        {product.fullDescription && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {product.fullDescription}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Specifications Section */}
        {product.specifications.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Technical Specifications</CardTitle>
              <CardDescription>Detailed product specifications</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  {product.specifications.map((spec, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium w-1/3">
                        {spec.label}
                      </TableCell>
                      <TableCell>{spec.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Reviews Section */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Reviews</CardTitle>
            <CardDescription>
              {product.reviewCount > 0
                ? `${product.reviewCount} review${product.reviewCount !== 1 ? "s" : ""} from verified buyers`
                : "What our customers are saying about this product"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {product.reviews.length > 0 ? (
              product.reviews.map((review) => (
                <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-0.5 bg-green-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded">
                      <span>{review.rating}</span>
                      <Star className="size-3 fill-current" />
                    </div>
                    <span className="font-medium text-sm">{review.name}</span>
                    {review.reviewDate && (
                      <span className="text-xs text-muted-foreground">{review.reviewDate}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No reviews yet.</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
