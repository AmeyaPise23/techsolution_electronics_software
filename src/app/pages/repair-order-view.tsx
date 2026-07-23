import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { repairService, RepairOrderDetail } from "../services/repairService";
import { Button } from "../components/ui/button";
import {
  ArrowLeft,
  Pencil,
  Printer,
  Wrench,
  User,
  Package,
  MessageSquare,
  Activity,
  IndianRupee,
  Truck,
  FileText,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
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

const ACTION_LABELS: Record<string, string> = {
  created: "Created",
  updated: "Updated",
  status_changed: "Status changed",
  priority_changed: "Priority changed",
  engineer_assigned: "Engineer assigned",
  item_added: "Item added",
  item_removed: "Item removed",
  item_updated: "Item updated",
  observation_added: "Observation added",
  cost_updated: "Cost updated",
  sent_to_vendor: "Sent to vendor",
  returned_from_vendor: "Returned from vendor",
  converted_to_invoice: "Converted to invoice",
  cancelled: "Cancelled",
  delivered: "Delivered",
  completed: "Completed",
};

const OBSERVATION_LABELS: Record<string, string> = {
  customer_complaint: "Customer complaint",
  initial_inspection: "Initial inspection",
  diagnosis: "Diagnosis",
  repair_action: "Repair action",
  part_replacement: "Part replacement",
  testing: "Testing",
  quality_check: "Quality check",
  completion_note: "Completion note",
  general_note: "General note",
};

const fmtStatus = (s?: string) => (s ? STATUS_LABELS[s] || s : "-");
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-IN") : "-";
const fmtDateTime = (d?: string) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";
const fmtMoney = (v?: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(v ?? 0);

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  const isEmpty =
    value === undefined ||
    value === null ||
    value === "" ||
    value === false;
  return (
    <div className="space-y-1">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-sm">{isEmpty ? "-" : value}</div>
    </div>
  );
}

export function RepairOrderView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<RepairOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const data = await repairService.get(Number(id));
        if (!cancelled) setOrder(data);
      } catch (e) {
        if (!cancelled) {
          const msg =
            e instanceof Error ? e.message : "Failed to load repair order";
          toast.error(msg);
          setLoadError(msg);
          setOrder(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/repair-orders/list")}
        >
          <ArrowLeft className="size-4 mr-2" />
          Back to list
        </Button>
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <div className="font-medium">Could not load repair order #{id}</div>
          <div className="text-muted-foreground mt-1">
            {loadError ?? "Repair order not found."}
          </div>
        </div>
      </div>
    );
  }

  const observations = [...(order.observations ?? [])].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const activities = [...(order.activities ?? [])].sort(
    (a, b) =>
      new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/repair-orders")}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="m-0">{order.repairNumber}</h1>
              <Badge variant={STATUS_VARIANTS[order.status] || "outline"}>
                {fmtStatus(order.status)}
              </Badge>
              <Badge variant="outline">Priority: {order.priority}</Badge>
              {order.outsourceStatus === "sent_to_vendor" && (
                <Badge className="bg-amber-500 hover:bg-amber-500 text-white">
                  <Truck className="size-3 mr-1" /> With Vendor
                </Badge>
              )}
              {order.convertedInvoiceId && (
                <Badge className="bg-green-600 hover:bg-green-600 text-white">
                  <FileText className="size-3 mr-1" /> Invoiced ·{" "}
                  {order.convertedInvoiceNumber}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {order.owningCompany} · Received {fmtDate(order.receivedDate)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4 mr-2" />
            Print
          </Button>
          <Button
            onClick={() => navigate(`/admin/repair-orders/${order.id}/edit`)}
          >
            <Pencil className="size-4 mr-2" />
            Open Workflow
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer + Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-4" /> Customer & Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Customer"
                  value={order.customerCompany || order.customerName}
                />
                <Field label="Customer ID" value={`#${order.customerId}`} />
              </div>
              {order.customerContact && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="Contact Person"
                      value={
                        <>
                          {order.customerContact.name}
                          {order.customerContact.isPrimary && (
                            <Badge variant="outline" className="ml-2">
                              Primary
                            </Badge>
                          )}
                        </>
                      }
                    />
                    <Field
                      label="Designation"
                      value={order.customerContact.designation}
                    />
                    <Field
                      label="Mobile"
                      value={order.customerContact.mobile}
                    />
                    <Field
                      label="Email"
                      value={order.customerContact.email}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Device */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="size-4" /> Device Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Field label="Device Name" value={order.deviceName} />
              <Field label="Category" value={order.machineCategoryName} />
              <Field label="Manufacturer" value={order.deviceManufacturer} />
              <Field label="Model" value={order.deviceModelNumber} />
              <Field label="Serial Number" value={order.deviceSerialNumber} />
              <Field label="Warranty Status" value={order.warrantyStatus} />
              <Field
                label="Warranty Expiry"
                value={fmtDate(order.warrantyExpiry)}
              />
              <Field label="Warranty Note" value={order.warranty} />
            </CardContent>
          </Card>

          {/* Service intake */}
          <Card>
            <CardHeader>
              <CardTitle>Service Intake</CardTitle>
              <CardDescription>What the customer reported</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field
                label="Customer Complaint"
                value={
                  order.customerComplaint && (
                    <span className="whitespace-pre-line">
                      {order.customerComplaint}
                    </span>
                  )
                }
              />
              <Field
                label="Problem Description"
                value={
                  order.problemDescription && (
                    <span className="whitespace-pre-line">
                      {order.problemDescription}
                    </span>
                  )
                }
              />
              <Field
                label="Initial Inspection Notes"
                value={
                  order.initialInspectionNotes && (
                    <span className="whitespace-pre-line">
                      {order.initialInspectionNotes}
                    </span>
                  )
                }
              />

              {order.accessories && order.accessories.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    Accessories Received
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {order.accessories.map((a) => (
                      <Badge key={a.id} variant="secondary">
                        {a.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Products used */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="size-4" /> Products / Parts Used
              </CardTitle>
              <CardDescription>
                {order.items?.length ?? 0} item(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!order.items || order.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No parts added yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b text-muted-foreground">
                        <th className="py-2 pr-3">Product</th>
                        <th className="py-2 pr-3">Qty</th>
                        <th className="py-2 pr-3 text-right">Unit</th>
                        <th className="py-2 pr-3 text-right">Discount</th>
                        <th className="py-2 pr-3 text-right">Tax</th>
                        <th className="py-2 pr-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((it) => (
                        <tr key={it.id} className="border-b last:border-0">
                          <td className="py-2 pr-3">
                            <div>{it.productName}</div>
                            {it.variantName && (
                              <div className="text-xs text-muted-foreground">
                                {it.variantName}
                              </div>
                            )}
                            {it.serialNumber && (
                              <div className="text-xs text-muted-foreground">
                                SN: {it.serialNumber}
                              </div>
                            )}
                          </td>
                          <td className="py-2 pr-3">
                            {it.quantity} {it.unit || ""}
                          </td>
                          <td className="py-2 pr-3 text-right">
                            {fmtMoney(it.unitPrice)}
                          </td>
                          <td className="py-2 pr-3 text-right">
                            {fmtMoney(it.discountAmount)}
                          </td>
                          <td className="py-2 pr-3 text-right">
                            {fmtMoney(it.taxAmount)}
                          </td>
                          <td className="py-2 pr-3 text-right font-medium">
                            {fmtMoney(it.lineTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Outsourcing history */}
          {(order.outsourcings ?? []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="size-4" /> Outsourcing History
                </CardTitle>
                <CardDescription>
                  {order.outsourcings!.length} vendor trip
                  {order.outsourcings!.length === 1 ? "" : "s"} — full audit
                  trail preserved
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[...(order.outsourcings ?? [])]
                  .sort(
                    (a, b) =>
                      new Date(b.outsourceDate).getTime() -
                      new Date(a.outsourceDate).getTime()
                  )
                  .map((leg) => {
                    const isOpen = leg.status === "sent_to_vendor";
                    const total = leg.totalCost ?? 0;
                    return (
                      <div
                        key={leg.id}
                        className={
                          "rounded-md border p-3 space-y-2 " +
                          (isOpen
                            ? "border-amber-500/40 bg-amber-500/5"
                            : "bg-muted/20")
                        }
                      >
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <p className="font-medium">
                              {leg.vendorName ?? `Vendor #${leg.vendorId}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Sent {fmtDate(leg.outsourceDate)}
                              {leg.expectedReturnDate &&
                                ` · Expected ${fmtDate(leg.expectedReturnDate)}`}
                              {leg.actualReturnDate &&
                                ` · Returned ${fmtDate(leg.actualReturnDate)}`}
                            </p>
                          </div>
                          <Badge
                            variant={isOpen ? "default" : "outline"}
                            className={
                              isOpen
                                ? "bg-amber-500 hover:bg-amber-500 text-white"
                                : ""
                            }
                          >
                            {isOpen ? "With Vendor" : "Returned"}
                          </Badge>
                        </div>

                        {!isOpen && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <div>
                              <p className="text-muted-foreground">
                                Vendor Invoice
                              </p>
                              <p>{leg.vendorInvoiceNumber || "-"}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Outsource Cost
                              </p>
                              <p>{fmtMoney(leg.outsourceCost)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Transport
                              </p>
                              <p>{fmtMoney(leg.transportCost)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Additional
                              </p>
                              <p>{fmtMoney(leg.additionalCharges)}</p>
                            </div>
                            <div className="col-span-2 md:col-span-4 flex justify-between border-t pt-1">
                              <span className="text-muted-foreground">
                                Trip total
                              </span>
                              <span className="font-medium">
                                {fmtMoney(total)}
                              </span>
                            </div>
                          </div>
                        )}

                        {leg.remarks && (
                          <p className="text-xs">
                            <span className="text-muted-foreground">
                              Sent notes:
                            </span>{" "}
                            <span className="italic">{leg.remarks}</span>
                          </p>
                        )}
                        {leg.returnRemarks && (
                          <p className="text-xs">
                            <span className="text-muted-foreground">
                              Return notes:
                            </span>{" "}
                            <span className="italic">{leg.returnRemarks}</span>
                          </p>
                        )}
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          )}

          {/* Observations timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="size-4" /> Repair Observations
              </CardTitle>
              <CardDescription>
                Technical notes recorded chronologically
              </CardDescription>
            </CardHeader>
            <CardContent>
              {observations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No observations recorded yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {observations.map((o) => (
                    <div key={o.id} className="border-l-2 border-primary/40 pl-4">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline">
                          {OBSERVATION_LABELS[o.observationType] ||
                            o.observationType}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {fmtDateTime(o.createdAt)}
                          {o.createdBy ? ` · ${o.createdBy}` : ""}
                        </span>
                      </div>
                      <p className="text-sm mt-2 whitespace-pre-line">
                        {o.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          {/* Assignment + dates */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field
                label="Status"
                value={
                  <Badge variant={STATUS_VARIANTS[order.status] || "outline"}>
                    {fmtStatus(order.status)}
                  </Badge>
                }
              />
              <Field label="Priority" value={order.priority} />
              <Field
                label="Assigned Engineer"
                value={order.assignedEngineer}
              />
              <Field label="Received By" value={order.receivedBy} />
              <Separator />
              <Field label="Received" value={fmtDate(order.receivedDate)} />
              <Field
                label="Expected Delivery"
                value={fmtDate(order.expectedDeliveryDate)}
              />
              <Field
                label="Repair Completed"
                value={fmtDate(order.repairCompletedDate)}
              />
              <Field label="Delivered" value={fmtDate(order.deliveredDate)} />
            </CardContent>
          </Card>

          {/* Cost summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="size-4" /> Cost Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Parts Cost</span>
                <span>{fmtMoney(order.partsCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Labour Charges</span>
                <span>{fmtMoney(order.labourCharges)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Outsourcing</span>
                <span>{fmtMoney(order.outsourcingCost)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{fmtMoney(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>-{fmtMoney(order.discountTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxable</span>
                <span>{fmtMoney(order.taxableAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (CGST+SGST+IGST)</span>
                <span>{fmtMoney(order.totalTax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Grand Total</span>
                <span>{fmtMoney(order.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Total Cost</span>
                <span>{fmtMoney(order.totalCost)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Profit</span>
                <span
                  className={
                    (order.profit ?? 0) < 0
                      ? "text-destructive"
                      : "text-green-600"
                  }
                >
                  {fmtMoney(order.profit)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Activity log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-4" /> Activity Log
              </CardTitle>
              <CardDescription>System audit trail</CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No activity yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {activities.slice(0, 15).map((a) => (
                    <div key={a.id} className="text-xs">
                      <div className="flex justify-between">
                        <span className="font-medium">
                          {ACTION_LABELS[a.action] || a.action}
                        </span>
                        <span className="text-muted-foreground">
                          {fmtDateTime(a.performedAt)}
                        </span>
                      </div>
                      {(a.fromStatus || a.toStatus) && (
                        <div className="text-muted-foreground">
                          {fmtStatus(a.fromStatus)} → {fmtStatus(a.toStatus)}
                        </div>
                      )}
                      {a.performedBy && (
                        <div className="text-muted-foreground">
                          by {a.performedBy}
                        </div>
                      )}
                      {a.remarks && (
                        <div className="text-muted-foreground italic">
                          {a.remarks}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
