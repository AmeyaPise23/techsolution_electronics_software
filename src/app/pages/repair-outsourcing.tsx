import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  vendorService,
  Vendor,
  VendorFormData,
  VendorSpend,
} from "../services/vendorService";
import { repairService, RepairOrderStats } from "../services/repairService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Plus,
  Truck,
  Users,
  IndianRupee,
  Warehouse,
  Pencil,
  Search,
} from "lucide-react";
import { toast } from "sonner";

const COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f97316",
  "#a855f7",
  "#06b6d4",
  "#f59e0b",
  "#ef4444",
  "#14b8a6",
];

const fmtMoney = (v: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v ?? 0);

const emptyVendorForm: VendorFormData = { name: "" };

export function RepairOutsourcing() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [spend, setSpend] = useState<VendorSpend[]>([]);
  const [stats, setStats] = useState<RepairOrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [form, setForm] = useState<VendorFormData>(emptyVendorForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [vp, s, sp] = await Promise.all([
        vendorService.list(undefined, undefined, 0, 500),
        repairService.getStats(),
        vendorService.spendSummary(),
      ]);
      setVendors(vp.content);
      setStats(s);
      setSpend(sp);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load outsourcing data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const spendByVendorId = useMemo(() => {
    const m: Record<number, VendorSpend> = {};
    spend.forEach((s) => (m[s.vendorId] = s));
    return m;
  }, [spend]);

  const filteredVendors = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return vendors;
    return vendors.filter(
      (v) =>
        v.name.toLowerCase().includes(needle) ||
        (v.contactPerson || "").toLowerCase().includes(needle) ||
        (v.mobile || "").toLowerCase().includes(needle) ||
        (v.email || "").toLowerCase().includes(needle) ||
        (v.specialization || "").toLowerCase().includes(needle)
    );
  }, [vendors, query]);

  const totalSpend = spend.reduce((sum, s) => sum + (s.totalSpend || 0), 0);
  const activeVendorCount = vendors.filter((v) => v.active).length;

  const pieData = spend
    .filter((s) => s.totalSpend > 0)
    .slice(0, 8)
    .map((s) => ({ name: s.vendorName, value: s.totalSpend }));

  const barData = spend
    .slice(0, 10)
    .map((s) => ({ name: s.vendorName, trips: s.tripsCount }));

  const openForm = (v?: Vendor) => {
    if (v) {
      setEditing(v);
      setForm({
        name: v.name,
        code: v.code,
        contactPerson: v.contactPerson,
        mobile: v.mobile,
        alternateMobile: v.alternateMobile,
        email: v.email,
        address: v.address,
        gstNumber: v.gstNumber,
        specialization: v.specialization,
        active: v.active,
      });
    } else {
      setEditing(null);
      setForm(emptyVendorForm);
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Vendor name is required");
    setSaving(true);
    try {
      if (editing) {
        await vendorService.update(editing.id, {
          ...form,
          name: form.name.trim(),
        });
        toast.success("Vendor updated");
      } else {
        await vendorService.create({ ...form, name: form.name.trim() });
        toast.success("Vendor added");
      }
      setShowForm(false);
      setEditing(null);
      setForm(emptyVendorForm);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save vendor");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (v: Vendor) => {
    try {
      if (v.active) {
        await vendorService.deactivate(v.id);
        toast.success(`${v.name} deactivated`);
      } else {
        await vendorService.activate(v.id);
        toast.success(`${v.name} reactivated`);
      }
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="text-xs text-muted-foreground mb-1">
            Repair <span className="mx-1">/</span> Outsourcing
          </div>
          <h1 className="mb-1">Outsourcing</h1>
          <p className="text-muted-foreground">
            Manage vendors, track outsourcing spend, and monitor open trips
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              navigate("/admin/repair-orders/list?outsourceStatus=sent_to_vendor")
            }
          >
            <Warehouse className="size-4 mr-2" />
            View Open Trips
          </Button>
          <Button onClick={() => openForm()}>
            <Plus className="size-4 mr-2" />
            Add Vendor
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
              <Users className="size-5 text-blue-500" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Vendors</p>
            <p className="text-2xl font-bold">
              {activeVendorCount}
              <span className="text-sm text-muted-foreground font-normal">
                {" "}/ {vendors.length} total
              </span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="size-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-2">
              <Warehouse className="size-5 text-amber-500" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Currently With Vendor</p>
            <p className="text-2xl font-bold">
              {stats?.currentlyWithVendor ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="size-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-2">
              <IndianRupee className="size-5 text-purple-500" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              Total Outsourcing Spend
            </p>
            <p className="text-2xl font-bold">{fmtMoney(totalSpend)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="size-10 rounded-lg bg-teal-500/10 flex items-center justify-center mb-2">
              <Truck className="size-5 text-teal-500" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Completed Trips</p>
            <p className="text-2xl font-bold">
              {spend.reduce((n, s) => n + s.tripsCount, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Spend by Vendor</CardTitle>
            <CardDescription>Top 8 by total closed-trip cost</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No completed vendor trips yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={100}
                    label={(e) => e.name}
                    labelLine={false}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmtMoney(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trips per Vendor</CardTitle>
            <CardDescription>Completed outsourcing trips</CardDescription>
          </CardHeader>
          <CardContent>
            {barData.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No trip history yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    angle={-30}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="trips" radius={[4, 4, 0, 0]}>
                    {barData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vendor list */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Vendors</CardTitle>
            <CardDescription>
              Full vendor directory · click a row to edit
            </CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="pl-9"
            />
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Trips</TableHead>
                <TableHead className="text-right">Total Spend</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading vendors…
                  </TableCell>
                </TableRow>
              ) : filteredVendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-muted-foreground">
                        {vendors.length === 0
                          ? "No vendors yet"
                          : "No vendors match your search"}
                      </p>
                      {vendors.length === 0 && (
                        <Button variant="outline" onClick={() => openForm()}>
                          <Plus className="size-4 mr-2" /> Add first vendor
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredVendors.map((v) => {
                  const s = spendByVendorId[v.id];
                  return (
                    <TableRow
                      key={v.id}
                      className="cursor-pointer"
                      onClick={() => openForm(v)}
                    >
                      <TableCell>
                        <div className="font-medium">{v.name}</div>
                        {v.code && (
                          <div className="text-xs text-muted-foreground">
                            {v.code}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {v.specialization || "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{v.contactPerson || "-"}</div>
                        <div className="text-muted-foreground text-xs">
                          {v.mobile || v.email || ""}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {s?.tripsCount ?? 0}
                        {s?.openTripsCount ? (
                          <span className="ml-1 text-xs text-amber-600">
                            (+{s.openTripsCount} open)
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {fmtMoney(s?.totalSpend ?? 0)}
                      </TableCell>
                      <TableCell>
                        {v.active ? (
                          <Badge>Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openForm(v)}
                            title="Edit"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(v)}
                            title={v.active ? "Deactivate" : "Reactivate"}
                          >
                            {v.active ? "Deactivate" : "Reactivate"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Vendor form dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${editing.name}` : "Add Vendor"}
            </DialogTitle>
            <DialogDescription>
              Vendors are used across the "Send to Vendor" outsourcing flow.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Short Code</Label>
                <Input
                  value={form.code ?? ""}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Contact Person</Label>
                <Input
                  value={form.contactPerson ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, contactPerson: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Mobile</Label>
                <Input
                  value={form.mobile ?? ""}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>GST Number</Label>
                <Input
                  value={form.gstNumber ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, gstNumber: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Specialization</Label>
              <Input
                value={form.specialization ?? ""}
                onChange={(e) =>
                  setForm({ ...form, specialization: e.target.value })
                }
                placeholder="e.g., PCB repair, hydraulic overhaul"
              />
            </div>
            <div className="space-y-1">
              <Label>Address</Label>
              <Textarea
                rows={2}
                value={form.address ?? ""}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            {editing && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.active ?? true}
                  onChange={(e) =>
                    setForm({ ...form, active: e.target.checked })
                  }
                />
                Active
              </label>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save Changes" : "Add Vendor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
