import {
  HistoryEventType,
  ID,
  Page,
  Pageable,
  Task,
  TaskFilters,
  TaskPriority,
  TaskStatus,
} from "../types";
import { simulateLatency } from "../mock/latency";
import { snapshot, useWorkStore } from "../mock/store";
import { paginate } from "./pagination";

// Task.actualHours is derived from time logs — recomputed on every read so it
// stays in sync with the TimeLog table without a mutation surface.
function withDerivedActualHours(task: Task): Task {
  const logs = snapshot().timeLogs.filter((l) => l.taskId === task.id);
  const minutes = logs.reduce((s, l) => s + l.durationMinutes, 0);
  return { ...task, actualHours: Math.round((minutes / 60) * 100) / 100 };
}

function matches(task: Task, filters: TaskFilters): boolean {
  if (filters.projectId && task.projectId !== filters.projectId) return false;
  if (filters.milestoneId === "BACKLOG") {
    if (task.milestoneId !== null) return false;
  } else if (filters.milestoneId && task.milestoneId !== filters.milestoneId) return false;
  if (filters.assigneeIds?.length && (!task.assigneeId || !filters.assigneeIds.includes(task.assigneeId))) return false;
  if (filters.statuses?.length && !filters.statuses.includes(task.status)) return false;
  if (filters.priorities?.length && !filters.priorities.includes(task.priority)) return false;
  if (filters.labels?.length && !filters.labels.some((l) => task.labels.includes(l))) return false;
  if (filters.dueBefore && (!task.dueDate || task.dueDate > filters.dueBefore)) return false;
  if (filters.dueAfter && (!task.dueDate || task.dueDate < filters.dueAfter)) return false;
  if (filters.search) {
    const q = filters.search.toLowerCase();
    if (!task.title.toLowerCase().includes(q)) return false;
  }
  return true;
}

export async function listTasks(
  filters: TaskFilters = {},
  pageable?: Pageable
): Promise<Page<Task>> {
  await simulateLatency();
  const filtered = snapshot()
    .tasks.filter((t) => matches(t, filters))
    .map(withDerivedActualHours);
  return paginate(filtered, pageable);
}

export async function getTask(id: ID): Promise<Task | null> {
  await simulateLatency();
  const t = snapshot().tasks.find((t) => t.id === id);
  return t ? withDerivedActualHours(t) : null;
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

export async function createTask(input: CreateTaskInput, actorId: ID): Promise<Task> {
  const now = new Date().toISOString();
  const state = snapshot();
  const orderIndex = state.tasks.filter(
    (t) => t.projectId === input.projectId && t.milestoneId === input.milestoneId
  ).length;
  const task: Task = {
    id: `tsk-${Date.now()}`,
    tenantId: "tenant-demo",
    projectId: input.projectId,
    milestoneId: input.milestoneId,
    parentTaskId: null,
    title: input.title,
    description: input.description,
    status: input.milestoneId === null ? TaskStatus.Backlog : TaskStatus.Todo,
    priority: input.priority ?? TaskPriority.Medium,
    assigneeId: input.assigneeId,
    reporterId: actorId,
    storyPoints: input.storyPoints ?? 0,
    labels: input.labels ?? [],
    dueDate: input.dueDate,
    estimatedHours: input.estimatedHours,
    actualHours: 0,
    orderIndex,
    createdAt: now,
    updatedAt: now,
  };
  useWorkStore.getState().patch((draft) => {
    draft.tasks.push(task);
    draft.history.push({
      id: `hst-${Date.now()}`,
      tenantId: "tenant-demo",
      eventType: HistoryEventType.TaskCreated,
      actorId,
      occurredAt: now,
      projectId: task.projectId,
      taskId: task.id,
      message: `Task “${task.title}” created`,
    });
  });
  await simulateLatency();
  return task;
}

export async function changeTaskStatus(id: ID, next: TaskStatus, actorId: ID): Promise<Task> {
  const now = new Date().toISOString();
  let updated: Task | null = null;
  useWorkStore.getState().patch((draft) => {
    const idx = draft.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const prev = draft.tasks[idx];
    if (prev.status === next) {
      updated = prev;
      return;
    }
    const completedAt =
      next === TaskStatus.Done ? now : prev.status === TaskStatus.Done ? undefined : prev.completedAt;
    draft.tasks[idx] = { ...prev, status: next, completedAt, updatedAt: now };
    updated = draft.tasks[idx];
    draft.history.push({
      id: `hst-${Date.now()}`,
      tenantId: "tenant-demo",
      eventType: HistoryEventType.TaskStatusChanged,
      actorId,
      occurredAt: now,
      projectId: prev.projectId,
      taskId: prev.id,
      changes: [{ field: "status", from: prev.status, to: next }],
    });
    // Credit story points when transitioning INTO Done from a non-Done state.
    if (next === TaskStatus.Done && prev.status !== TaskStatus.Done && prev.assigneeId) {
      draft.storyPointLedger.push({
        id: `spl-${Date.now()}`,
        tenantId: "tenant-demo",
        employeeId: prev.assigneeId,
        taskId: prev.id,
        projectId: prev.projectId,
        points: prev.storyPoints,
        creditedAt: now,
        reason: "TASK_COMPLETED",
      });
      draft.history.push({
        id: `hst-${Date.now()}-spl`,
        tenantId: "tenant-demo",
        eventType: HistoryEventType.StoryPointsCredited,
        actorId,
        occurredAt: now,
        projectId: prev.projectId,
        taskId: prev.id,
        message: `${prev.storyPoints} points credited to ${prev.assigneeId}`,
      });
    }
  });
  if (!updated) throw new Error(`Task ${id} not found`);
  await simulateLatency();
  return updated;
}

export async function transferTaskOwnership(
  id: ID,
  newAssigneeId: ID,
  actorId: ID
): Promise<Task> {
  const now = new Date().toISOString();
  let updated: Task | null = null;
  useWorkStore.getState().patch((draft) => {
    const idx = draft.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const prev = draft.tasks[idx];
    draft.tasks[idx] = { ...prev, assigneeId: newAssigneeId, updatedAt: now };
    updated = draft.tasks[idx];
    draft.history.push({
      id: `hst-${Date.now()}`,
      tenantId: "tenant-demo",
      eventType: HistoryEventType.TaskTransferred,
      actorId,
      occurredAt: now,
      projectId: prev.projectId,
      taskId: prev.id,
      changes: [{ field: "assigneeId", from: prev.assigneeId, to: newAssigneeId }],
    });
  });
  if (!updated) throw new Error(`Task ${id} not found`);
  await simulateLatency();
  return updated;
}

export async function moveTaskToMilestone(id: ID, milestoneId: ID | null, actorId: ID): Promise<Task> {
  const now = new Date().toISOString();
  let updated: Task | null = null;
  useWorkStore.getState().patch((draft) => {
    const idx = draft.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const prev = draft.tasks[idx];
    const nextStatus = milestoneId === null ? TaskStatus.Backlog : prev.status === TaskStatus.Backlog ? TaskStatus.Todo : prev.status;
    draft.tasks[idx] = { ...prev, milestoneId, status: nextStatus, updatedAt: now };
    updated = draft.tasks[idx];
    draft.history.push({
      id: `hst-${Date.now()}`,
      tenantId: "tenant-demo",
      eventType: milestoneId === null ? HistoryEventType.TaskMovedToBacklog : HistoryEventType.TaskMovedToMilestone,
      actorId,
      occurredAt: now,
      projectId: prev.projectId,
      taskId: prev.id,
      changes: [{ field: "milestoneId", from: prev.milestoneId, to: milestoneId }],
    });
  });
  if (!updated) throw new Error(`Task ${id} not found`);
  await simulateLatency();
  return updated;
}
