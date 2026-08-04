import { HistoryEventType, ID, TimeLog, TimeLogFilters } from "../types";
import { simulateLatency } from "../mock/latency";
import { snapshot, useWorkStore } from "../mock/store";

export async function listTimeLogs(filters: TimeLogFilters): Promise<TimeLog[]> {
  await simulateLatency();
  const { timeLogs } = snapshot();
  return timeLogs
    .filter((l) => {
      if (l.workDate < filters.dateFrom || l.workDate > filters.dateTo) return false;
      if (filters.employeeIds?.length && !filters.employeeIds.includes(l.employeeId)) return false;
      if (filters.projectId && l.projectId !== filters.projectId) return false;
      if (filters.taskId && l.taskId !== filters.taskId) return false;
      return true;
    })
    .sort((a, b) => (a.workDate < b.workDate ? -1 : 1));
}

export interface LogTimeInput {
  employeeId: ID;
  taskId: ID;
  workDate: string;
  durationMinutes: number;
  note?: string;
}

export async function logTime(input: LogTimeInput, actorId: ID): Promise<TimeLog> {
  const now = new Date().toISOString();
  const state = snapshot();
  const task = state.tasks.find((t) => t.id === input.taskId);
  if (!task) throw new Error(`Task ${input.taskId} not found`);
  const log: TimeLog = {
    id: `tl-${Date.now()}`,
    tenantId: "tenant-demo",
    employeeId: input.employeeId,
    taskId: input.taskId,
    projectId: task.projectId,
    workDate: input.workDate,
    durationMinutes: input.durationMinutes,
    note: input.note,
    createdAt: now,
    updatedAt: now,
  };
  useWorkStore.getState().patch((draft) => {
    draft.timeLogs.push(log);
    draft.history.push({
      id: `hst-${Date.now()}`,
      tenantId: "tenant-demo",
      eventType: HistoryEventType.TimeLogged,
      actorId,
      occurredAt: now,
      projectId: task.projectId,
      taskId: task.id,
      message: `${(input.durationMinutes / 60).toFixed(2)}h logged on ${input.workDate}`,
    });
  });
  await simulateLatency();
  return log;
}
