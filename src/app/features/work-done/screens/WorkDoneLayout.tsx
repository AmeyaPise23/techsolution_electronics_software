import { NavLink, Outlet } from "react-router";
import { RoleSwitcher } from "../components/RoleSwitcher";
import { TaskDetailsDrawer } from "../components/TaskDetailsDrawer";
import { GlobalSearch, GlobalSearchTrigger } from "../components/GlobalSearch";
import { Folder, LayoutDashboard, Trophy, User } from "lucide-react";
import { Can } from "../components/Can";

const TABS = [
  { to: "/admin/work-done/projects",    label: "Projects",    icon: Folder,          action: undefined },
  { to: "/admin/work-done/dashboard",   label: "My Dashboard", icon: LayoutDashboard, action: undefined },
  { to: "/admin/work-done/personal",    label: "Personal",    icon: User,             action: "personalTask.viewOwn" as const },
  { to: "/admin/work-done/leaderboard", label: "Leaderboard", icon: Trophy,           action: "leaderboard.view" as const },
];

export function WorkDoneLayout() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5">
          <div>
            <h1 className="text-xl font-bold text-slate-950">Work Management</h1>
            <p className="text-sm text-slate-500">Projects, milestones, and team throughput.</p>
          </div>
          <div className="flex items-center gap-2">
            <GlobalSearchTrigger />
            <RoleSwitcher />
          </div>
        </div>
        <nav className="mt-4 flex gap-1 overflow-x-auto px-6">
          {TABS.map((t) => {
            const link = (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.to === "/admin/work-done/projects"}
                className={({ isActive }) =>
                  `flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? "border-blue-600 text-blue-700"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`
                }
              >
                <t.icon className="size-4" />
                {t.label}
              </NavLink>
            );
            if (t.action) {
              return <Can key={t.to} action={t.action}>{link}</Can>;
            }
            return link;
          })}
        </nav>
      </div>
      <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
        <Outlet />
      </div>
      <TaskDetailsDrawer />
      <GlobalSearch />
    </div>
  );
}
