import { useMemo, useState } from "react";
import { useOutletContext } from "react-router";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { useAsync } from "../hooks/useAsync";
import { useCurrentActor } from "../hooks/useCurrentActor";
import { listMilestones, startMilestone, completeMilestone } from "../services/milestoneService";
import { listTasks } from "../services/taskService";
import { Milestone, MilestoneStatus, Project, TaskStatus } from "../types";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Skeleton } from "../../../components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../../components/ui/alert-dialog";
import { Can } from "../components/Can";
import { CheckCircle2, Play } from "lucide-react";
import { toast } from "sonner";

interface ProjectShellCtx {
  project: Project;
}

const STATUS_LOOK: Record<
  MilestoneStatus,
  { bar: string; label: string; chip: string }
> = {
  [MilestoneStatus.Planned]:   { bar: "bg-slate-300",    label: "Planned",   chip: "bg-slate-100 text-slate-700" },
  [MilestoneStatus.Ongoing]:   { bar: "bg-emerald-400",  label: "Ongoing",   chip: "bg-emerald-100 text-emerald-800" },
  [MilestoneStatus.Completed]: { bar: "bg-blue-500",     label: "Completed", chip: "bg-blue-100 text-blue-800" },
};

const DAY_PX = 8;
const MIN_BAR_PX = 12;

export function MilestoneTimelinePage() {
  const { project } = useOutletContext<ProjectShellCtx>();
  const actor = useCurrentActor();
  const { data: milestones, isLoading } = useAsync(
    () => listMilestones({ projectId: project.id }),
    { deps: [project.id] }
  );
  const { data: taskPage } = useAsync(
    () => listTasks({ projectId: project.id }, { page: 0, size: 1000 }),
    { deps: [project.id] }
  );

  // Timeline range: min planned start → max planned end (fall back to today).
  const { rangeStart, rangeEnd, totalDays } = useMemo(() => {
    if (!milestones || milestones.length === 0) {
      const today = new Date();
      return { rangeStart: today, rangeEnd: today, totalDays: 1 };
    }
    const starts = milestones
      .map((m) => (m.plannedStartDate ? parseISO(m.plannedStartDate) : null))
      .filter((d): d is Date => !!d);
    const ends = milestones
      .map((m) => (m.plannedEndDate ? parseISO(m.plannedEndDate) : null))
      .filter((d): d is Date => !!d);
    const rangeStart = starts.length ? new Date(Math.min(...starts.map((d) => d.getTime()))) : new Date();
    const rangeEnd = ends.length ? new Date(Math.max(...ends.map((d) => d.getTime()))) : rangeStart;
    const totalDays = Math.max(1, differenceInCalendarDays(rangeEnd, rangeStart) + 1);
    return { rangeStart, rangeEnd, totalDays };
  }, [milestones]);

  if (isLoading || !milestones) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-slate-500">No milestones yet.</Card>
    );
  }

  const timelineWidth = totalDays * DAY_PX;

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Milestone Timeline</h3>
        <span className="text-xs text-slate-400">
          {format(rangeStart, "MMM d")} → {format(rangeEnd, "MMM d, yyyy")}
        </span>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: `${Math.max(timelineWidth + 240, 700)}px` }}>
          {/* Header: month ticks */}
          <div className="mb-3 flex border-b border-slate-200 pb-1 text-[10px] font-semibold uppercase text-slate-400">
            <div className="w-56 shrink-0">Milestone</div>
            <div className="flex-1 relative" style={{ height: 16 }}>
              <MonthTicks start={rangeStart} totalDays={totalDays} dayPx={DAY_PX} />
            </div>
            <div className="w-32 shrink-0 text-right">Actions</div>
          </div>

          {/* `relative` bounds the absolutely-positioned <TodayLine> so the marker
              spans only the milestone rows below — not the header row above. */}
          <div className="relative space-y-2">
            {/* Today marker (spans just the milestone rows) */}
            <TodayLine rangeStart={rangeStart} totalDays={totalDays} dayPx={DAY_PX} />

            {milestones.map((m) => {
              const tasks = taskPage?.content.filter((t) => t.milestoneId === m.id) ?? [];
              return (
                <MilestoneRow
                  key={m.id}
                  milestone={m}
                  totalTasks={tasks.length}
                  doneTasks={tasks.filter((t) => t.status === TaskStatus.Done).length}
                  rangeStart={rangeStart}
                  totalDays={totalDays}
                  onStart={async () => {
                    try {
                      await startMilestone(m.id, actor.id);
                      toast.success(`${m.name} started`);
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Failed");
                    }
                  }}
                  onComplete={async () => {
                    try {
                      await completeMilestone(m.id, actor.id);
                      toast.success(`${m.name} completed — unfinished tasks moved to backlog`);
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Failed");
                    }
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

function MonthTicks({ start, totalDays, dayPx }: { start: Date; totalDays: number; dayPx: number }) {
  const ticks: { left: number; label: string }[] = [];
  const cursor = new Date(start);
  // Snap cursor to the 1st of each month within the range.
  cursor.setDate(1);
  for (let i = 0; i < 60; i++) {
    if (differenceInCalendarDays(cursor, start) > totalDays) break;
    const left = Math.max(0, differenceInCalendarDays(cursor, start)) * dayPx;
    ticks.push({ left, label: format(cursor, "MMM yyyy") });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return (
    <>
      {ticks.map((t, i) => (
        <span key={i} className="absolute top-0" style={{ left: `${t.left}px` }}>
          <span className="mr-2 inline-block border-l border-slate-200 pl-1 text-[10px]">{t.label}</span>
        </span>
      ))}
    </>
  );
}

function TodayLine({ rangeStart, totalDays, dayPx }: { rangeStart: Date; totalDays: number; dayPx: number }) {
  const today = new Date();
  const offset = differenceInCalendarDays(today, rangeStart);
  if (offset < 0 || offset > totalDays) return null;
  // Offset the marker to the right of the "Milestone" label column (w-56 = 224px)
  const left = 224 + offset * dayPx;
  return (
    <div
      className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-red-400/70"
      style={{ left: `${left}px` }}
    >
      <span className="absolute -top-3 -left-4 rounded-full bg-red-100 px-1.5 text-[9px] font-bold text-red-700">
        TODAY
      </span>
    </div>
  );
}

interface MilestoneRowProps {
  milestone: Milestone;
  totalTasks: number;
  doneTasks: number;
  rangeStart: Date;
  totalDays: number;
  onStart: () => void;
  onComplete: () => void;
}

function MilestoneRow({
  milestone,
  totalTasks,
  doneTasks,
  rangeStart,
  totalDays,
  onStart,
  onComplete,
}: MilestoneRowProps) {
  const look = STATUS_LOOK[milestone.status];
  const start = milestone.plannedStartDate ? parseISO(milestone.plannedStartDate) : null;
  const end = milestone.plannedEndDate ? parseISO(milestone.plannedEndDate) : null;

  let leftPx = 0;
  let widthPx = MIN_BAR_PX;
  if (start && end) {
    const offsetDays = Math.max(0, differenceInCalendarDays(start, rangeStart));
    const spanDays = Math.max(1, differenceInCalendarDays(end, start) + 1);
    leftPx = offsetDays * DAY_PX;
    widthPx = Math.max(MIN_BAR_PX, spanDays * DAY_PX);
  }
  const timelinePx = totalDays * DAY_PX;
  const progressPct = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  return (
    <div className="flex items-center">
      <div className="w-56 shrink-0 pr-4">
        <div className="text-sm font-semibold text-slate-800">{milestone.name}</div>
        <div className="mt-0.5 flex items-center gap-2">
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase ${look.chip}`}>
            {look.label}
          </span>
          <span className="text-[11px] text-slate-500">
            {doneTasks}/{totalTasks} · {progressPct}%
          </span>
        </div>
      </div>

      <div className="relative flex-1" style={{ minWidth: `${timelinePx}px`, height: 32 }}>
        <div className="absolute inset-y-1/2 h-px w-full -translate-y-1/2 bg-slate-100" />
        <div
          className={`absolute top-1 h-6 rounded-md ${look.bar} shadow-sm`}
          style={{ left: `${leftPx}px`, width: `${widthPx}px` }}
          title={`${milestone.plannedStartDate ?? "?"} → ${milestone.plannedEndDate ?? "?"}`}
        >
          {progressPct > 0 && progressPct < 100 && (
            <div
              className="h-full rounded-md bg-white/40"
              style={{ width: `${progressPct}%` }}
            />
          )}
        </div>
      </div>

      <div className="flex w-32 shrink-0 justify-end gap-1">
        {milestone.status === MilestoneStatus.Planned && (
          <Can action="milestone.start">
            <Button size="sm" className="h-7 gap-1 px-2 text-xs" onClick={onStart}>
              <Play className="size-3" />
              Start
            </Button>
          </Can>
        )}
        {milestone.status === MilestoneStatus.Ongoing && (
          <Can action="milestone.complete">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs">
                  <CheckCircle2 className="size-3" />
                  Complete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Complete {milestone.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Any unfinished tasks in this milestone will be automatically moved to the project backlog.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onComplete}>Complete milestone</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Can>
        )}
      </div>
    </div>
  );
}
