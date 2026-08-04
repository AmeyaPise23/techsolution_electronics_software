import {
  HistoryEventType,
  ID,
  Milestone,
  MilestoneProgress,
  MilestoneStatus,
  TaskStatus,
} from "../types";
import { simulateLatency } from "../mock/latency";
import { snapshot, useWorkStore } from "../mock/store";

export interface MilestoneFilters {
  projectId?: ID;
  status?: MilestoneStatus;
}

export async function listMilestones(filters: MilestoneFilters = {}): Promise<Milestone[]> {
  await simulateLatency();
  return snapshot()
    .milestones.filter((m) => {
      if (filters.projectId && m.projectId !== filters.projectId) return false;
      if (filters.status && m.status !== filters.status) return false;
      return true;
    })
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

export async function getMilestone(id: ID): Promise<Milestone | null> {
  await simulateLatency();
  return snapshot().milestones.find((m) => m.id === id) ?? null;
}

export async function getMilestoneProgress(id: ID): Promise<MilestoneProgress> {
  await simulateLatency();
  const state = snapshot();
  const tasks = state.tasks.filter((t) => t.milestoneId === id);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === TaskStatus.Done).length;
  return {
    milestoneId: id,
    totalTasks,
    completedTasks,
    percentComplete: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
  };
}

export interface CreateMilestoneInput {
  projectId: ID;
  name: string;
  description?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  orderIndex?: number;
}

export async function createMilestone(input: CreateMilestoneInput, actorId: ID): Promise<Milestone> {
  const now = new Date().toISOString();
  const state = snapshot();
  const orderIndex =
    input.orderIndex ??
    Math.max(0, ...state.milestones.filter((m) => m.projectId === input.projectId).map((m) => m.orderIndex)) + 1;
  const milestone: Milestone = {
    id: `ms-${Date.now()}`,
    tenantId: "tenant-demo",
    projectId: input.projectId,
    name: input.name,
    description: input.description,
    status: MilestoneStatus.Planned,
    plannedStartDate: input.plannedStartDate,
    plannedEndDate: input.plannedEndDate,
    orderIndex,
    createdAt: now,
    updatedAt: now,
  };
  useWorkStore.getState().patch((draft) => {
    draft.milestones.push(milestone);
    draft.history.push({
      id: `hst-${Date.now()}`,
      tenantId: "tenant-demo",
      eventType: HistoryEventType.MilestoneCreated,
      actorId,
      occurredAt: now,
      projectId: input.projectId,
      milestoneId: milestone.id,
      message: `Milestone ${milestone.name} created`,
    });
  });
  await simulateLatency();
  return milestone;
}

export async function startMilestone(id: ID, actorId: ID): Promise<Milestone> {
  const now = new Date().toISOString();
  let updated: Milestone | null = null;
  useWorkStore.getState().patch((draft) => {
    const idx = draft.milestones.findIndex((m) => m.id === id);
    if (idx === -1) return;
    draft.milestones[idx] = {
      ...draft.milestones[idx],
      status: MilestoneStatus.Ongoing,
      actualStartDate: now.slice(0, 10),
      updatedAt: now,
    };
    updated = draft.milestones[idx];
    draft.history.push({
      id: `hst-${Date.now()}`,
      tenantId: "tenant-demo",
      eventType: HistoryEventType.MilestoneStarted,
      actorId,
      occurredAt: now,
      projectId: updated.projectId,
      milestoneId: id,
      message: `Milestone ${updated.name} started`,
    });
  });
  if (!updated) throw new Error(`Milestone ${id} not found`);
  await simulateLatency();
  return updated;
}

// Completing a milestone auto-moves unfinished tasks to the backlog and emits
// history for each moved task, matching the Phase B spec (B3).
export async function completeMilestone(id: ID, actorId: ID): Promise<Milestone> {
  const now = new Date().toISOString();
  let updated: Milestone | null = null;
  useWorkStore.getState().patch((draft) => {
    const idx = draft.milestones.findIndex((m) => m.id === id);
    if (idx === -1) return;
    draft.milestones[idx] = {
      ...draft.milestones[idx],
      status: MilestoneStatus.Completed,
      actualEndDate: now.slice(0, 10),
      updatedAt: now,
    };
    updated = draft.milestones[idx];
    // Auto-move unfinished tasks to backlog.
    for (let i = 0; i < draft.tasks.length; i++) {
      const t = draft.tasks[i];
      if (t.milestoneId === id && t.status !== TaskStatus.Done) {
        draft.tasks[i] = { ...t, milestoneId: null, status: TaskStatus.Backlog, updatedAt: now };
        draft.history.push({
          id: `hst-${Date.now()}-${i}`,
          tenantId: "tenant-demo",
          eventType: HistoryEventType.TaskMovedToBacklog,
          actorId,
          occurredAt: now,
          projectId: t.projectId,
          taskId: t.id,
          message: `Auto-moved to backlog on milestone completion`,
        });
      }
    }
    draft.history.push({
      id: `hst-${Date.now()}`,
      tenantId: "tenant-demo",
      eventType: HistoryEventType.MilestoneCompleted,
      actorId,
      occurredAt: now,
      projectId: updated.projectId,
      milestoneId: id,
      message: `Milestone ${updated.name} completed`,
    });
  });
  if (!updated) throw new Error(`Milestone ${id} not found`);
  await simulateLatency();
  return updated;
}
