import { NavLink, Outlet, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { useAsync } from "../hooks/useAsync";
import { getProject } from "../services/projectService";
import { Badge } from "../../../components/ui/badge";
import { Skeleton } from "../../../components/ui/skeleton";
import { Can } from "../components/Can";

const TABS = [
  { key: "overview",  label: "Overview" },
  { key: "timeline",  label: "Timeline" },
  { key: "board",     label: "Board" },
  { key: "backlog",   label: "Backlog" },
  { key: "calendar",  label: "Team Time", action: "timeLog.viewTeam" as const },
];

export function ProjectShell() {
  const { projectId = "" } = useParams();
  const { data: project, isLoading, error } = useAsync(() => getProject(projectId), {
    deps: [projectId],
  });

  return (
    <div className="space-y-4">
      <Link to="/admin/work-done/projects" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" />
        All projects
      </Link>

      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load project: {error.message}
        </div>
      ) : !project ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Project not found.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-5">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">{project.key}</Badge>
                <h2 className="text-lg font-bold text-slate-950">{project.name}</h2>
              </div>
              {project.description && (
                <p className="mt-1 text-sm text-slate-500">{project.description}</p>
              )}
            </div>
            <div className="text-xs text-slate-500">
              {project.startDate && <div>Started {project.startDate}</div>}
              {project.targetEndDate && <div>Target {project.targetEndDate}</div>}
            </div>
          </div>

          <nav className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
            {TABS.map((t) => {
              const link = (
                <NavLink
                  key={t.key}
                  to={`/admin/work-done/projects/${projectId}/${t.key}`}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-blue-100 text-blue-800"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    }`
                  }
                >
                  {t.label}
                </NavLink>
              );
              if (t.action) {
                return <Can key={t.key} action={t.action}>{link}</Can>;
              }
              return link;
            })}
          </nav>

          <Outlet context={{ project }} />
        </>
      )}
    </div>
  );
}
