import { useState, useEffect } from "react";
import { Building2, Save, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  companySettingsService,
  CompanySettings,
  CompanySettingsUpdate,
} from "../services/companySettingsService";
import { toast } from "sonner";

export function AdminCompanySettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CompanySettingsUpdate>({});

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const data = await companySettingsService.getSettings();
      setForm({
        companyName: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        addressLine1: data.addressLine1 || "",
        addressLine2: data.addressLine2 || "",
        gstNumber: data.gstin || "",
        pan: data.pan || "",
        stateName: data.stateName || "",
        stateCode: data.stateCode || "",
        bankName: data.bankName || "",
        bankAccountName: data.bankAccountName || "",
        bankAccountNumber: data.bankAccountNumber || "",
        bankIfsc: data.bankIfsc || "",
        bankBranch: data.bankBranch || "",
        bankUpi: data.bankUpi || "",
      });
    } catch {
      toast.error("Failed to load company settings");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      await companySettingsService.updateSettings(form);
      toast.success("Company settings updated");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update settings");
    } finally {
      setSaving(false);
    }
  }

  function update(field: keyof CompanySettingsUpdate, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Company Settings</h1>
          <p className="text-muted-foreground">
            Business details used in invoices, PDFs, and emails
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Business Info */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="size-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Business Information</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input value={form.companyName || ""} onChange={(e) => update("companyName", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.email || ""} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={form.phone || ""} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>GST Number</Label>
            <Input value={form.gstNumber || ""} onChange={(e) => update("gstNumber", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>PAN</Label>
            <Input value={form.pan || ""} onChange={(e) => update("pan", e.target.value)} />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Address & State</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Address Line 1</Label>
            <Input value={form.addressLine1 || ""} onChange={(e) => update("addressLine1", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Address Line 2</Label>
            <Input value={form.addressLine2 || ""} onChange={(e) => update("addressLine2", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>State Name</Label>
            <Input value={form.stateName || ""} onChange={(e) => update("stateName", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>State Code</Label>
            <Input value={form.stateCode || ""} onChange={(e) => update("stateCode", e.target.value)} placeholder="e.g. 27" />
          </div>
        </div>
      </div>

      {/* Bank Details */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Bank Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Bank Name</Label>
            <Input value={form.bankName || ""} onChange={(e) => update("bankName", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Account Name</Label>
            <Input value={form.bankAccountName || ""} onChange={(e) => update("bankAccountName", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Account Number</Label>
            <Input value={form.bankAccountNumber || ""} onChange={(e) => update("bankAccountNumber", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>IFSC Code</Label>
            <Input value={form.bankIfsc || ""} onChange={(e) => update("bankIfsc", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Branch</Label>
            <Input value={form.bankBranch || ""} onChange={(e) => update("bankBranch", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>UPI ID</Label>
            <Input value={form.bankUpi || ""} onChange={(e) => update("bankUpi", e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
}
