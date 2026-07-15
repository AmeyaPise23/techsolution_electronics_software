import { useEffect, useMemo, useState } from "react";
import { ChevronRight, FolderTree, Loader2, Plus, Search, X } from "lucide-react";
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
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import { ScrollArea } from "./ui/scroll-area";
import {
    categoryService,
    FlatCategory,
    CategoryResponseDto,
} from "../services/categoryService";

type CreateCategoryDialogProps = {
    open: boolean;
    onClose: () => void;
    onCategoryCreated?: (category: CategoryResponseDto) => void;
};

export function CreateCategoryDialog({
    open,
    onClose,
    onCategoryCreated,
}: CreateCategoryDialogProps) {
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [parentCategorySearch, setParentCategorySearch] = useState("");
    const [selectedParent, setSelectedParent] = useState<FlatCategory | null>(null);
    const [description, setDescription] = useState("");
    const [active, setActive] = useState(true);
    const [touched, setTouched] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [allCategories, setAllCategories] = useState<FlatCategory[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);

    useEffect(() => {
        if (!open) return;

        let cancelled = false;
        setLoadingCategories(true);
        categoryService
            .getAllFlatCategories()
            .then((cats) => {
                if (!cancelled) setAllCategories(cats);
            })
            .catch(() => {
                if (!cancelled) setAllCategories([]);
            })
            .finally(() => {
                if (!cancelled) setLoadingCategories(false);
            });

        return () => {
            cancelled = true;
        };
    }, [open]);

    const filteredCategoryOptions = useMemo(() => {
        if (!parentCategorySearch.trim()) {
            return allCategories.slice(0, 15);
        }
        const query = parentCategorySearch.toLowerCase();
        return allCategories.filter((option) =>
            option.label.toLowerCase().includes(query)
        );
    }, [allCategories, parentCategorySearch]);

    const resetForm = () => {
        setName("");
        setCode("");
        setParentCategorySearch("");
        setSelectedParent(null);
        setDescription("");
        setActive(true);
        setTouched(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleCreate = async () => {
        setTouched(true);
        if (!name.trim()) return;

        setSubmitting(true);
        try {
            const created = await categoryService.createCategory({
                name: name.trim(),
                code: code.trim() || undefined,
                parentId: selectedParent?.id ?? undefined,
                description: description.trim() || undefined,
                active,
            });

            toast.success(`Category "${name.trim()}" created successfully.`);
            onCategoryCreated?.(created);
            handleClose();
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Failed to create category";
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const isNameValid = name.trim().length > 0;

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) handleClose();
            }}
        >
            <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] overflow-hidden sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <FolderTree className="size-5" />
                        </div>
                        <span>Create Category</span>
                    </DialogTitle>
                    <DialogDescription>
                        Organize your catalog with nested categories.
                    </DialogDescription>
                </DialogHeader>

                <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                    <div className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="category-name">
                                    Category Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="category-name"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        if (touched) setTouched(false);
                                    }}
                                    placeholder="Enter category name"
                                    required
                                />
                                {touched && !isNameValid ? (
                                    <p className="text-sm text-destructive">
                                        Category name is required
                                    </p>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Required for the new catalog entry.
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category-code">Category Code</Label>
                                <Input
                                    id="category-code"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="Optional unique code"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="parent-category">Parent Category</Label>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="parent-category"
                                        value={parentCategorySearch}
                                        onChange={(e) => {
                                            setParentCategorySearch(e.target.value);
                                            if (selectedParent) setSelectedParent(null);
                                        }}
                                        placeholder="Search parent category"
                                        className="pl-9"
                                    />
                                </div>

                                {selectedParent && (
                                    <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm">
                                        <span className="flex items-center gap-1 text-foreground">
                                            {selectedParent.label.split(" > ").map((part, i, arr) => (
                                                <span key={i} className="flex items-center gap-1">
                                                    {i > 0 && (
                                                        <ChevronRight className="size-3 text-muted-foreground" />
                                                    )}
                                                    <span
                                                        className={
                                                            i === arr.length - 1
                                                                ? "font-medium"
                                                                : "text-muted-foreground"
                                                        }
                                                    >
                                                        {part}
                                                    </span>
                                                </span>
                                            ))}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedParent(null);
                                                setParentCategorySearch("");
                                            }}
                                            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="size-3.5" />
                                            Clear
                                        </button>
                                    </div>
                                )}

                                {!selectedParent && (parentCategorySearch.trim() || allCategories.length > 0) && (
                                    <ScrollArea className="max-h-40">
                                        <div className="rounded-md border border-border bg-background p-1">
                                            {loadingCategories ? (
                                                <div className="flex items-center justify-center py-3 text-sm text-muted-foreground">
                                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                                    Loading categories...
                                                </div>
                                            ) : filteredCategoryOptions.length === 0 ? (
                                                <div className="py-3 text-center text-sm text-muted-foreground">
                                                    No categories found
                                                </div>
                                            ) : (
                                                filteredCategoryOptions.map((option) => (
                                                    <button
                                                        key={option.id}
                                                        type="button"
                                                        className="flex w-full items-center rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                                                        style={{ paddingLeft: `${option.depth * 16 + 8}px` }}
                                                        onClick={() => {
                                                            setSelectedParent(option);
                                                            setParentCategorySearch(option.label);
                                                        }}
                                                    >
                                                        <span className="flex items-center gap-1">
                                                            {option.label.split(" > ").map((part, i, arr) => (
                                                                <span key={i} className="flex items-center gap-1">
                                                                    {i > 0 && (
                                                                        <ChevronRight className="size-3 text-muted-foreground" />
                                                                    )}
                                                                    <span
                                                                        className={
                                                                            i === arr.length - 1
                                                                                ? "font-medium"
                                                                                : "text-muted-foreground"
                                                                        }
                                                                    >
                                                                        {part}
                                                                    </span>
                                                                </span>
                                                            ))}
                                                        </span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </ScrollArea>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category-description">Description</Label>
                            <Textarea
                                id="category-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter category description"
                                rows={3}
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
                            <div>
                                <p className="text-sm font-medium">Status</p>
                                <p className="text-sm text-muted-foreground">
                                    Make the category available to shoppers.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Label htmlFor="category-status" className="text-sm">
                                    Active
                                </Label>
                                <Switch
                                    id="category-status"
                                    checked={active}
                                    onCheckedChange={setActive}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleCreate}
                            disabled={!isNameValid || submitting}
                        >
                            {submitting ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : (
                                <Plus className="mr-2 size-4" />
                            )}
                            {submitting ? "Creating..." : "Create Category"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
