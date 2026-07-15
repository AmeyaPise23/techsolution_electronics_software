import { useState, useEffect, useCallback } from "react";
import { ChevronRight, FolderTree, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
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
import { CreateCategoryDialog } from "../components/create-category-dialog";
import {
  categoryService,
  FlatCategory,
} from "../services/categoryService";
import { toast } from "sonner";

export function AdminCategories() {
  const [categories, setCategories] = useState<FlatCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const cats = await categoryService.getAllFlatCategories();
      setCategories(cats);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleDeleteClick = (id: string) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    try {
      await categoryService.deleteCategory(categoryToDelete);
      setCategories(categories.filter((c) => c.id !== categoryToDelete));
      toast.success("Category deleted successfully");
    } catch {
      toast.error("Failed to delete category");
    } finally {
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const rootCount = categories.filter((c) => !c.parentId).length;
  const childCount = categories.filter((c) => c.parentId).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="mb-1">Categories</h1>
          <p className="text-muted-foreground">
            Organize your product catalog with nested categories
          </p>
        </div>
        <Button onClick={() => setCategoryDialogOpen(true)}>
          <Plus className="size-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground">Total Categories</p>
          <p className="text-2xl font-bold mt-1">{categories.length}</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground">Root Categories</p>
          <p className="text-2xl font-bold mt-1">{rootCount}</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground">Sub Categories</p>
          <p className="text-2xl font-bold mt-1">{childCount}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Loading categories...
                </TableCell>
              </TableRow>
            ) : filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="size-14 rounded-full bg-muted flex items-center justify-center">
                      <FolderTree className="size-7 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mt-2">No categories yet</p>
                    <Button
                      variant="outline"
                      onClick={() => setCategoryDialogOpen(true)}
                    >
                      <Plus className="size-4 mr-2" />
                      Create first category
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell>
                    <div
                      className="flex items-center gap-1 font-medium"
                      style={{ paddingLeft: `${cat.depth * 20}px` }}
                    >
                      {cat.label.split(" > ").map((part, i, arr) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && (
                            <ChevronRight className="size-3 text-muted-foreground" />
                          )}
                          <span
                            className={
                              i === arr.length - 1 ? "" : "text-muted-foreground"
                            }
                          >
                            {part}
                          </span>
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {cat.code || "-"}
                  </TableCell>
                  <TableCell>
                    {cat.active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" title="Edit" disabled>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete"
                        onClick={() => handleDeleteClick(cat.id)}
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

      <CreateCategoryDialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        onCategoryCreated={() => loadCategories()}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this category and all its
              subcategories. This action cannot be undone.
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
