import { ID, PersonalTask, TaskPriority } from "../types";
import { wmGet, wmPatch, wmPost, s } from "./api";

interface BackendPersonalTask {
  id: number;
  ownerUserId: number;
  title: string;
  description: string | null;
  completed: boolean;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

function toPersonalTask(b: BackendPersonalTask): PersonalTask {
  return {
    id: s(b.id),
    tenantId: "",
    ownerId: s(b.ownerUserId),
    title: b.title,
    description: b.description ?? undefined,
    isCompleted: b.completed,
    dueDate: b.dueDate ?? undefined,
    priority: b.priority as TaskPriority,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

export async function listOwnPersonalTasks(_ownerId: ID): Promise<PersonalTask[]> {
  const raw = await wmGet<BackendPersonalTask[]>("/personal-tasks");
  return raw.map(toPersonalTask).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export interface CreatePersonalTaskInput {
  ownerId: ID;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
}

export async function createPersonalTask(input: CreatePersonalTaskInput): Promise<PersonalTask> {
  const raw = await wmPost<BackendPersonalTask>("/personal-tasks", {
    title: input.title,
    description: input.description,
    dueDate: input.dueDate,
    priority: input.priority,
  });
  return toPersonalTask(raw);
}

export async function togglePersonalTask(id: ID, _ownerId: ID): Promise<PersonalTask> {
  const raw = await wmPatch<BackendPersonalTask>(`/personal-tasks/${id}/toggle`);
  return toPersonalTask(raw);
}
