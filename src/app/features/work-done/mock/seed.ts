// Deterministic seed data for the Work Management mock layer. Every run of the
// app in dev starts from the SAME dataset (seeded PRNG) so screens are
// reproducible while iterating. Mutations happen through the zustand store
// (mock/store.ts) — this file only produces the initial payload.

import {
  Attachment,
  ChecklistItem,
  Comment,
  Employee,
  HistoryEntry,
  HistoryEventType,
  Milestone,
  MilestoneStatus,
  PersonalTask,
  Project,
  Role,
  StoryPointLedgerEntry,
  Task,
  TaskPriority,
  TaskStatus,
  TimeLog,
} from "../types";

const TENANT_ID = "tenant-demo";
const NOW = new Date("2026-07-30T09:00:00.000Z");

// Small deterministic PRNG (mulberry32). Not for security — only to keep seed
// output identical across reloads so the UI is stable while iterating.
function makePrng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, items: T[]): T {
  return items[Math.floor(rand() * items.length)];
}

function daysFromNow(days: number, base: Date = NOW): string {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function isoDateTime(offsetMinutes: number, base: Date = NOW): string {
  return new Date(base.getTime() + offsetMinutes * 60_000).toISOString();
}

export interface SeedData {
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
}

// ---------- Employees ----------

const EMPLOYEES: Employee[] = [
  { id: "emp-mgr-1", tenantId: TENANT_ID, displayName: "Ameya Pise",   email: "ameya@techsolution.in",  role: Role.Manager,  avatarUrl: undefined },
  { id: "emp-hr-1",  tenantId: TENANT_ID, displayName: "Priya Nair",    email: "priya@techsolution.in",  role: Role.HR },
  { id: "emp-1",     tenantId: TENANT_ID, displayName: "Rohit Sharma",  email: "rohit@techsolution.in",  role: Role.Employee },
  { id: "emp-2",     tenantId: TENANT_ID, displayName: "Sana Iyer",     email: "sana@techsolution.in",   role: Role.Employee },
  { id: "emp-3",     tenantId: TENANT_ID, displayName: "Vikram Rao",    email: "vikram@techsolution.in", role: Role.Employee },
  { id: "emp-4",     tenantId: TENANT_ID, displayName: "Neha Kapoor",   email: "neha@techsolution.in",   role: Role.Employee },
  { id: "emp-5",     tenantId: TENANT_ID, displayName: "Arjun Menon",   email: "arjun@techsolution.in",  role: Role.Employee },
];

const DEV_EMPLOYEE_IDS = EMPLOYEES.filter((e) => e.role === Role.Employee).map((e) => e.id);

// ---------- Projects ----------

const PROJECTS_SEED: Array<Omit<Project, "tenantId" | "createdAt" | "updatedAt" | "isArchived">> = [
  {
    id: "prj-erp",
    key: "ERP",
    name: "ERP Suite — Work Management module",
    description: "Cross-cutting project/milestone/task tracking module for the ERP.",
    ownerId: "emp-mgr-1",
    memberIds: ["emp-mgr-1", "emp-1", "emp-2", "emp-3", "emp-4"],
    startDate: daysFromNow(-45),
    targetEndDate: daysFromNow(60),
  },
  {
    id: "prj-store",
    key: "STORE",
    name: "Elehaus Storefront Redesign",
    description: "Landing pages, PDP, and checkout rework on the storefront.",
    ownerId: "emp-mgr-1",
    memberIds: ["emp-mgr-1", "emp-2", "emp-5"],
    startDate: daysFromNow(-30),
    targetEndDate: daysFromNow(45),
  },
  {
    id: "prj-mobile",
    key: "MOB",
    name: "Mobile Companion App",
    description: "React-Native shell with core order/repair flows for field staff.",
    ownerId: "emp-mgr-1",
    memberIds: ["emp-mgr-1", "emp-1", "emp-3"],
    startDate: daysFromNow(-15),
    targetEndDate: daysFromNow(90),
  },
];

// ---------- Milestones ----------
// Mixed statuses so every screen has something to show. Ongoing milestones
// carry actualStartDate; Completed carry actualEndDate.

interface MilestoneSeed {
  id: string;
  projectId: string;
  name: string;
  status: MilestoneStatus;
  plannedStart: number; // day offset
  plannedEnd: number;
  orderIndex: number;
}

const MILESTONES_SEED: MilestoneSeed[] = [
  // ERP
  { id: "ms-erp-1", projectId: "prj-erp", name: "M1 — Foundations",       status: MilestoneStatus.Completed, plannedStart: -45, plannedEnd: -10, orderIndex: 1 },
  { id: "ms-erp-2", projectId: "prj-erp", name: "M2 — Screens & Mock",    status: MilestoneStatus.Ongoing,   plannedStart: -8,  plannedEnd:  20, orderIndex: 2 },
  { id: "ms-erp-3", projectId: "prj-erp", name: "M3 — Backend Contracts", status: MilestoneStatus.Planned,   plannedStart:  22, plannedEnd:  50, orderIndex: 3 },
  // Store
  { id: "ms-store-1", projectId: "prj-store", name: "Discovery",   status: MilestoneStatus.Completed, plannedStart: -30, plannedEnd: -18, orderIndex: 1 },
  { id: "ms-store-2", projectId: "prj-store", name: "Landing v2",  status: MilestoneStatus.Ongoing,   plannedStart: -17, plannedEnd:  10, orderIndex: 2 },
  { id: "ms-store-3", projectId: "prj-store", name: "PDP Rework",  status: MilestoneStatus.Planned,   plannedStart:  12, plannedEnd:  35, orderIndex: 3 },
  // Mobile
  { id: "ms-mob-1", projectId: "prj-mobile", name: "Spike & Shell", status: MilestoneStatus.Ongoing, plannedStart: -15, plannedEnd:  15, orderIndex: 1 },
  { id: "ms-mob-2", projectId: "prj-mobile", name: "Auth & Sync",   status: MilestoneStatus.Planned, plannedStart:  16, plannedEnd:  60, orderIndex: 2 },
];

// ---------- Task generation ----------

const TASK_TITLES = [
  "Model entities and enums",
  "Wire authorization matrix",
  "Ship first mock service",
  "Build project overview cards",
  "Timeline bar interactions",
  "Kanban drag targets",
  "Backlog → milestone move",
  "Task details drawer skeleton",
  "Activity timeline diff renderer",
  "Comment composer with mentions",
  "Checklist reordering",
  "Attachment dropzone",
  "Team week calendar layout",
  "Log time quick dialog",
  "Leaderboard window tabs",
  "Employee dashboard filters",
  "Personal tasks privacy pass",
  "Filter bar shared state",
  "Empty states across screens",
  "Loading skeletons pass",
  "Optimistic status updates",
  "Milestone completion side-effects",
  "Story-point ledger crediting",
  "Responsive board scrolling",
  "Global search wiring",
];

const LABELS = ["frontend", "backend", "polish", "spike", "bug", "design"];

function seedTasksForMilestone(
  rand: () => number,
  milestone: MilestoneSeed,
  taskIdCounter: { n: number }
): Task[] {
  const count = 6 + Math.floor(rand() * 4); // 6..9 tasks per milestone
  const tasks: Task[] = [];
  for (let i = 0; i < count; i++) {
    const id = `tsk-${taskIdCounter.n++}`;
    const assigneeId = pick(rand, DEV_EMPLOYEE_IDS);
    // Distribute statuses so every column has content across projects.
    let status: TaskStatus;
    if (milestone.status === MilestoneStatus.Completed) {
      status = TaskStatus.Done;
    } else if (milestone.status === MilestoneStatus.Planned) {
      status = TaskStatus.Todo;
    } else {
      // Ongoing: spread across columns
      const r = rand();
      status = r < 0.15 ? TaskStatus.Todo
             : r < 0.55 ? TaskStatus.InProgress
             : r < 0.75 ? TaskStatus.InReview
             : TaskStatus.Done;
    }
    const priorityRoll = rand();
    const priority: TaskPriority =
      priorityRoll < 0.15 ? TaskPriority.Urgent :
      priorityRoll < 0.45 ? TaskPriority.High :
      priorityRoll < 0.85 ? TaskPriority.Medium : TaskPriority.Low;

    const createdOffset = milestone.plannedStart + Math.floor(rand() * 5);
    const createdAt = isoDateTime(createdOffset * 24 * 60);
    const completedAt = status === TaskStatus.Done
      ? isoDateTime((createdOffset + 2 + Math.floor(rand() * 6)) * 24 * 60)
      : undefined;

    tasks.push({
      id,
      tenantId: TENANT_ID,
      projectId: milestone.projectId,
      milestoneId: milestone.id,
      parentTaskId: null,
      title: TASK_TITLES[(taskIdCounter.n + i) % TASK_TITLES.length],
      description: undefined,
      status,
      priority,
      assigneeId,
      reporterId: "emp-mgr-1",
      storyPoints: pick(rand, [1, 2, 3, 3, 5, 5, 8]),
      labels: rand() < 0.7 ? [pick(rand, LABELS)] : [],
      dueDate: daysFromNow(milestone.plannedEnd - Math.floor(rand() * 5)),
      estimatedHours: pick(rand, [2, 4, 8, 16]),
      actualHours: 0, // derived from time logs; recomputed at read time
      orderIndex: i,
      completedAt,
      createdAt,
      updatedAt: createdAt,
    });
  }
  return tasks;
}

// Sprinkle a handful of backlog tasks (milestoneId=null) per project so the
// Backlog Board is not empty.
function seedBacklogTasks(
  rand: () => number,
  projectId: string,
  taskIdCounter: { n: number }
): Task[] {
  const count = 4 + Math.floor(rand() * 3); // 4..6 backlog tasks
  const tasks: Task[] = [];
  for (let i = 0; i < count; i++) {
    const id = `tsk-${taskIdCounter.n++}`;
    const assigneeId = rand() < 0.5 ? pick(rand, DEV_EMPLOYEE_IDS) : null;
    const createdOffset = -20 + Math.floor(rand() * 20);
    const createdAt = isoDateTime(createdOffset * 24 * 60);
    const priorityRoll = rand();
    const priority: TaskPriority =
      priorityRoll < 0.2 ? TaskPriority.High :
      priorityRoll < 0.7 ? TaskPriority.Medium : TaskPriority.Low;
    tasks.push({
      id,
      tenantId: TENANT_ID,
      projectId,
      milestoneId: null,
      parentTaskId: null,
      title: TASK_TITLES[(taskIdCounter.n * 3 + i) % TASK_TITLES.length],
      description: undefined,
      status: TaskStatus.Backlog,
      priority,
      assigneeId,
      reporterId: "emp-mgr-1",
      storyPoints: pick(rand, [1, 2, 3, 5]),
      labels: rand() < 0.5 ? [pick(rand, LABELS)] : [],
      dueDate: undefined,
      estimatedHours: pick(rand, [2, 4, 8]),
      actualHours: 0,
      orderIndex: i,
      createdAt,
      updatedAt: createdAt,
    });
  }
  return tasks;
}

// ---------- Story point ledger ----------
// Spread completion dates across today/week/month/year so leaderboard windows
// all have content.

function seedLedgerFromDoneTasks(rand: () => number, tasks: Task[]): StoryPointLedgerEntry[] {
  const entries: StoryPointLedgerEntry[] = [];
  let idCounter = 1;
  for (const task of tasks) {
    if (task.status !== TaskStatus.Done || !task.assigneeId) continue;
    // Distribute credited_at: some today, some this week, some this month,
    // some earlier this year — so the five leaderboard windows are all populated.
    const bucket = rand();
    let creditedAt: string;
    if (bucket < 0.1)      creditedAt = isoDateTime(-Math.floor(rand() * 8 * 60));           // today
    else if (bucket < 0.4) creditedAt = isoDateTime(-Math.floor(rand() * 6 * 24 * 60) - 60); // this week
    else if (bucket < 0.75) creditedAt = isoDateTime(-Math.floor(rand() * 25 * 24 * 60));    // this month
    else                    creditedAt = isoDateTime(-Math.floor(rand() * 180 * 24 * 60));   // earlier this year
    entries.push({
      id: `spl-${idCounter++}`,
      tenantId: TENANT_ID,
      employeeId: task.assigneeId,
      taskId: task.id,
      projectId: task.projectId,
      points: task.storyPoints,
      creditedAt,
      reason: "TASK_COMPLETED",
    });
  }
  return entries;
}

// ---------- Time logs ----------
// One week's worth of entries across the team so the calendar isn't sparse.

function seedTimeLogs(rand: () => number, tasks: Task[]): TimeLog[] {
  const logs: TimeLog[] = [];
  let idCounter = 1;
  // Focus on the current week: Monday..Friday of the current ISO week.
  // Simple heuristic: use offsets [-6..0] from today.
  for (const empId of DEV_EMPLOYEE_IDS) {
    for (let dayOffset = -6; dayOffset <= 0; dayOffset++) {
      const day = new Date(NOW);
      day.setUTCDate(day.getUTCDate() + dayOffset);
      const weekday = day.getUTCDay();
      if (weekday === 0 || weekday === 6) continue; // skip weekends
      // 1..3 entries per person per weekday
      const entryCount = 1 + Math.floor(rand() * 3);
      const activeTasks = tasks.filter(
        (t) => t.assigneeId === empId && t.status !== TaskStatus.Backlog
      );
      if (activeTasks.length === 0) continue;
      for (let i = 0; i < entryCount; i++) {
        const task = pick(rand, activeTasks);
        const minutes = pick(rand, [30, 45, 60, 90, 120, 180, 240]);
        const createdAt = isoDateTime(dayOffset * 24 * 60 + 9 * 60 + i * 60);
        logs.push({
          id: `tl-${idCounter++}`,
          tenantId: TENANT_ID,
          employeeId: empId,
          taskId: task.id,
          projectId: task.projectId,
          workDate: day.toISOString().slice(0, 10),
          durationMinutes: minutes,
          note: undefined,
          createdAt,
          updatedAt: createdAt,
        });
      }
    }
  }
  return logs;
}

// ---------- Personal tasks ----------
// A couple per employee so the "Personal Reference Tasks" panel isn't empty.

function seedPersonalTasks(): PersonalTask[] {
  const out: PersonalTask[] = [];
  let id = 1;
  for (const emp of EMPLOYEES) {
    const count = 2;
    for (let i = 0; i < count; i++) {
      const createdAt = isoDateTime(-((i + 1) * 24 * 60));
      out.push({
        id: `ptsk-${id++}`,
        tenantId: TENANT_ID,
        ownerId: emp.id,
        title: i === 0 ? "Follow up with client re: onboarding" : "Read design tokens spec",
        description: undefined,
        isCompleted: false,
        priority: i === 0 ? TaskPriority.Medium : TaskPriority.Low,
        createdAt,
        updatedAt: createdAt,
      });
    }
  }
  return out;
}

// ---------- History (a light dusting) ----------
// The full audit trail is generated by services on mutation. We seed just a
// few entries per project so the Activity Timeline has something on first load.

function seedHistory(projects: Project[], milestones: Milestone[]): HistoryEntry[] {
  const out: HistoryEntry[] = [];
  let id = 1;
  for (const p of projects) {
    out.push({
      id: `hst-${id++}`,
      tenantId: TENANT_ID,
      eventType: HistoryEventType.ProjectCreated,
      actorId: p.ownerId,
      occurredAt: p.createdAt,
      projectId: p.id,
      message: `Project ${p.name} created`,
    });
  }
  for (const m of milestones) {
    out.push({
      id: `hst-${id++}`,
      tenantId: TENANT_ID,
      eventType: HistoryEventType.MilestoneCreated,
      actorId: "emp-mgr-1",
      occurredAt: m.createdAt,
      projectId: m.projectId,
      milestoneId: m.id,
      message: `Milestone ${m.name} created`,
    });
    if (m.status === MilestoneStatus.Ongoing || m.status === MilestoneStatus.Completed) {
      out.push({
        id: `hst-${id++}`,
        tenantId: TENANT_ID,
        eventType: HistoryEventType.MilestoneStarted,
        actorId: "emp-mgr-1",
        occurredAt: isoDateTime((m.plannedStartDate ? 0 : 0)),
        projectId: m.projectId,
        milestoneId: m.id,
        message: `Milestone ${m.name} started`,
      });
    }
    if (m.status === MilestoneStatus.Completed) {
      out.push({
        id: `hst-${id++}`,
        tenantId: TENANT_ID,
        eventType: HistoryEventType.MilestoneCompleted,
        actorId: "emp-mgr-1",
        occurredAt: isoDateTime(0),
        projectId: m.projectId,
        milestoneId: m.id,
        message: `Milestone ${m.name} completed`,
      });
    }
  }
  return out;
}

// ---------- Public: build the full seed ----------

export function buildSeedData(): SeedData {
  const rand = makePrng(20260730);

  const projects: Project[] = PROJECTS_SEED.map((p) => ({
    ...p,
    tenantId: TENANT_ID,
    isArchived: false,
    createdAt: isoDateTime(-60 * 24 * 60),
    updatedAt: isoDateTime(-1 * 24 * 60),
  }));

  const milestones: Milestone[] = MILESTONES_SEED.map((m) => ({
    id: m.id,
    tenantId: TENANT_ID,
    projectId: m.projectId,
    name: m.name,
    description: undefined,
    status: m.status,
    plannedStartDate: daysFromNow(m.plannedStart),
    plannedEndDate: daysFromNow(m.plannedEnd),
    actualStartDate:
      m.status === MilestoneStatus.Ongoing || m.status === MilestoneStatus.Completed
        ? daysFromNow(m.plannedStart + 1)
        : undefined,
    actualEndDate: m.status === MilestoneStatus.Completed ? daysFromNow(m.plannedEnd - 1) : undefined,
    orderIndex: m.orderIndex,
    createdAt: isoDateTime((m.plannedStart - 2) * 24 * 60),
    updatedAt: isoDateTime(-1 * 24 * 60),
  }));

  const taskIdCounter = { n: 1 };
  const tasks: Task[] = [];
  for (const m of MILESTONES_SEED) {
    tasks.push(...seedTasksForMilestone(rand, m, taskIdCounter));
  }
  for (const p of PROJECTS_SEED) {
    tasks.push(...seedBacklogTasks(rand, p.id, taskIdCounter));
  }

  const storyPointLedger = seedLedgerFromDoneTasks(rand, tasks);
  const timeLogs = seedTimeLogs(rand, tasks);
  const personalTasks = seedPersonalTasks();
  const history = seedHistory(projects, milestones);

  return {
    employees: EMPLOYEES,
    projects,
    milestones,
    tasks,
    personalTasks,
    comments: [],
    checklistItems: [],
    attachments: [],
    history,
    storyPointLedger,
    timeLogs,
  };
}

export const SEED_TENANT_ID = TENANT_ID;
export const SEED_NOW = NOW;
