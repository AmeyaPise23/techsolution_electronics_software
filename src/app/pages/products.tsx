import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router";
import { Navbar } from "../components/navbar";
import { ProductCard } from "../components/product-card";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Slider } from "../components/ui/slider";
import {
  Search,
  Package,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Headset,
  RotateCcw,
  CreditCard,
  Truck,
} from "lucide-react";
import {
  productService,
  getProductImageUrl,
  type ProductListingItem,
  type FilterOptions,
  type ProductListingParams,
} from "../services/productService";

type SortOption = "default" | "price-asc" | "price-desc" | "rating" | "newest";

const PAGE_SIZE = 12;
const PRICE_MIN = 0;
const PRICE_MAX = 100000;
const PRICE_STEP = 500;

const inrFormatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const formatINR = (value: number) => inrFormatter.format(value);

const SERVICES = [
  { icon: Headset, title: "Support 24/7", subtitle: "Dedicated 24/7 support" },
  { icon: RotateCcw, title: "Easy Returns", subtitle: "Shop with confidence" },
  { icon: CreditCard, title: "B2B Invoicing", subtitle: "Quotation to invoice" },
  { icon: Truck, title: "Free Shipping", subtitle: "On bulk quotations" },
];

export function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<ProductListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ brands: [], categories: [] });

  // Sidebar "New products" spotlight
  const [newProducts, setNewProducts] = useState<ProductListingItem[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters from URL or state
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedBrands, setSelectedBrands] = useState<string[]>(() => {
    const b = searchParams.get("brand");
    return b ? [b] : [];
  });
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get("sort") as SortOption) || "default");
  const [inStockOnly, setInStockOnly] = useState(searchParams.get("inStock") === "true");
  const [priceRange, setPriceRange] = useState<[number, number]>(() => [
    Number(searchParams.get("minPrice")) || PRICE_MIN,
    Number(searchParams.get("maxPrice")) || PRICE_MAX,
  ]);
  // Committed on slider release so we don't refetch while dragging
  const [committedPriceRange, setCommittedPriceRange] = useState<[number, number]>(priceRange);
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const hasPriceFilter = committedPriceRange[0] > PRICE_MIN || committedPriceRange[1] < PRICE_MAX;

  const loadProducts = useCallback(async (page: number) => {
    try {
      setLoading(true);
      setError("");

      const params: ProductListingParams = {
        page,
        size: PAGE_SIZE,
      };
      if (debouncedSearch) params.q = debouncedSearch;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedBrands.length === 1) params.brand = selectedBrands[0];
      if (sortBy !== "default") params.sort = sortBy;
      if (inStockOnly) params.inStock = true;
      if (committedPriceRange[0] > PRICE_MIN) params.minPrice = committedPriceRange[0];
      if (committedPriceRange[1] < PRICE_MAX) params.maxPrice = committedPriceRange[1];

      const data = await productService.getProductListing(params);

      // Client-side brand multi-filter when more than 1 brand selected
      let filtered = data.products;
      if (selectedBrands.length > 1) {
        filtered = filtered.filter((p) =>
          selectedBrands.some((b) => b.toLowerCase() === (p.brand || "").toLowerCase())
        );
      }

      setProducts(filtered);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setCurrentPage(data.page);
      setFilterOptions(data.filters);
    } catch (err) {
      console.error(err);
      setError("Unable to load products right now.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategory, selectedBrands, sortBy, inStockOnly, committedPriceRange]);

  useEffect(() => {
    loadProducts(0);
  }, [loadProducts]);

  // Sidebar spotlight: latest three products, fetched once
  useEffect(() => {
    productService
      .getProductListing({ page: 0, size: 3, sort: "newest" })
      .then((data) => setNewProducts(data.products))
      .catch(() => setNewProducts([]));
  }, []);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedBrands.length === 1) params.set("brand", selectedBrands[0]);
    if (sortBy !== "default") params.set("sort", sortBy);
    if (inStockOnly) params.set("inStock", "true");
    if (committedPriceRange[0] > PRICE_MIN) params.set("minPrice", String(committedPriceRange[0]));
    if (committedPriceRange[1] < PRICE_MAX) params.set("maxPrice", String(committedPriceRange[1]));
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, selectedCategory, selectedBrands, sortBy, inStockOnly, committedPriceRange, setSearchParams]);

  const handlePageChange = (page: number) => {
    loadProducts(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedBrands([]);
    setSortBy("default");
    setInStockOnly(false);
    setPriceRange([PRICE_MIN, PRICE_MAX]);
    setCommittedPriceRange([PRICE_MIN, PRICE_MAX]);
  };

  const hasActiveFilters =
    !!debouncedSearch || !!selectedCategory || selectedBrands.length > 0 || inStockOnly || hasPriceFilter;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ============ Sidebar ============ */}
          <aside className={`${showFilters ? "block" : "hidden"} lg:block w-full lg:w-[270px] shrink-0 space-y-5`}>
            {/* Services */}
            <div className="rounded-md border border-gray-200 bg-white px-5 py-2">
              {SERVICES.map((service, i) => (
                <div
                  key={service.title}
                  className={`flex items-center gap-4 py-4 ${i > 0 ? "border-t border-gray-100" : ""}`}
                >
                  <service.icon className="size-7 shrink-0 text-[#f13c1f]" strokeWidth={1.5} />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-800">
                      {service.title}
                    </p>
                    <p className="text-xs text-gray-400">{service.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Product Filter */}
            <div className="rounded-md border border-gray-200 bg-white p-5">
              <h3 className="mb-4 text-base font-bold text-slate-800">Product Filter</h3>

              {/* Brand */}
              {filterOptions.brands.length > 0 && (
                <div className="mb-5">
                  <h4 className="mb-3 text-sm font-semibold text-slate-600">Filter By Brand</h4>
                  <div className="max-h-44 space-y-2.5 overflow-y-auto pr-1">
                    {filterOptions.brands.map((brand) => (
                      <div key={brand} className="flex items-center gap-2.5">
                        <Checkbox
                          id={`brand-${brand}`}
                          checked={selectedBrands.includes(brand)}
                          onCheckedChange={() => toggleBrand(brand)}
                          className="data-[state=checked]:border-[#f13c1f] data-[state=checked]:bg-[#f13c1f]"
                        />
                        <Label
                          htmlFor={`brand-${brand}`}
                          className="cursor-pointer text-sm font-normal text-gray-500 hover:text-slate-800"
                        >
                          {brand}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Availability */}
              <div className="mb-5">
                <h4 className="mb-3 text-sm font-semibold text-slate-600">Availability</h4>
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    id="in-stock"
                    checked={inStockOnly}
                    onCheckedChange={(checked) => setInStockOnly(checked === true)}
                    className="data-[state=checked]:border-[#f13c1f] data-[state=checked]:bg-[#f13c1f]"
                  />
                  <Label htmlFor="in-stock" className="cursor-pointer text-sm font-normal text-gray-500 hover:text-slate-800">
                    In Stock Only
                  </Label>
                </div>
              </div>

              {/* Price */}
              <div className="mb-1">
                <h4 className="mb-4 text-sm font-semibold text-slate-600">Filter By Price</h4>
                <Slider
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={PRICE_STEP}
                  value={priceRange}
                  onValueChange={(v) => setPriceRange(v as [number, number])}
                  onValueCommit={(v) => setCommittedPriceRange(v as [number, number])}
                  className="mb-3 [&_[data-slot=slider-range]]:bg-[#f13c1f] [&_[data-slot=slider-thumb]]:border-[#f13c1f]"
                />
                <p className="text-xs text-gray-400">
                  Price:{" "}
                  <span className="font-semibold text-[#f13c1f]">
                    {formatINR(priceRange[0])} - {formatINR(priceRange[1])}
                  </span>
                </p>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full border-gray-300 text-slate-600 hover:border-[#f13c1f] hover:bg-[#f13c1f] hover:text-white"
                  onClick={clearAllFilters}
                >
                  Clear All Filters
                </Button>
              )}
            </div>

            {/* New products */}
            {newProducts.length > 0 && (
              <div className="rounded-md border border-gray-200 bg-white p-5">
                <h3 className="mb-4 text-base font-bold text-slate-800">New Products</h3>
                <div className="space-y-4">
                  {newProducts.map((p) => (
                    <Link key={p.id} to={`/products/${p.id}`} className="group flex items-center gap-3">
                      <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded border border-gray-200 bg-white p-1">
                        {p.primaryImageId ? (
                          <img
                            src={getProductImageUrl(p.primaryImageId)}
                            alt={p.name}
                            className="size-full object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <Package className="size-6 text-gray-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-xs font-medium leading-snug text-slate-600 group-hover:text-[#f13c1f]">
                          {p.name}
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-[#f13c1f]">
                          {formatINR(p.variantCount > 0 ? p.startingPrice : (p.discountPrice ?? p.price))}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Promo card */}
            <div className="rounded-md bg-[#fdf3e3] p-6">
              <p className="text-xs font-semibold text-[#f13c1f]">Sparing Sales</p>
              <p className="mt-1 text-lg font-bold leading-snug text-slate-800">
                Bulk Orders
                <br />
                With Easy Quotes
              </p>
              <Link
                to="/cart"
                className="mt-4 inline-flex items-center gap-1.5 rounded-sm bg-[#f13c1f] px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#d43413]"
              >
                Get Quote
                <ArrowRight className="size-3" />
              </Link>
            </div>
          </aside>

          {/* ============ Main column ============ */}
          <div className="min-w-0 flex-1">
            {/* Promo banners */}
            <div className="mb-6 hidden gap-4 sm:grid sm:grid-cols-2">
              <div className="flex flex-col justify-center rounded-md bg-slate-900 px-7 py-6">
                <p className="text-xs font-semibold text-gray-400">Wholesale Pricing</p>
                <p className="mt-1 text-xl font-bold leading-snug text-white">
                  Request A Quote
                  <br />
                  &amp; Save Big
                </p>
                <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-white">
                  Shop Now <ArrowRight className="size-3 text-[#f13c1f]" />
                </span>
              </div>
              <div className="flex flex-col justify-center rounded-md bg-[#5a5bd8] px-7 py-6">
                <p className="text-xs font-semibold text-indigo-200">B2B Exclusive</p>
                <p className="mt-1 text-xl font-bold leading-snug text-white">
                  Smart Devices
                  <br />
                  For Your Business
                </p>
                <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-white">
                  Shop Now <ArrowRight className="size-3" />
                </span>
              </div>
            </div>

            {/* Section header + category tabs */}
            <div className="mb-5 flex flex-col gap-3 border-b border-gray-200 pb-3 md:flex-row md:items-center md:justify-between">
              <h1 className="text-xl font-bold text-slate-900">Our Products!</h1>
              <div className="flex items-center gap-5 overflow-x-auto pb-1 md:pb-0">
                <button
                  onClick={() => setSelectedCategory("")}
                  className={`whitespace-nowrap text-sm font-semibold transition-colors ${
                    !selectedCategory
                      ? "text-[#f13c1f] underline decoration-2 underline-offset-8"
                      : "text-gray-500 hover:text-[#f13c1f]"
                  }`}
                >
                  All
                </button>
                {filterOptions.categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(selectedCategory === cat ? "" : cat)}
                    className={`whitespace-nowrap text-sm font-semibold transition-colors ${
                      selectedCategory === cat
                        ? "text-[#f13c1f] underline decoration-2 underline-offset-8"
                        : "text-gray-500 hover:text-[#f13c1f]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Toolbar: search + sort */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex w-full gap-2 sm:w-auto">
                <div className="relative flex-1 sm:w-80">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search products, brands, SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-gray-300 pl-9 focus-visible:ring-[#f13c1f]/30"
                  />
                </div>
                <Button
                  variant={showFilters ? "default" : "outline"}
                  size="icon"
                  className={`shrink-0 lg:hidden ${showFilters ? "bg-[#f13c1f] hover:bg-[#d43413]" : "border-gray-300"}`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="size-4" />
                </Button>
              </div>

              <div className="flex items-center gap-3">
                {!loading && !error && (
                  <span className="hidden whitespace-nowrap text-xs text-gray-400 md:inline">
                    {totalElements} product{totalElements !== 1 ? "s" : ""}
                    {totalPages > 1 && ` — page ${currentPage + 1} of ${totalPages}`}
                  </span>
                )}
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger className="w-full border-gray-300 sm:w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Sorting</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Bar */}
            {hasActiveFilters && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-400">Active filters:</span>
                {debouncedSearch && (
                  <FilterChip label={`Search: "${debouncedSearch}"`} onRemove={() => setSearchQuery("")} />
                )}
                {selectedCategory && (
                  <FilterChip label={`Category: ${selectedCategory}`} onRemove={() => setSelectedCategory("")} />
                )}
                {selectedBrands.map((b) => (
                  <FilterChip key={b} label={`Brand: ${b}`} onRemove={() => toggleBrand(b)} />
                ))}
                {inStockOnly && <FilterChip label="In Stock Only" onRemove={() => setInStockOnly(false)} />}
                {hasPriceFilter && (
                  <FilterChip
                    label={`Price: ${formatINR(committedPriceRange[0])} - ${formatINR(committedPriceRange[1])}`}
                    onRemove={() => {
                      setPriceRange([PRICE_MIN, PRICE_MAX]);
                      setCommittedPriceRange([PRICE_MIN, PRICE_MAX]);
                    }}
                  />
                )}
                <button onClick={clearAllFilters} className="ml-1 text-xs text-[#f13c1f] hover:underline">
                  Clear all
                </button>
              </div>
            )}

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse overflow-hidden rounded-md border border-gray-200 bg-white">
                    <div className="aspect-square bg-gray-100" />
                    <div className="space-y-3 p-4">
                      <div className="h-3 w-3/4 rounded bg-gray-100" />
                      <div className="h-3 w-1/2 rounded bg-gray-100" />
                      <div className="h-5 w-1/3 rounded bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="py-16 text-center">
                <div className="mx-auto max-w-md">
                  <h3 className="mb-2 font-bold text-slate-800">Products unavailable</h3>
                  <p className="mb-6 text-gray-400">{error}</p>
                  <Button className="bg-[#f13c1f] hover:bg-[#d43413]" onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-1.5">
                    <button
                      disabled={currentPage === 0}
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="flex size-9 items-center justify-center rounded-sm border border-gray-300 text-slate-600 transition-colors hover:border-[#f13c1f] hover:bg-[#f13c1f] hover:text-white disabled:pointer-events-none disabled:opacity-40"
                    >
                      <ChevronLeft className="size-4" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i)
                      .filter((p) => {
                        if (totalPages <= 7) return true;
                        if (p === 0 || p === totalPages - 1) return true;
                        return Math.abs(p - currentPage) <= 1;
                      })
                      .map((p, idx, arr) => {
                        const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                        return (
                          <span key={p} className="contents">
                            {showEllipsis && <span className="px-1.5 text-sm text-gray-400">...</span>}
                            <button
                              onClick={() => handlePageChange(p)}
                              className={`flex size-9 items-center justify-center rounded-sm border text-sm font-semibold transition-colors ${
                                p === currentPage
                                  ? "border-[#f13c1f] bg-[#f13c1f] text-white"
                                  : "border-gray-300 text-slate-600 hover:border-[#f13c1f] hover:text-[#f13c1f]"
                              }`}
                            >
                              {p + 1}
                            </button>
                          </span>
                        );
                      })}

                    <button
                      disabled={currentPage >= totalPages - 1}
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="flex size-9 items-center justify-center rounded-sm border border-gray-300 text-slate-600 transition-colors hover:border-[#f13c1f] hover:bg-[#f13c1f] hover:text-white disabled:pointer-events-none disabled:opacity-40"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="py-16 text-center">
                <div className="mx-auto max-w-md">
                  <Package className="mx-auto mb-4 size-12 text-gray-300" />
                  <h3 className="mb-2 font-bold text-slate-800">No products found</h3>
                  <p className="mb-6 text-gray-400">
                    Try adjusting your filters or search to find what you're looking for
                  </p>
                  <div className="flex justify-center gap-2">
                    {hasActiveFilters && (
                      <Button variant="outline" className="border-gray-300" onClick={clearAllFilters}>
                        Clear Filters
                      </Button>
                    )}
                    <Button className="bg-[#f13c1f] hover:bg-[#d43413]" onClick={clearAllFilters}>
                      View All Products
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#f13c1f]/10 px-2.5 py-1 text-xs text-[#f13c1f]">
      {label}
      <button onClick={onRemove} className="hover:opacity-70">
        <X className="size-3" />
      </button>
    </span>
  );
}
