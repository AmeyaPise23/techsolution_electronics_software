import {
  HistoryEventType,
  ID,
  Page,
  Pageable,
  Project,
  ProjectProgress,
  TaskStatus,
} from "../types";
import { simulateLatency } from "../mock/latency";
import { snapshot, useWorkStore } from "../mock/store";
import { paginate } from "./pagination";

export interface ProjectFilters {
  search?: string;
  archived?: boolean;
  memberOfEmployeeId?: ID;
}

export async function listProjects(
  filters: ProjectFilters = {},
  pageable?: Pageable
): Promise<Page<Project>> {
  await simulateLatency();
  const { projects } = snapshot();
  const filtered = projects.filter((p) => {
    if (filters.archived !== undefined && p.isArchived !== filters.archived) return false;
    if (filters.memberOfEmployeeId && !p.memberIds.includes(filters.memberOfEmployeeId)) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.key.toLowerCase().includes(q)) return false;
    }
    return true;
  });
  return paginate(filtered, pageable);
}

export async function getProject(id: ID): Promise<Project | null> {
  await simulateLatency();
  return snapshot().projects.find((p) => p.id === id) ?? null;
}

export async function getProjectProgress(id: ID): Promise<ProjectProgress> {
  await simulateLatency();
  const state = snapshot();
  const tasks = state.tasks.filter((t) => t.projectId === id);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === TaskStatus.Done).length;
  const totalStoryPoints = tasks.reduce((s, t) => s + t.storyPoints, 0);
  const completedStoryPoints = tasks
    .filter((t) => t.status === TaskStatus.Done)
    .reduce((s, t) => s + t.storyPoints, 0);
  return {
    projectId: id,
    totalTasks,
    completedTasks,
    remainingTasks: totalTasks - completedTasks,
    totalStoryPoints,
    completedStoryPoints,
    percentComplete: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
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

export async function createProject(input: CreateProjectInput, actorId: ID): Promise<Project> {
  const now = new Date().toISOString();
  const project: Project = {
    id: `prj-${Date.now()}`,
    tenantId: "tenant-demo",
    key: input.key,
    name: input.name,
    description: input.description,
    ownerId: input.ownerId,
    memberIds: input.memberIds,
    startDate: input.startDate,
    targetEndDate: input.targetEndDate,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  };
  useWorkStore.getState().patch((draft) => {
    draft.projects.push(project);
    draft.history.push({
      id: `hst-${Date.now()}`,
      tenantId: "tenant-demo",
      eventType: HistoryEventType.ProjectCreated,
      actorId,
      occurredAt: now,
      projectId: project.id,
      message: `Project ${project.name} created`,
    });
  });
  await simulateLatency();
  return project;
}

export async function updateProject(
  id: ID,
  patch: Partial<CreateProjectInput>,
  actorId: ID
): Promise<Project> {
  const now = new Date().toISOString();
  let updated: Project | null = null;
  useWorkStore.getState().patch((draft) => {
    const idx = draft.projects.findIndex((p) => p.id === id);
    if (idx === -1) return;
    const changes = Object.keys(patch)
      .filter((k) => (draft.projects[idx] as any)[k] !== (patch as any)[k])
      .map((k) => ({ field: k, from: (draft.projects[idx] as any)[k], to: (patch as any)[k] }));
    draft.projects[idx] = { ...draft.projects[idx], ...patch, updatedAt: now };
    updated = draft.projects[idx];
    if (changes.length > 0) {
      draft.history.push({
        id: `hst-${Date.now()}`,
        tenantId: "tenant-demo",
        eventType: HistoryEventType.ProjectUpdated,
        actorId,
        occurredAt: now,
        projectId: id,
        changes,
      });
    }
  });
  if (!updated) throw new Error(`Project ${id} not found`);
  await simulateLatency();
  return updated;
}
