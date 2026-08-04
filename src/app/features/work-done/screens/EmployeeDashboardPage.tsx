import { useMemo } from "react";
import { Link } from "react-router";
import { format, isToday, parseISO } from "date-fns";
import { useAsync } from "../hooks/useAsync";
import { useCurrentActor } from "../hooks/useCurrentActor";
import { useTaskDrawer } from "../hooks/useTaskDrawer";
import { listTasks } from "../services/taskService";
import { listMilestones } from "../services/milestoneService";
import { listProjects } from "../services/projectService";
import { listOwnPersonalTasks, togglePersonalTask } from "../services/personalTaskService";
import { MilestoneStatus, Project, Task, TaskPriority, TaskStatus } from "../types";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Skeleton } from "../../../components/ui/skeleton";
import { Checkbox } from "../../../components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { AlertTriangle, CalendarClock, CheckCircle2, Flag, Lock, Zap } from "lucide-react";

const PRIORITY_LOOK: Record<TaskPriority, string> = {
  [TaskPriority.Low]:    "bg-slate-100 text-slate-700",
  [TaskPriority.Medium]: "bg-blue-100 text-blue-800",
  [TaskPriority.High]:   "bg-amber-100 text-amber-800",
  [TaskPriority.Urgent]: "bg-red-100 text-red-800",
};

const STATUS_LOOK: Record<TaskStatus, string> = {
  [TaskStatus.Backlog]:    "bg-slate-100 text-slate-600",
  [TaskStatus.Todo]:       "bg-slate-100 text-slate-700",
  [TaskStatus.InProgress]: "bg-blue-100 text-blue-800",
  [TaskStatus.InReview]:   "bg-amber-100 text-amber-800",
  [TaskStatus.Done]:       "bg-emerald-100 text-emerald-800",
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function EmployeeDashboardPage() {
  const actor = useCurrentActor();

  const { data: taskPage, isLoading: tasksLoading } = useAsync(
    () => listTasks({ assigneeIds: [actor.id] }, { page: 0, size: 500 }),
    { deps: [actor.id] }
  );
  const { data: milestones } = useAsync(() => listMilestones());
  const { data: projectPage } = useAsync(() => listProjects());
  const { data: personal } = useAsync(() => listOwnPersonalTasks(actor.id), { deps: [actor.id] });

  const tasks = taskPage?.content ?? [];
  const projectById = useMemo(() => {
    const m = new Map<string, Project>();
    for (const p of projectPage?.content ?? []) m.set(p.id, p);
    return m;
  }, [projectPage]);
  const ongoingMilestoneIds = useMemo(
    () => new Set((milestones ?? []).filter((m) => m.status === MilestoneStatus.Ongoing).map((m) => m.id)),
    [milestones]
  );

  const now = Date.now();
  const todayIso = new Date().toISOString().slice(0, 10);
  const sevenDaysIso = new Date(now + 7 * DAY_MS).toISOString().slice(0, 10);
  const weekAgoMs = now - 7 * DAY_MS;

  const active = tasks.filter((t) => t.status !== TaskStatus.Done);
  const dueToday = active.filter((t) => t.dueDate === todayIso);
  const overdue = active.filter((t) => t.dueDate && t.dueDate < todayIso);
  const upcoming = active.filter((t) => t.dueDate && t.dueDate > todayIso && t.dueDate <= sevenDaysIso);
  const inCurrentMilestone = active.filter((t) => t.milestoneId && ongoingMilestoneIds.has(t.milestoneId));
  const completed = tasks
    .filter((t) => t.status === TaskStatus.Done)
    .sort((a, b) => (a.completedAt && b.completedAt ? (a.completedAt < b.completedAt ? 1 : -1) : 0))
    .slice(0, 40);
  const pending = tasks.filter((t) => t.status === TaskStatus.Todo);

  const doneThisWeek = tasks.filter(
    (t) => t.status === TaskStatus.Done && t.completedAt && Date.parse(t.completedAt) >= weekAgoMs
  );
  const pointsThisWeek = doneThisWeek.reduce((s, t) => s + t.storyPoints, 0);

  if (tasksLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          {[0,1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-3 md:grid-cols-4">
        <Stat label="Assigned to me" value={`${active.length}`} icon={<Flag className="size-4 text-slate-400" />} />
        <Stat label="Overdue" value={`${overdue.length}`} icon={<AlertTriangle className="size-4 text-red-400" />} accent={overdue.length > 0 ? "text-red-700" : undefined} />
        <Stat label="Done this week" value={`${doneThisWeek.length}`} icon={<CheckCircle2 className="size-4 text-emerald-400" />} />
        <Stat label="Points this week" value={`${pointsThisWeek}`} icon={<Zap className="size-4 text-indigo-400" />} accent="text-indigo-700" />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="p-4">
          <Tabs defaultValue="my">
            <TabsList className="flex-wrap">
              <TabsTrigger value="my">My Tasks ({active.length})</TabsTrigger>
              <TabsTrigger value="today">Today ({dueToday.length})</TabsTrigger>
              <TabsTrigger value="overdue">Overdue ({overdue.length})</TabsTrigger>
              <TabsTrigger value="milestone">Current milestone ({inCurrentMilestone.length})</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
              <TabsTrigger value="done">Completed ({completed.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="my"        className="mt-4"><TaskList tasks={active} projectById={projectById} emptyText="Nothing on your plate — enjoy it." /></TabsContent>
            <TabsContent value="today"     className="mt-4"><TaskList tasks={dueToday} projectById={projectById} emptyText="Nothing due today." /></TabsContent>
            <TabsContent value="overdue"   className="mt-4"><TaskList tasks={overdue} projectById={projectById} emptyText="No overdue tasks. 👍" highlightOverdue /></TabsContent>
            <TabsContent value="milestone" className="mt-4"><TaskList tasks={inCurrentMilestone} projectById={projectById} emptyText="No tasks assigned in an active milestone." /></TabsContent>
            <TabsContent value="upcoming"  className="mt-4"><TaskList tasks={upcoming} projectById={projectById} emptyText="Nothing due in the next 7 days." /></TabsContent>
            <TabsContent value="pending"   className="mt-4"><TaskList tasks={pending} projectById={projectById} emptyText="Nothing pending." /></TabsContent>
            <TabsContent value="done"      className="mt-4"><TaskList tasks={completed} projectById={projectById} emptyText="No completed tasks yet." /></TabsContent>
          </Tabs>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            <Lock className="size-3.5" />
            Personal Reference
          </div>
          <p className="mb-3 text-[11px] text-slate-400">
            Private to you. Never visible to Manager or HR.
          </p>
          {!personal || personal.length === 0 ? (
            <p className="text-sm italic text-slate-400">No personal tasks.</p>
          ) : (
            <ul className="space-y-1.5">
              {personal.slice(0, 8).map((t) => (
                <li key={t.id} className="flex items-start gap-2">
                  <Checkbox
                    checked={t.isCompleted}
                    onCheckedChange={() => togglePersonalTask(t.id, actor.id)}
                    className="mt-0.5"
                  />
                  <span className={`text-sm ${t.isCompleted ? "text-slate-400 line-through" : "text-slate-700"}`}>
                    {t.title}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/admin/work-done/personal"
            className="mt-3 inline-block text-xs font-semibold text-blue-700 hover:underline"
          >
            Manage all →
          </Link>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  accent?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
        {icon}
      </div>
      <div className={`mt-1 text-2xl font-bold ${accent ?? "text-slate-950"}`}>{value}</div>
    </Card>
  );
}

interface TaskListProps {
  tasks: Task[];
  projectById: Map<string, Project>;
  emptyText: string;
  highlightOverdue?: boolean;
}

function TaskList({ tasks, projectById, emptyText, highlightOverdue }: TaskListProps) {
  const openDrawer = useTaskDrawer((s) => s.open);
  if (tasks.length === 0) {
    return <p className="py-10 text-center text-sm italic text-slate-400">{emptyText}</p>;
  }
  return (
    <ul className="divide-y divide-slate-100">
      {tasks.map((t) => {
        const project = projectById.get(t.projectId);
        return (
          <li key={t.id}>
            <button
              onClick={() => openDrawer(t.id)}
              className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-slate-50/70"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  {project && (
                    <Badge variant="outline" className="font-mono text-[10px]">{project.key}</Badge>
                  )}
                  <p className="truncate text-sm font-semibold text-slate-800">{t.title}</p>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <Badge className={`px-1.5 py-0 text-[10px] ${PRIORITY_LOOK[t.priority]}`}>{t.priority}</Badge>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${STATUS_LOOK[t.status]}`}>
                    {t.status.replaceAll("_", " ")}
                  </span>
                  <span className="inline-flex items-center gap-0.5 rounded bg-indigo-100 px-1.5 py-0.5 font-semibold text-indigo-800">
                    <Zap className="size-3" />
                    {t.storyPoints}
                  </span>
                  {t.dueDate && (
                    <span
                      className={`inline-flex items-center gap-0.5 ${
                        highlightOverdue
                          ? "font-semibold text-red-700"
                          : isToday(parseISO(t.dueDate))
                          ? "font-semibold text-blue-700"
                          : "text-slate-500"
                      }`}
                    >
                      <CalendarClock className="size-3" />
                      {format(parseISO(t.dueDate), "MMM d")}
                    </span>
                  )}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
