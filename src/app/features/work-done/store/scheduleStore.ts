import { create } from 'zustand';
import { taskAPI } from '../lib/taskStorage';

export interface Task {
  id: string;
  column_index: number;
  start_minute: number;
  duration: number;
  title: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface BoardColumn {
  id: string;
  column_index: number;
  label: string;
  created_at: string;
}

const DEFAULT_COLUMNS: BoardColumn[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
].map((label, column_index) => ({
  id: `default-${column_index}`,
  column_index,
  label,
  created_at: '',
}));

export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  created_at: string;
}

export interface Milestone {
  id: string;
  name: string;
  description?: string;
  dueDate?: string;
  status?: 'completed' | 'in-progress' | 'planned';
  created_at: string;
}

interface ScheduleStore {
  tasks: Task[];
  columns: BoardColumn[];
  projects: Project[];
  milestones: Milestone[];
  loading: boolean;
  error: string | null;
  weekdaysOnly: boolean;

  // Actions
  fetchTasks: () => Promise<void>;
  fetchColumns: () => Promise<void>;
  fetchProjects: () => Promise<void>;
  fetchMilestones: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<Task | null>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setTasks: (tasks: Task[]) => void;
  toggleWeekdaysOnly: () => void;
}

export const useScheduleStore = create<ScheduleStore>((set, get) => ({
  tasks: [],
  columns: DEFAULT_COLUMNS,
  projects: [],
  milestones: [],
  loading: false,
  error: null,
  weekdaysOnly: false,

  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const data = await taskAPI.getTasks();
      set({ tasks: data || [], loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch tasks',
        loading: false
      });
    }
  },

  fetchColumns: async () => {
    // Column data lives client-side in this integration; the original Supabase-backed
    // fetch has been removed. The default weekday column set is authoritative.
    set({ columns: DEFAULT_COLUMNS });
  },

  fetchProjects: async () => {
    try {
      const mockProjects: Project[] = [
        {
          id: '1',
          name: 'Personal Tasks',
          description: 'Daily personal to-do items',
          color: '#3b82f6',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Work Projects',
          description: 'Work-related projects and tasks',
          color: '#10b981',
          created_at: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Side Projects',
          description: 'Creative and side projects',
          color: '#8b5cf6',
          created_at: new Date().toISOString(),
        },
      ];
      set({ projects: mockProjects });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch projects'
      });
    }
  },

  fetchMilestones: async () => {
    try {
      const mockMilestones: Milestone[] = [
        {
          id: '1',
          name: 'Q2 Launch',
          description: 'Launch new features for Q2',
          dueDate: '2026-06-30',
          status: 'in-progress',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Alpha Version',
          description: 'Complete alpha testing',
          dueDate: '2026-05-15',
          status: 'completed',
          created_at: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Beta Release',
          description: 'Prepare for beta release',
          dueDate: '2026-07-01',
          status: 'planned',
          created_at: new Date().toISOString(),
        },
      ];
      set({ milestones: mockMilestones });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch milestones'
      });
    }
  },

  addTask: async (task) => {
    try {
      const data = await taskAPI.createTask(task);
      const currentTasks = get().tasks;
      set({ tasks: [...currentTasks, data] });
      return data;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to add task'
      });
      return null;
    }
  },

  updateTask: async (id, updates) => {
    try {
      await taskAPI.updateTask(id, updates);
      const currentTasks = get().tasks;
      set({
        tasks: currentTasks.map(t => t.id === id ? { ...t, ...updates } : t)
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to update task'
      });
    }
  },

  deleteTask: async (id) => {
    try {
      await taskAPI.deleteTask(id);
      const currentTasks = get().tasks;
      set({ tasks: currentTasks.filter(t => t.id !== id) });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to delete task'
      });
    }
  },

  setTasks: (tasks) => set({ tasks }),

  toggleWeekdaysOnly: () => {
    const current = get().weekdaysOnly;
    set({ weekdaysOnly: !current });
  },
}));
