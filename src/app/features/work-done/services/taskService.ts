import {
  ID,
  Page,
  Pageable,
  Task,
  TaskFilters,
  TaskPriority,
  TaskStatus,
} from "../types";
import { wmGet, wmPatch, wmPost, s } from "./api";

interface BackendTask {
  id: number;
  projectId: number;
  milestoneId: number | null;
  parentTaskId: number | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigneeUserId: number | null;
  reporterUserId: number | null;
  storyPoints: number;
  estimatedHours: number | null;
  dueDate: string | null;
  orderIndex: number;
  completedAt: string | null;
  labels: string[];
  createdAt: string;
  updatedAt: string;
}

function toTask(b: BackendTask): Task {
  return {
    id: s(b.id),
    tenantId: "",
    projectId: s(b.projectId),
    milestoneId: b.milestoneId != null ? s(b.milestoneId) : null,
    parentTaskId: b.parentTaskId != null ? s(b.parentTaskId) : null,
    title: b.title,
    description: b.description ?? undefined,
    status: b.status as TaskStatus,
    priority: b.priority as TaskPriority,
    assigneeId: b.assigneeUserId != null ? s(b.assigneeUserId) : null,
    reporterId: s(b.reporterUserId),
    storyPoints: b.storyPoints,
    labels: b.labels ?? [],
    dueDate: b.dueDate ?? undefined,
    estimatedHours: b.estimatedHours ?? undefined,
    actualHours: 0,
    orderIndex: b.orderIndex,
    completedAt: b.completedAt ?? undefined,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

function toPage(raw: Page<BackendTask>): Page<Task> {
  return { ...raw, content: raw.content.map(toTask) };
}

export async function listTasks(
  filters: TaskFilters = {},
  pageable?: Pageable
): Promise<Page<Task>> {
  const params = new URLSearchParams();
  if (filters.projectId) params.set("projectId", filters.projectId);
  if (filters.milestoneId === "BACKLOG") params.set("backlogOnly", "true");
  else if (filters.milestoneId) params.set("milestoneId", filters.milestoneId);
  if (filters.assigneeIds?.length) params.set("assigneeUserId", filters.assigneeIds[0]);
  if (filters.search) params.set("search", filters.search);
  if (filters.dueBefore) params.set("dueBefore", filters.dueBefore);
  if (filters.dueAfter) params.set("dueAfter", filters.dueAfter);
  if (pageable) {
    params.set("page", String(pageable.page));
    params.set("size", String(pageable.size));
    if (pageable.sort) params.set("sort", pageable.sort);
  }
  const qs = params.toString();
  const raw = await wmGet<Page<BackendTask>>(`/tasks${qs ? `?${qs}` : ""}`);
  return toPage(raw);
}

export async function getTask(id: ID): Promise<Task | null> {
  try {
    const raw = await wmGet<BackendTask>(`/tasks/${id}`);
    return toTask(raw);
  } catch {
    return null;
  }
}

export interface CreateTaskInput {
  projectId: ID;
  milestoneId: ID | null;
  title: string;
  description?: string;
  assigneeId: ID | null;
  storyPoints?: number;
  priority?: TaskPriority;
  labels?: string[];
  dueDate?: string;
  estimatedHours?: number;
}

export async function createTask(input: CreateTaskInput, _actorId: ID): Promise<Task> {
  const raw = await wmPost<BackendTask>("/tasks", {
    projectId: Number(input.projectId),
    milestoneId: input.milestoneId ? Number(input.milestoneId) : null,
    title: input.title,
    description: input.description,
    assigneeUserId: input.assigneeId ? Number(input.assigneeId) : null,
    storyPoints: input.storyPoints,
    priority: input.priority,
    labels: input.labels,
    dueDate: input.dueDate,
    estimatedHours: input.estimatedHours,
  });
  return toTask(raw);
}

export async function changeTaskStatus(id: ID, next: TaskStatus, _actorId: ID): Promise<Task> {
  const raw = await wmPatch<BackendTask>(`/tasks/${id}/status?status=${next}`);
  return toTask(raw);
}

export async function transferTaskOwnership(
  id: ID,
  newAssigneeId: ID,
  _actorId: ID
): Promise<Task> {
  const raw = await wmPatch<BackendTask>(`/tasks/${id}/transfer?assigneeUserId=${newAssigneeId}`);
  return toTask(raw);
}

export async function moveTaskToMilestone(id: ID, milestoneId: ID | null, _actorId: ID): Promise<Task> {
  const raw = await wmPatch<BackendTask>(`/tasks/${id}`, {
    milestoneId: milestoneId ? Number(milestoneId) : null,
  });
  return toTask(raw);
}
