import type {
  RepairStatusApi,
  RepairStatusGroupApi,
  RepairOrderStats,
} from "../../services/repairService";

/**
 * A repair-orders "view" scopes the shared list page to a subset of orders
 * (e.g. Pending, Ongoing). Everything that differs between the sidebar
 * entries — title, subtitle, the API status-group filter, the stat cards — is
 * declared here. The shared <RepairOrdersView> reads this config.
 *
 * The status membership itself lives on the backend (RepairStatusGroup enum);
 * `statusMembers` here mirrors it so stat cards can aggregate the /stats
 * response client-side without an extra round-trip.
 */
export type RepairViewKey =
  | "all"
  | "pending"
  | "ongoing"
  | "completed"
  | "cancelled";

export interface StatCardConfig {
  key: string;
  label: string;
  /** Icon name is looked up in <RepairOrdersView> to keep this file logic-only. */
  icon:
    | "receipt"
    | "calendar"
    | "clock"
    | "alert"
    | "wrench"
    | "truck"
    | "check"
    | "x";
  tint: string;
  /**
   * Compute the number to display. Passed the totalElements for the current
   * search (already filtered to this view's group) and global statusCounts
   * from the /stats endpoint (broken down by individual RepairStatus).
   */
  compute: (ctx: {
    totalElements: number;
    statusCounts: Record<string, number>;
  }) => number;
}

export interface RepairViewConfig {
  key: RepairViewKey;
  title: string;
  subtitle: string;
  /**
   * Server-defined bucket sent as ?statusGroup=<value>. "all" means no filter.
   */
  group: RepairStatusGroupApi;
  /**
   * The individual statuses this group covers. Mirrors the backend
   * RepairStatusGroup enum — used for client-side stat aggregation only.
   */
  statusMembers: RepairStatusApi[];
  stats: StatCardConfig[];
}

const sumOf = (counts: Record<string, number>, keys: RepairStatusApi[]) =>
  keys.reduce((n, k) => n + (counts[k] || 0), 0);

const ALL_STATUSES: RepairStatusApi[] = [
  "received",
  "inspection",
  "waiting_for_customer_approval",
  "waiting_for_parts",
  "under_repair",
  "testing",
  "quality_check",
  "ready_for_delivery",
  "delivered",
  "completed",
  "cancelled",
];

// Mirror of backend RepairStatusGroup — keep in sync.
const PENDING_STATUSES: RepairStatusApi[] = [
  "received",
  "inspection",
  "waiting_for_parts",
];

const ONGOING_STATUSES: RepairStatusApi[] = [
  "under_repair",
  "testing",
  "quality_check",
  "ready_for_delivery",
];

const COMPLETED_STATUSES: RepairStatusApi[] = ["delivered", "completed"];

export const REPAIR_VIEWS: Record<RepairViewKey, RepairViewConfig> = {
  all: {
    key: "all",
    title: "All Orders",
    subtitle: "Every repair order across all statuses.",
    group: "all",
    statusMembers: ALL_STATUSES,
    stats: [
      {
        key: "total",
        label: "Total Orders",
        icon: "receipt",
        tint: "bg-orange-100 text-orange-600",
        compute: ({ totalElements }) => totalElements,
      },
      {
        key: "ongoing",
        label: "Ongoing",
        icon: "wrench",
        tint: "bg-blue-100 text-blue-600",
        compute: ({ statusCounts }) => sumOf(statusCounts, ONGOING_STATUSES),
      },
      {
        key: "pending",
        label: "Pending",
        icon: "clock",
        tint: "bg-amber-100 text-amber-600",
        compute: ({ statusCounts }) => sumOf(statusCounts, PENDING_STATUSES),
      },
      {
        key: "completed",
        label: "Completed",
        icon: "check",
        tint: "bg-emerald-100 text-emerald-600",
        compute: ({ statusCounts }) => sumOf(statusCounts, COMPLETED_STATUSES),
      },
    ],
  },
  pending: {
    key: "pending",
    title: "Pending Orders",
    subtitle: "Orders received, in inspection, or waiting for parts.",
    group: "pending",
    statusMembers: PENDING_STATUSES,
    stats: [
      {
        key: "totalPending",
        label: "Total Pending",
        icon: "receipt",
        tint: "bg-orange-100 text-orange-600",
        compute: ({ totalElements }) => totalElements,
      },
      {
        key: "received",
        label: "Received",
        icon: "clock",
        tint: "bg-amber-100 text-amber-600",
        compute: ({ statusCounts }) => statusCounts.received || 0,
      },
      {
        key: "inspection",
        label: "In Inspection",
        icon: "alert",
        tint: "bg-indigo-100 text-indigo-600",
        compute: ({ statusCounts }) => statusCounts.inspection || 0,
      },
      {
        key: "waitingParts",
        label: "Waiting for Parts",
        icon: "calendar",
        tint: "bg-violet-100 text-violet-600",
        compute: ({ statusCounts }) => statusCounts.waiting_for_parts || 0,
      },
    ],
  },
  ongoing: {
    key: "ongoing",
    title: "Ongoing Orders",
    subtitle:
      "Orders currently in repair, testing, QC, or ready for delivery.",
    group: "ongoing",
    statusMembers: ONGOING_STATUSES,
    stats: [
      {
        key: "totalOngoing",
        label: "Total Ongoing",
        icon: "wrench",
        tint: "bg-blue-100 text-blue-600",
        compute: ({ totalElements }) => totalElements,
      },
      {
        key: "underRepair",
        label: "Under Repair",
        icon: "wrench",
        tint: "bg-amber-100 text-amber-600",
        compute: ({ statusCounts }) => statusCounts.under_repair || 0,
      },
      {
        key: "testing",
        label: "Testing / QC",
        icon: "check",
        tint: "bg-indigo-100 text-indigo-600",
        compute: ({ statusCounts }) =>
          (statusCounts.testing || 0) + (statusCounts.quality_check || 0),
      },
      {
        key: "readyForDelivery",
        label: "Ready for Delivery",
        icon: "truck",
        tint: "bg-emerald-100 text-emerald-600",
        compute: ({ statusCounts }) => statusCounts.ready_for_delivery || 0,
      },
    ],
  },
  completed: {
    key: "completed",
    title: "Completed Orders",
    subtitle: "Delivered or fully closed repairs.",
    group: "completed",
    statusMembers: COMPLETED_STATUSES,
    stats: [
      {
        key: "totalCompleted",
        label: "Total Completed",
        icon: "check",
        tint: "bg-emerald-100 text-emerald-600",
        compute: ({ totalElements }) => totalElements,
      },
      {
        key: "delivered",
        label: "Delivered",
        icon: "truck",
        tint: "bg-blue-100 text-blue-600",
        compute: ({ statusCounts }) => statusCounts.delivered || 0,
      },
      {
        key: "closed",
        label: "Closed",
        icon: "check",
        tint: "bg-indigo-100 text-indigo-600",
        compute: ({ statusCounts }) => statusCounts.completed || 0,
      },
    ],
  },
  cancelled: {
    key: "cancelled",
    title: "Cancelled Orders",
    subtitle: "Repairs that were withdrawn or rejected.",
    group: "cancelled",
    statusMembers: ["cancelled"],
    stats: [
      {
        key: "totalCancelled",
        label: "Total Cancelled",
        icon: "x",
        tint: "bg-red-100 text-red-600",
        compute: ({ totalElements }) => totalElements,
      },
    ],
  },
};

export function getRepairView(key: string | null | undefined): RepairViewConfig {
  const k = (key || "all") as RepairViewKey;
  return REPAIR_VIEWS[k] ?? REPAIR_VIEWS.all;
}

/** Given a legacy ?status=X, infer which view it maps to. */
export function viewKeyForStatus(status: string | null | undefined): RepairViewKey {
  if (!status) return "all";
  for (const view of Object.values(REPAIR_VIEWS)) {
    if (view.statusMembers.includes(status as RepairStatusApi)) return view.key;
  }
  return "all";
}

export type { RepairOrderStats };
