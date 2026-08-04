import { useMemo, useState } from "react";
import { useOutletContext } from "react-router";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { KanbanColumn } from "../components/KanbanColumn";
import { FilterBar, FilterBarValue } from "../components/FilterBar";
import { useAsync } from "../hooks/useAsync";
import { useCurrentActor } from "../hooks/useCurrentActor";
import { usePermission } from "../hooks/usePermission";
import { listMilestones } from "../services/milestoneService";
import { listTasks, changeTaskStatus } from "../services/taskService";
import { listEmployees } from "../services/employeeService";
import { MilestoneStatus, Project, TaskStatus } from "../types";
import { Skeleton } from "../../../components/ui/skeleton";
import { Card } from "../../../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { toast } from "sonner";

interface ProjectShellCtx {
  project: Project;
}

// Columns rendered left-to-right. Backlog lives on its own page, so the board
// hides it — the spec's Backlog Board is the correct home for that column.
const BOARD_COLUMNS: TaskStatus[] = [
  TaskStatus.Todo,
  TaskStatus.InProgress,
  TaskStatus.InReview,
  TaskStatus.Done,
];

export function KanbanBoardPage() {
  const { project } = useOutletContext<ProjectShellCtx>();
  const actor = useCurrentActor();
  const canDrag = usePermission("task.changeStatus"); // resource-scope enforced per-card in service

  const { data: milestones, isLoading: msLoading } = useAsync(
    () => listMilestones({ projectId: project.id }),
    { deps: [project.id] }
  );
  const { data: employees } = useAsync(() => listEmployees());

  // Default scope: the Ongoing milestone if any, else the first one.
  const defaultMilestoneId = useMemo(() => {
    if (!milestones || milestones.length === 0) return "";
    const ongoing = milestones.find((m) => m.status === MilestoneStatus.Ongoing);
    return ongoing?.id ?? milestones[0].id;
  }, [milestones]);

  const [milestoneId, setMilestoneId] = useState<string>("");
  const effectiveMilestoneId = milestoneId || defaultMilestoneId;

  const [filters, setFilters] = useState<FilterBarValue>({});

  const { data: taskPage, isLoading: tasksLoading } = useAsync(
    () =>
      effectiveMilestoneId
        ? listTasks(
            {
              projectId: project.id,
              milestoneId: effectiveMilestoneId,
              search: filters.search,
              assigneeIds: filters.assigneeIds,
              priorities: filters.priorities,
              labels: filters.labels,
              // Board columns already partition by status; ignore status filter
              // from the filter bar for the Board — it would just hide columns.
            },
            { page: 0, size: 500 }
          )
        : Promise.resolve({ content: [], page: 0, size: 0, totalElements: 0, totalPages: 0 }),
    {
      deps: [
        project.id,
        effectiveMilestoneId,
        filters.search,
        JSON.stringify(filters.assigneeIds),
        JSON.stringify(filters.priorities),
        JSON.stringify(filters.labels),
      ],
    }
  );

  const availableLabels = useMemo(() => {
    const set = new Set<string>();
    for (const t of taskPage?.content ?? []) for (const l of t.labels) set.add(l);
    return [...set].sort();
  }, [taskPage]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function handleDragEnd(evt: DragEndEvent) {
    const overId = evt.over?.id;
    if (!overId || !evt.active) return;
    const overData = evt.over?.data.current as { status?: TaskStatus } | undefined;
    const nextStatus = overData?.status;
    if (!nextStatus) return;
    const activeData = evt.active.data.current as { taskId?: string; currentStatus?: TaskStatus } | undefined;
    if (!activeData?.taskId || activeData.currentStatus === nextStatus) return;
    try {
      await changeTaskStatus(activeData.taskId, nextStatus, actor.id);
      if (nextStatus === TaskStatus.Done) {
        toast.success("Task marked done — story points credited");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  if (msLoading || !milestones) {
    return (
      <div className="flex gap-3">
        {BOARD_COLUMNS.map((c) => <Skeleton key={c} className="h-96 w-72 rounded-lg" />)}
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-slate-500">
        This project has no milestones yet — create one from the Timeline tab.
      </Card>
    );
  }

  const tasks = taskPage?.content ?? [];
  const byStatus = new Map<TaskStatus, typeof tasks>();
  for (const c of BOARD_COLUMNS) byStatus.set(c, []);
  for (const t of tasks) {
    const bucket = byStatus.get(t.status);
    if (bucket) bucket.push(t);
  }
  for (const bucket of byStatus.values()) {
    bucket.sort((a, b) => a.orderIndex - b.orderIndex);
  }

  return (
    <div className="flex h-[calc(100vh-280px)] min-h-[500px] flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Milestone</span>
        <Select value={effectiveMilestoneId} onValueChange={setMilestoneId}>
          <SelectTrigger className="h-8 w-72 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {milestones.map((m) => (
              <SelectItem key={m.id} value={m.id} className="text-sm">
                <span className="mr-2 inline-block w-16 text-[10px] font-semibold uppercase text-slate-400">
                  {m.status}
                </span>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!canDrag && (
          <span className="text-xs text-slate-400">
            (You can’t change status on tasks you don’t own — try Preview as Manager.)
          </span>
        )}
      </div>

      <FilterBar
        value={filters}
        onChange={setFilters}
        show={{ assignee: true, priority: true, label: true }}
        availableLabels={availableLabels}
      />

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 gap-3 overflow-x-auto pb-2">
          {tasksLoading ? (
            BOARD_COLUMNS.map((c) => <Skeleton key={c} className="h-full w-72 rounded-lg" />)
          ) : (
            BOARD_COLUMNS.map((c) => (
              <KanbanColumn
                key={c}
                status={c}
                tasks={byStatus.get(c) ?? []}
                employees={employees ?? []}
              />
            ))
          )}
        </div>
      </DndContext>
    </div>
  );
}
