import {
  ID,
  Milestone,
  MilestoneProgress,
  MilestoneStatus,
} from "../types";
import { wmGet, wmPatch, wmPost, s } from "./api";

interface BackendMilestone {
  id: number;
  projectId: number;
  name: string;
  description: string | null;
  status: string;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

function toMilestone(b: BackendMilestone): Milestone {
  return {
    id: s(b.id),
    tenantId: "",
    projectId: s(b.projectId),
    name: b.name,
    description: b.description ?? undefined,
    status: b.status as MilestoneStatus,
    plannedStartDate: b.plannedStartDate ?? undefined,
    plannedEndDate: b.plannedEndDate ?? undefined,
    actualStartDate: b.actualStartDate ?? undefined,
    actualEndDate: b.actualEndDate ?? undefined,
    orderIndex: b.orderIndex,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

export interface MilestoneFilters {
  projectId?: ID;
  status?: MilestoneStatus;
}

export async function listMilestones(filters: MilestoneFilters = {}): Promise<Milestone[]> {
  const params = new URLSearchParams();
  if (filters.projectId) params.set("projectId", filters.projectId);
  const qs = params.toString();
  const raw = await wmGet<BackendMilestone[]>(`/milestones${qs ? `?${qs}` : ""}`);
  let result = raw.map(toMilestone);
  if (filters.status) result = result.filter((m) => m.status === filters.status);
  return result.sort((a, b) => a.orderIndex - b.orderIndex);
}

export async function getMilestone(id: ID): Promise<Milestone | null> {
  try {
    const raw = await wmGet<BackendMilestone>(`/milestones/${id}`);
    return toMilestone(raw);
  } catch {
    return null;
  }
}

export async function getMilestoneProgress(id: ID): Promise<MilestoneProgress> {
  const raw = await wmGet<{
    milestoneId: number;
    totalTasks: number;
    doneTasks: number;
    remainingTasks: number;
    percentComplete: number;
  }>(`/milestones/${id}/progress`);
  return {
    milestoneId: s(raw.milestoneId),
    totalTasks: raw.totalTasks,
    completedTasks: raw.doneTasks,
    percentComplete: raw.percentComplete,
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

export async function createMilestone(input: CreateMilestoneInput, _actorId: ID): Promise<Milestone> {
  const raw = await wmPost<BackendMilestone>("/milestones", {
    projectId: Number(input.projectId),
    name: input.name,
    description: input.description,
    plannedStartDate: input.plannedStartDate,
    plannedEndDate: input.plannedEndDate,
  });
  return toMilestone(raw);
}

export async function startMilestone(id: ID, _actorId: ID): Promise<Milestone> {
  const raw = await wmPatch<BackendMilestone>(`/milestones/${id}/start`);
  return toMilestone(raw);
}

export async function completeMilestone(id: ID, _actorId: ID): Promise<Milestone> {
  const raw = await wmPatch<BackendMilestone>(`/milestones/${id}/complete`);
  return toMilestone(raw);
}
