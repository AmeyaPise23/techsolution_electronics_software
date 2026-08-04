// Phase 0 — Foundations: shared vocabulary for the Work Management module.
// Every entity carries tenantId so multi-tenancy is designed-in from day one,
// even though the frontend mock layer (Phase A2) will not enforce it yet.
// The existing day-scheduler under this folder is a separate, pre-existing asset;
// reconciling its Task shape with this module's Task happens in Phase A5.

// ---------- Shared primitives ----------

export type ID = string;
export type TenantId = ID;
export type ISODate = string;      // "2026-07-30"
export type ISODateTime = string;  // "2026-07-30T14:22:03.000Z"

export interface TenantScoped {
  tenantId: TenantId;
}

export interface Timestamped {
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// ---------- Enums ----------

export enum Role {
  Manager = "MANAGER",
  HR = "HR",
  Employee = "EMPLOYEE",
}

export enum MilestoneStatus {
  Planned = "PLANNED",
  Ongoing = "ONGOING",
  Completed = "COMPLETED",
}

// Assumption (open decision): five columns modeled after the spec's example.
// Backlog is BOTH a task status AND a scoping concept — a task is "in the backlog"
// when milestoneId is null OR status === Backlog. Backend (Phase B1) models this
// as state, not a separate table.
export enum TaskStatus {
  Backlog = "BACKLOG",
  Todo = "TODO",
  InProgress = "IN_PROGRESS",
  InReview = "IN_REVIEW",
  Done = "DONE",
}

export enum TaskPriority {
  Low = "LOW",
  Medium = "MEDIUM",
  High = "HIGH",
  Urgent = "URGENT",
}

// The kinds of things the audit/history stream can record. Kept generic so new
// mutating actions in later phases don't need schema churn.
export enum HistoryEventType {
  ProjectCreated = "PROJECT_CREATED",
  ProjectUpdated = "PROJECT_UPDATED",
  MilestoneCreated = "MILESTONE_CREATED",
  MilestoneStarted = "MILESTONE_STARTED",
  MilestoneCompleted = "MILESTONE_COMPLETED",
  MilestoneUpdated = "MILESTONE_UPDATED",
  TaskCreated = "TASK_CREATED",
  TaskUpdated = "TASK_UPDATED",
  TaskStatusChanged = "TASK_STATUS_CHANGED",
  TaskAssigned = "TASK_ASSIGNED",
  TaskReassigned = "TASK_REASSIGNED",
  TaskTransferred = "TASK_TRANSFERRED",
  TaskMovedToBacklog = "TASK_MOVED_TO_BACKLOG",
  TaskMovedToMilestone = "TASK_MOVED_TO_MILESTONE",
  StoryPointsCredited = "STORY_POINTS_CREDITED",
  StoryPointsAdjusted = "STORY_POINTS_ADJUSTED",
  CommentAdded = "COMMENT_ADDED",
  ChecklistItemToggled = "CHECKLIST_ITEM_TOGGLED",
  AttachmentAdded = "ATTACHMENT_ADDED",
  TimeLogged = "TIME_LOGGED",
}

export enum LeaderboardWindow {
  Today = "TODAY",
  Week = "WEEK",
  Month = "MONTH",
  Year = "YEAR",
  AllTime = "ALL_TIME",
}

// ---------- Employee (module-local view of a user) ----------
// Reconciles later with the app-wide auth user; kept minimal here so screens
// don't depend on any auth-shape detail beyond id / display / role.

export interface Employee extends TenantScoped {
  id: ID;
  displayName: string;
  email: string;
  role: Role;
  avatarUrl?: string;
}

// ---------- Project ----------

export interface Project extends TenantScoped, Timestamped {
  id: ID;
  key: string;                    // short prefix, e.g. "ERP"
  name: string;
  description?: string;
  ownerId: ID;                    // Employee.id (Manager)
  memberIds: ID[];
  startDate?: ISODate;
  targetEndDate?: ISODate;
  isArchived: boolean;
}

// Derived, never stored — computed on read from tasks under this project.
export interface ProjectProgress {
  projectId: ID;
  totalTasks: number;
  completedTasks: number;
  remainingTasks: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  percentComplete: number;        // 0..100
}

// ---------- Milestone ----------

export interface Milestone extends TenantScoped, Timestamped {
  id: ID;
  projectId: ID;
  name: string;
  description?: string;
  status: MilestoneStatus;
  plannedStartDate?: ISODate;
  plannedEndDate?: ISODate;
  actualStartDate?: ISODate;      // set when status → Ongoing
  actualEndDate?: ISODate;        // set when status → Completed
  orderIndex: number;             // for timeline ordering within a project
}

export interface MilestoneProgress {
  milestoneId: ID;
  totalTasks: number;
  completedTasks: number;
  percentComplete: number;
}

// ---------- Task ----------
// milestoneId === null means the task lives in the project's backlog.
// storyPoints is set at creation (by Manager) and credited to the assignee's
// ledger on transition to Done — not editable outside that flow.

export interface Task extends TenantScoped, Timestamped {
  id: ID;
  projectId: ID;
  milestoneId: ID | null;
  parentTaskId?: ID | null;       // reserved for future subtask support
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: ID | null;          // exactly one owner (spec: "one owner only")
  reporterId: ID;                 // who created / assigned it
  storyPoints: number;
  labels: string[];
  dueDate?: ISODate;
  estimatedHours?: number;        // planning input, not derived
  actualHours: number;            // DERIVED: sum of TimeLog.durationMinutes / 60
  orderIndex: number;             // ordering within a column / backlog
  completedAt?: ISODateTime;
}

// ---------- Personal Task ----------
// Private to a single employee. Never visible to Manager/HR. Enforced at query
// time in Phase B, not just in the UI.

export interface PersonalTask extends TenantScoped, Timestamped {
  id: ID;
  ownerId: ID;                    // Employee.id — sole visibility
  title: string;
  description?: string;
  isCompleted: boolean;
  dueDate?: ISODate;
  priority: TaskPriority;
}

// ---------- Comments, Checklist, Attachments ----------

export interface Comment extends TenantScoped, Timestamped {
  id: ID;
  taskId: ID;
  authorId: ID;
  body: string;                   // markdown; mentions parsed downstream
  editedAt?: ISODateTime;
}

export interface ChecklistItem extends TenantScoped, Timestamped {
  id: ID;
  taskId: ID;
  text: string;
  isChecked: boolean;
  checkedByEmployeeId?: ID;
  checkedAt?: ISODateTime;
  orderIndex: number;
}

export interface Attachment extends TenantScoped, Timestamped {
  id: ID;
  taskId: ID;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageUrl: string;             // storage backend deferred (open decision)
  uploadedByEmployeeId: ID;
}

// ---------- History / Audit ----------
// Generic old→new diff so any field change can be rendered on the Activity
// Timeline without adding a per-field entity.

export interface HistoryFieldChange {
  field: string;
  from: unknown;
  to: unknown;
}

export interface HistoryEntry extends TenantScoped {
  id: ID;
  eventType: HistoryEventType;
  actorId: ID;                    // Employee who caused the event (or system)
  occurredAt: ISODateTime;
  projectId?: ID;
  milestoneId?: ID;
  taskId?: ID;
  changes?: HistoryFieldChange[]; // for *Updated / *Changed events
  message?: string;               // human-readable fallback
}

// ---------- Story Points Ledger ----------
// Append-only. Leaderboard windows (Today/Week/Month/Year/AllTime) are just
// range queries over creditedAt — never a mutable counter on Employee.

export interface StoryPointLedgerEntry extends TenantScoped {
  id: ID;
  employeeId: ID;                 // recipient
  taskId: ID;
  projectId: ID;
  points: number;                 // usually positive; negative = adjustment
  creditedAt: ISODateTime;
  reason: "TASK_COMPLETED" | "ADJUSTMENT";
}

// ---------- Time Log ----------
// Append-only. Task.actualHours and the weekly team calendar are both derived
// from this table. Duration is stored in minutes to avoid float drift.
// Assumption (open decision): manual duration entry, not a live start/stop timer.

export interface TimeLog extends TenantScoped, Timestamped {
  id: ID;
  employeeId: ID;
  taskId: ID;
  projectId: ID;                  // denormalized for calendar-range queries
  workDate: ISODate;              // the calendar day the work is logged against
  durationMinutes: number;
  note?: string;
}

// ---------- Leaderboard view model ----------
// Not persisted — this is the shape the leaderboard endpoint returns.

export interface LeaderboardEntry {
  employeeId: ID;
  displayName: string;
  avatarUrl?: string;
  rank: number;
  totalPoints: number;
  tasksCompleted: number;
  window: LeaderboardWindow;
}

// ---------- Query / filter shapes ----------
// The frontend filter bar (A3.9) speaks these; the mock service layer accepts
// them (A2) and the backend list endpoints accept the identical shape (B2).

export interface Pageable {
  page: number;                   // 0-indexed
  size: number;
  sort?: string;                  // e.g. "dueDate,asc"
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface TaskFilters {
  projectId?: ID;
  milestoneId?: ID | "BACKLOG";   // sentinel: milestoneId IS NULL
  assigneeIds?: ID[];
  statuses?: TaskStatus[];
  priorities?: TaskPriority[];
  labels?: string[];
  dueBefore?: ISODate;
  dueAfter?: ISODate;
  search?: string;
}

export interface TimeLogFilters {
  employeeIds?: ID[];
  projectId?: ID;
  taskId?: ID;
  dateFrom: ISODate;              // range required — this table grows fast
  dateTo: ISODate;
}
