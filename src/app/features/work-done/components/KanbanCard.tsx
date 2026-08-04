import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Task, TaskPriority } from "../types";
import { Badge } from "../../../components/ui/badge";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { Calendar, Zap } from "lucide-react";
import { useTaskDrawer } from "../hooks/useTaskDrawer";

const PRIORITY_LOOK: Record<TaskPriority, { color: string; label: string }> = {
  [TaskPriority.Low]:    { color: "bg-slate-100 text-slate-700",  label: "Low" },
  [TaskPriority.Medium]: { color: "bg-blue-100 text-blue-800",    label: "Med" },
  [TaskPriority.High]:   { color: "bg-amber-100 text-amber-800",  label: "High" },
  [TaskPriority.Urgent]: { color: "bg-red-100 text-red-800",      label: "Urgent" },
};

function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

interface KanbanCardProps {
  task: Task;
  assigneeName?: string;
}

export function KanbanCard({ task, assigneeName }: KanbanCardProps) {
  const openDrawer = useTaskDrawer((s) => s.open);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { taskId: task.id, currentStatus: task.status },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  const priority = PRIORITY_LOOK[task.priority];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Ignore clicks that are actually part of a drag.
        if (isDragging) return;
        e.stopPropagation();
        openDrawer(task.id);
      }}
      className="group rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 flex-1 text-sm font-semibold text-slate-800 group-hover:text-blue-800">
          {task.title}
        </p>
        <Badge className={`shrink-0 px-1.5 py-0 text-[10px] ${priority.color}`}>{priority.label}</Badge>
      </div>

      {task.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.labels.map((l) => (
            <span key={l} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
              {l}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-0.5 rounded bg-indigo-100 px-1.5 py-0.5 font-semibold text-indigo-800">
            <Zap className="size-3" />
            {task.storyPoints}
          </span>
          {task.dueDate && (
            <span className="inline-flex items-center gap-0.5">
              <Calendar className="size-3" />
              {task.dueDate.slice(5)}
            </span>
          )}
        </div>
        {task.assigneeId ? (
          <Avatar className="size-6">
            <AvatarFallback className="bg-blue-100 text-[10px] font-bold text-blue-800">
              {initials(assigneeName ?? task.assigneeId)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <span className="text-[10px] text-slate-400">Unassigned</span>
        )}
      </div>
    </div>
  );
}
