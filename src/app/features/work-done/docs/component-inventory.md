# Component Inventory & Gap List — Work Management Module (Phase 0)

Audit of the existing design system vs. what this module needs. New components must consume existing color/spacing/typography tokens (Tailwind config + `src/app/components/ui/*`), not introduce new ones.

## Reused as-is (already in `src/app/components/ui/`)

| Component | Where in this module |
| --- | --- |
| `button` | Every action affordance; primary/secondary variants for milestone start/complete, task create, transfer ownership. |
| `input`, `textarea`, `label`, `form` | Task/milestone/project create + edit forms; comment composer. |
| `dialog` | Create-project, create-milestone, create-task modals. |
| `sheet` / `drawer` | **Task Details Drawer (A3.5)** — pick one; `sheet` is the shadcn side-panel and is the better semantic fit. |
| `dropdown-menu`, `context-menu` | Card row actions (Move to milestone, Transfer, Delete); milestone kebab menu. |
| `select` | Filter bar (assignee, priority, milestone, status); task-edit fields. |
| `command` | Global search (A3.9) and quick-jump (⌘K style). |
| `tabs` | Task Details Drawer tabs (Details/Comments/Checklist/Attachments/Time Log/Activity); Leaderboard time-window tabs. |
| `avatar` | Assignee, comment authors, leaderboard rows. |
| `badge` | Priority chip, label chips, status chip on cards. |
| `card`, `separator`, `scroll-area` | Overview page, Kanban columns, drawer sections. |
| `progress` | Project/milestone progress bars on Overview. |
| `calendar`, `popover` | Due-date picker; "Log time on this day" quick-entry. |
| `checkbox` | Checklist items. |
| `tooltip` | Truncated titles, avatar hover names, action affordance hints. |
| `skeleton` | Loading states across all boards and the drawer. |
| `alert-dialog` | Destructive confirmations (delete task, complete milestone). |
| `table`, `pagination` | Leaderboard, Employee Dashboard list views, Reports. |
| `sonner` | Toast feedback for create/edit/transfer/status-change actions. |
| `hover-card` | Employee profile hover on avatars in cards & timeline. |
| `switch` | Manager-only view toggles on Leaderboard/Reports. |

## Net-new components (build for this module, still on existing tokens)

| Component | Purpose | Depends on |
| --- | --- | --- |
| `<KanbanCard>` | Task summary card used on the Kanban Board and Backlog. Title, priority chip, assignee avatar, story-point pill, label chips, due-date indicator. | `card`, `badge`, `avatar`, `tooltip` |
| `<StoryPointPill>` | Small numeric pill styled distinctly from priority/label badges. | `badge` (variant) |
| `<KanbanColumn>` | Column header (name + count) and drop-zone wrapper. | `scroll-area` |
| `<KanbanBoardLayout>` | Horizontal-scrolling grid of `<KanbanColumn>` with responsive stack on narrow widths. | — |
| `<BacklogRow>` | Denser row variant of `<KanbanCard>` for the Backlog list. | `card`, `badge` |
| `<MilestoneTimelineBar>` | Horizontal bar on the Timeline view — status color, start/end labels, hover popover with actions. | `tooltip`, `popover`, `hover-card` |
| `<MilestoneSummaryCard>` | Overview page milestone cards with status color and progress. | `card`, `progress`, `badge` |
| `<ProjectProgressCard>` | Overview page header progress ring/bar + quick stats. | `card`, `progress` |
| `<TaskDetailsDrawer>` | The drawer container that opens over any board without losing scroll; wires the Details/Comments/Checklist/Attachments/Time Log/Activity tabs. | `sheet`, `tabs` |
| `<ActivityTimelineEntry>` | Single history entry rendered from a `HistoryEntry` (old→new diff, actor avatar, timestamp). | `avatar`, `tooltip` |
| `<CommentThread>` + `<CommentComposer>` | Comment list and markdown composer with mentions. | `textarea`, `avatar` |
| `<ChecklistList>` | Ordered, reorderable checklist. | `checkbox`, `input` |
| `<AttachmentList>` + `<AttachmentDropzone>` | Upload + list; storage backend deferred (open decision). | `button`, `progress` |
| `<TimeLogList>` | Per-task list of logged entries with edit-own affordance. | `table` |
| `<LogTimeDialog>` | Quick "log 2.5h against Task X on <date>" form. | `dialog`, `input`, `calendar` |
| `<TeamWeekCalendar>` | The A3.3 week grid — employees × days matrix of time blocks. Days-across × employees-down layout; each cell aggregates that employee's `TimeLog` entries for that day. | `scroll-area`, `hover-card`, `tooltip` |
| `<WeekPicker>` | ISO-week navigator for the calendar. | `button`, `popover` |
| `<TimeBlock>` | Single stacked entry inside a calendar cell (task, project, duration). | `badge` |
| `<LeaderboardRow>` | Rank + avatar + name + points + delta; "you" highlight variant. | `avatar`, `badge` |
| `<LeaderboardWindowTabs>` | Today/Week/Month/Year/All-time tab strip. | `tabs` |
| `<PermissionGate>` (`<Can action="...">`) | Wraps children; hides or disables based on `can()` from `permissions.ts`. Purely declarative, no styling. | `permissions.ts` |
| `<FilterBar>` | Shared assignee/priority/status/milestone/label filter row used by Board, Backlog, and Dashboard. | `select`, `command`, `badge` |
| `<EmptyState>` | Shared empty-state shell (icon + title + CTA) — used across every board. | `button` |

## Notes

- The existing `src/app/features/work-done/components/*` (Board.tsx, Column.tsx, Task.tsx, TaskModal.tsx, TimeTracker.tsx) is a day-scheduler (time-block, minutes-on-y-axis) — **not** the Jira-style Kanban board this spec talks about. Treat it as a separate pre-existing asset; reconciliation happens in **Phase A5**, not now.
- No new color, spacing, or typography tokens are introduced. Status colors reuse the existing semantic-color scale (`text-primary`, `bg-muted`, etc.). If a Kanban column color palette is needed, it maps to existing tokens rather than adding brand hues.
- Drag-and-drop library: the existing scheduler uses `@dnd-kit/core`. Reuse the same dependency for the Kanban/Backlog boards (A3.4 and A5) to avoid a second DnD stack.
