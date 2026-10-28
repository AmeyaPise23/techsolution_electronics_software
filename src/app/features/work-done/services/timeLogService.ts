import { ID, TimeLog, TimeLogFilters } from "../types";
import { wmGet, wmPost, s } from "./api";

interface BackendTimeLog {
  id: number;
  employeeUserId: number;
  taskId: number;
  projectId: number;
  workDate: string;
  durationMinutes: number;
  note: string | null;
  createdAt: string;
}

function toTimeLog(b: BackendTimeLog): TimeLog {
  return {
    id: s(b.id),
    tenantId: "",
    employeeId: s(b.employeeUserId),
    taskId: s(b.taskId),
    projectId: s(b.projectId),
    workDate: b.workDate,
    durationMinutes: b.durationMinutes,
    note: b.note ?? undefined,
    createdAt: b.createdAt,
    updatedAt: b.createdAt,
  };
}

export async function listTimeLogs(filters: TimeLogFilters): Promise<TimeLog[]> {
  const params = new URLSearchParams();
  params.set("dateFrom", filters.dateFrom);
  params.set("dateTo", filters.dateTo);
  if (filters.projectId) params.set("projectId", filters.projectId);
  if (filters.taskId) params.set("taskId", filters.taskId);
  if (filters.employeeIds?.length) params.set("employeeUserId", filters.employeeIds[0]);
  const raw = await wmGet<BackendTimeLog[]>(`/time-logs?${params}`);
  return raw.map(toTimeLog).sort((a, b) => (a.workDate < b.workDate ? -1 : 1));
}

export interface LogTimeInput {
  employeeId: ID;
  taskId: ID;
  workDate: string;
  durationMinutes: number;
  note?: string;
}

export async function logTime(input: LogTimeInput, _actorId: ID): Promise<TimeLog> {
  const raw = await wmPost<BackendTimeLog>("/time-logs", {
    taskId: Number(input.taskId),
    projectId: null,
    workDate: input.workDate,
    durationMinutes: input.durationMinutes,
    note: input.note,
  });
  return toTimeLog(raw);
}
