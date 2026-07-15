import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { clientService, Client, ClientFormData } from "../services/clientService";
import { toast } from "sonner";

interface CreateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated: (client: Client) => void;
  editClient?: Client | null;
}

const emptyForm: ClientFormData = {
  name: "",
  company: "",
  email: "",
  phone: "",
  address: "",
  gstNumber: "",
};

export function CreateClientDialog({
  open,
  onOpenChange,
  onClientCreated,
  editClient,
}: CreateClientDialogProps) {
  const [form, setForm] = useState<ClientFormData>(
    editClient
      ? {
          name: editClient.name,
          company: editClient.company,
          email: editClient.email,
          phone: editClient.phone,
          address: editClient.address,
          gstNumber: editClient.gstNumber || "",
        }
      : { ...emptyForm }
  );
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setForm({ ...emptyForm });
  }

  function handleOpenChange(value: boolean) {
    if (!value) resetForm();
    onOpenChange(value);
  }

  function validate(): string | null {
    if (!form.name.trim()) return "Client name is required";
    if (!form.company.trim()) return "Company name is required";
    if (!form.email.trim()) return "Email is required";
    if (!form.phone.trim()) return "Phone is required";
    if (!form.address.trim()) return "Address is required";
    return null;
  }

  async function handleSave() {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setSaving(true);
    try {
      let client: Client;
      if (editClient) {
        client = await clientService.updateClient(editClient.id, form);
        toast.success("Client updated");
      } else {
        client = await clientService.createClient(form);
        toast.success("Client registered");
      }
      onClientCreated(client);
      resetForm();
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save client");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editClient ? "Edit Client" : "Register New Client"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          <div>
            <Label>Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Client name"
            />
          </div>
          <div>
            <Label>Company *</Label>
            <Input
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="Company name"
            />
          </div>
          <div>
            <Label>Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@example.com"
            />
          </div>
          <div>
            <Label>Phone *</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone number"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Address *</Label>
            <Textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Full address"
              rows={2}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>GST Number</Label>
            <Input
              value={form.gstNumber}
              onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
              placeholder="GST Number (optional)"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving
              ? "Saving..."
              : editClient
              ? "Update Client"
              : "Register Client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
