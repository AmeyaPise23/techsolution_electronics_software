import { useMemo, useState } from "react";
import { useOutletContext } from "react-router";
import {
  addDays,
  addWeeks,
  format,
  isSameDay,
  parseISO,
  startOfWeek,
} from "date-fns";
import { useAsync } from "../hooks/useAsync";
import { useCurrentActor } from "../hooks/useCurrentActor";
import { usePermission } from "../hooks/usePermission";
import { listEmployees } from "../services/employeeService";
import { listTimeLogs } from "../services/timeLogService";
import { listTasks } from "../services/taskService";
import { Employee, Project, Role, TimeLog } from "../types";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Skeleton } from "../../../components/ui/skeleton";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

interface ProjectShellCtx {
  project: Project;
}

function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function hoursText(minutes: number): string {
  if (minutes === 0) return "";
  const h = minutes / 60;
  return `${h.toFixed(h % 1 === 0 ? 0 : 1)}h`;
}

export function TeamCalendarPage() {
  const { project } = useOutletContext<ProjectShellCtx>();
  const actor = useCurrentActor();
  const canViewTeam = usePermission("timeLog.viewTeam");

  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = useMemo(
    () => addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset),
    [weekOffset]
  );
  const weekEnd = addDays(weekStart, 4); // Mon..Fri
  const days = useMemo(
    () => [0, 1, 2, 3, 4].map((n) => addDays(weekStart, n)),
    [weekStart]
  );

  const { data: employees } = useAsync(() => listEmployees());
  const { data: taskPage } = useAsync(
    () => listTasks({ projectId: project.id }, { page: 0, size: 1000 }),
    { deps: [project.id] }
  );
  const { data: logs, isLoading } = useAsync(
    () =>
      listTimeLogs({
        projectId: project.id,
        dateFrom: format(weekStart, "yyyy-MM-dd"),
        dateTo: format(weekEnd, "yyyy-MM-dd"),
      }),
    { deps: [project.id, format(weekStart, "yyyy-MM-dd")] }
  );

  // Rows: full team when allowed; just the actor otherwise. HR/Manager see
  // everyone; Employee is scoped to self.
  const rowEmployees = useMemo(() => {
    if (!employees) return [];
    if (canViewTeam) {
      return employees.filter((e) => e.role !== Role.HR); // HR doesn't log time
    }
    return employees.filter((e) => e.id === actor.id);
  }, [employees, canViewTeam, actor.id]);

  // Index logs by (employeeId, workDate).
  const logsBy = useMemo(() => {
    const map = new Map<string, TimeLog[]>();
    for (const l of logs ?? []) {
      const key = `${l.employeeId}|${l.workDate}`;
      const bucket = map.get(key) ?? [];
      bucket.push(l);
      map.set(key, bucket);
    }
    return map;
  }, [logs]);

  const taskById = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of taskPage?.content ?? []) m.set(t.id, t.title);
    return m;
  }, [taskPage]);

  const dayTotals = days.map((d) =>
    (logs ?? [])
      .filter(
        (l) =>
          isSameDay(parseISO(l.workDate), d) &&
          rowEmployees.some((e) => e.id === l.employeeId)
      )
      .reduce((s, l) => s + l.durationMinutes, 0)
  );
  const rowTotals = rowEmployees.map((emp) =>
    (logs ?? [])
      .filter((l) => l.employeeId === emp.id)
      .reduce((s, l) => s + l.durationMinutes, 0)
  );
  const grandTotal = rowTotals.reduce((s, m) => s + m, 0);

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Team Time</h3>
          <div className="mt-0.5 text-xs text-slate-500">
            {canViewTeam ? "All team members" : "Your entries only"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => setWeekOffset((n) => n - 1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm">
            <CalendarDays className="size-4 text-slate-400" />
            <span className="font-semibold text-slate-700">
              {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
            </span>
          </div>
          <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => setWeekOffset((n) => n + 1)}>
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant={weekOffset === 0 ? "secondary" : "ghost"}
            size="sm"
            className="h-8 px-3"
            onClick={() => setWeekOffset(0)}
          >
            Today
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-md" />)}
        </div>
      ) : rowEmployees.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
          No team members to show.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-44 border-b border-slate-200 bg-white p-2 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Member
                </th>
                {days.map((d) => (
                  <th
                    key={d.toISOString()}
                    className={`border-b border-slate-200 p-2 text-left text-[11px] font-bold uppercase tracking-wide ${
                      isSameDay(d, new Date()) ? "bg-blue-50 text-blue-700" : "text-slate-500"
                    }`}
                  >
                    <div>{format(d, "EEE")}</div>
                    <div className="text-slate-400">{format(d, "MMM d")}</div>
                  </th>
                ))}
                <th className="w-20 border-b border-slate-200 p-2 text-right text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {rowEmployees.map((emp, rowIdx) => (
                <MemberRow
                  key={emp.id}
                  employee={emp}
                  days={days}
                  logsBy={logsBy}
                  taskById={taskById}
                  rowTotalMin={rowTotals[rowIdx]}
                />
              ))}
              <tr>
                <td className="sticky left-0 z-10 border-t-2 border-slate-300 bg-white p-2 text-right text-xs font-bold uppercase text-slate-500">
                  Day total
                </td>
                {dayTotals.map((m, i) => (
                  <td
                    key={i}
                    className="border-t-2 border-slate-300 p-2 text-xs font-semibold text-slate-700"
                  >
                    {hoursText(m) || "—"}
                  </td>
                ))}
                <td className="border-t-2 border-slate-300 p-2 text-right text-xs font-bold text-blue-700">
                  {hoursText(grandTotal) || "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

interface MemberRowProps {
  employee: Employee;
  days: Date[];
  logsBy: Map<string, TimeLog[]>;
  taskById: Map<string, string>;
  rowTotalMin: number;
}

function MemberRow({ employee, days, logsBy, taskById, rowTotalMin }: MemberRowProps) {
  return (
    <tr>
      <td className="sticky left-0 z-10 border-b border-slate-100 bg-white p-2 align-top">
        <div className="flex items-center gap-2">
          <Avatar className="size-7">
            <AvatarFallback className="bg-blue-100 text-[11px] font-bold text-blue-800">
              {initials(employee.displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-800">{employee.displayName}</div>
            <div className="text-[10px] uppercase text-slate-400">{employee.role}</div>
          </div>
        </div>
      </td>
      {days.map((d) => {
        const key = `${employee.id}|${format(d, "yyyy-MM-dd")}`;
        const cellLogs = logsBy.get(key) ?? [];
        const total = cellLogs.reduce((s, l) => s + l.durationMinutes, 0);
        return (
          <td
            key={d.toISOString()}
            className={`border-b border-slate-100 p-1 align-top ${
              isSameDay(d, new Date()) ? "bg-blue-50/40" : ""
            }`}
            style={{ minWidth: 130 }}
          >
            {cellLogs.length === 0 ? (
              <div className="h-14 rounded-md border border-dashed border-slate-200" />
            ) : (
              <div className="space-y-1">
                {cellLogs.map((l) => (
                  <div
                    key={l.id}
                    className="rounded-md border border-slate-200 bg-white p-1.5 text-[11px] shadow-sm"
                    title={l.note ?? ""}
                  >
                    <div className="truncate font-semibold text-slate-700">
                      {taskById.get(l.taskId) ?? l.taskId}
                    </div>
                    <div className="text-slate-500">{hoursText(l.durationMinutes)}</div>
                  </div>
                ))}
                <div className="pt-0.5 text-right text-[10px] font-bold text-slate-500">
                  {hoursText(total)}
                </div>
              </div>
            )}
          </td>
        );
      })}
      <td className="border-b border-slate-100 p-2 text-right align-top text-xs font-bold text-slate-700">
        {hoursText(rowTotalMin) || "—"}
      </td>
    </tr>
  );
}
