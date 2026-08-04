// In-memory mock store. Zustand gives us reactivity across screens without an
// invalidation layer — components that call the services below stay in sync
// automatically when a mutation happens.
// This is the ONLY module that mutates the mock dataset. Services (../services/*)
// read/write through here; screens never touch it directly.

import { create } from "zustand";
import {
  Attachment,
  ChecklistItem,
  Comment,
  Employee,
  HistoryEntry,
  Milestone,
  PersonalTask,
  Project,
  StoryPointLedgerEntry,
  Task,
  TimeLog,
} from "../types";
import { buildSeedData } from "./seed";

export interface WorkStoreState {
  employees: Employee[];
  projects: Project[];
  milestones: Milestone[];
  tasks: Task[];
  personalTasks: PersonalTask[];
  comments: Comment[];
  checklistItems: ChecklistItem[];
  attachments: Attachment[];
  history: HistoryEntry[];
  storyPointLedger: StoryPointLedgerEntry[];
  timeLogs: TimeLog[];

  // Internal mutation helper — services should call one of these rather than
  // mutating slices directly so we can layer in optimistic UI hooks later.
  patch: (mut: (draft: WorkStoreState) => void) => void;
  resetToSeed: () => void;
}

function freshState(): Omit<WorkStoreState, "patch" | "resetToSeed"> {
  const seed = buildSeedData();
  return {
    employees: seed.employees,
    projects: seed.projects,
    milestones: seed.milestones,
    tasks: seed.tasks,
    personalTasks: seed.personalTasks,
    comments: seed.comments,
    checklistItems: seed.checklistItems,
    attachments: seed.attachments,
    history: seed.history,
    storyPointLedger: seed.storyPointLedger,
    timeLogs: seed.timeLogs,
  };
}

export const useWorkStore = create<WorkStoreState>((set, get) => ({
  ...freshState(),
  patch: (mut) => {
    // Shallow-clone the array slices we touch so React sees new references.
    // We copy every slice defensively — cheap enough for a mock layer.
    const next: WorkStoreState = {
      ...get(),
      employees: [...get().employees],
      projects: [...get().projects],
      milestones: [...get().milestones],
      tasks: [...get().tasks],
      personalTasks: [...get().personalTasks],
      comments: [...get().comments],
      checklistItems: [...get().checklistItems],
      attachments: [...get().attachments],
      history: [...get().history],
      storyPointLedger: [...get().storyPointLedger],
      timeLogs: [...get().timeLogs],
    };
    mut(next);
    set(next);
  },
  resetToSeed: () => set({ ...freshState() }),
}));

// Read-only snapshot for service functions that do not need reactivity.
export function snapshot(): WorkStoreState {
  return useWorkStore.getState();
}
