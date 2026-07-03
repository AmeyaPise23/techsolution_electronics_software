import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { repairOrderService, RepairOrder, RepairStatus } from "../services/repairOrderService";
import { Plus, Search, Eye, Pencil, Printer, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { toast } from "sonner";

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

export function RepairOrdersList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [repairOrders, setRepairOrders] = useState<RepairOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") || "all");

  useEffect(() => {
    loadRepairOrders();
  }, []);

  const loadRepairOrders = async () => {
    try {
      setLoading(true);
      const data = await repairOrderService.getAllRepairOrders();
      setRepairOrders(data);
    } catch (error) {
      toast.error("Failed to load repair orders");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this repair order?")) {
      try {
        await repairOrderService.deleteRepairOrder(id);
        setRepairOrders(repairOrders.filter((ro) => ro.id !== id));
        toast.success("Repair order deleted successfully");
      } catch (error) {
        toast.error("Failed to delete repair order");
      }
    }
  };

  const filteredOrders = repairOrders.filter((order) => {
    const matchesSearch =
      order.repairOrderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.machine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.machine.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.companyName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: RepairStatus) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "received": "outline",
      "inspection-pending": "secondary",
      "under-diagnosis": "secondary",
      "waiting-for-parts": "outline",
      "in-repair": "default",
      "outsourced": "secondary",
      "quality-check": "secondary",
      "completed": "default",
      "ready-for-delivery": "default",
      "delivered": "default",
      "closed": "outline",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {STATUS_LABELS[status]}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="mb-1">Repair Orders</h1>
          <p className="text-muted-foreground">Manage all repair orders</p>
        </div>
        <Button onClick={() => navigate("/admin/repair-orders/create")}>
          <Plus className="size-4 mr-2" />
          New Repair Order
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
          <p className="text-2xl font-bold">{repairOrders.length}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">In Progress</p>
          <p className="text-2xl font-bold">
            {repairOrders.filter((ro) => ro.status === "in-repair").length}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Outsourced</p>
          <p className="text-2xl font-bold">
            {repairOrders.filter((ro) => ro.status === "outsourced").length}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Completed</p>
          <p className="text-2xl font-bold">
            {repairOrders.filter((ro) => ro.status === "completed").length}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number, machine, serial, or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Repair Order #</TableHead>
                <TableHead>Machine</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Received Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Loading repair orders...
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-muted-foreground">No repair orders found</p>
                      {repairOrders.length === 0 && (
                        <Button
                          variant="outline"
                          onClick={() => navigate("/admin/repair-orders/create")}
                        >
                          <Plus className="size-4 mr-2" />
                          Create your first repair order
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.repairOrderNumber}
                    </TableCell>
                    <TableCell>{order.machine.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.machine.modelNumber}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.machine.serialNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.customer.companyName}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.customer.contactPerson}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(order.receivedDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.assignment?.technician || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            navigate(`/admin/repair-orders/${order.id}`)
                          }
                          title="View"
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            navigate(`/admin/repair-orders/${order.id}/edit`)
                          }
                          title="Edit"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Print Job Sheet"
                        >
                          <Printer className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(order.id)}
                          title="Delete"
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
      </Card>
    </div>
  );
}
