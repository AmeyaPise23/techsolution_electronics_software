import { HistoryEntry, ID } from "../types";
import { simulateLatency } from "../mock/latency";
import { snapshot } from "../mock/store";

export interface HistoryFilters {
  projectId?: ID;
  milestoneId?: ID;
  taskId?: ID;
  limit?: number;
}

export async function listHistory(filters: HistoryFilters = {}): Promise<HistoryEntry[]> {
  await simulateLatency();
  const items = snapshot().history.filter((h) => {
    if (filters.projectId && h.projectId !== filters.projectId) return false;
    if (filters.milestoneId && h.milestoneId !== filters.milestoneId) return false;
    if (filters.taskId && h.taskId !== filters.taskId) return false;
    return true;
  });
  items.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));
  return filters.limit ? items.slice(0, filters.limit) : items;
}
