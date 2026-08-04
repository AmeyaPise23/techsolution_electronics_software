# Permission Matrix — Work Management Module (Phase 0)

Human-readable mirror of `src/app/features/work-done/permissions.ts`. If you edit either, update both. The `can()` helper in `permissions.ts` layers a resource-scope check on top of these role bits (e.g. Employee `task.editOwn` requires `resourceOwnerId === actorId`).

Legend: ✅ allowed · ❌ denied · 🔒 allowed only for self-owned resource

| Action | Manager | HR | Employee |
| --- | --- | --- | --- |
| **Projects** | | | |
| `project.create` | ✅ | ❌ | ❌ |
| `project.edit` | ✅ | ❌ | ❌ |
| `project.archive` | ✅ | ❌ | ❌ |
| `project.viewAll` | ✅ | ✅ | ❌ |
| **Milestones** | | | |
| `milestone.create` | ✅ | ❌ | ❌ |
| `milestone.edit` | ✅ | ❌ | ❌ |
| `milestone.start` | ✅ | ❌ | ❌ |
| `milestone.complete` | ✅ | ❌ | ❌ |
| **Tasks (assigned)** | | | |
| `task.create` | ✅ | ❌ | ❌ |
| `task.assign` | ✅ | ❌ | ❌ |
| `task.editOwn` | ✅ | ❌ | 🔒 |
| `task.editOthers` | ✅ | ❌ | ❌ |
| `task.transferOwnership` | ✅ | ❌ | 🔒 |
| `task.setStoryPoints` | ✅ | ❌ | ❌ |
| `task.changeStatus` | ✅ | ❌ | 🔒 |
| `task.delete` | ✅ | ❌ | ❌ |
| `task.viewOthers` | ✅ | ✅ | ✅ |
| **Task interactions** | | | |
| `task.comment` | ✅ | ❌ | ✅ |
| `task.checklist.toggleOwn` | ✅ | ❌ | 🔒 |
| `task.checklist.toggleOthers` | ✅ | ❌ | ❌ |
| `task.attachment.upload` | ✅ | ❌ | 🔒 |
| **Backlog moves** | | | |
| `task.moveToBacklog` | ✅ | ❌ | 🔒 |
| `task.moveToMilestone` | ✅ | ❌ | 🔒 |
| **Personal tasks** (never visible across users, regardless of role) | | | |
| `personalTask.create` | ✅ | ✅ | ✅ |
| `personalTask.viewOwn` | ✅ | ✅ | ✅ |
| **Time logging** | | | |
| `timeLog.logOwn` | ✅ | ❌ | 🔒 |
| `timeLog.editOwn` | ✅ | ❌ | 🔒 |
| `timeLog.viewOwn` | ✅ | ✅ | ✅ |
| `timeLog.viewTeam` | ✅ | ✅ | ❌ |
| **Reporting** | | | |
| `report.view` | ✅ | ✅ | ❌ |
| `leaderboard.view` | ✅ | ✅ | ✅ |
| `leaderboard.viewFullBreakdown` | ✅ | ✅ | ❌ |

## Design notes

- **HR is read-only** everywhere except personal tasks (which are self-scoped for everyone).
- **Personal tasks are private at the query level.** Even Manager and HR cannot list, read, or search another user's personal tasks. Phase B enforces this at the repository layer, not just in service methods.
- **"One owner only"** for tasks — `task.transferOwnership` is how ownership changes hands. Employees can transfer their own task; Managers can transfer any.
- **Story points are Manager-set at creation, credited on Done.** There is no employee-facing action to edit points post-hoc; adjustments (`StoryPointsAdjusted`) are a Manager path modeled via `task.setStoryPoints`.
- **Backlog is a state, not a place.** `task.moveToBacklog` sets `milestoneId = null`; `task.moveToMilestone` sets it. Same permission rules as any other task edit.
- **Leaderboard visibility is universal, breakdown is not.** Everyone sees the ranking; only Manager/HR see the per-window drill-down (`leaderboard.viewFullBreakdown`).

## Open decisions this matrix depends on

- **Time-entry visibility across teammates** for Employee role: current default is `timeLog.viewTeam = false` for Employee. Flip if you want a team-capacity view visible to everyone.
- **Kanban status columns**: matrix does not enumerate columns; `task.changeStatus` gates any transition. The specific column list lives in `types.ts` (`TaskStatus`).
