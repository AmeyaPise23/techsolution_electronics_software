import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Users, Pencil, Trash2, Building2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
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
import { clientService, Client } from "../services/clientService";
import { CreateClientDialog } from "../components/create-client-dialog";
import { toast } from "sonner";

export function SalesClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      const data = await clientService.getClients();
      setClients(data);
    } catch {
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const filteredClients = clients.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    );
  });

  function handleAdd() {
    setEditingClient(null);
    setDialogOpen(true);
  }

  function handleEdit(client: Client) {
    setEditingClient(client);
    setDialogOpen(true);
  }

  function handleClientSaved(client: Client) {
    setClients((prev) => {
      const idx = prev.findIndex((c) => c.id === client.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = client;
        return copy;
      }
      return [client, ...prev];
    });
  }

  async function handleDelete() {
    if (!clientToDelete) return;
    try {
      await clientService.deleteClient(clientToDelete);
      setClients((prev) => prev.filter((c) => c.id !== clientToDelete));
      toast.success("Client deleted");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="mb-1">Clients</h1>
          <p className="text-muted-foreground">
            Manage your client base and business relationships
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="size-4 mr-2" />
          Register Client
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground">Total Clients</p>
          <p className="text-2xl font-bold mt-1">{clients.length}</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground">With GST</p>
          <p className="text-2xl font-bold mt-1">
            {clients.filter((c) => c.gstNumber).length}
          </p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground">Added This Month</p>
          <p className="text-2xl font-bold mt-1">
            {
              clients.filter((c) => {
                if (!c.createdAt) return false;
                const d = new Date(c.createdAt);
                const now = new Date();
                return (
                  d.getMonth() === now.getMonth() &&
                  d.getFullYear() === now.getFullYear()
                );
              }).length
            }
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search clients by name, company, email or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>GST Number</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading clients...
                  </TableCell>
                </TableRow>
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <div className="size-14 rounded-full bg-muted flex items-center justify-center">
                        <Users className="size-7 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground mt-2">
                        {searchQuery
                          ? "No clients match your search"
                          : "No clients registered yet"}
                      </p>
                      {!searchQuery && (
                        <Button variant="outline" onClick={handleAdd}>
                          <Plus className="size-4 mr-2" />
                          Register your first client
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="size-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {client.company}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.email}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.phone}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.gstNumber || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.createdAt
                        ? new Date(client.createdAt).toLocaleDateString("en-IN")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Edit"
                          onClick={() => handleEdit(client)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete"
                          onClick={() => {
                            setClientToDelete(client.id);
                            setDeleteDialogOpen(true);
                          }}
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

      <CreateClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onClientCreated={handleClientSaved}
        editClient={editingClient}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this client record. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
