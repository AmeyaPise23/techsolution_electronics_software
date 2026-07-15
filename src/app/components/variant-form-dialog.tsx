import { useState, useEffect } from "react";
import { Loader2, Package, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  variantService,
  VariantResponseDto,
  VariantRequestDto,
} from "../services/variantService";

interface VariantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
}

function getEmptyVariant(productId: string): VariantRequestDto {
  return {
    productId,
    variantName: "",
    sku: "",
    color: "",
    size: "",
    material: "",
    weight: "",
    purchasePrice: undefined,
    landingCost: undefined,
    mrp: undefined,
    price: 0,
    discountPrice: undefined,
    taxPercentage: undefined,
    hsnCode: "",
    currency: "INR",
    taxInclusive: false,
    stockQuantity: 0,
    stockStatus: "in-stock",
    active: true,
  };
}

export function VariantFormDialog({
  open,
  onOpenChange,
  productId,
  productName,
}: VariantFormDialogProps) {
  const [variants, setVariants] = useState<VariantResponseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [formData, setFormData] = useState<VariantRequestDto>(getEmptyVariant(productId));
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [variantToDelete, setVariantToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !productId) return;
    loadVariants();
  }, [open, productId]);

  const loadVariants = async () => {
    setLoading(true);
    try {
      const data = await variantService.getVariantsByProduct(productId);
      setVariants(data);
    } catch {
      setVariants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setFormData(getEmptyVariant(productId));
    setFormMode("create");
    setEditingVariantId(null);
    setShowForm(true);
  };

  const handleEdit = (variant: VariantResponseDto) => {
    setFormData({
      productId,
      variantName: variant.variantName,
      sku: variant.sku,
      color: variant.color ?? "",
      size: variant.size ?? "",
      material: variant.material ?? "",
      weight: variant.weight ?? "",
      purchasePrice: variant.purchasePrice ?? undefined,
      landingCost: variant.landingCost ?? undefined,
      mrp: variant.mrp ?? undefined,
      price: variant.price,
      discountPrice: variant.discountPrice ?? undefined,
      taxPercentage: variant.taxPercentage ?? undefined,
      hsnCode: variant.hsnCode ?? "",
      currency: variant.currency ?? "INR",
      taxInclusive: variant.taxInclusive,
      stockQuantity: variant.stockQuantity,
      stockStatus: variant.stockStatus,
      active: variant.active,
    });
    setFormMode("edit");
    setEditingVariantId(variant.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.variantName.trim() || !formData.sku.trim()) return;

    setSubmitting(true);
    try {
      if (formMode === "create") {
        await variantService.createVariant(formData);
        toast.success("Variant created successfully");
      } else if (editingVariantId) {
        await variantService.updateVariant(editingVariantId, formData);
        toast.success("Variant updated successfully");
      }
      setShowForm(false);
      await loadVariants();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : `Failed to ${formMode} variant`;
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (variantId: string) => {
    setVariantToDelete(variantId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!variantToDelete) return;
    try {
      await variantService.deleteVariant(variantToDelete);
      setVariants(variants.filter((v) => v.id !== variantToDelete));
      toast.success("Variant deleted successfully");
    } catch {
      toast.error("Failed to delete variant");
    } finally {
      setDeleteDialogOpen(false);
      setVariantToDelete(null);
    }
  };

  const getStockBadge = (status: string) => {
    switch (status) {
      case "in-stock":
        return <Badge variant="default">In Stock</Badge>;
      case "out-of-stock":
        return <Badge variant="destructive">Out of Stock</Badge>;
      case "pre-order":
        return <Badge variant="secondary">Pre Order</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] sm:max-w-5xl overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Package className="size-5" />
              </div>
              <div>
                <span>Product Variants</span>
                <p className="text-sm font-normal text-muted-foreground">
                  {productName}
                </p>
              </div>
            </DialogTitle>
            <DialogDescription>
              Manage pricing, inventory and attributes for each variant of this product.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(92vh-140px)]">
            {!showForm ? (
              <div className="space-y-4 pr-4">
                <div className="flex justify-end">
                  <Button onClick={handleAddNew}>
                    <Plus className="size-4 mr-2" />
                    Add Variant
                  </Button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Loading variants...
                  </div>
                ) : variants.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground mb-3">
                      No variants yet. Add pricing and inventory details as variants.
                    </p>
                    <Button variant="outline" onClick={handleAddNew}>
                      <Plus className="size-4 mr-2" />
                      Create first variant
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Variant</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Attributes</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>MRP</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {variants.map((variant) => (
                          <TableRow key={variant.id}>
                            <TableCell className="font-medium">
                              {variant.variantName}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {variant.sku}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {variant.color && (
                                  <Badge variant="outline">{variant.color}</Badge>
                                )}
                                {variant.size && (
                                  <Badge variant="outline">{variant.size}</Badge>
                                )}
                                {variant.material && (
                                  <Badge variant="outline">{variant.material}</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {variant.currency ?? "INR"} {variant.price.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {variant.mrp != null
                                ? `${variant.currency ?? "INR"} ${variant.mrp.toFixed(2)}`
                                : "-"}
                            </TableCell>
                            <TableCell>{variant.stockQuantity}</TableCell>
                            <TableCell>
                              {getStockBadge(variant.stockStatus)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(variant)}
                                  title="Edit"
                                >
                                  <Pencil className="size-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteClick(variant.id)}
                                  title="Delete"
                                >
                                  <Trash2 className="size-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 pr-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    {formMode === "create" ? "New Variant" : "Edit Variant"}
                  </h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowForm(false)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>

                {/* Variant Info */}
                <div className="space-y-4 rounded-lg border p-4">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Variant Information
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="variantName">Variant Name *</Label>
                      <Input
                        id="variantName"
                        value={formData.variantName}
                        onChange={(e) =>
                          setFormData({ ...formData, variantName: e.target.value })
                        }
                        placeholder="e.g. 128GB - Space Gray"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="variantSku">SKU *</Label>
                      <Input
                        id="variantSku"
                        value={formData.sku}
                        onChange={(e) =>
                          setFormData({ ...formData, sku: e.target.value })
                        }
                        placeholder="e.g. PROD-128-GRY"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Attributes */}
                <div className="space-y-4 rounded-lg border p-4">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Attributes
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="color">Color</Label>
                      <Input
                        id="color"
                        value={formData.color ?? ""}
                        onChange={(e) =>
                          setFormData({ ...formData, color: e.target.value })
                        }
                        placeholder="e.g. Black"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="size">Size</Label>
                      <Input
                        id="size"
                        value={formData.size ?? ""}
                        onChange={(e) =>
                          setFormData({ ...formData, size: e.target.value })
                        }
                        placeholder="e.g. Large"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="material">Material</Label>
                      <Input
                        id="material"
                        value={formData.material ?? ""}
                        onChange={(e) =>
                          setFormData({ ...formData, material: e.target.value })
                        }
                        placeholder="e.g. Cotton"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight</Label>
                      <Input
                        id="weight"
                        value={formData.weight ?? ""}
                        onChange={(e) =>
                          setFormData({ ...formData, weight: e.target.value })
                        }
                        placeholder="e.g. 250g"
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-4 rounded-lg border p-4">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Pricing
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="vPurchasePrice">Purchase Price *</Label>
                      <Input
                        id="vPurchasePrice"
                        type="number"
                        step="0.01"
                        value={formData.purchasePrice ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            purchasePrice: e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vLandingCost">Landing Cost</Label>
                      <Input
                        id="vLandingCost"
                        type="number"
                        step="0.01"
                        value={formData.landingCost ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            landingCost: e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vMrp">MRP *</Label>
                      <Input
                        id="vMrp"
                        type="number"
                        step="0.01"
                        value={formData.mrp ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            mrp: e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vPrice">Selling Price *</Label>
                      <Input
                        id="vPrice"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            price: e.target.value
                              ? parseFloat(e.target.value)
                              : 0,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vDiscount">Discount Price</Label>
                      <Input
                        id="vDiscount"
                        type="number"
                        step="0.01"
                        value={formData.discountPrice ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discountPrice: e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vTax">GST %</Label>
                      <Input
                        id="vTax"
                        type="number"
                        step="0.01"
                        value={formData.taxPercentage ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            taxPercentage: e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vHsn">HSN Code</Label>
                      <Input
                        id="vHsn"
                        value={formData.hsnCode ?? ""}
                        onChange={(e) =>
                          setFormData({ ...formData, hsnCode: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vCurrency">Currency</Label>
                      <Input
                        id="vCurrency"
                        value={formData.currency ?? "INR"}
                        onChange={(e) =>
                          setFormData({ ...formData, currency: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm w-fit">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.taxInclusive)}
                      onChange={(e) =>
                        setFormData({ ...formData, taxInclusive: e.target.checked })
                      }
                    />
                    <span>Tax Inclusive</span>
                  </label>
                </div>

                {/* Inventory */}
                <div className="space-y-4 rounded-lg border p-4">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Inventory
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="vStockQty">Stock Quantity *</Label>
                      <Input
                        id="vStockQty"
                        type="number"
                        value={formData.stockQuantity}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            stockQuantity: parseInt(e.target.value) || 0,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vStockStatus">Stock Status *</Label>
                      <Select
                        value={formData.stockStatus}
                        onValueChange={(value) =>
                          setFormData({ ...formData, stockStatus: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in-stock">In Stock</SelectItem>
                          <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                          <SelectItem value="pre-order">Pre Order</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 justify-end border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                    {formMode === "create" ? "Create Variant" : "Update Variant"}
                  </Button>
                </div>
              </form>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Variant?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The variant and its pricing/inventory
              data will be permanently removed.
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
    </>
  );
}
