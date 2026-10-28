import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import repairPin from "@/assets/repair-pin.svg";
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
import { useAuth } from "../context/AuthContext";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../components/ui/command";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  X,
  Building2,
  User as UserIcon,
  Cog,
  ClipboardList,
  Hash,
  Barcode,
  Package,
  Factory,
  UserCog,
  Check,
  FilePlus2,
  Search,
  Wrench,
  Truck,
  Lightbulb,
  Headphones,
  ExternalLink,
  ChevronsUpDown,
} from "lucide-react";
import { toast } from "sonner";

const COMPANIES = ["TECHsolution", "Skillful Technology Pvt Ltd"];

const PRIORITIES: {
  value: string;
  label: string;
  dot: string;
}[] = [
  { value: "low", label: "Low", dot: "bg-slate-400" },
  { value: "normal", label: "Normal", dot: "bg-amber-500" },
  { value: "high", label: "High", dot: "bg-orange-500" },
  { value: "urgent", label: "Urgent", dot: "bg-red-500" },
];

const NEXT_STEPS = [
  {
    n: 1,
    label: "Order Created",
    hint: "Repair order will be created",
    icon: FilePlus2,
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    n: 2,
    label: "Inspection",
    hint: "Detailed inspection by engineer",
    icon: Search,
    color: "text-slate-700 bg-slate-100",
  },
  {
    n: 3,
    label: "Quote & Approval",
    hint: "Estimate will be shared",
    icon: FilePlus2,
    color: "text-amber-600 bg-amber-50",
  },
  {
    n: 4,
    label: "Repair Process",
    hint: "Work will be completed",
    icon: Wrench,
    color: "text-blue-600 bg-blue-50",
  },
  {
    n: 5,
    label: "Delivery",
    hint: "Machine returned to customer",
    icon: Truck,
    color: "text-emerald-600 bg-emerald-50",
  },
] as const;

function SectionCard({
  icon: Icon,
  iconTint,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  iconTint: string; // eg "bg-indigo-50 text-indigo-600"
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <header className="mb-5 flex items-start gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${iconTint}`}
        >
          <Icon className="size-5" />
        </span>
        <div>
          <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
          <p className="text-[13px] text-slate-500">{description}</p>
        </div>
      </header>
      <div>{children}</div>
    </section>
  );
}

/** Wrap an <Input>/<Select> trigger with a leading icon inside the field. */
function FieldIcon({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-slate-400" />
      <div className="[&_input]:pl-9 [&_button[role=combobox]]:pl-9">
        {children}
      </div>
    </div>
  );
}

export function RepairOrderCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();

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
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
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

  const createdOn = useMemo(
    () =>
      new Date().toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    []
  );

  return (
    <div className="min-h-full bg-slate-50/60">
      {/* ── Page header ── */}
      <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-white via-indigo-50/40 to-violet-50/60">
        <div className="mx-auto flex max-w-[1400px] items-start justify-between gap-6 px-6 py-6">
          <div className="flex items-start gap-4">
            <Button
              variant="outline"
              size="icon"
              className="size-9 rounded-lg border-slate-200 bg-white shadow-sm"
              onClick={() => navigate("/admin/repair-orders")}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <h1 className="mb-1 text-[26px] font-bold leading-tight text-slate-900">
                New Repair Order
              </h1>
              <p className="text-[13.5px] text-slate-500">
                Register a new machine for repair
              </p>
            </div>
          </div>

          <div className="hidden shrink-0 md:block">
            <img
              src={repairPin}
              alt=""
              aria-hidden="true"
              className="h-28 w-auto"
            />
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-[1400px] px-6 py-6"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* ── Main column ── */}
          <div className="space-y-5">
            {/* Company & Priority */}
            <SectionCard
              icon={Building2}
              iconTint="bg-indigo-50 text-indigo-600"
              title="Company & Priority"
              description="Select the company and set priority for this repair order"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="company" className="text-[13px] font-medium">
                    Owning Company <span className="text-red-500">*</span>
                  </Label>
                  <FieldIcon icon={Building2}>
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
                  </FieldIcon>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="priority" className="text-[13px] font-medium">
                    Priority <span className="text-red-500">*</span>
                  </Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          <span className="flex items-center gap-2">
                            <span className={`size-2 rounded-full ${p.dot}`} />
                            {p.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SectionCard>

            {/* Customer Information */}
            <SectionCard
              icon={UserIcon}
              iconTint="bg-emerald-50 text-emerald-600"
              title="Customer Information"
              description="Select customer and contact person"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="customer" className="text-[13px] font-medium">
                    Customer <span className="text-red-500">*</span>
                  </Label>
                  <FieldIcon icon={UserIcon}>
                    <Popover
                      open={customerSearchOpen}
                      onOpenChange={setCustomerSearchOpen}
                    >
                      <PopoverTrigger asChild>
                        <button
                          id="customer"
                          type="button"
                          role="combobox"
                          aria-expanded={customerSearchOpen}
                          disabled={loadingMasters}
                          className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-input-background px-3 py-2 text-sm transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span
                            className={`line-clamp-1 text-left ${
                              selectedCustomer ? "" : "text-muted-foreground"
                            }`}
                          >
                            {selectedCustomer
                              ? selectedCustomer.company
                                ? `${selectedCustomer.company} — ${selectedCustomer.name}`
                                : selectedCustomer.name
                              : loadingMasters
                                ? "Loading..."
                                : "Search customer"}
                          </span>
                          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        className="w-(--radix-popover-trigger-width) p-0"
                      >
                        <Command
                          filter={(value, search) =>
                            value.toLowerCase().includes(search.toLowerCase())
                              ? 1
                              : 0
                          }
                        >
                          <CommandInput placeholder="Search by name, company, email or phone..." />
                          <CommandList>
                            <CommandEmpty>No customer found.</CommandEmpty>
                            <CommandGroup>
                              {customers.map((c) => (
                                <CommandItem
                                  key={c.id}
                                  value={[
                                    c.name,
                                    c.company,
                                    c.email,
                                    c.phone,
                                    c.gstNumber,
                                  ]
                                    .filter(Boolean)
                                    .join(" ")}
                                  onSelect={() => {
                                    setCustomerId(String(c.id));
                                    setCustomerSearchOpen(false);
                                  }}
                                >
                                  <Check
                                    className={`size-4 shrink-0 ${
                                      customerId === String(c.id)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    }`}
                                  />
                                  <div className="min-w-0">
                                    <div className="truncate">
                                      {c.company || c.name}
                                    </div>
                                    <div className="truncate text-xs text-slate-500">
                                      {[c.company ? c.name : null, c.phone]
                                        .filter(Boolean)
                                        .join(" · ")}
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </FieldIcon>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contact" className="text-[13px] font-medium">
                    Contact Person <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <FieldIcon icon={UserIcon}>
                        <Select
                          value={customerContactId}
                          onValueChange={setCustomerContactId}
                          disabled={!customerId}
                        >
                          <SelectTrigger id="contact">
                            <SelectValue
                              placeholder={
                                customerId
                                  ? contacts.length
                                    ? "Pick a contact person"
                                    : "No contacts — add one"
                                  : "Pick a contact person"
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
                      </FieldIcon>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={!customerId}
                      onClick={() => setShowAddContact(true)}
                      title="Add contact"
                      className="shrink-0"
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {selectedCustomer && (
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-sm text-slate-600">
                  <div className="font-medium text-slate-900">
                    {selectedCustomer.company || selectedCustomer.name}
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
            </SectionCard>

            {/* Machine Information */}
            <SectionCard
              icon={Cog}
              iconTint="bg-sky-50 text-sky-600"
              title="Machine Information"
              description="Enter machine details for accurate diagnosis"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="machineName"
                    className="text-[13px] font-medium"
                  >
                    Machine Name <span className="text-red-500">*</span>
                  </Label>
                  <FieldIcon icon={Package}>
                    <Input
                      id="machineName"
                      value={machine.name}
                      onChange={(e) =>
                        setMachine({ ...machine, name: e.target.value })
                      }
                      placeholder="e.g., CNC Milling Machine"
                      required
                    />
                  </FieldIcon>
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="manufacturer"
                    className="text-[13px] font-medium"
                  >
                    Manufacturer
                  </Label>
                  <FieldIcon icon={Factory}>
                    <Input
                      id="manufacturer"
                      value={machine.manufacturer}
                      onChange={(e) =>
                        setMachine({
                          ...machine,
                          manufacturer: e.target.value,
                        })
                      }
                      placeholder="e.g., Haas Automation"
                    />
                  </FieldIcon>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="modelNumber"
                    className="text-[13px] font-medium"
                  >
                    Model Number
                  </Label>
                  <FieldIcon icon={Hash}>
                    <Input
                      id="modelNumber"
                      value={machine.modelNumber}
                      onChange={(e) =>
                        setMachine({
                          ...machine,
                          modelNumber: e.target.value,
                        })
                      }
                      placeholder="e.g., VF-2"
                    />
                  </FieldIcon>
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="serialNumber"
                    className="text-[13px] font-medium"
                  >
                    Serial Number
                  </Label>
                  <FieldIcon icon={Barcode}>
                    <Input
                      id="serialNumber"
                      value={machine.serialNumber}
                      onChange={(e) =>
                        setMachine({
                          ...machine,
                          serialNumber: e.target.value,
                        })
                      }
                      placeholder="e.g., HA123456"
                    />
                  </FieldIcon>
                </div>
              </div>

              <div className="mt-4 space-y-1.5">
                <Label className="text-[13px] font-medium">
                  Machine Category <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <FieldIcon icon={Cog}>
                      <Select
                        value={machine.categoryId}
                        onValueChange={(value) =>
                          setMachine({ ...machine, categoryId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              loadingMasters
                                ? "Loading..."
                                : "Select category"
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
                    </FieldIcon>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowAddCategory(true)}
                    title="Add category"
                    className="shrink-0"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>
            </SectionCard>

            {/* Service Information */}
            <SectionCard
              icon={ClipboardList}
              iconTint="bg-orange-50 text-orange-600"
              title="Service Information"
              description="Describe the issue and initial observations"
            >
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="customerComplaint"
                    className="text-[13px] font-medium"
                  >
                    Customer Complaint <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="customerComplaint"
                    value={service.customerComplaint}
                    onChange={(e) =>
                      setService({
                        ...service,
                        customerComplaint: e.target.value,
                      })
                    }
                    placeholder="What the customer reported?"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="problemDescription"
                    className="text-[13px] font-medium"
                  >
                    Problem Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="problemDescription"
                    value={service.problemDescription}
                    maxLength={500}
                    onChange={(e) =>
                      setService({
                        ...service,
                        problemDescription: e.target.value,
                      })
                    }
                    placeholder="Describe the technical issue in detail..."
                    rows={4}
                    required
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] text-slate-500">
                      Be as specific as possible to help our engineers
                    </p>
                    <p className="text-[12px] text-slate-400">
                      {service.problemDescription.length}/500
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[13px] font-medium">
                    Accessories Received
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., Tool holders, Manual, Keys"
                      value={accessoryInput}
                      onChange={(e) => setAccessoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addAccessory();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={addAccessory}
                      className="shrink-0"
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                  {service.accessoriesReceived.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {service.accessoriesReceived.map((accessory, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[13px] text-slate-700"
                        >
                          {accessory}
                          <button
                            type="button"
                            onClick={() => removeAccessory(index)}
                            className="text-slate-400 hover:text-slate-700"
                            aria-label={`Remove ${accessory}`}
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="initialInspectionNotes"
                    className="text-[13px] font-medium"
                  >
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
                    placeholder="First observations about the machine condition..."
                    rows={3}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="assignedEngineer"
                    className="text-[13px] font-medium"
                  >
                    Assigned Engineer
                  </Label>
                  <FieldIcon icon={UserCog}>
                    <Input
                      id="assignedEngineer"
                      value={assignedEngineer}
                      onChange={(e) => setAssignedEngineer(e.target.value)}
                      placeholder="Optional at intake"
                    />
                  </FieldIcon>
                </div>
              </div>
            </SectionCard>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/repair-orders")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? "Creating..." : "Save & Continue"}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>

          {/* ── Right rail ── */}
          <aside className="space-y-5">
            {/* Summary */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <header className="mb-4 flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <ClipboardList className="size-4" />
                </span>
                <div>
                  <h3 className="text-[14px] font-semibold text-slate-900">
                    Repair Order Summary
                  </h3>
                  <p className="text-[12px] text-slate-500">
                    Details will appear here
                  </p>
                </div>
              </header>

              <div className="mb-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-6">
                <span className="flex size-14 items-center justify-center rounded-full bg-violet-100 text-violet-500">
                  <ClipboardList className="size-6" />
                </span>
                <p className="mt-3 text-[13px] font-medium text-slate-500">
                  RO #
                </p>
                <span className="mt-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-violet-600">
                  Auto generated
                </span>
              </div>

              <dl className="divide-y divide-slate-100 text-[13px]">
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-slate-500">Status</dt>
                  <dd>
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                      New Order
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-slate-500">Created On</dt>
                  <dd className="font-medium text-slate-900">{createdOn}</dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-slate-500">Created By</dt>
                  <dd className="font-medium text-slate-900">
                    {user?.username || "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-slate-500">Last Updated</dt>
                  <dd className="text-slate-400">—</dd>
                </div>
              </dl>
            </section>

            {/* What happens next */}
            <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-5">
              <h3 className="mb-4 text-[14px] font-semibold text-amber-900">
                What happens next?
              </h3>
              <ol className="space-y-3.5">
                {NEXT_STEPS.map((step) => {
                  const Icon = step.icon;
                  return (
                    <li key={step.n} className="flex items-start gap-3">
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${step.color}`}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div>
                        <p className="text-[13px] font-semibold text-slate-900">
                          {step.n}. {step.label}
                        </p>
                        <p className="text-[12px] text-slate-500">
                          {step.hint}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            {/* Quick Tips */}
            <section className="rounded-xl border border-blue-200 bg-blue-50/50 p-5">
              <header className="mb-3 flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                  <Lightbulb className="size-4" />
                </span>
                <h3 className="text-[14px] font-semibold text-blue-900">
                  Quick Tips
                </h3>
              </header>
              <ul className="space-y-2 text-[13px] text-slate-700">
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-blue-600" />
                  Provide complete information for faster service
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-blue-600" />
                  Attach photos if available
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-blue-600" />
                  Mention any error codes or alarms
                </li>
              </ul>
            </section>

            {/* Need Help */}
            <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
              <header className="mb-2 flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-md bg-emerald-100 text-emerald-600">
                  <Headphones className="size-4" />
                </span>
                <h3 className="text-[14px] font-semibold text-emerald-900">
                  Need Help?
                </h3>
              </header>
              <p className="mb-3 text-[13px] text-slate-600">
                Our support team is here to help you
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full gap-2 border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
              >
                Contact Support <ExternalLink className="size-3.5" />
              </Button>
            </section>
          </aside>
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
