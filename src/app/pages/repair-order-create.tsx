import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { repairService } from "../services/repairService";
import { clientService, Client } from "../services/clientService";
import {
  machineCategoryService,
  MachineCategory,
} from "../services/machineCategoryService";
import {
  customerContactService,
  CustomerContact,
} from "../services/customerContactService";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { ArrowLeft, Plus, X } from "lucide-react";
import { toast } from "sonner";

const COMPANIES = ["TECHsolution", "Skillful Technology Pvt Ltd"];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export function RepairOrderCreate() {
  const navigate = useNavigate();

  // ── Master data ──
  const [customers, setCustomers] = useState<Client[]>([]);
  const [categories, setCategories] = useState<MachineCategory[]>([]);
  const [contacts, setContacts] = useState<CustomerContact[]>([]);
  const [loadingMasters, setLoadingMasters] = useState(true);

  // ── Header ──
  const [company, setCompany] = useState("");
  const [priority, setPriority] = useState("normal");
  const [assignedEngineer, setAssignedEngineer] = useState("");

  // ── Customer + contact ──
  const [customerId, setCustomerId] = useState<string>("");
  const [customerContactId, setCustomerContactId] = useState<string>("");

  // ── Machine ──
  const [machine, setMachine] = useState({
    name: "",
    manufacturer: "",
    modelNumber: "",
    serialNumber: "",
    categoryId: "",
  });

  // ── Service intake ──
  const [service, setService] = useState({
    problemDescription: "",
    customerComplaint: "",
    accessoriesReceived: [] as string[],
    initialInspectionNotes: "",
  });
  const [accessoryInput, setAccessoryInput] = useState("");

  // ── Add-new dialogs ──
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    mobile: "",
    email: "",
    designation: "",
    isPrimary: false,
  });
  const [savingContact, setSavingContact] = useState(false);

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    code: "",
    description: "",
  });
  const [savingCategory, setSavingCategory] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const selectedCustomer = useMemo(
    () => customers.find((c) => String(c.id) === customerId),
    [customers, customerId]
  );

  // ── Load masters on mount ──
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [cust, cats] = await Promise.all([
          clientService.getClients(),
          machineCategoryService.listActive(),
        ]);
        if (!mounted) return;
        setCustomers(cust);
        setCategories(cats);
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Failed to load master data"
        );
      } finally {
        if (mounted) setLoadingMasters(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // ── Load contacts when customer changes ──
  useEffect(() => {
    if (!customerId) {
      setContacts([]);
      setCustomerContactId("");
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const list = await customerContactService.listActiveByCustomer(
          Number(customerId)
        );
        if (!mounted) return;
        setContacts(list);
        // auto-select primary (first) contact if only one exists or a primary is present
        const primary = list.find((c) => c.isPrimary) || list[0];
        setCustomerContactId(primary ? String(primary.id) : "");
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Failed to load contacts"
        );
      }
    })();
    return () => {
      mounted = false;
    };
  }, [customerId]);

  // ── Accessories helpers ──
  const addAccessory = () => {
    if (accessoryInput.trim()) {
      setService({
        ...service,
        accessoriesReceived: [
          ...service.accessoriesReceived,
          accessoryInput.trim(),
        ],
      });
      setAccessoryInput("");
    }
  };

  const removeAccessory = (index: number) => {
    setService({
      ...service,
      accessoriesReceived: service.accessoriesReceived.filter(
        (_, i) => i !== index
      ),
    });
  };

  // ── Add contact inline ──
  const handleSaveContact = async () => {
    if (!customerId) {
      toast.error("Select a customer first");
      return;
    }
    if (!newContact.name.trim()) {
      toast.error("Contact name is required");
      return;
    }
    setSavingContact(true);
    try {
      const created = await customerContactService.create({
        customerId: Number(customerId),
        name: newContact.name.trim(),
        mobile: newContact.mobile.trim() || undefined,
        email: newContact.email.trim() || undefined,
        designation: newContact.designation.trim() || undefined,
        isPrimary: newContact.isPrimary,
      });
      setContacts((prev) => [created, ...prev]);
      setCustomerContactId(String(created.id));
      setShowAddContact(false);
      setNewContact({
        name: "",
        mobile: "",
        email: "",
        designation: "",
        isPrimary: false,
      });
      toast.success("Contact added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add contact");
    } finally {
      setSavingContact(false);
    }
  };

  // ── Add category inline ──
  const handleSaveCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    setSavingCategory(true);
    try {
      const created = await machineCategoryService.create({
        name: newCategory.name.trim(),
        code: newCategory.code.trim() || undefined,
        description: newCategory.description.trim() || undefined,
      });
      setCategories((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
      );
      setMachine({ ...machine, categoryId: String(created.id) });
      setShowAddCategory(false);
      setNewCategory({ name: "", code: "", description: "" });
      toast.success("Machine category added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add category");
    } finally {
      setSavingCategory(false);
    }
  };

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return toast.error("Please select the owning company");
    if (!customerId) return toast.error("Please select a customer");
    if (!customerContactId)
      return toast.error("Please select a contact person");
    if (!machine.categoryId)
      return toast.error("Please select a machine category");

    setSubmitting(true);
    try {
      const created = await repairService.create({
        owningCompany: company,
        customerId: Number(customerId),
        customerContactId: Number(customerContactId),
        deviceName: machine.name,
        deviceManufacturer: machine.manufacturer || undefined,
        deviceModelNumber: machine.modelNumber || undefined,
        deviceSerialNumber: machine.serialNumber || undefined,
        machineCategoryId: Number(machine.categoryId),
        problemDescription: service.problemDescription,
        customerComplaint: service.customerComplaint,
        initialInspectionNotes: service.initialInspectionNotes || undefined,
        priority: priority as never,
        assignedEngineer: assignedEngineer.trim() || undefined,
        receivedDate: new Date().toISOString().split("T")[0],
        accessories: service.accessoriesReceived.map((name, i) => ({
          name,
          sortOrder: i,
        })),
      });
      toast.success(`Repair order ${created.repairNumber} created`);
      navigate(`/admin/repair-orders/${created.id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create repair order"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/repair-orders")}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="mb-1">New Repair Order</h1>
          <p className="text-muted-foreground">
            Register a new machine for repair
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company */}
        <Card>
          <CardHeader>
            <CardTitle>Company</CardTitle>
            <CardDescription>
              Select which company this repair order belongs to
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Owning Company *</Label>
              <Select value={company} onValueChange={setCompany}>
                <SelectTrigger id="company">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {COMPANIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Customer + Contact pickers */}
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
            <CardDescription>
              Pick an existing customer and the contact person handing over the
              machine
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer *</Label>
                <Select
                  value={customerId}
                  onValueChange={setCustomerId}
                  disabled={loadingMasters}
                >
                  <SelectTrigger id="customer">
                    <SelectValue
                      placeholder={
                        loadingMasters ? "Loading..." : "Select customer"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.company ? `${c.company} — ${c.name}` : c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact">Contact Person *</Label>
                <div className="flex gap-2">
                  <Select
                    value={customerContactId}
                    onValueChange={setCustomerContactId}
                    disabled={!customerId}
                  >
                    <SelectTrigger id="contact" className="flex-1">
                      <SelectValue
                        placeholder={
                          customerId
                            ? contacts.length
                              ? "Select contact"
                              : "No contacts — add one"
                            : "Pick a customer first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                          {c.designation ? ` — ${c.designation}` : ""}
                          {c.isPrimary ? "  ★" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={!customerId}
                    onClick={() => setShowAddContact(true)}
                    title="Add contact"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>
            </div>

            {selectedCustomer && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">
                    {selectedCustomer.company || selectedCustomer.name}
                  </span>
                </div>
                {selectedCustomer.email && <div>{selectedCustomer.email}</div>}
                {selectedCustomer.phone && <div>{selectedCustomer.phone}</div>}
                {selectedCustomer.address && (
                  <div className="mt-1 whitespace-pre-line">
                    {selectedCustomer.address}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Machine Information */}
        <Card>
          <CardHeader>
            <CardTitle>Machine Information</CardTitle>
            <CardDescription>Details of the machine for repair</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="machineName">Machine Name *</Label>
                <Input
                  id="machineName"
                  value={machine.name}
                  onChange={(e) =>
                    setMachine({ ...machine, name: e.target.value })
                  }
                  placeholder="e.g., CNC Milling Machine"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  value={machine.manufacturer}
                  onChange={(e) =>
                    setMachine({ ...machine, manufacturer: e.target.value })
                  }
                  placeholder="e.g., Haas Automation"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="modelNumber">Model Number</Label>
                <Input
                  id="modelNumber"
                  value={machine.modelNumber}
                  onChange={(e) =>
                    setMachine({ ...machine, modelNumber: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input
                  id="serialNumber"
                  value={machine.serialNumber}
                  onChange={(e) =>
                    setMachine({ ...machine, serialNumber: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Machine Category *</Label>
              <div className="flex gap-2">
                <Select
                  value={machine.categoryId}
                  onValueChange={(value) =>
                    setMachine({ ...machine, categoryId: value })
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue
                      placeholder={
                        loadingMasters ? "Loading..." : "Select category"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowAddCategory(true)}
                  title="Add category"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Information */}
        <Card>
          <CardHeader>
            <CardTitle>Service Information</CardTitle>
            <CardDescription>
              Problem description and initial notes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="problemDescription">Problem Description *</Label>
              <Textarea
                id="problemDescription"
                value={service.problemDescription}
                onChange={(e) =>
                  setService({
                    ...service,
                    problemDescription: e.target.value,
                  })
                }
                placeholder="Describe the technical issue"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerComplaint">Customer Complaint *</Label>
              <Textarea
                id="customerComplaint"
                value={service.customerComplaint}
                onChange={(e) =>
                  setService({ ...service, customerComplaint: e.target.value })
                }
                placeholder="What the customer reported"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Accessories Received</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Tool holders, Manual, Keys"
                  value={accessoryInput}
                  onChange={(e) => setAccessoryInput(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addAccessory())
                  }
                />
                <Button type="button" onClick={addAccessory}>
                  <Plus className="size-4" />
                </Button>
              </div>

              {service.accessoriesReceived.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {service.accessoriesReceived.map((accessory, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-1 bg-accent rounded-lg"
                    >
                      <span className="text-sm">{accessory}</span>
                      <button
                        type="button"
                        onClick={() => removeAccessory(index)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="initialInspectionNotes">
                Initial Inspection Notes
              </Label>
              <Textarea
                id="initialInspectionNotes"
                value={service.initialInspectionNotes}
                onChange={(e) =>
                  setService({
                    ...service,
                    initialInspectionNotes: e.target.value,
                  })
                }
                placeholder="First observations about the machine condition"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedEngineer">Assigned Engineer</Label>
              <Input
                id="assignedEngineer"
                value={assignedEngineer}
                onChange={(e) => setAssignedEngineer(e.target.value)}
                placeholder="Optional at intake"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/repair-orders")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Repair Order"}
          </Button>
        </div>
      </form>

      {/* ── Add Contact dialog ── */}
      <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contact Person</DialogTitle>
            <DialogDescription>
              For{" "}
              {selectedCustomer?.company ||
                selectedCustomer?.name ||
                "this customer"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="nc-name">Name *</Label>
              <Input
                id="nc-name"
                value={newContact.name}
                onChange={(e) =>
                  setNewContact({ ...newContact, name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="nc-mobile">Mobile</Label>
                <Input
                  id="nc-mobile"
                  value={newContact.mobile}
                  onChange={(e) =>
                    setNewContact({ ...newContact, mobile: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="nc-email">Email</Label>
                <Input
                  id="nc-email"
                  type="email"
                  value={newContact.email}
                  onChange={(e) =>
                    setNewContact({ ...newContact, email: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="nc-designation">Designation</Label>
              <Input
                id="nc-designation"
                value={newContact.designation}
                onChange={(e) =>
                  setNewContact({
                    ...newContact,
                    designation: e.target.value,
                  })
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newContact.isPrimary}
                onChange={(e) =>
                  setNewContact({ ...newContact, isPrimary: e.target.checked })
                }
              />
              Mark as primary
            </label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddContact(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveContact}
              disabled={savingContact}
            >
              {savingContact ? "Saving..." : "Save Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Machine Category dialog ── */}
      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Machine Category</DialogTitle>
            <DialogDescription>
              New categories become available immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="cat-name">Name *</Label>
              <Input
                id="cat-name"
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cat-code">Short Code</Label>
              <Input
                id="cat-code"
                placeholder="e.g., CNC"
                value={newCategory.code}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, code: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea
                id="cat-desc"
                rows={2}
                value={newCategory.description}
                onChange={(e) =>
                  setNewCategory({
                    ...newCategory,
                    description: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddCategory(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveCategory}
              disabled={savingCategory}
            >
              {savingCategory ? "Saving..." : "Save Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
