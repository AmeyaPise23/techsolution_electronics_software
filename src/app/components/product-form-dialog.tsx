import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { ScrollArea } from "./ui/scroll-area";
import { Plus, X, Upload } from "lucide-react";
import { ProductFormData } from "../services/productService";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProductFormData) => void;
  initialData?: ProductFormData | null;
  mode: "create" | "edit";
}

const categories = [
  "Audio",
  "Watches",
  "Cameras",
  "Home",
  "Fitness",
  "Computing",
  "Gaming",
  "Fashion",
  "Beauty",
];

export function ProductFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
}: ProductFormDialogProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    sku: "",
    category: "",
    brand: "",
    description: "",
    fullDescription: "",
    price: 0,
    discountPrice: undefined,
    taxPercentage: undefined,
    stockQuantity: 0,
    stockStatus: "in-stock",
    image: "",
    images: [],
    features: [],
    specifications: [],
    metaTitle: "",
    metaDescription: "",
  });

  const [currentFeature, setCurrentFeature] = useState("");
  const [currentSpec, setCurrentSpec] = useState({ label: "", value: "" });
  const [primaryImagePreview, setPrimaryImagePreview] = useState("");
  const [galleryImagePreviews, setGalleryImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setPrimaryImagePreview(initialData.image || initialData.images[0] || "");
      setGalleryImagePreviews(initialData.images || []);
    } else {
      // Reset form
      setFormData({
        name: "",
        sku: "",
        category: "",
        brand: "",
        description: "",
        fullDescription: "",
        price: 0,
        discountPrice: undefined,
        taxPercentage: undefined,
        stockQuantity: 0,
        stockStatus: "in-stock",
        image: "",
        images: [],
        galleryImageFiles: [],
        features: [],
        specifications: [],
        metaTitle: "",
        metaDescription: "",
      });
      setPrimaryImagePreview("");
      setGalleryImagePreviews([]);
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addFeature = () => {
    if (currentFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, currentFeature.trim()],
      });
      setCurrentFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  const addSpecification = () => {
    if (currentSpec.label.trim() && currentSpec.value.trim()) {
      setFormData({
        ...formData,
        specifications: [...formData.specifications, currentSpec],
      });
      setCurrentSpec({ label: "", value: "" });
    }
  };

  const removeSpecification = (index: number) => {
    setFormData({
      ...formData,
      specifications: formData.specifications.filter((_, i) => i !== index),
    });
  };

  const handlePrimaryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setPrimaryImagePreview(previewUrl);
    setFormData({
      ...formData,
      image: previewUrl,
      imageFile: file,
    });
  };

  const handleGalleryImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentFiles = formData.galleryImageFiles || [];
    const selectedFiles = Array.from(e.target.files || []);
    const nextFiles = [...currentFiles, ...selectedFiles].slice(0, 5);
    const newPreviewUrls = selectedFiles
      .slice(0, Math.max(0, 5 - currentFiles.length))
      .map((file) => URL.createObjectURL(file));
    const nextPreviewUrls = [...galleryImagePreviews, ...newPreviewUrls].slice(0, 5);

    setGalleryImagePreviews(nextPreviewUrls);
    setFormData({
      ...formData,
      images: nextPreviewUrls,
      galleryImageFiles: nextFiles,
    });
    e.target.value = "";
  };

  const removePrimaryImage = () => {
    setPrimaryImagePreview("");
    setFormData({
      ...formData,
      image: "",
      imageFile: undefined,
    });
  };

  const removeImage = (index: number) => {
    const nextPreviews = galleryImagePreviews.filter((_, i) => i !== index);
    const nextFiles = formData.galleryImageFiles?.filter((_, i) => i !== index) || [];

    setGalleryImagePreviews(nextPreviews);
    setFormData({
      ...formData,
      images: nextPreviews,
      galleryImageFiles: nextFiles,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add New Product" : "Edit Product"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Fill in the details to create a new product"
              : "Update the product information"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Basic Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Short Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullDescription">Full Description</Label>
                <Textarea
                  id="fullDescription"
                  value={formData.fullDescription}
                  onChange={(e) =>
                    setFormData({ ...formData, fullDescription: e.target.value })
                  }
                  rows={4}
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="font-semibold">Pricing</h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: parseFloat(e.target.value) })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountPrice">Discount Price</Label>
                  <Input
                    id="discountPrice"
                    type="number"
                    step="0.01"
                    value={formData.discountPrice || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxPercentage">Tax %</Label>
                  <Input
                    id="taxPercentage"
                    type="number"
                    step="0.01"
                    value={formData.taxPercentage || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        taxPercentage: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className="space-y-4">
              <h3 className="font-semibold">Inventory</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, stockQuantity: parseInt(e.target.value) })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stockStatus">Stock Status *</Label>
                  <Select
                    value={formData.stockStatus}
                    onValueChange={(value: "in-stock" | "out-of-stock" | "pre-order") =>
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

            {/* Images */}
            <div className="space-y-4">
              <h3 className="font-semibold">Product Images</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryImage">Primary Image *</Label>
                  <Input
                    id="primaryImage"
                    type="file"
                    accept="image/jpeg,image/jpg"
                    onChange={handlePrimaryImageChange}
                    required={mode === "create" && !formData.imageFile}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="galleryImages">
                    Gallery Images ({galleryImagePreviews.length}/5)
                  </Label>
                  <Input
                    id="galleryImages"
                    type="file"
                    accept="image/jpeg,image/jpg"
                    multiple
                    disabled={galleryImagePreviews.length >= 5}
                    onChange={handleGalleryImagesChange}
                  />
                </div>
              </div>

              {primaryImagePreview ? (
                <div className="relative w-full max-w-xs group">
                  <img
                    src={primaryImagePreview}
                    alt="Primary product"
                    className="w-full h-40 object-cover rounded-lg border border-border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity size-7"
                    onClick={removePrimaryImage}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ) : (
                <div className="w-full max-w-xs h-40 rounded-lg border border-dashed border-border bg-muted flex items-center justify-center">
                  <Upload className="size-6 text-muted-foreground" />
                </div>
              )}

              {galleryImagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {galleryImagePreviews.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Product ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity size-6"
                        onClick={() => removeImage(index)}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h3 className="font-semibold">Product Features</h3>

              <div className="flex gap-2">
                <Input
                  placeholder="Add a feature"
                  value={currentFeature}
                  onChange={(e) => setCurrentFeature(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                />
                <Button type="button" onClick={addFeature} size="icon">
                  <Plus className="size-4" />
                </Button>
              </div>

              {formData.features.length > 0 && (
                <div className="space-y-2">
                  {formData.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-accent rounded-lg"
                    >
                      <span className="text-sm">{feature}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={() => removeFeature(index)}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Specifications */}
            <div className="space-y-4">
              <h3 className="font-semibold">Specifications</h3>

              <div className="flex gap-2">
                <Input
                  placeholder="Label (e.g., Processor)"
                  value={currentSpec.label}
                  onChange={(e) =>
                    setCurrentSpec({ ...currentSpec, label: e.target.value })
                  }
                />
                <Input
                  placeholder="Value (e.g., Intel i7)"
                  value={currentSpec.value}
                  onChange={(e) =>
                    setCurrentSpec({ ...currentSpec, value: e.target.value })
                  }
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addSpecification())
                  }
                />
                <Button type="button" onClick={addSpecification} size="icon">
                  <Plus className="size-4" />
                </Button>
              </div>

              {formData.specifications.length > 0 && (
                <div className="space-y-2">
                  {formData.specifications.map((spec, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-accent rounded-lg"
                    >
                      <span className="text-sm">
                        <span className="font-medium">{spec.label}:</span> {spec.value}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={() => removeSpecification(index)}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SEO */}
            <div className="space-y-4">
              <h3 className="font-semibold">SEO</h3>

              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={formData.metaTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, metaTitle: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={formData.metaDescription}
                  onChange={(e) =>
                    setFormData({ ...formData, metaDescription: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {mode === "create" ? "Create Product" : "Update Product"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
