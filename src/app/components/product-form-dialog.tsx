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
import { categoryService, FlatCategory } from "../services/categoryService";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProductFormData) => void;
  initialData?: ProductFormData | null;
  mode: "create" | "edit";
}

function getEmptyProductFormData(): ProductFormData {
  return {
    name: "",
    sku: "",
    category: "",
    brand: "",
    description: "",
    fullDescription: "",
    price: 0,
    stockQuantity: 0,
    stockStatus: "in-stock",
    image: "",
    images: [],
    features: [],
    specifications: [],
    metaTitle: "",
    metaDescription: "",
  };
}

export function ProductFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
}: ProductFormDialogProps) {
  const [formData, setFormData] = useState<ProductFormData>(getEmptyProductFormData());

  const [currentFeature, setCurrentFeature] = useState("");
  const [currentSpec, setCurrentSpec] = useState({ label: "", value: "" });
  const [primaryImagePreview, setPrimaryImagePreview] = useState("");
  const [galleryImagePreviews, setGalleryImagePreviews] = useState<string[]>([]);

  const [flatCategories, setFlatCategories] = useState<FlatCategory[]>([]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    categoryService.getFlatCategories().then((cats) => {
      if (!cancelled) setFlatCategories(cats);
    }).catch(() => {
      if (!cancelled) setFlatCategories([]);
    });
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    if (initialData) {
      setFormData({ ...getEmptyProductFormData(), ...initialData });
      setPrimaryImagePreview(initialData.image || initialData.images[0] || "");
      setGalleryImagePreviews(initialData.images || []);
    } else {
      setFormData({ ...getEmptyProductFormData(), galleryImageFiles: [] });
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
      <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] sm:max-w-6xl overflow-hidden">
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

        <ScrollArea className="max-h-[calc(92vh-120px)] pr-4">
          <form
            onSubmit={handleSubmit}
            className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2"
          >
            {/* Basic Information */}
            <div className="min-w-0 space-y-4 rounded-lg border p-4">
              <h3 className="font-semibold">Basic Information</h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0 space-y-2">
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

                <div className="min-w-0 space-y-2">
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0 space-y-2">
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
                      {flatCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {"  ".repeat(cat.depth)}{cat.depth > 0 ? "└ " : ""}{cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-0 space-y-2">
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

            {/* Images */}
            <div className="min-w-0 space-y-4 rounded-lg border p-4 lg:row-span-2">
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
            <div className="min-w-0 space-y-4 rounded-lg border p-4">
              <h3 className="font-semibold">Product Features</h3>

              <div className="flex min-w-0 gap-2">
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
                      className="flex min-w-0 items-center justify-between gap-2 p-2 bg-accent rounded-lg"
                    >
                      <span className="min-w-0 break-words text-sm">{feature}</span>
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
            <div className="min-w-0 space-y-4 rounded-lg border p-4">
              <h3 className="font-semibold">Specifications</h3>

              <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
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
                      className="flex min-w-0 items-center justify-between gap-2 p-2 bg-accent rounded-lg"
                    >
                      <span className="min-w-0 break-words text-sm">
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
            <div className="min-w-0 space-y-4 rounded-lg border p-4">
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
            <div className="flex gap-3 justify-end border-t pt-4 lg:col-span-2">
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
