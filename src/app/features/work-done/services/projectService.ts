import {
  ID,
  Page,
  Pageable,
  Project,
  ProjectProgress,
} from "../types";
import { wmGet, wmPatch, wmPost, s } from "./api";

interface BackendProject {
  id: number;
  tenantId: number;
  key: string;
  name: string;
  description: string | null;
  ownerId: number | null;
  memberIds: number[];
  startDate: string | null;
  targetEndDate: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

function toProject(b: BackendProject): Project {
  return {
    id: s(b.id),
    tenantId: s(b.tenantId),
    key: b.key,
    name: b.name,
    description: b.description ?? undefined,
    ownerId: s(b.ownerId),
    memberIds: (b.memberIds ?? []).map(s),
    startDate: b.startDate ?? undefined,
    targetEndDate: b.targetEndDate ?? undefined,
    isArchived: b.isArchived,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

function toPage(raw: Page<BackendProject>): Page<Project> {
  return { ...raw, content: raw.content.map(toProject) };
}

export interface ProjectFilters {
  search?: string;
  archived?: boolean;
  memberOfEmployeeId?: ID;
}

export async function listProjects(
  filters: ProjectFilters = {},
  pageable?: Pageable
): Promise<Page<Project>> {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.archived !== undefined) params.set("archived", String(filters.archived));
  if (filters.memberOfEmployeeId) params.set("memberUserId", filters.memberOfEmployeeId);
  if (pageable) {
    params.set("page", String(pageable.page));
    params.set("size", String(pageable.size));
    if (pageable.sort) params.set("sort", pageable.sort);
  }
  const qs = params.toString();
  const raw = await wmGet<Page<BackendProject>>(`/projects${qs ? `?${qs}` : ""}`);
  return toPage(raw);
}

export async function getProject(id: ID): Promise<Project | null> {
  try {
    const raw = await wmGet<BackendProject>(`/projects/${id}`);
    return toProject(raw);
  } catch {
    return null;
  }
}

export async function getProjectProgress(id: ID): Promise<ProjectProgress> {
  const raw = await wmGet<{
    projectId: number;
    totalTasks: number;
    completedTasks: number;
    remainingTasks: number;
    totalStoryPoints: number;
    completedStoryPoints: number;
    percentComplete: number;
  }>(`/projects/${id}/progress`);
  return {
    projectId: s(raw.projectId),
    totalTasks: raw.totalTasks,
    completedTasks: raw.completedTasks,
    remainingTasks: raw.remainingTasks,
    totalStoryPoints: raw.totalStoryPoints,
    completedStoryPoints: raw.completedStoryPoints,
    percentComplete: raw.percentComplete,
  };
}

export interface CreateProjectInput {
  key: string;
  name: string;
  description?: string;
  ownerId: ID;
  memberIds: ID[];
  startDate?: string;
  targetEndDate?: string;
}

export async function createProject(input: CreateProjectInput, _actorId: ID): Promise<Project> {
  const raw = await wmPost<BackendProject>("/projects", {
    key: input.key,
    name: input.name,
    description: input.description,
    ownerUserId: Number(input.ownerId),
    memberUserIds: input.memberIds.map(Number),
    startDate: input.startDate,
    targetEndDate: input.targetEndDate,
  });
  return toProject(raw);
}

export async function updateProject(
  id: ID,
  patch: Partial<CreateProjectInput>,
  _actorId: ID
): Promise<Project> {
  const payload: Record<string, unknown> = {};
  if (patch.key !== undefined) payload.key = patch.key;
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.ownerId !== undefined) payload.ownerUserId = Number(patch.ownerId);
  if (patch.memberIds !== undefined) payload.memberUserIds = patch.memberIds.map(Number);
  if (patch.startDate !== undefined) payload.startDate = patch.startDate;
  if (patch.targetEndDate !== undefined) payload.targetEndDate = patch.targetEndDate;
  const raw = await wmPatch<BackendProject>(`/projects/${id}`, payload);
  return toProject(raw);
}
