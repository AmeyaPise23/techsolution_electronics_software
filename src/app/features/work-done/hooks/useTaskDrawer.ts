// Small global store so any card in any board (Kanban, Backlog, Dashboard)
// can open the shared TaskDetailsDrawer without prop drilling. Rendered once
// at the WorkDoneLayout level.

import { create } from "zustand";

interface TaskDrawerState {
  openTaskId: string | null;
  open: (taskId: string) => void;
  close: () => void;
}

export const useTaskDrawer = create<TaskDrawerState>((set) => ({
  openTaskId: null,
  open: (taskId) => set({ openTaskId: taskId }),
  close: () => set({ openTaskId: null }),
}));
