import { useOutletContext, Link } from "react-router";
import { useAsync } from "../hooks/useAsync";
import { getProjectProgress } from "../services/projectService";
import { listMilestones } from "../services/milestoneService";
import { listTasks } from "../services/taskService";
import { listHistory } from "../services/historyService";
import { listEmployees } from "../services/employeeService";
import { Project, MilestoneStatus, TaskStatus, Milestone, Employee } from "../types";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Skeleton } from "../../../components/ui/skeleton";
import { Progress } from "../../../components/ui/progress";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import {
  CheckCircle2,
  CircleDot,
  Circle,
  Flag,
  Users,
  Zap,
} from "lucide-react";

interface ProjectShellCtx {
  project: Project;
}

const MILESTONE_STATUS_LOOK: Record<
  MilestoneStatus,
  { label: string; color: string; ring: string; icon: React.ComponentType<{ className?: string }> }
> = {
  [MilestoneStatus.Planned]:   { label: "Planned",   color: "text-slate-500 bg-slate-100",       ring: "ring-slate-200",  icon: Circle },
  [MilestoneStatus.Ongoing]:   { label: "Ongoing",   color: "text-emerald-700 bg-emerald-100",   ring: "ring-emerald-300", icon: CircleDot },
  [MilestoneStatus.Completed]: { label: "Completed", color: "text-blue-700 bg-blue-100",         ring: "ring-blue-300",   icon: CheckCircle2 },
};

function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function ProjectOverviewPage() {
  const { project } = useOutletContext<ProjectShellCtx>();
  const { data: progress, isLoading: loadingProg } = useAsync(
    () => getProjectProgress(project.id),
    { deps: [project.id] }
  );
  const { data: milestones, isLoading: loadingMs } = useAsync(
    () => listMilestones({ projectId: project.id }),
    { deps: [project.id] }
  );
  const { data: taskPage } = useAsync(
    () => listTasks({ projectId: project.id }, { page: 0, size: 1000 }),
    { deps: [project.id] }
  );
  const { data: history } = useAsync(
    () => listHistory({ projectId: project.id, limit: 6 }),
    { deps: [project.id] }
  );
  const { data: employees } = useAsync(() => listEmployees());

  const memberEmployees =
    employees?.filter((e) => project.memberIds.includes(e.id)) ?? [];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Progress"
          value={progress ? `${progress.percentComplete}%` : "—"}
          isLoading={loadingProg}
          accent="text-blue-700"
        >
          <Progress value={progress?.percentComplete ?? 0} className="mt-2 h-1.5" />
        </StatCard>
        <StatCard
          label="Tasks"
          value={progress ? `${progress.completedTasks} / ${progress.totalTasks}` : "—"}
          isLoading={loadingProg}
          hint={progress ? `${progress.remainingTasks} remaining` : undefined}
          icon={<Flag className="size-4 text-slate-400" />}
        />
        <StatCard
          label="Story points"
          value={progress ? `${progress.completedStoryPoints} / ${progress.totalStoryPoints}` : "—"}
          isLoading={loadingProg}
          icon={<Zap className="size-4 text-slate-400" />}
        />
        <StatCard
          label="Team"
          value={`${project.memberIds.length}`}
          hint="members"
          icon={<Users className="size-4 text-slate-400" />}
        />
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Milestones</h3>
          <Link
            to={`/admin/work-done/projects/${project.id}/timeline`}
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            View timeline →
          </Link>
        </div>
        {loadingMs || !milestones ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
          </div>
        ) : milestones.length === 0 ? (
          <Card className="p-6 text-center text-sm text-slate-500">
            No milestones yet.
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {milestones.map((m) => (
              <MilestoneCard
                key={m.id}
                milestone={m}
                tasks={taskPage?.content.filter((t) => t.milestoneId === m.id) ?? []}
              />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            Recent activity
          </h3>
          {!history ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-8 rounded-md" />)}
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-slate-500">No activity yet.</p>
          ) : (
            <ol className="space-y-3">
              {history.map((h) => (
                <li key={h.id} className="flex items-start gap-3 text-sm">
                  <span className="mt-1 inline-flex size-2 shrink-0 rounded-full bg-slate-300" />
                  <div className="flex-1">
                    <p className="text-slate-700">{h.message ?? h.eventType}</p>
                    <p className="text-xs text-slate-400">{formatWhen(h.occurredAt)}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Team</h3>
          {memberEmployees.length === 0 ? (
            <p className="text-sm text-slate-500">No members.</p>
          ) : (
            <ul className="space-y-2">
              {memberEmployees.map((e) => (
                <MemberRow key={e.id} employee={e} />
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  accent,
  isLoading,
  children,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  accent?: string;
  isLoading?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
        {icon}
      </div>
      {isLoading ? (
        <Skeleton className="mt-2 h-7 w-20" />
      ) : (
        <div className={`mt-1 text-2xl font-bold ${accent ?? "text-slate-950"}`}>{value}</div>
      )}
      {hint && <div className="text-xs text-slate-400">{hint}</div>}
      {children}
    </Card>
  );
}

function MilestoneCard({ milestone, tasks }: { milestone: Milestone; tasks: { status: TaskStatus }[] }) {
  const look = MILESTONE_STATUS_LOOK[milestone.status];
  const StatusIcon = look.icon;
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === TaskStatus.Done).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <Card className={`p-4 ring-1 ${look.ring}`}>
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-bold text-slate-950">{milestone.name}</h4>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${look.color}`}>
          <StatusIcon className="size-3" />
          {look.label}
        </span>
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{done} / {total} tasks</span>
          <span className="font-semibold text-slate-700">{pct}%</span>
        </div>
        <Progress value={pct} className="h-1.5" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
        <div>
          <div className="uppercase tracking-wide text-slate-400">Start</div>
          <div className="font-medium text-slate-700">{milestone.actualStartDate ?? milestone.plannedStartDate ?? "—"}</div>
        </div>
        <div>
          <div className="uppercase tracking-wide text-slate-400">End</div>
          <div className="font-medium text-slate-700">{milestone.actualEndDate ?? milestone.plannedEndDate ?? "—"}</div>
        </div>
      </div>
    </Card>
  );
}

function MemberRow({ employee }: { employee: Employee }) {
  return (
    <li className="flex items-center gap-3">
      <Avatar className="size-8">
        <AvatarFallback className="bg-blue-100 text-xs font-bold text-blue-800">
          {initials(employee.displayName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-800">{employee.displayName}</p>
        <p className="truncate text-xs text-slate-500">{employee.role}</p>
      </div>
    </li>
  );
}

function formatWhen(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const secs = Math.round((now - then) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}
