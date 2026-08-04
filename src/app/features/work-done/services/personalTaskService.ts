import { ID, PersonalTask, TaskPriority } from "../types";
import { simulateLatency } from "../mock/latency";
import { snapshot, useWorkStore } from "../mock/store";

// Personal tasks are strictly self-scoped. The service enforces the privacy
// rule at the query layer — no ownerId parameter means no result, even for
// Manager/HR callers. Backend (Phase B6) mirrors this at the repository level.

export async function listOwnPersonalTasks(ownerId: ID): Promise<PersonalTask[]> {
  await simulateLatency();
  return snapshot()
    .personalTasks.filter((t) => t.ownerId === ownerId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export interface CreatePersonalTaskInput {
  ownerId: ID;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
}

export async function createPersonalTask(input: CreatePersonalTaskInput): Promise<PersonalTask> {
  const now = new Date().toISOString();
  const t: PersonalTask = {
    id: `ptsk-${Date.now()}`,
    tenantId: "tenant-demo",
    ownerId: input.ownerId,
    title: input.title,
    description: input.description,
    isCompleted: false,
    dueDate: input.dueDate,
    priority: input.priority ?? TaskPriority.Medium,
    createdAt: now,
    updatedAt: now,
  };
  useWorkStore.getState().patch((draft) => {
    draft.personalTasks.push(t);
  });
  await simulateLatency();
  return t;
}

export async function togglePersonalTask(id: ID, ownerId: ID): Promise<PersonalTask> {
  const now = new Date().toISOString();
  let updated: PersonalTask | null = null;
  useWorkStore.getState().patch((draft) => {
    const idx = draft.personalTasks.findIndex((t) => t.id === id && t.ownerId === ownerId);
    if (idx === -1) return;
    draft.personalTasks[idx] = {
      ...draft.personalTasks[idx],
      isCompleted: !draft.personalTasks[idx].isCompleted,
      updatedAt: now,
    };
    updated = draft.personalTasks[idx];
  });
  if (!updated) throw new Error(`Personal task ${id} not found for owner ${ownerId}`);
  await simulateLatency();
  return updated;
}
