import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { repairOrderService, RepairOrder, RepairStatus } from "../services/repairOrderService";
import { Button } from "../components/ui/button";
import { ArrowLeft, Pencil, Printer, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";

const STATUS_LABELS: Record<RepairStatus, string> = {
  "received": "Received",
  "inspection-pending": "Inspection Pending",
  "under-diagnosis": "Under Diagnosis",
  "waiting-for-parts": "Waiting for Parts",
  "in-repair": "In Repair",
  "outsourced": "Outsourced",
  "quality-check": "Quality Check",
  "completed": "Completed",
  "ready-for-delivery": "Ready for Delivery",
  "delivered": "Delivered",
  "closed": "Closed",
};

export function RepairOrderView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<RepairOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadOrder(id);
    }
  }, [id]);

  const loadOrder = async (orderId: string) => {
    try {
      setLoading(true);
      const data = await repairOrderService.getRepairOrderById(orderId);
      setOrder(data);
    } catch (error) {
      console.error("Failed to load repair order:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
      <div className="p-6">
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
            onClick={() => navigate("/admin/repair-orders")}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="mb-1">Repair Order {order.repairOrderNumber}</h1>
            <p className="text-muted-foreground">View repair order details and history</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4 mr-2" />
            Print
          </Button>
          <Button onClick={() => navigate(`/admin/repair-orders/${order.id}/edit`)}>
            <Pencil className="size-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Company Name</p>
                  <p className="font-medium">{order.customer.companyName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact Person</p>
                  <p className="font-medium">{order.customer.contactPerson}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{order.customer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{order.customer.phone}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{order.customer.address}</p>
              </div>
            </CardContent>
          </Card>

          {/* Machine Information */}
          <Card>
            <CardHeader>
              <CardTitle>Machine Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Machine Name</p>
                  <p className="font-medium">{order.machine.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Manufacturer</p>
                  <p className="font-medium">{order.machine.manufacturer}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Model Number</p>
                  <p className="font-medium">{order.machine.modelNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Serial Number</p>
                  <p className="font-medium">{order.machine.serialNumber}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <Badge variant="outline">{order.machine.category}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Service Information */}
          <Card>
            <CardHeader>
              <CardTitle>Service Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Problem Description</p>
                <p className="font-medium">{order.service.problemDescription}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Customer Complaint</p>
                <p className="font-medium">{order.service.customerComplaint}</p>
              </div>

              {order.service.accessoriesReceived.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Accessories Received</p>
                  <div className="flex flex-wrap gap-2">
                    {order.service.accessoriesReceived.map((acc, idx) => (
                      <Badge key={idx} variant="secondary">
                        {acc}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {order.service.initialInspectionNotes && (
                <div>
                  <p className="text-sm text-muted-foreground">Initial Inspection Notes</p>
                  <p className="font-medium">{order.service.initialInspectionNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Technician Assignment */}
          {order.assignment && (
            <Card>
              <CardHeader>
                <CardTitle>Technician Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Engineer</p>
                    <p className="font-medium">{order.assignment.engineer}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Technician</p>
                    <p className="font-medium">{order.assignment.technician}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Work Notes</p>
                  <p className="font-medium">{order.assignment.workNotes}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Repair Summary</p>
                  <p className="font-medium">{order.assignment.repairSummary}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Time Spent</p>
                  <p className="font-medium">{order.assignment.timeSpent} hours</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Parts Used */}
          {order.partsUsed.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Parts Used</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {order.partsUsed.map((part, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{part.partName}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {part.quantity} × {formatCurrency(part.unitCost)}
                        </p>
                      </div>
                      <p className="font-medium">{formatCurrency(part.totalCost)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Outsourcing Details */}
          {order.outsourcing && (
            <Card>
              <CardHeader>
                <CardTitle>Outsourced Repair Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Vendor Name</p>
                    <p className="font-medium">{order.outsourcing.vendorName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Service Type</p>
                    <p className="font-medium">{order.outsourcing.serviceType}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Cost</p>
                    <p className="font-medium">{formatCurrency(order.outsourcing.cost)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Status</p>
                    <Badge variant={order.outsourcing.paymentStatus === "paid" ? "default" : "secondary"}>
                      {order.outsourcing.paymentStatus}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Invoice Number</p>
                  <p className="font-medium">{order.outsourcing.invoiceNumber}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Current Status</p>
                <Badge className="text-base px-3 py-1">
                  {STATUS_LABELS[order.status]}
                </Badge>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">Received Date</p>
                <p className="font-medium">{new Date(order.receivedDate).toLocaleDateString()}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Created By</p>
                <p className="font-medium">{order.createdBy}</p>
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Repair Revenue</span>
                <span className="font-medium">{formatCurrency(order.financial.repairRevenue)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Parts Cost</span>
                <span className="font-medium">{formatCurrency(order.financial.partsCost)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Labour Cost</span>
                <span className="font-medium">{formatCurrency(order.financial.labourCost)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Outsourcing Cost</span>
                <span className="font-medium">{formatCurrency(order.financial.outsourcingCost)}</span>
              </div>

              <Separator />

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Cost</span>
                <span className="font-medium">{formatCurrency(order.financial.totalCost)}</span>
              </div>

              <div className="flex justify-between text-lg">
                <span className="font-semibold">Profit</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(order.financial.profit)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Status History</CardTitle>
              <CardDescription>Timeline of status changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.statusHistory.map((history, idx) => (
                  <div key={idx} className="relative pl-6 pb-4 last:pb-0">
                    {idx !== order.statusHistory.length - 1 && (
                      <div className="absolute left-2 top-6 bottom-0 w-px bg-border" />
                    )}
                    <div className="absolute left-0 top-1">
                      {idx === 0 ? (
                        <CheckCircle className="size-4 text-green-500" />
                      ) : (
                        <Clock className="size-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{STATUS_LABELS[history.status]}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(history.date)}
                      </p>
                      <p className="text-xs text-muted-foreground">By {history.updatedBy}</p>
                      {history.notes && (
                        <p className="text-xs mt-1">{history.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
