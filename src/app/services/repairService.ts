import { authService } from "./authService";

import { API_BASE_URL } from "../config";

export type RepairStatusApi =
  | "received"
  | "inspection"
  | "waiting_for_customer_approval"
  | "waiting_for_parts"
  | "under_repair"
  | "testing"
  | "quality_check"
  | "ready_for_delivery"
  | "delivered"
  | "completed"
  | "cancelled";

export type RepairPriorityApi = "low" | "normal" | "high" | "urgent";

/**
 * Server-defined bucket over RepairStatus. Kept in sync with
 * backend `com.ecommerce.auth.entity.RepairStatusGroup`.
 * "all" means "no status filter".
 */
export type RepairStatusGroupApi =
  | "all"
  | "pending"
  | "ongoing"
  | "completed"
  | "cancelled";

export type WarrantyStatusApi =
  | "in_warranty"
  | "out_of_warranty"
  | "amc"
  | "not_applicable";

export interface RepairOrderItemRequest {
  productId: string;
  variantId?: string;
  productName?: string;
  hsnSac?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discountPercent?: number;
  taxPercent?: number;
  serialNumber?: string;
  warranty?: string;
  notes?: string;
  sortOrder?: number;
}

export interface RepairOrderAccessoryRequest {
  name: string;
  remarks?: string;
  sortOrder?: number;
}

export interface RepairObservationRequest {
  observationType: string;
  description: string;
}

export interface RepairOrderRequest {
  owningCompany: string;
  customerId: number;
  customerContactId: number;
  deviceName: string;
  deviceManufacturer?: string;
  deviceModelNumber?: string;
  deviceSerialNumber?: string;
  machineCategoryId: number;
  problemDescription: string;
  customerComplaint: string;
  initialInspectionNotes?: string;
  status?: RepairStatusApi;
  priority?: RepairPriorityApi;
  assignedEngineer?: string;
  receivedBy?: string;
  receivedDate: string;
  expectedDeliveryDate?: string;
  warrantyStatus?: WarrantyStatusApi;
  warranty?: string;
  labourCharges?: number;
  outsourcingCost?: number;
  items?: RepairOrderItemRequest[];
  accessories?: RepairOrderAccessoryRequest[];
  observations?: RepairObservationRequest[];
}

export interface RepairOrderResponse {
  id: number;
  repairNumber: string;
  status: string;
  priority: string;
  [key: string]: unknown;
}

export interface RepairOrderSummary {
  id: number;
  repairNumber: string;
  owningCompany: string;
  customerId: number;
  customerName?: string;
  customerCompany?: string;
  contactPersonName?: string;
  deviceName: string;
  deviceModelNumber?: string;
  deviceSerialNumber?: string;
  machineCategoryName?: string;
  status: string;
  priority: string;
  outsourceStatus?: OutsourceStatusApi;
  assignedEngineer?: string;
  receivedDate: string;
  expectedDeliveryDate?: string;
  deliveredDate?: string;
  grandTotal?: number;
  profit?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface RepairOrderStats {
  totalOrders: number;
  activeOrders: number;
  currentlyWithVendor: number;
  statusCounts: Record<string, number>;
  totalRevenue: number;
  totalPartsCost: number;
  totalLabourCharges: number;
  totalOutsourcingCost: number;
  totalProfit: number;
}

export type OutsourceStatusApi =
  | "none"
  | "sent_to_vendor"
  | "returned_from_vendor";

export interface RepairOutsourcingLeg {
  id: number;
  vendorId: number;
  vendorName?: string;
  status: string;
  outsourceDate: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  vendorInvoiceNumber?: string;
  outsourceCost?: number;
  transportCost?: number;
  additionalCharges?: number;
  totalCost?: number;
  remarks?: string;
  returnRemarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SendToVendorRequest {
  vendorId: number;
  outsourceDate: string;
  expectedReturnDate?: string;
  remarks?: string;
}

export interface ReceiveFromVendorRequest {
  actualReturnDate: string;
  vendorInvoiceNumber?: string;
  outsourceCost: number;
  transportCost?: number;
  additionalCharges?: number;
  returnRemarks?: string;
}

export interface RecentActivity {
  id: number;
  repairOrderId: number;
  repairNumber: string;
  customerName?: string;
  deviceName?: string;
  action: string;
  fromStatus?: string;
  toStatus?: string;
  performedBy?: string;
  remarks?: string;
  performedAt: string;
}

export interface RepairOrderDetail {
  id: number;
  repairNumber: string;
  owningCompany: string;
  customerId: number;
  customerName?: string;
  customerCompany?: string;
  customerContact?: {
    id: number;
    name: string;
    mobile?: string;
    email?: string;
    designation?: string;
    isPrimary?: boolean;
  };
  deviceName: string;
  deviceManufacturer?: string;
  deviceModelNumber?: string;
  deviceSerialNumber?: string;
  machineCategoryId?: number;
  machineCategoryName?: string;
  problemDescription?: string;
  customerComplaint?: string;
  initialInspectionNotes?: string;
  status: string;
  priority: string;
  assignedEngineer?: string;
  receivedBy?: string;
  receivedDate: string;
  expectedDeliveryDate?: string;
  repairCompletedDate?: string;
  deliveredDate?: string;
  warrantyStatus?: string;
  warrantyExpiry?: string;
  warranty?: string;
  deliveredTo?: string;
  deliveryMode?: string;
  deliveryRemarks?: string;
  estimatedCost?: number;
  approvedCost?: number;
  customerApproved?: boolean;
  currency?: string;
  labourCharges?: number;
  outsourcingCost?: number;
  partsCost?: number;
  subtotal?: number;
  discountTotal?: number;
  taxableAmount?: number;
  cgstTotal?: number;
  sgstTotal?: number;
  igstTotal?: number;
  totalTax?: number;
  grandTotal?: number;
  totalCost?: number;
  profit?: number;
  items?: Array<{
    id: number;
    productId: string;
    productName: string;
    variantName?: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    discountAmount?: number;
    taxAmount?: number;
    lineTotal: number;
    serialNumber?: string;
    warranty?: string;
    notes?: string;
  }>;
  accessories?: Array<{ id: number; name: string; remarks?: string }>;
  observations?: Array<{
    id: number;
    observationType: string;
    description: string;
    createdBy?: string;
    createdAt: string;
  }>;
  activities?: Array<{
    id: number;
    action: string;
    fromStatus?: string;
    toStatus?: string;
    performedBy?: string;
    remarks?: string;
    performedAt: string;
  }>;
  outsourceStatus?: OutsourceStatusApi;
  outsourcings?: RepairOutsourcingLeg[];
  convertedInvoiceId?: number;
  convertedInvoiceNumber?: string;
  convertedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RepairSearchParams {
  q?: string;
  status?: RepairStatusApi;
  statusGroup?: RepairStatusGroupApi;
  priority?: RepairPriorityApi;
  customerId?: number;
  machineCategoryId?: number;
  assignedEngineer?: string;
  deviceSerialNumber?: string;
  deviceModelNumber?: string;
  productId?: string;
  owningCompany?: string;
  outsourceStatus?: OutsourceStatusApi;
  receivedFrom?: string;
  receivedTo?: string;
  page?: number;
  size?: number;
  sort?: string;
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "Request failed";
    try {
      const body = await response.json();
      message = body.message || body.error || message;
    } catch {}
    throw new Error(message);
  }
  return response.json();
}

export const repairService = {
  async create(data: RepairOrderRequest): Promise<RepairOrderResponse> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/repair-orders`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    return parseJsonResponse<RepairOrderResponse>(response);
  },

  async update(id: number, data: RepairOrderRequest): Promise<RepairOrderResponse> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/repair-orders/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    return parseJsonResponse<RepairOrderResponse>(response);
  },

  async get(id: number): Promise<RepairOrderDetail> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/repair-orders/${id}`
    );
    return parseJsonResponse<RepairOrderDetail>(response);
  },

  async sendToVendor(
    id: number,
    payload: SendToVendorRequest
  ): Promise<RepairOrderDetail> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/repair-orders/${id}/outsourcings`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    return parseJsonResponse<RepairOrderDetail>(response);
  },

  async receiveFromVendor(
    id: number,
    legId: number,
    payload: ReceiveFromVendorRequest
  ): Promise<RepairOrderDetail> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/repair-orders/${id}/outsourcings/${legId}/receive`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    return parseJsonResponse<RepairOrderDetail>(response);
  },

  async convertToInvoice(id: number): Promise<RepairOrderDetail> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/repair-orders/${id}/convert-to-invoice`,
      { method: "POST" }
    );
    return parseJsonResponse<RepairOrderDetail>(response);
  },

  async getStats(): Promise<RepairOrderStats> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/repair-orders/stats`
    );
    return parseJsonResponse<RepairOrderStats>(response);
  },

  async getRecentActivities(limit = 20): Promise<RecentActivity[]> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/repair-orders/activities/recent?limit=${limit}`
    );
    return parseJsonResponse<RecentActivity[]>(response);
  },

  async search(params: RepairSearchParams = {}): Promise<Page<RepairOrderSummary>> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    });
    if (!qs.has("page")) qs.set("page", "0");
    if (!qs.has("size")) qs.set("size", "20");
    if (!qs.has("sort")) qs.set("sort", "createdAt,desc");
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/repair-orders?${qs.toString()}`
    );
    return parseJsonResponse<Page<RepairOrderSummary>>(response);
  },

  async updateStatus(
    id: number,
    status: RepairStatusApi,
    remarks?: string
  ): Promise<RepairOrderResponse> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/repair-orders/${id}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, remarks }),
      }
    );
    return parseJsonResponse<RepairOrderResponse>(response);
  },

  async addObservation(
    id: number,
    observationType: string,
    description: string
  ): Promise<unknown> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/repair-orders/${id}/observations`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ observationType, description }),
      }
    );
    return parseJsonResponse<unknown>(response);
  },

  async softDelete(id: number): Promise<void> {
    const response = await authService.authenticatedFetch(
      `${API_BASE_URL}/repair-orders/${id}`,
      { method: "DELETE" }
    );
    if (!response.ok) {
      let message = "Failed to delete repair order";
      try {
        const body = await response.json();
        message = body.message || message;
      } catch {}
      throw new Error(message);
    }
  },
};
