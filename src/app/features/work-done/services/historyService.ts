import { HistoryEntry, HistoryEventType, ID } from "../types";
import { wmGet, s } from "./api";

export interface HistoryFilters {
  projectId?: ID;
  milestoneId?: ID;
  taskId?: ID;
  limit?: number;
}

interface BackendHistory {
  id: number;
  eventType: string;
  actorUserId: number;
  occurredAt: string;
  projectId: number | null;
  milestoneId: number | null;
  taskId: number | null;
  changesJson: string | null;
  message: string | null;
}

function toHistoryEntry(b: BackendHistory): HistoryEntry {
  let changes: { field: string; from: unknown; to: unknown }[] | undefined;
  if (b.changesJson) {
    try { changes = JSON.parse(b.changesJson); } catch { /* ignore */ }
  }
  return {
    id: s(b.id),
    tenantId: "",
    eventType: b.eventType as HistoryEventType,
    actorId: s(b.actorUserId),
    occurredAt: b.occurredAt,
    projectId: b.projectId != null ? s(b.projectId) : undefined,
    milestoneId: b.milestoneId != null ? s(b.milestoneId) : undefined,
    taskId: b.taskId != null ? s(b.taskId) : undefined,
    changes,
    message: b.message ?? undefined,
  };
}

export async function listHistory(filters: HistoryFilters = {}): Promise<HistoryEntry[]> {
  const params = new URLSearchParams();
  if (filters.projectId) params.set("projectId", filters.projectId);
  if (filters.milestoneId) params.set("milestoneId", filters.milestoneId);
  if (filters.taskId) params.set("taskId", filters.taskId);
  params.set("page", "0");
  params.set("size", String(filters.limit ?? 50));
  const raw = await wmGet<{ content: BackendHistory[] }>(`/history?${params}`);
  return raw.content.map(toHistoryEntry);
}
