// LocalStorage-backed replacement for the original Node backend used by the
// standalone Time-Tracking project. Keeps the same taskAPI shape so the store
// keeps working exactly as before.

const STORAGE_KEY = "work-done:tasks";

export interface CreateTaskRequest {
  column_index: number;
  start_minute: number;
  duration: number;
  title: string;
  color: string;
}

export interface Task extends CreateTaskRequest {
  id: string;
  created_at: string;
  updated_at: string;
}

const readAll = (): Task[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeAll = (tasks: Task[]): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // Ignore quota / access errors — behavior degrades to in-memory for the session.
  }
};

const uid = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export const taskAPI = {
  async getTasks(): Promise<Task[]> {
    return readAll();
  },

  async createTask(task: CreateTaskRequest): Promise<Task> {
    const now = new Date().toISOString();
    const created: Task = {
      ...task,
      id: uid(),
      created_at: now,
      updated_at: now,
    };
    const all = readAll();
    all.push(created);
    writeAll(all);
    return created;
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const all = readAll();
    const idx = all.findIndex(t => t.id === id);
    if (idx === -1) throw new Error("Task not found");
    const merged: Task = {
      ...all[idx],
      ...updates,
      id: all[idx].id,
      created_at: all[idx].created_at,
      updated_at: new Date().toISOString(),
    };
    all[idx] = merged;
    writeAll(all);
    return merged;
  },

  async deleteTask(id: string): Promise<void> {
    const all = readAll().filter(t => t.id !== id);
    writeAll(all);
  },
};
