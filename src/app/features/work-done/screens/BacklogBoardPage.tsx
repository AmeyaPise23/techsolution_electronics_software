import { useOutletContext } from "react-router";
import { useMemo, useState } from "react";
import { useAsync } from "../hooks/useAsync";
import { useCurrentActor } from "../hooks/useCurrentActor";
import { listTasks, moveTaskToMilestone } from "../services/taskService";
import { listMilestones } from "../services/milestoneService";
import { listEmployees } from "../services/employeeService";
import { useTaskDrawer } from "../hooks/useTaskDrawer";
import { FilterBar, FilterBarValue } from "../components/FilterBar";
import { Milestone, MilestoneStatus, Project, Task, TaskPriority } from "../types";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Skeleton } from "../../../components/ui/skeleton";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Can } from "../components/Can";
import { toast } from "sonner";
import { Calendar, Flag, Zap } from "lucide-react";

interface ProjectShellCtx {
  project: Project;
}

const PRIORITY_LOOK: Record<TaskPriority, string> = {
  [TaskPriority.Low]:    "bg-slate-100 text-slate-700",
  [TaskPriority.Medium]: "bg-blue-100 text-blue-800",
  [TaskPriority.High]:   "bg-amber-100 text-amber-800",
  [TaskPriority.Urgent]: "bg-red-100 text-red-800",
};

function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function BacklogBoardPage() {
  const { project } = useOutletContext<ProjectShellCtx>();
  const [filters, setFilters] = useState<FilterBarValue>({});

  const { data: taskPage, isLoading } = useAsync(
    () =>
      listTasks(
        {
          projectId: project.id,
          milestoneId: "BACKLOG",
          search: filters.search,
          assigneeIds: filters.assigneeIds,
          priorities: filters.priorities,
          labels: filters.labels,
        },
        { page: 0, size: 500 }
      ),
    {
      deps: [
        project.id,
        filters.search,
        JSON.stringify(filters.assigneeIds),
        JSON.stringify(filters.priorities),
        JSON.stringify(filters.labels),
      ],
    }
  );
  const { data: milestones } = useAsync(
    () => listMilestones({ projectId: project.id }),
    { deps: [project.id] }
  );
  const { data: employees } = useAsync(() => listEmployees());

  // Only Planned or Ongoing milestones are valid move targets — Completed
  // milestones are archived and cannot accept new tasks.
  const targetMilestones =
    milestones?.filter(
      (m) => m.status === MilestoneStatus.Planned || m.status === MilestoneStatus.Ongoing
    ) ?? [];

  if (isLoading || !taskPage) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full rounded-md" />)}
      </div>
    );
  }

  const tasks = taskPage.content;
  const availableLabels = [...new Set(tasks.flatMap((t) => t.labels))].sort();

  return (
    <div className="space-y-3">
      <FilterBar
        value={filters}
        onChange={setFilters}
        show={{ assignee: true, priority: true, label: true }}
        availableLabels={availableLabels}
      />
    <Card className="p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Backlog</h3>
        <span className="text-xs text-slate-400">{tasks.length} tasks</span>
      </div>
      {tasks.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
          Backlog is empty.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {tasks.map((t) => (
            <BacklogRow
              key={t.id}
              task={t}
              assigneeName={employees?.find((e) => e.id === t.assigneeId)?.displayName}
              targetMilestones={targetMilestones}
            />
          ))}
        </ul>
      )}
    </Card>
    </div>
  );
}

interface BacklogRowProps {
  task: Task;
  assigneeName?: string;
  targetMilestones: Milestone[];
}

function BacklogRow({ task, assigneeName, targetMilestones }: BacklogRowProps) {
  const actor = useCurrentActor();
  const openDrawer = useTaskDrawer((s) => s.open);
  const [moving, setMoving] = useState(false);

  async function moveTo(milestoneId: string) {
    setMoving(true);
    try {
      await moveTaskToMilestone(task.id, milestoneId, actor.id);
      toast.success("Moved to milestone");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to move");
    } finally {
      setMoving(false);
    }
  }

  return (
    <li className="flex flex-wrap items-center gap-3 py-2.5">
      <button
        onClick={() => openDrawer(task.id)}
        className="min-w-0 flex-1 text-left"
      >
        <p className="truncate text-sm font-semibold text-slate-800 hover:text-blue-800">{task.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
          <Badge className={`px-1.5 py-0 text-[10px] ${PRIORITY_LOOK[task.priority]}`}>{task.priority}</Badge>
          <span className="inline-flex items-center gap-0.5 rounded bg-indigo-100 px-1.5 py-0.5 font-semibold text-indigo-800">
            <Zap className="size-3" />
            {task.storyPoints}
          </span>
          {task.labels.map((l) => (
            <span key={l} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
              {l}
            </span>
          ))}
          {task.dueDate && (
            <span className="inline-flex items-center gap-0.5 text-slate-500">
              <Calendar className="size-3" />
              {task.dueDate}
            </span>
          )}
        </div>
      </button>

      <div className="flex items-center gap-2">
        {task.assigneeId ? (
          <Avatar className="size-6">
            <AvatarFallback className="bg-blue-100 text-[10px] font-bold text-blue-800">
              {initials(assigneeName ?? task.assigneeId)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <span className="text-[10px] text-slate-400">Unassigned</span>
        )}
        <Can
          action="task.moveToMilestone"
          resourceOwnerId={task.assigneeId ?? undefined}
          fallback={
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled>
              Read-only
            </Button>
          }
        >
          <Select
            value=""
            onValueChange={(v) => v && moveTo(v)}
            disabled={moving || targetMilestones.length === 0}
          >
            <SelectTrigger className="h-7 w-40 text-xs">
              <span className="inline-flex items-center gap-1">
                <Flag className="size-3" />
                <SelectValue placeholder={targetMilestones.length === 0 ? "No target" : "Move to…"} />
              </span>
            </SelectTrigger>
            <SelectContent>
              {targetMilestones.map((m) => (
                <SelectItem key={m.id} value={m.id} className="text-xs">
                  <span className="mr-2 text-[10px] uppercase text-slate-400">{m.status}</span>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Can>
      </div>
    </li>
  );
}
