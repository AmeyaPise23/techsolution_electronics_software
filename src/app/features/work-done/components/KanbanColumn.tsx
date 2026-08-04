import { useDroppable } from "@dnd-kit/core";
import { Task, TaskStatus } from "../types";
import { KanbanCard } from "./KanbanCard";
import { Employee } from "../types";

const COLUMN_LABEL: Record<TaskStatus, string> = {
  [TaskStatus.Backlog]:    "Backlog",
  [TaskStatus.Todo]:       "To Do",
  [TaskStatus.InProgress]: "In Progress",
  [TaskStatus.InReview]:   "In Review",
  [TaskStatus.Done]:       "Done",
};

const COLUMN_ACCENT: Record<TaskStatus, string> = {
  [TaskStatus.Backlog]:    "border-t-slate-400",
  [TaskStatus.Todo]:       "border-t-slate-500",
  [TaskStatus.InProgress]: "border-t-blue-500",
  [TaskStatus.InReview]:   "border-t-amber-500",
  [TaskStatus.Done]:       "border-t-emerald-500",
};

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  employees: Employee[];
}

export function KanbanColumn({ status, tasks, employees }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col-${status}`,
    data: { status },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex h-full w-72 shrink-0 flex-col rounded-lg border border-slate-200 border-t-4 bg-slate-100/70 transition-colors ${COLUMN_ACCENT[status]} ${
        isOver ? "bg-blue-50" : ""
      }`}
    >
      <div className="flex items-center justify-between px-3 pt-3">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-700">{COLUMN_LABEL[status]}</span>
        <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
          {tasks.length}
        </span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-2 pb-4">
        {tasks.length === 0 && (
          <div className="mt-6 rounded-md border border-dashed border-slate-300 p-4 text-center text-[11px] text-slate-400">
            Drop tasks here
          </div>
        )}
        {tasks.map((t) => (
          <KanbanCard
            key={t.id}
            task={t}
            assigneeName={employees.find((e) => e.id === t.assigneeId)?.displayName}
          />
        ))}
      </div>
    </div>
  );
}

export { COLUMN_LABEL };
