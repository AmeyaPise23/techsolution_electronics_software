import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2, Eye, Package } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { ProductFormDialog } from "../components/product-form-dialog";
import { CreateCategoryDialog } from "../components/create-category-dialog";
import { VariantFormDialog } from "../components/variant-form-dialog";
import { productService, ProductFormData } from "../services/productService";
import {
  categoryService,
  FlatCategory,
} from "../services/categoryService";
import { toast } from "sonner";
import { useNavigate } from "react-router";

export function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductFormData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [flatCategories, setFlatCategories] = useState<FlatCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [variantProduct, setVariantProduct] = useState<{ id: string; name: string } | null>(null);
  const [currentProduct, setCurrentProduct] = useState<ProductFormData | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  const loadCategories = useCallback(async () => {
    try {
      const cats = await categoryService.getAllFlatCategories();
      setFlatCategories(cats);
    } catch {
      setFlatCategories([]);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadCategories]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (error) {
      toast.error("Failed to load products");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = () => {
    setCurrentProduct(null);
    setFormMode("create");
    setFormDialogOpen(true);
  };

  const handleEditProduct = (product: ProductFormData) => {
    setCurrentProduct(product);
    setFormMode("edit");
    setFormDialogOpen(true);
  };

  const handleViewProduct = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  const handleManageVariants = (product: ProductFormData) => {
    setVariantProduct({ id: product.id!, name: product.name });
    setVariantDialogOpen(true);
  };

  const handleDeleteClick = (productId: string) => {
    setProductToDelete(productId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      await productService.deleteProduct(productToDelete);
      setProducts(products.filter((p) => p.id !== productToDelete));
      toast.success("Product deleted successfully");
    } catch (error) {
      toast.error("Failed to delete product");
      console.error(error);
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleFormSubmit = async (data: ProductFormData) => {
    try {
      if (formMode === "create") {
        const newProduct = await productService.createProduct(data);
        setProducts([...products, newProduct]);
        toast.success("Product created successfully");
      } else if (currentProduct?.id) {
        const updatedProduct = await productService.updateProduct(
          currentProduct.id,
          data
        );
        setProducts(
          products.map((p) => (p.id === currentProduct.id ? updatedProduct : p))
        );
        toast.success("Product updated successfully");
      }
      setFormDialogOpen(false);
      setCurrentProduct(null);
    } catch (error) {
      toast.error(`Failed to ${formMode} product`);
      console.error(error);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="mb-1">Product Management</h1>
          <p className="text-muted-foreground">
            Manage your product catalog, categories and variants
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto">
          <Button onClick={handleCreateProduct}>
            <Plus className="size-4 mr-2" />
            Add Product
          </Button>
          <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(true)}>
            <Plus className="size-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search products by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[250px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {flatCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.name}>
                {"  ".repeat(cat.depth)}{cat.depth > 0 ? "└ " : ""}{cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground">Total Products</p>
          <p className="text-2xl font-bold mt-1">{products.length}</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground">Categories</p>
          <p className="text-2xl font-bold mt-1">{flatCategories.length}</p>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading products...
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-muted-foreground">No products found</p>
                      {products.length === 0 && (
                        <Button variant="outline" onClick={handleCreateProduct}>
                          <Plus className="size-4 mr-2" />
                          Add your first product
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="size-12 object-cover rounded-lg border border-border"
                        />
                      ) : (
                        <div className="size-12 rounded-lg bg-muted flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">No image</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.sku}
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.brand || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.createdAt
                        ? new Date(product.createdAt).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleManageVariants(product)}
                          title="Manage Variants"
                        >
                          <Package className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewProduct(product.id!)}
                          title="View"
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditProduct(product)}
                          title="Edit"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(product.id!)}
                          title="Delete"
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Product Form Dialog */}
      <ProductFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        onSubmit={handleFormSubmit}
        initialData={currentProduct}
        mode={formMode}
      />

      <CreateCategoryDialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        onCategoryCreated={() => loadCategories()}
      />

      {/* Variant Management Dialog */}
      {variantProduct && (
        <VariantFormDialog
          open={variantDialogOpen}
          onOpenChange={setVariantDialogOpen}
          productId={variantProduct.id}
          productName={variantProduct.name}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              product and all its variants from your catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
