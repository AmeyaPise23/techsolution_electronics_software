import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  repairService,
  RepairOrderSummary,
  RepairStatusApi,
} from "../services/repairService";
import { Plus, Search, Eye, Pencil, Trash2, Truck } from "lucide-react";
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

const STATUS_LABELS: Record<RepairStatusApi, string> = {
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
  RepairStatusApi,
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

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

const PAGE_SIZE = 20;

export function RepairOrdersList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [orders, setOrders] = useState<RepairOrderSummary[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get("status") || "all"
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await repairService.search({
        q: searchQuery.trim() || undefined,
        status:
          statusFilter !== "all"
            ? (statusFilter as RepairStatusApi)
            : undefined,
        page,
        size: PAGE_SIZE,
        sort: "createdAt,desc",
      });
      setOrders(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to load repair orders"
      );
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => setPage(0), 300);
    return () => clearTimeout(t);
  }, [searchQuery, statusFilter]);

  const handleDelete = async (id: number, repairNumber: string) => {
    if (
      !confirm(`Delete repair order ${repairNumber}? This can be undone by an admin.`)
    )
      return;
    try {
      await repairService.softDelete(id);
      toast.success(`Repair order ${repairNumber} deleted`);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const statusOf = (s: string) =>
    (STATUS_LABELS as Record<string, string>)[s] || s;

  const badgeFor = (status: string) => (
    <Badge
      variant={
        (STATUS_VARIANTS as Record<string, "default" | "secondary" | "destructive" | "outline">)[
          status
        ] || "outline"
      }
    >
      {statusOf(status)}
    </Badge>
  );

  const countByStatus = (s: RepairStatusApi) =>
    orders.filter((o) => o.status === s).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="mb-1">Repair Orders</h1>
          <p className="text-muted-foreground">
            Manage all repair orders — {totalElements} total
          </p>
        </div>
        <Button onClick={() => navigate("/admin/repair-orders/create")}>
          <Plus className="size-4 mr-2" />
          New Repair Order
        </Button>
      </div>

      {/* Stats (current page) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Total (server)</p>
          <p className="text-2xl font-bold">{totalElements}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Under Repair</p>
          <p className="text-2xl font-bold">{countByStatus("under_repair")}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">
            Ready for Delivery
          </p>
          <p className="text-2xl font-bold">
            {countByStatus("ready_for_delivery")}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Completed</p>
          <p className="text-2xl font-bold">{countByStatus("completed")}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number, device, serial, model, customer, engineer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {(Object.keys(STATUS_LABELS) as RepairStatusApi[]).map((k) => (
              <SelectItem key={k} value={k}>
                {STATUS_LABELS[k]}
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
                <TableHead>Repair Number</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Serial</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Engineer</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    Loading repair orders...
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-muted-foreground">
                        No repair orders found
                      </p>
                      <Button
                        variant="outline"
                        onClick={() =>
                          navigate("/admin/repair-orders/create")
                        }
                      >
                        <Plus className="size-4 mr-2" />
                        Create a repair order
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.repairNumber}
                    </TableCell>
                    <TableCell>{order.deviceName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.deviceModelNumber || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.deviceSerialNumber || "-"}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {order.customerCompany ||
                            order.customerName ||
                            `#${order.customerId}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.contactPersonName || "-"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.receivedDate
                        ? new Date(order.receivedDate).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 flex-wrap">
                        {badgeFor(order.status)}
                        {order.outsourceStatus === "sent_to_vendor" && (
                          <Badge className="bg-amber-500 hover:bg-amber-500 text-white">
                            <Truck className="size-3 mr-1" /> Vendor
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {PRIORITY_LABELS[order.priority] || order.priority}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.assignedEngineer || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
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
                          onClick={() =>
                            handleDelete(order.id, order.repairNumber)
                          }
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
