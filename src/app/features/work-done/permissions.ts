// Phase 0 — Foundations: Role × Action permission matrix.
// Single source of truth for both frontend conditional rendering (Phase A4)
// and backend authorization (Phase B6). The human-readable version lives at
// docs/permission-matrix.md and MUST stay in sync with this file.

import { Role } from "./types";

// Every gated user-facing action in the module. Keep names stable — they are
// referenced by <Can action="..."> and by backend policy annotations.
export type Action =
  // Projects
  | "project.create"
  | "project.edit"
  | "project.archive"
  | "project.viewAll"
  // Milestones
  | "milestone.create"
  | "milestone.edit"
  | "milestone.start"
  | "milestone.complete"
  // Tasks — assigned
  | "task.create"
  | "task.assign"
  | "task.editOwn"
  | "task.editOthers"
  | "task.transferOwnership"
  | "task.setStoryPoints"
  | "task.changeStatus"
  | "task.delete"
  | "task.viewOthers"
  // Task interactions
  | "task.comment"
  | "task.checklist.toggleOwn"
  | "task.checklist.toggleOthers"
  | "task.attachment.upload"
  // Personal tasks — always self-scoped; no role can ever see another's
  | "personalTask.create"
  | "personalTask.viewOwn"
  // Backlog moves
  | "task.moveToBacklog"
  | "task.moveToMilestone"
  // Time logging
  | "timeLog.logOwn"
  | "timeLog.editOwn"
  | "timeLog.viewOwn"
  | "timeLog.viewTeam"
  // Reporting
  | "report.view"
  | "leaderboard.view"
  | "leaderboard.viewFullBreakdown";

// The matrix. `true` = allowed, `false` = denied. Anything HR touches that
// *mutates* stays false — HR is read-only across the board per spec.
export const PERMISSIONS: Record<Action, Record<Role, boolean>> = {
  // Projects
  "project.create":          { [Role.Manager]: true,  [Role.HR]: false, [Role.Employee]: false },
  "project.edit":            { [Role.Manager]: true,  [Role.HR]: false, [Role.Employee]: false },
  "project.archive":         { [Role.Manager]: true,  [Role.HR]: false, [Role.Employee]: false },
  "project.viewAll":         { [Role.Manager]: true,  [Role.HR]: true,  [Role.Employee]: false },

  // Milestones
  "milestone.create":        { [Role.Manager]: true,  [Role.HR]: false, [Role.Employee]: false },
  "milestone.edit":          { [Role.Manager]: true,  [Role.HR]: false, [Role.Employee]: false },
  "milestone.start":         { [Role.Manager]: true,  [Role.HR]: false, [Role.Employee]: false },
  "milestone.complete":      { [Role.Manager]: true,  [Role.HR]: false, [Role.Employee]: false },

  // Tasks — assigned
  "task.create":             { [Role.Manager]: true,  [Role.HR]: false, [Role.Employee]: false },
  "task.assign":             { [Role.Manager]: true,  [Role.HR]: false, [Role.Employee]: false },
  "task.editOwn":            { [Role.Manager]: true,  [Role.HR]: false, [Role.Employee]: true  },
  "task.editOthers":         { [Role.Manager]: true,  [Role.HR]: false, [Role.Employee]: false },
  "task.transferOwnership":  { [Role.Manager]: true,  [Role.HR]: false, [Role.Employee]: true  },
  "task.setStoryPoints":     { [Role.Manager]: true,  [Role.HR]: false, [Role.Employee]: false },
  "task.changeStatus":       { [Role.Manager]: true,  [Role.HR]: false, [Role.Employee]: true  },
  "task.delete":             { [Role.Manager]: true,  [Role.HR]: false, [Role.Employee]: false },
  "task.viewOthers":         { [Role.Manager]: true,  [Role.HR]: true,  [Role.Employee]: true  },

  // Task interactions
  "task.comment":            { [Role.Manager]: true,  [Role.HR]: false, [Role.Employee]: true  },
  "task.checklist.toggleOwn":    { [Role.Manager]: true, [Role.HR]: false, [Role.Employee]: true  },
  "task.checklist.toggleOthers": { [Role.Manager]: true, [Role.HR]: false, [Role.Employee]: false },
  "task.attachment.upload":  { [Role.Manager]: true,  [Role.HR]: false, [Role.Employee]: true  },

  // Personal tasks — no role can ever see another's; viewOwn is the only view.
  "personalTask.create":     { [Role.Manager]: true,  [Role.HR]: true,  [Role.Employee]: true  },
  "personalTask.viewOwn":    { [Role.Manager]: true,  [Role.HR]: true,  [Role.Employee]: true  },

  // Backlog moves — status transition is a task edit; ownership rules apply
  // via the resource-scope check below (assignee OR manager).
  "task.moveToBacklog":      { [Role.Manager]: true,  [Role.HR]: false, [Role.Employee]: true  },
  "task.moveToMilestone":    { [Role.Manager]: true,  [Role.HR]: false, [Role.Employee]: true  },

  // Time logging
  "timeLog.logOwn":          { [Role.Manager]: true,  [Role.HR]: false, [Role.Employee]: true  },
  "timeLog.editOwn":         { [Role.Manager]: true,  [Role.HR]: false, [Role.Employee]: true  },
  "timeLog.viewOwn":         { [Role.Manager]: true,  [Role.HR]: true,  [Role.Employee]: true  },
  "timeLog.viewTeam":        { [Role.Manager]: true,  [Role.HR]: true,  [Role.Employee]: false },

  // Reporting
  "report.view":                    { [Role.Manager]: true, [Role.HR]: true,  [Role.Employee]: false },
  "leaderboard.view":               { [Role.Manager]: true, [Role.HR]: true,  [Role.Employee]: true  },
  "leaderboard.viewFullBreakdown":  { [Role.Manager]: true, [Role.HR]: true,  [Role.Employee]: false },
};

// A few actions carry an implicit resource-scope check beyond the role bit
// (e.g. Employee may edit ONLY their own task). Enforcement lives here so the
// UI hook and the backend policy service can share it verbatim.
export interface PermissionContext {
  actorId: string;
  actorRole: Role;
  // For task/personal-task actions: the assignee/owner of the resource.
  resourceOwnerId?: string;
}

export function can(action: Action, ctx: PermissionContext): boolean {
  const roleAllowed = PERMISSIONS[action]?.[ctx.actorRole] ?? false;
  if (!roleAllowed) return false;

  // Resource-scoped rules that the role-bit alone can't express.
  if (ctx.actorRole === Role.Employee) {
    switch (action) {
      case "task.editOwn":
      case "task.changeStatus":
      case "task.transferOwnership":
      case "task.moveToBacklog":
      case "task.moveToMilestone":
      case "task.checklist.toggleOwn":
      case "task.attachment.upload":
        return ctx.resourceOwnerId === ctx.actorId;
      case "timeLog.logOwn":
      case "timeLog.editOwn":
        return ctx.resourceOwnerId === ctx.actorId;
      default:
        return true;
    }
  }
  return true;
}
