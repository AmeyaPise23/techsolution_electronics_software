// Repair Order Service - API integration layer
// TODO: Replace with actual backend API calls

const API_BASE_URL = "https://your-backend-api.com/api";

// ==================== INTERFACES ====================

export type RepairStatus =
  | "received"
  | "inspection-pending"
  | "under-diagnosis"
  | "waiting-for-parts"
  | "in-repair"
  | "outsourced"
  | "quality-check"
  | "completed"
  | "ready-for-delivery"
  | "delivered"
  | "closed";

export interface RepairOrder {
  id: string;
  repairOrderNumber: string;

  // Customer Information
  customer: {
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
  };

  // Machine Information
  machine: {
    name: string;
    manufacturer: string;
    modelNumber: string;
    serialNumber: string;
    category: string;
  };

  // Service Information
  service: {
    problemDescription: string;
    customerComplaint: string;
    accessoriesReceived: string[];
    initialInspectionNotes: string;
  };

  // Status & Timeline
  status: RepairStatus;
  receivedDate: string;
  createdBy: string;

  // Technician Assignment
  assignment?: {
    engineer: string;
    technician: string;
    assignedDate: string;
    workNotes: string;
    repairSummary: string;
    timeSpent: number; // hours
  };

  // Outsourced Details
  outsourcing?: {
    vendorName: string;
    vendorContact: string;
    serviceType: string;
    outsourceDate: string;
    expectedReturnDate: string;
    actualReturnDate?: string;
    cost: number;
    invoiceNumber: string;
    invoiceDate: string;
    paymentStatus: "pending" | "paid";
  };

  // Parts Used
  partsUsed: {
    partName: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }[];

  // Financial
  financial: {
    repairRevenue: number;
    outsourcingCost: number;
    partsCost: number;
    labourCost: number;
    totalCost: number;
    profit: number;
  };

  // Delivery
  delivery?: {
    deliveryDate: string;
    deliveredBy: string;
    receivedByCustomer: string;
    customerSignature?: string;
    deliveryNotes: string;
  };

  // History
  statusHistory: {
    status: RepairStatus;
    date: string;
    updatedBy: string;
    notes: string;
  }[];

  // Previous repairs for this machine (by serial number)
  machineHistory?: RepairOrder[];
}

export interface RepairDashboardStats {
  totalRepairOrders: number;
  pendingRepairs: number;
  inProgressRepairs: number;
  outsourcedRepairs: number;
  completedRepairs: number;
  deliveredRepairs: number;
  totalRepairRevenue: number;
  totalOutsourcingCost: number;
  repairProfit: number;

  // Charts data
  repairsByMonth: { month: string; count: number }[];
  repairsByStatus: { status: string; count: number }[];
  vendorDistribution: { vendor: string; cost: number }[];
}

// ==================== MOCK DATA ====================

const mockRepairOrders: RepairOrder[] = [
  {
    id: "1",
    repairOrderNumber: "RO-2026-001",
    customer: {
      companyName: "Industrial Solutions Ltd.",
      contactPerson: "John Smith",
      email: "john@industrial.com",
      phone: "+1-555-0101",
      address: "123 Industrial Park, Manufacturing District",
    },
    machine: {
      name: "CNC Milling Machine",
      manufacturer: "Haas Automation",
      modelNumber: "VF-2SS",
      serialNumber: "SN-CNC-12345",
      category: "CNC Machines",
    },
    service: {
      problemDescription: "Spindle not rotating at correct RPM",
      customerComplaint: "Machine producing parts out of tolerance",
      accessoriesReceived: ["Tool holders", "Chuck keys", "Manual"],
      initialInspectionNotes: "Visible wear on spindle bearings, unusual noise detected",
    },
    status: "in-repair",
    receivedDate: "2026-05-15",
    createdBy: "Admin User",
    assignment: {
      engineer: "Mike Johnson",
      technician: "Robert Chen",
      assignedDate: "2026-05-16",
      workNotes: "Replaced spindle bearings, recalibrated RPM sensor",
      repairSummary: "Spindle bearing replacement and calibration",
      timeSpent: 8,
    },
    partsUsed: [
      {
        partName: "Spindle Bearing Set",
        quantity: 1,
        unitCost: 450,
        totalCost: 450,
      },
      {
        partName: "RPM Sensor",
        quantity: 1,
        unitCost: 120,
        totalCost: 120,
      },
    ],
    financial: {
      repairRevenue: 2500,
      outsourcingCost: 0,
      partsCost: 570,
      labourCost: 800,
      totalCost: 1370,
      profit: 1130,
    },
    statusHistory: [
      {
        status: "received",
        date: "2026-05-15T09:00:00",
        updatedBy: "Admin User",
        notes: "Machine received from customer",
      },
      {
        status: "inspection-pending",
        date: "2026-05-15T10:30:00",
        updatedBy: "Admin User",
        notes: "Assigned for initial inspection",
      },
      {
        status: "under-diagnosis",
        date: "2026-05-16T08:00:00",
        updatedBy: "Mike Johnson",
        notes: "Diagnosed spindle bearing issue",
      },
      {
        status: "waiting-for-parts",
        date: "2026-05-16T14:00:00",
        updatedBy: "Mike Johnson",
        notes: "Ordered replacement bearings",
      },
      {
        status: "in-repair",
        date: "2026-05-18T09:00:00",
        updatedBy: "Robert Chen",
        notes: "Started spindle bearing replacement",
      },
    ],
  },
  {
    id: "2",
    repairOrderNumber: "RO-2026-002",
    customer: {
      companyName: "Tech Manufacturing Inc.",
      contactPerson: "Sarah Williams",
      email: "sarah@techmanuf.com",
      phone: "+1-555-0102",
      address: "456 Tech Avenue, Innovation City",
    },
    machine: {
      name: "PCB Assembly Robot",
      manufacturer: "Universal Robots",
      modelNumber: "UR10e",
      serialNumber: "SN-UR-67890",
      category: "Robotics",
    },
    service: {
      problemDescription: "Gripper malfunction, not picking components correctly",
      customerComplaint: "High reject rate on assembly line",
      accessoriesReceived: ["Gripper attachments", "Power cable", "Software USB"],
      initialInspectionNotes: "Gripper sensor calibration issue",
    },
    status: "outsourced",
    receivedDate: "2026-05-20",
    createdBy: "Admin User",
    outsourcing: {
      vendorName: "RoboTech Services",
      vendorContact: "support@robotech.com",
      serviceType: "Gripper Replacement & Calibration",
      outsourceDate: "2026-05-21",
      expectedReturnDate: "2026-05-28",
      cost: 1500,
      invoiceNumber: "RT-INV-445",
      invoiceDate: "2026-05-21",
      paymentStatus: "pending",
    },
    partsUsed: [],
    financial: {
      repairRevenue: 3200,
      outsourcingCost: 1500,
      partsCost: 0,
      labourCost: 400,
      totalCost: 1900,
      profit: 1300,
    },
    statusHistory: [
      {
        status: "received",
        date: "2026-05-20T10:00:00",
        updatedBy: "Admin User",
        notes: "Robot received for gripper repair",
      },
      {
        status: "inspection-pending",
        date: "2026-05-20T11:00:00",
        updatedBy: "Admin User",
        notes: "Scheduled for inspection",
      },
      {
        status: "under-diagnosis",
        date: "2026-05-21T09:00:00",
        updatedBy: "Mike Johnson",
        notes: "Requires specialized gripper repair",
      },
      {
        status: "outsourced",
        date: "2026-05-21T14:00:00",
        updatedBy: "Admin User",
        notes: "Sent to RoboTech Services for gripper replacement",
      },
    ],
  },
  {
    id: "3",
    repairOrderNumber: "RO-2026-003",
    customer: {
      companyName: "AutoParts Manufacturing",
      contactPerson: "David Lee",
      email: "david@autoparts.com",
      phone: "+1-555-0103",
      address: "789 Auto Drive, Production Zone",
    },
    machine: {
      name: "Hydraulic Press",
      manufacturer: "Schuler",
      modelNumber: "HP-500",
      serialNumber: "SN-HP-11223",
      category: "Presses",
    },
    service: {
      problemDescription: "Hydraulic pump leaking, pressure inconsistent",
      customerComplaint: "Cannot maintain required pressure for stamping",
      accessoriesReceived: ["Hydraulic fluid samples", "Pressure gauge"],
      initialInspectionNotes: "Seal failure in main hydraulic pump",
    },
    status: "completed",
    receivedDate: "2026-05-10",
    createdBy: "Admin User",
    assignment: {
      engineer: "Mike Johnson",
      technician: "Carlos Rodriguez",
      assignedDate: "2026-05-11",
      workNotes: "Replaced hydraulic seals, flushed system, pressure tested",
      repairSummary: "Complete hydraulic system overhaul",
      timeSpent: 12,
    },
    partsUsed: [
      {
        partName: "Hydraulic Seal Kit",
        quantity: 2,
        unitCost: 280,
        totalCost: 560,
      },
      {
        partName: "Hydraulic Fluid",
        quantity: 20,
        unitCost: 15,
        totalCost: 300,
      },
      {
        partName: "Filter Cartridge",
        quantity: 1,
        unitCost: 85,
        totalCost: 85,
      },
    ],
    financial: {
      repairRevenue: 4500,
      outsourcingCost: 0,
      partsCost: 945,
      labourCost: 1200,
      totalCost: 2145,
      profit: 2355,
    },
    statusHistory: [
      {
        status: "received",
        date: "2026-05-10T08:00:00",
        updatedBy: "Admin User",
        notes: "Hydraulic press received",
      },
      {
        status: "under-diagnosis",
        date: "2026-05-11T09:00:00",
        updatedBy: "Mike Johnson",
        notes: "Diagnosed seal failure",
      },
      {
        status: "waiting-for-parts",
        date: "2026-05-11T15:00:00",
        updatedBy: "Mike Johnson",
        notes: "Ordered hydraulic seal kit",
      },
      {
        status: "in-repair",
        date: "2026-05-13T08:00:00",
        updatedBy: "Carlos Rodriguez",
        notes: "Started hydraulic system repair",
      },
      {
        status: "quality-check",
        date: "2026-05-14T16:00:00",
        updatedBy: "Mike Johnson",
        notes: "Pressure testing in progress",
      },
      {
        status: "completed",
        date: "2026-05-15T10:00:00",
        updatedBy: "Mike Johnson",
        notes: "Repair completed, all tests passed",
      },
    ],
  },
];

const mockDashboardStats: RepairDashboardStats = {
  totalRepairOrders: 48,
  pendingRepairs: 8,
  inProgressRepairs: 12,
  outsourcedRepairs: 5,
  completedRepairs: 18,
  deliveredRepairs: 15,
  totalRepairRevenue: 145000,
  totalOutsourcingCost: 28000,
  repairProfit: 87000,

  repairsByMonth: [
    { month: "Jan", count: 6 },
    { month: "Feb", count: 8 },
    { month: "Mar", count: 7 },
    { month: "Apr", count: 9 },
    { month: "May", count: 11 },
    { month: "Jun", count: 7 },
  ],

  repairsByStatus: [
    { status: "Pending", count: 8 },
    { status: "In Progress", count: 12 },
    { status: "Outsourced", count: 5 },
    { status: "Completed", count: 18 },
    { status: "Delivered", count: 15 },
  ],

  vendorDistribution: [
    { vendor: "RoboTech Services", cost: 12000 },
    { vendor: "Precision Calibration", cost: 8500 },
    { vendor: "Electronics Repair Co", cost: 5200 },
    { vendor: "Hydraulic Specialists", cost: 2300 },
  ],
};

// ==================== SERVICE ====================

export const repairOrderService = {
  // Dashboard Stats
  async getDashboardStats(): Promise<RepairDashboardStats> {
    // TODO: const response = await fetch(`${API_BASE_URL}/repair-orders/stats`);
    // TODO: return response.json();
    return mockDashboardStats;
  },

  // Get all repair orders
  async getAllRepairOrders(): Promise<RepairOrder[]> {
    // TODO: const response = await fetch(`${API_BASE_URL}/repair-orders`);
    // TODO: return response.json();
    return mockRepairOrders;
  },

  // Get single repair order
  async getRepairOrderById(id: string): Promise<RepairOrder | null> {
    // TODO: const response = await fetch(`${API_BASE_URL}/repair-orders/${id}`);
    // TODO: return response.json();
    return mockRepairOrders.find((ro) => ro.id === id) || null;
  },

  // Create repair order
  async createRepairOrder(data: Omit<RepairOrder, "id" | "repairOrderNumber" | "statusHistory">): Promise<RepairOrder> {
    // TODO: const response = await fetch(`${API_BASE_URL}/repair-orders`, {...});
    // TODO: return response.json();
    const newOrder: RepairOrder = {
      ...data,
      id: Date.now().toString(),
      repairOrderNumber: `RO-2026-${String(Date.now()).slice(-4)}`,
      statusHistory: [
        {
          status: data.status,
          date: new Date().toISOString(),
          updatedBy: data.createdBy,
          notes: "Repair order created",
        },
      ],
    };
    console.log("Create repair order:", newOrder);
    return newOrder;
  },

  // Update repair order
  async updateRepairOrder(id: string, data: Partial<RepairOrder>): Promise<RepairOrder> {
    // TODO: const response = await fetch(`${API_BASE_URL}/repair-orders/${id}`, {...});
    // TODO: return response.json();
    console.log("Update repair order:", id, data);
    return { ...mockRepairOrders[0], ...data, id };
  },

  // Update status
  async updateStatus(
    id: string,
    status: RepairStatus,
    notes: string,
    updatedBy: string
  ): Promise<RepairOrder> {
    // TODO: const response = await fetch(`${API_BASE_URL}/repair-orders/${id}/status`, {...});
    // TODO: return response.json();
    console.log("Update status:", id, status, notes, updatedBy);
    const order = mockRepairOrders.find((ro) => ro.id === id);
    if (order) {
      order.status = status;
      order.statusHistory.push({
        status,
        date: new Date().toISOString(),
        updatedBy,
        notes,
      });
    }
    return order || mockRepairOrders[0];
  },

  // Delete repair order
  async deleteRepairOrder(id: string): Promise<void> {
    // TODO: await fetch(`${API_BASE_URL}/repair-orders/${id}`, { method: 'DELETE' });
    console.log("Delete repair order:", id);
  },

  // Get machine history by serial number
  async getMachineHistory(serialNumber: string): Promise<RepairOrder[]> {
    // TODO: const response = await fetch(`${API_BASE_URL}/repair-orders/machine/${serialNumber}`);
    // TODO: return response.json();
    return mockRepairOrders.filter(
      (ro) => ro.machine.serialNumber === serialNumber
    );
  },
};
