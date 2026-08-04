import { Link } from "react-router";
import { useAsync } from "../hooks/useAsync";
import { listProjects } from "../services/projectService";
import { listMilestones } from "../services/milestoneService";
import { listTasks } from "../services/taskService";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Skeleton } from "../../../components/ui/skeleton";
import { Progress } from "../../../components/ui/progress";
import { MilestoneStatus, TaskStatus } from "../types";

export function ProjectsListPage() {
  const { data: page, isLoading } = useAsync(() => listProjects());
  const { data: milestones } = useAsync(() => listMilestones());
  const { data: taskPage } = useAsync(() => listTasks({}, { page: 0, size: 1000 }));

  if (isLoading || !page) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
    );
  }

  if (page.content.length === 0) {
    return (
      <Card className="p-10 text-center text-sm text-slate-500">
        No projects yet.
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {page.content.map((p) => {
        const projMilestones = milestones?.filter((m) => m.projectId === p.id) ?? [];
        const ongoing = projMilestones.find((m) => m.status === MilestoneStatus.Ongoing);
        const projTasks = taskPage?.content.filter((t) => t.projectId === p.id) ?? [];
        const totalTasks = projTasks.length;
        const doneTasks = projTasks.filter((t) => t.status === TaskStatus.Done).length;
        const pct = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);
        return (
          <Link
            key={p.id}
            to={`/admin/work-done/projects/${p.id}/overview`}
            className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge variant="outline" className="font-mono text-[10px]">{p.key}</Badge>
                <h3 className="mt-2 text-base font-bold text-slate-950 group-hover:text-blue-800">
                  {p.name}
                </h3>
              </div>
            </div>
            {p.description && (
              <p className="mt-2 line-clamp-2 text-sm text-slate-500">{p.description}</p>
            )}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{doneTasks} / {totalTasks} tasks done</span>
                <span className="font-semibold">{pct}%</span>
              </div>
              <Progress value={pct} className="h-2" />
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              {ongoing ? (
                <>
                  <span className="inline-flex size-2 rounded-full bg-emerald-500" />
                  In: <span className="font-semibold text-slate-700">{ongoing.name}</span>
                </>
              ) : (
                <>
                  <span className="inline-flex size-2 rounded-full bg-slate-300" />
                  No active milestone
                </>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
