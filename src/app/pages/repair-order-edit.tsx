import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  repairService,
  RepairOrderDetail,
  RepairOrderRequest,
  RepairStatusApi,
  RepairPriorityApi,
} from "../services/repairService";
import { productService, ProductFormData } from "../services/productService";
import { vendorService, Vendor, VendorFormData } from "../services/vendorService";
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
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  ArrowLeft,
  Eye,
  Plus,
  Trash2,
  FileText,
  Save,
  MessageSquarePlus,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  received: "Received",
  inspection: "Inspection",
  waiting_for_customer_approval: "Waiting for Approval",
  waiting_for_parts: "Waiting for Parts",
  under_repair: "Under Repair",
  testing: "Testing",
  quality_check: "Quality Check",
  ready_for_delivery: "Ready for Delivery",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  received: "outline",
  inspection: "secondary",
  waiting_for_customer_approval: "outline",
  waiting_for_parts: "outline",
  under_repair: "default",
  testing: "secondary",
  quality_check: "secondary",
  ready_for_delivery: "default",
  delivered: "default",
  completed: "default",
  cancelled: "destructive",
};

const OBSERVATION_TYPES = [
  { value: "customer_complaint", label: "Customer Complaint" },
  { value: "initial_inspection", label: "Initial Inspection" },
  { value: "diagnosis", label: "Diagnosis" },
  { value: "repair_action", label: "Repair Action" },
  { value: "part_replacement", label: "Part Replacement" },
  { value: "testing", label: "Testing" },
  { value: "quality_check", label: "Quality Check" },
  { value: "completion_note", label: "Completion Note" },
  { value: "general_note", label: "General Note" },
];

const PRIORITIES: RepairPriorityApi[] = ["low", "normal", "high", "urgent"];

const fmtMoney = (v?: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(v ?? 0);

const fmtDate = (v?: string) =>
  v
    ? new Date(v).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

/**
 * When the order entered its current status. Falls back to the order's own
 * updatedAt when no status-change activity is recorded (e.g. freshly created
 * orders still sitting in "received").
 */
function statusSince(d: RepairOrderDetail): string | undefined {
  const entered = (d.activities ?? [])
    .filter((a) => a.toStatus === d.status && a.performedAt)
    .sort(
      (a, b) =>
        new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
    )[0];
  return entered?.performedAt || d.updatedAt;
}

/** Whole days between `iso` and now, floored at 0. */
function daysSince(iso?: string): number | undefined {
  if (!iso) return undefined;
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return undefined;
  return Math.max(0, Math.floor(ms / 86_400_000));
}

function detailToRequest(d: RepairOrderDetail): RepairOrderRequest {
  return {
    owningCompany: d.owningCompany,
    customerId: d.customerId,
    customerContactId: d.customerContact?.id ?? 0,
    deviceName: d.deviceName,
    deviceManufacturer: d.deviceManufacturer,
    deviceModelNumber: d.deviceModelNumber,
    deviceSerialNumber: d.deviceSerialNumber,
    machineCategoryId: d.machineCategoryId ?? 0,
    problemDescription: d.problemDescription ?? "",
    customerComplaint: d.customerComplaint ?? "",
    initialInspectionNotes: d.initialInspectionNotes,
    status: d.status as RepairStatusApi,
    priority: d.priority as RepairPriorityApi,
    assignedEngineer: d.assignedEngineer,
    receivedBy: d.receivedBy,
    receivedDate: d.receivedDate,
    expectedDeliveryDate: d.expectedDeliveryDate,
    warrantyStatus: d.warrantyStatus as never,
    warranty: d.warranty,
    labourCharges: d.labourCharges,
    outsourcingCost: d.outsourcingCost,
    items: (d.items ?? []).map((it) => ({
      productId: it.productId,
      productName: it.productName,
      quantity: it.quantity,
      unit: it.unit,
      unitPrice: it.unitPrice,
      discountPercent: 0,
      taxPercent: 0,
      serialNumber: it.serialNumber,
      warranty: it.warranty,
      notes: it.notes,
    })),
    accessories: (d.accessories ?? []).map((a) => ({
      name: a.name,
      remarks: a.remarks,
    })),
  };
}

export function RepairOrderEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<RepairOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // basic edit fields
  const [assignedEngineer, setAssignedEngineer] = useState("");
  const [priority, setPriority] = useState<RepairPriorityApi>("normal");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [labourCharges, setLabourCharges] = useState<string>("0");

  // status change
  const [nextStatus, setNextStatus] = useState<RepairStatusApi | "">("");
  const [statusRemarks, setStatusRemarks] = useState("");

  // observation
  const [obsType, setObsType] = useState("general_note");
  const [obsDescription, setObsDescription] = useState("");
  const [addingObs, setAddingObs] = useState(false);

  // vendor / send-to-vendor
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [showSendToVendor, setShowSendToVendor] = useState(false);
  const [sendVendorId, setSendVendorId] = useState<string>("");
  const [sendOutsourceDate, setSendOutsourceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [sendExpectedReturnDate, setSendExpectedReturnDate] = useState("");
  const [sendRemarks, setSendRemarks] = useState("");
  const [sending, setSending] = useState(false);

  const [showAddVendor, setShowAddVendor] = useState(false);
  const [newVendor, setNewVendor] = useState<VendorFormData>({ name: "" });
  const [savingVendor, setSavingVendor] = useState(false);

  // receive-from-vendor
  const [showReceive, setShowReceive] = useState(false);
  const [receiveDate, setReceiveDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [receiveInvoice, setReceiveInvoice] = useState("");
  const [receiveOutsourceCost, setReceiveOutsourceCost] = useState("0");
  const [receiveTransport, setReceiveTransport] = useState("0");
  const [receiveAdditional, setReceiveAdditional] = useState("0");
  const [receiveRemarks, setReceiveRemarks] = useState("");
  const [receiving, setReceiving] = useState(false);

  // parts
  const [products, setProducts] = useState<ProductFormData[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [newPartProductId, setNewPartProductId] = useState("");
  const [newPartQty, setNewPartQty] = useState("1");
  const [newPartUnitPrice, setNewPartUnitPrice] = useState("");
  const [addingPart, setAddingPart] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const d = await repairService.get(Number(id));
      setDetail(d);
      setAssignedEngineer(d.assignedEngineer ?? "");
      setPriority((d.priority as RepairPriorityApi) ?? "normal");
      setExpectedDelivery(d.expectedDeliveryDate ?? "");
      setLabourCharges(String(d.labourCharges ?? 0));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load repair order");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setProductsLoading(true);
      try {
        const list = await productService.listProducts();
        if (!cancelled) setProducts(list);
      } catch (e) {
        if (!cancelled)
          toast.error(
            e instanceof Error ? e.message : "Failed to load products"
          );
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadVendors = useCallback(async () => {
    setVendorsLoading(true);
    try {
      const list = await vendorService.listActive();
      setVendors(list);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load vendors");
    } finally {
      setVendorsLoading(false);
    }
  }, []);

  const openSendToVendor = () => {
    if (vendors.length === 0) loadVendors();
    setShowSendToVendor(true);
  };

  const handleSendToVendor = async () => {
    if (!detail || !sendVendorId) return toast.error("Please pick a vendor");
    if (!sendOutsourceDate) return toast.error("Outsource date is required");
    if (
      sendExpectedReturnDate &&
      sendExpectedReturnDate < sendOutsourceDate
    ) {
      return toast.error("Expected return date cannot be before outsource date");
    }
    setSending(true);
    try {
      await repairService.sendToVendor(detail.id, {
        vendorId: Number(sendVendorId),
        outsourceDate: sendOutsourceDate,
        expectedReturnDate: sendExpectedReturnDate || undefined,
        remarks: sendRemarks || undefined,
      });
      toast.success("Sent to vendor");
      setShowSendToVendor(false);
      setSendVendorId("");
      setSendRemarks("");
      setSendExpectedReturnDate("");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send to vendor");
    } finally {
      setSending(false);
    }
  };

  const openReceive = () => {
    if (!activeLeg) return;
    setReceiveDate(new Date().toISOString().split("T")[0]);
    setReceiveInvoice("");
    setReceiveOutsourceCost("0");
    setReceiveTransport("0");
    setReceiveAdditional("0");
    setReceiveRemarks("");
    setShowReceive(true);
  };

  const handleReceive = async () => {
    if (!detail || !activeLeg) return;
    if (!receiveDate) return toast.error("Return date is required");
    if (receiveDate < activeLeg.outsourceDate) {
      return toast.error(
        `Return date cannot be before outsource date (${activeLeg.outsourceDate})`
      );
    }
    const oc = Number(receiveOutsourceCost);
    if (Number.isNaN(oc) || oc < 0)
      return toast.error("Outsource cost must be a non-negative number");
    setReceiving(true);
    try {
      await repairService.receiveFromVendor(detail.id, activeLeg.id, {
        actualReturnDate: receiveDate,
        vendorInvoiceNumber: receiveInvoice.trim() || undefined,
        outsourceCost: oc,
        transportCost: Number(receiveTransport) || 0,
        additionalCharges: Number(receiveAdditional) || 0,
        returnRemarks: receiveRemarks.trim() || undefined,
      });
      toast.success("Received from vendor — back to in-house workflow");
      setShowReceive(false);
      await load();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to receive from vendor"
      );
    } finally {
      setReceiving(false);
    }
  };

  const handleSaveVendor = async () => {
    if (!newVendor.name.trim()) return toast.error("Vendor name is required");
    setSavingVendor(true);
    try {
      const created = await vendorService.create({
        ...newVendor,
        name: newVendor.name.trim(),
      });
      setVendors((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
      );
      setSendVendorId(String(created.id));
      setShowAddVendor(false);
      setNewVendor({ name: "" });
      toast.success("Vendor added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add vendor");
    } finally {
      setSavingVendor(false);
    }
  };

  const isConverted = !!detail?.convertedInvoiceId;
  const withVendor = detail?.outsourceStatus === "sent_to_vendor";
  const canConvert =
    !isConverted &&
    !!detail &&
    !withVendor &&
    (detail.status === "completed" ||
      detail.status === "ready_for_delivery") &&
    ((detail.items?.length ?? 0) > 0 || (detail.labourCharges ?? 0) > 0);
  const canSendToVendor =
    !!detail &&
    !isConverted &&
    !withVendor &&
    detail.status !== "delivered" &&
    detail.status !== "completed" &&
    detail.status !== "cancelled";
  const activeLeg = (detail?.outsourcings ?? []).find(
    (o) => o.status === "sent_to_vendor"
  );

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === newPartProductId),
    [products, newPartProductId]
  );

  // ── Handlers ──

  const saveBasics = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      const req = detailToRequest(detail);
      req.assignedEngineer = assignedEngineer.trim() || undefined;
      req.priority = priority;
      req.expectedDeliveryDate = expectedDelivery || undefined;
      req.labourCharges = Number(labourCharges) || 0;
      await repairService.update(detail.id, req);
      toast.success("Details updated");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async () => {
    if (!detail || !nextStatus) return;
    setSaving(true);
    try {
      await repairService.updateStatus(
        detail.id,
        nextStatus as RepairStatusApi,
        statusRemarks || undefined
      );
      toast.success(
        `Status updated to ${STATUS_LABELS[nextStatus] || nextStatus}`
      );
      setNextStatus("");
      setStatusRemarks("");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to change status");
    } finally {
      setSaving(false);
    }
  };

  const handleAddObservation = async () => {
    if (!detail || !obsDescription.trim()) {
      toast.error("Observation description is required");
      return;
    }
    setAddingObs(true);
    try {
      await repairService.addObservation(
        detail.id,
        obsType,
        obsDescription.trim()
      );
      toast.success("Observation added");
      setObsDescription("");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add observation");
    } finally {
      setAddingObs(false);
    }
  };

  const handleAddPart = async () => {
    if (!detail || !newPartProductId || !selectedProduct) {
      toast.error("Please pick a product");
      return;
    }
    const qty = Number(newPartQty);
    const price = Number(newPartUnitPrice || selectedProduct.price);
    if (qty < 1) return toast.error("Quantity must be at least 1");
    if (price < 0) return toast.error("Unit price cannot be negative");

    setAddingPart(true);
    try {
      const req = detailToRequest(detail);
      req.items = [
        ...(req.items ?? []),
        {
          productId: selectedProduct.id!,
          productName: selectedProduct.name,
          quantity: qty,
          unitPrice: price,
          taxPercent: selectedProduct.taxPercentage ?? 0,
          hsnSac: selectedProduct.hsnCode,
        },
      ];
      await repairService.update(detail.id, req);
      toast.success(`Added ${selectedProduct.name}`);
      setNewPartProductId("");
      setNewPartQty("1");
      setNewPartUnitPrice("");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add part");
    } finally {
      setAddingPart(false);
    }
  };

  const handleRemovePart = async (index: number) => {
    if (!detail) return;
    if (!confirm("Remove this part?")) return;
    setSaving(true);
    try {
      const req = detailToRequest(detail);
      req.items = (req.items ?? []).filter((_, i) => i !== index);
      await repairService.update(detail.id, req);
      toast.success("Part removed");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove part");
    } finally {
      setSaving(false);
    }
  };

  const handleConvert = async () => {
    if (!detail) return;
    if (
      !confirm(
        `Convert ${detail.repairNumber} to an invoice DRAFT? You'll be able to edit the invoice before finalising.`
      )
    )
      return;
    setSaving(true);
    try {
      const updated = await repairService.convertToInvoice(detail.id);
      toast.success(
        `Invoice ${updated.convertedInvoiceNumber} created as DRAFT`
      );
      if (updated.convertedInvoiceId) {
        navigate(`/admin/finance/invoices/${updated.convertedInvoiceId}/edit`);
      } else {
        await load();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to convert");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-6 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/repair-orders/list")}
        >
          <ArrowLeft className="size-4 mr-2" /> Back
        </Button>
        <p className="text-muted-foreground">Repair order not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/admin/repair-orders/${detail.id}`)}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="m-0">{detail.repairNumber}</h1>
              <Badge variant={STATUS_VARIANTS[detail.status] || "outline"}>
                {STATUS_LABELS[detail.status] || detail.status}
              </Badge>
              <Badge variant="outline">Priority: {detail.priority}</Badge>
              {withVendor && (
                <Badge className="bg-amber-500 hover:bg-amber-500 text-white">
                  <Truck className="size-3 mr-1" />
                  With Vendor{activeLeg?.vendorName ? `: ${activeLeg.vendorName}` : ""}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Workflow — update details, add observations, add parts, change status
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/repair-orders/${detail.id}`)}
          >
            <Eye className="size-4 mr-2" />
            View
          </Button>
        </div>
      </div>

      {/* Conversion banner */}
      {isConverted && (
        <Card className="border-green-500/40 bg-green-500/5">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">
                Converted to invoice{" "}
                <span className="font-mono">
                  {detail.convertedInvoiceNumber}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                This repair order is now linked to an invoice.
              </p>
            </div>
            <Button
              onClick={() =>
                navigate(`/admin/finance/invoices/${detail.convertedInvoiceId}`)
              }
            >
              <FileText className="size-4 mr-2" />
              Open Invoice
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — details / observations / parts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic details */}
          <Card>
            <CardHeader>
              <CardTitle>Repair Details</CardTitle>
              <CardDescription>
                Assigned engineer, priority, expected delivery, labour
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentStatus">Current Status</Label>
                <div
                  id="currentStatus"
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border bg-muted/40 px-3 py-2"
                >
                  <Badge variant={STATUS_VARIANTS[detail.status] || "outline"}>
                    {STATUS_LABELS[detail.status] || detail.status}
                  </Badge>
                  {withVendor && (
                    <Badge className="bg-amber-500 hover:bg-amber-500 text-white">
                      <Truck className="size-3 mr-1" />
                      With Vendor
                      {activeLeg?.vendorName ? `: ${activeLeg.vendorName}` : ""}
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {(() => {
                      const since = statusSince(detail);
                      const days = daysSince(since);
                      if (!since) return "Stage start not recorded";
                      const age =
                        days === undefined
                          ? ""
                          : days === 0
                            ? " (today)"
                            : ` (${days} day${days === 1 ? "" : "s"})`;
                      return `In this stage since ${fmtDate(since)}${age}`;
                    })()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use “Change Status” to move this order to the next stage.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="engineer">Assigned Engineer</Label>
                  <Input
                    id="engineer"
                    value={assignedEngineer}
                    onChange={(e) => setAssignedEngineer(e.target.value)}
                    disabled={isConverted}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={priority}
                    onValueChange={(v) => setPriority(v as RepairPriorityApi)}
                    disabled={isConverted}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expected">Expected Delivery</Label>
                  <Input
                    id="expected"
                    type="date"
                    value={expectedDelivery}
                    onChange={(e) => setExpectedDelivery(e.target.value)}
                    disabled={isConverted}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="labour">Labour Charges (INR)</Label>
                  <Input
                    id="labour"
                    type="number"
                    min="0"
                    step="0.01"
                    value={labourCharges}
                    onChange={(e) => setLabourCharges(e.target.value)}
                    disabled={isConverted}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={saveBasics} disabled={saving || isConverted}>
                  <Save className="size-4 mr-2" />
                  {saving ? "Saving..." : "Save Details"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Add observation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquarePlus className="size-4" /> Add Observation
              </CardTitle>
              <CardDescription>
                Log a technical note on this repair. Appears in the timeline.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 col-span-1">
                  <Label>Type</Label>
                  <Select value={obsType} onValueChange={setObsType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OBSERVATION_TYPES.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={obsDescription}
                    onChange={(e) => setObsDescription(e.target.value)}
                    rows={3}
                    placeholder="What was observed / done"
                    disabled={isConverted}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleAddObservation}
                  disabled={addingObs || isConverted}
                >
                  <Plus className="size-4 mr-2" />
                  {addingObs ? "Adding..." : "Add Observation"}
                </Button>
              </div>

              {(detail.observations ?? []).length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {[...(detail.observations ?? [])]
                      .sort(
                        (a, b) =>
                          new Date(a.createdAt).getTime() -
                          new Date(b.createdAt).getTime()
                      )
                      .map((o) => (
                        <div
                          key={o.id}
                          className="border-l-2 border-primary/40 pl-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="outline">{o.observationType}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(o.createdAt).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <p className="text-sm mt-1 whitespace-pre-line">
                            {o.description}
                          </p>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Parts */}
          <Card>
            <CardHeader>
              <CardTitle>Parts / Products Used</CardTitle>
              <CardDescription>
                {(detail.items ?? []).length} part(s) so far
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-6 gap-3 items-end">
                <div className="col-span-3 space-y-2">
                  <Label>Product</Label>
                  <Select
                    value={newPartProductId}
                    onValueChange={(v) => {
                      setNewPartProductId(v);
                      const p = products.find((x) => x.id === v);
                      if (p) setNewPartUnitPrice(String(p.price));
                    }}
                    disabled={productsLoading || isConverted}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          productsLoading ? "Loading..." : "Pick product"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id!}>
                          {p.name}
                          {p.sku ? ` — ${p.sku}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1 space-y-2">
                  <Label>Qty</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newPartQty}
                    onChange={(e) => setNewPartQty(e.target.value)}
                    disabled={isConverted}
                  />
                </div>
                <div className="col-span-1 space-y-2">
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newPartUnitPrice}
                    onChange={(e) => setNewPartUnitPrice(e.target.value)}
                    disabled={isConverted}
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    onClick={handleAddPart}
                    disabled={addingPart || isConverted || !newPartProductId}
                    className="w-full"
                  >
                    <Plus className="size-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              {(detail.items ?? []).length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b text-muted-foreground">
                        <th className="py-2 pr-3">Product</th>
                        <th className="py-2 pr-3">Qty</th>
                        <th className="py-2 pr-3 text-right">Unit</th>
                        <th className="py-2 pr-3 text-right">Line Total</th>
                        <th className="py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detail.items ?? []).map((it, idx) => (
                        <tr key={it.id} className="border-b last:border-0">
                          <td className="py-2 pr-3">{it.productName}</td>
                          <td className="py-2 pr-3">
                            {it.quantity} {it.unit || ""}
                          </td>
                          <td className="py-2 pr-3 text-right">
                            {fmtMoney(it.unitPrice)}
                          </td>
                          <td className="py-2 pr-3 text-right font-medium">
                            {fmtMoney(it.lineTotal)}
                          </td>
                          <td className="py-2 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemovePart(idx)}
                              disabled={saving || isConverted}
                              title="Remove"
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column — status + convert + cost */}
        <div className="space-y-6">
          {/* Change status */}
          <Card>
            <CardHeader>
              <CardTitle>Change Status</CardTitle>
              <CardDescription>Current: {STATUS_LABELS[detail.status]}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {withVendor && (
                <p className="text-xs text-amber-700 dark:text-amber-500 bg-amber-500/10 border border-amber-500/30 rounded p-2">
                  Blocked: cannot advance to Ready-for-Delivery / Delivered /
                  Completed while the device is with a vendor. Receive it first.
                </p>
              )}
              {!withVendor &&
                (detail.outsourcings?.some(
                  (o) => o.status === "returned_from_vendor"
                ) ??
                  false) &&
                detail.status !== "completed" &&
                detail.status !== "delivered" && (
                  <p className="text-xs text-muted-foreground bg-muted/40 rounded p-2">
                    Device back from vendor — advance to Testing, Quality
                    Check, then Ready for Delivery or Completed.
                  </p>
                )}
              <Select
                value={nextStatus}
                onValueChange={(v) => setNextStatus(v as RepairStatusApi)}
                disabled={isConverted}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select next status" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABELS) as RepairStatusApi[])
                    .filter((k) => k !== detail.status && k !== "cancelled")
                    .map((k) => (
                      <SelectItem key={k} value={k}>
                        {STATUS_LABELS[k]}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Remarks (optional)"
                value={statusRemarks}
                onChange={(e) => setStatusRemarks(e.target.value)}
                rows={2}
                disabled={isConverted}
              />
              <Button
                onClick={handleStatusChange}
                disabled={saving || !nextStatus || isConverted}
                className="w-full"
              >
                {saving ? "Updating..." : "Update Status"}
              </Button>
            </CardContent>
          </Card>

          {/* Cost summary */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Parts Cost</span>
                <span>{fmtMoney(detail.partsCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Labour</span>
                <span>{fmtMoney(detail.labourCharges)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Outsourcing</span>
                <span>{fmtMoney(detail.outsourcingCost)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{fmtMoney(detail.totalTax)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Grand Total</span>
                <span>{fmtMoney(detail.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Profit</span>
                <span
                  className={
                    (detail.profit ?? 0) < 0
                      ? "text-destructive"
                      : "text-green-600"
                  }
                >
                  {fmtMoney(detail.profit)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Send to Vendor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="size-4" /> Outsourcing
              </CardTitle>
              <CardDescription>
                {withVendor
                  ? "Currently with a vendor. Receive from vendor to continue in-house."
                  : "Send this device to a vendor for external repair."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {withVendor && activeLeg && (
                <div className="rounded-md bg-amber-500/10 border border-amber-500/30 p-3 text-sm space-y-1">
                  <div className="font-medium">
                    {activeLeg.vendorName || `Vendor #${activeLeg.vendorId}`}
                  </div>
                  <div className="text-muted-foreground">
                    Sent: {activeLeg.outsourceDate}
                    {activeLeg.expectedReturnDate
                      ? ` · Expected back: ${activeLeg.expectedReturnDate}`
                      : ""}
                  </div>
                  {activeLeg.remarks && (
                    <div className="text-muted-foreground italic">
                      {activeLeg.remarks}
                    </div>
                  )}
                </div>
              )}
              {(detail.outsourcings ?? []).filter(
                (o) => o.status !== "sent_to_vendor"
              ).length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground">
                    Past outsourcing trips (
                    {
                      (detail.outsourcings ?? []).filter(
                        (o) => o.status !== "sent_to_vendor"
                      ).length
                    }
                    )
                  </summary>
                  <div className="mt-2 space-y-2">
                    {(detail.outsourcings ?? [])
                      .filter((o) => o.status !== "sent_to_vendor")
                      .map((o) => (
                        <div
                          key={o.id}
                          className="border rounded p-2 space-y-0.5"
                        >
                          <div className="font-medium">{o.vendorName}</div>
                          <div className="text-muted-foreground">
                            {o.outsourceDate} → {o.actualReturnDate || "?"}
                          </div>
                          {o.totalCost !== undefined && o.totalCost > 0 && (
                            <div>Cost: {fmtMoney(o.totalCost)}</div>
                          )}
                        </div>
                      ))}
                  </div>
                </details>
              )}
              {withVendor && activeLeg && (
                <Button
                  onClick={openReceive}
                  disabled={saving || isConverted}
                  className="w-full"
                >
                  <Truck className="size-4 mr-2 rotate-180" />
                  Receive From Vendor
                </Button>
              )}
              <Button
                onClick={openSendToVendor}
                disabled={!canSendToVendor || saving}
                className="w-full"
                variant={withVendor ? "outline" : "default"}
              >
                <Truck className="size-4 mr-2" />
                {withVendor ? "Send to Another Vendor" : "Send to Vendor"}
              </Button>
            </CardContent>
          </Card>

          {/* Convert to invoice */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-4" /> Invoice
              </CardTitle>
              <CardDescription>
                Convert this repair to an invoice DRAFT for review + edit.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isConverted ? (
                <p className="text-sm text-muted-foreground">
                  Already converted to{" "}
                  <span className="font-mono">
                    {detail.convertedInvoiceNumber}
                  </span>
                  .
                </p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    {canConvert
                      ? "Ready to convert. The invoice will open in DRAFT so you can review and edit before finalising."
                      : withVendor
                      ? "Cannot invoice while the device is with a vendor. Receive it first."
                      : "Move the status to Ready for Delivery or Completed, and add at least one part or set labour charges, before converting."}
                  </p>
                  <Button
                    onClick={handleConvert}
                    disabled={!canConvert || saving}
                    className="w-full"
                  >
                    <FileText className="size-4 mr-2" />
                    Convert to Invoice
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Send to Vendor dialog */}
      <Dialog open={showSendToVendor} onOpenChange={setShowSendToVendor}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send to Vendor</DialogTitle>
            <DialogDescription>
              Log the outsourcing details. Costs are recorded when the device
              is received back.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Vendor *</Label>
              <div className="flex gap-2">
                <Select
                  value={sendVendorId}
                  onValueChange={setSendVendorId}
                  disabled={vendorsLoading}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue
                      placeholder={
                        vendorsLoading
                          ? "Loading..."
                          : vendors.length
                          ? "Select vendor"
                          : "No vendors — add one"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {v.name}
                        {v.specialization ? ` — ${v.specialization}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowAddVendor(true)}
                  title="Add vendor"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Outsource Date *</Label>
                <Input
                  type="date"
                  value={sendOutsourceDate}
                  onChange={(e) => setSendOutsourceDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Expected Return</Label>
                <Input
                  type="date"
                  value={sendExpectedReturnDate}
                  onChange={(e) =>
                    setSendExpectedReturnDate(e.target.value)
                  }
                  min={sendOutsourceDate}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Remarks</Label>
              <Textarea
                value={sendRemarks}
                onChange={(e) => setSendRemarks(e.target.value)}
                rows={2}
                placeholder="Scope of work, damage notes, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSendToVendor(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSendToVendor}
              disabled={sending || !sendVendorId}
            >
              <Truck className="size-4 mr-2" />
              {sending ? "Sending..." : "Confirm Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive From Vendor dialog */}
      <Dialog open={showReceive} onOpenChange={setShowReceive}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receive From Vendor</DialogTitle>
            <DialogDescription>
              {activeLeg?.vendorName
                ? `Closing outsourcing trip to ${activeLeg.vendorName}.`
                : "Close the current outsourcing trip."}{" "}
              After this, the repair returns to in-house workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Return Date *</Label>
                <Input
                  type="date"
                  value={receiveDate}
                  onChange={(e) => setReceiveDate(e.target.value)}
                  min={activeLeg?.outsourceDate}
                />
              </div>
              <div className="space-y-1">
                <Label>Vendor Invoice #</Label>
                <Input
                  value={receiveInvoice}
                  onChange={(e) => setReceiveInvoice(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Outsource Cost *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={receiveOutsourceCost}
                  onChange={(e) => setReceiveOutsourceCost(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Transport</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={receiveTransport}
                  onChange={(e) => setReceiveTransport(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Additional</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={receiveAdditional}
                  onChange={(e) => setReceiveAdditional(e.target.value)}
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground bg-muted/40 rounded p-2 flex justify-between">
              <span>Trip total</span>
              <span className="font-medium text-foreground">
                {fmtMoney(
                  (Number(receiveOutsourceCost) || 0) +
                    (Number(receiveTransport) || 0) +
                    (Number(receiveAdditional) || 0)
                )}
              </span>
            </div>
            <div className="space-y-1">
              <Label>Remarks</Label>
              <Textarea
                value={receiveRemarks}
                onChange={(e) => setReceiveRemarks(e.target.value)}
                rows={2}
                placeholder="Condition on return, work performed, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowReceive(false)}
              disabled={receiving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleReceive}
              disabled={receiving}
            >
              {receiving ? "Receiving..." : "Confirm Receive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Vendor dialog */}
      <Dialog open={showAddVendor} onOpenChange={setShowAddVendor}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Vendor</DialogTitle>
            <DialogDescription>
              New vendors are available immediately for outsourcing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input
                value={newVendor.name}
                onChange={(e) =>
                  setNewVendor({ ...newVendor, name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Contact Person</Label>
                <Input
                  value={newVendor.contactPerson ?? ""}
                  onChange={(e) =>
                    setNewVendor({
                      ...newVendor,
                      contactPerson: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Mobile</Label>
                <Input
                  value={newVendor.mobile ?? ""}
                  onChange={(e) =>
                    setNewVendor({ ...newVendor, mobile: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newVendor.email ?? ""}
                  onChange={(e) =>
                    setNewVendor({ ...newVendor, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>GST Number</Label>
                <Input
                  value={newVendor.gstNumber ?? ""}
                  onChange={(e) =>
                    setNewVendor({ ...newVendor, gstNumber: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Specialization</Label>
              <Input
                value={newVendor.specialization ?? ""}
                onChange={(e) =>
                  setNewVendor({
                    ...newVendor,
                    specialization: e.target.value,
                  })
                }
                placeholder="e.g., PCB repair, hydraulic overhaul"
              />
            </div>
            <div className="space-y-1">
              <Label>Address</Label>
              <Textarea
                rows={2}
                value={newVendor.address ?? ""}
                onChange={(e) =>
                  setNewVendor({ ...newVendor, address: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddVendor(false)}
              disabled={savingVendor}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveVendor}
              disabled={savingVendor}
            >
              {savingVendor ? "Saving..." : "Save Vendor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
