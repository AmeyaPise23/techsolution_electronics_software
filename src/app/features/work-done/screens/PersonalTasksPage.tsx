import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { useAsync } from "../hooks/useAsync";
import { useCurrentActor } from "../hooks/useCurrentActor";
import {
  createPersonalTask,
  listOwnPersonalTasks,
  togglePersonalTask,
} from "../services/personalTaskService";
import { PersonalTask, TaskPriority } from "../types";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Checkbox } from "../../../components/ui/checkbox";
import { Skeleton } from "../../../components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import { Lock, Plus, CalendarClock } from "lucide-react";
import { toast } from "sonner";

const PRIORITY_LOOK: Record<TaskPriority, string> = {
  [TaskPriority.Low]:    "bg-slate-100 text-slate-700",
  [TaskPriority.Medium]: "bg-blue-100 text-blue-800",
  [TaskPriority.High]:   "bg-amber-100 text-amber-800",
  [TaskPriority.Urgent]: "bg-red-100 text-red-800",
};

export function PersonalTasksPage() {
  const actor = useCurrentActor();
  const { data: items, isLoading } = useAsync(
    () => listOwnPersonalTasks(actor.id),
    { deps: [actor.id] }
  );

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.Medium);
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "done">("active");
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const src = items ?? [];
    if (filter === "active") return src.filter((t) => !t.isCompleted);
    if (filter === "done") return src.filter((t) => t.isCompleted);
    return src;
  }, [items, filter]);

  async function handleAdd() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      await createPersonalTask({
        ownerId: actor.id,
        title: title.trim(),
        priority,
        dueDate: dueDate || undefined,
      });
      setTitle("");
      setDueDate("");
      setPriority(TaskPriority.Medium);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Personal Tasks</h2>
            <p className="text-xs text-slate-500">Only you can see these — Manager and HR cannot.</p>
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as "all" | "active" | "done")}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="done">Completed</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-[minmax(0,1fr)_140px_160px_auto]">
          <Input
            placeholder="What do you want to remember?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="h-9 text-sm"
          />
          <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.values(TaskPriority) as TaskPriority[]).map((p) => (
                <SelectItem key={p} value={p} className="text-sm">{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-9 text-sm"
          />
          <Button onClick={handleAdd} disabled={busy || !title.trim()} className="h-9">
            <Plus className="mr-1 size-4" />
            Add
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[0,1,2].map(i => <Skeleton key={i} className="h-10 rounded-md" />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm italic text-slate-400">
            {filter === "done" ? "Nothing completed yet." : filter === "active" ? "Nothing on the list." : "No personal tasks."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((t) => (
              <PersonalRow key={t.id} task={t} ownerId={actor.id} />
            ))}
          </ul>
        )}
      </Card>

      <Card className="h-fit border-amber-200 bg-amber-50 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-900">
          <Lock className="size-3.5" />
          Privacy
        </div>
        <p className="text-xs leading-relaxed text-amber-900/80">
          These tasks are stored against your account only. No other role — including Manager and
          HR — can list, view, or search them. This is enforced at the query layer, not just in
          the UI, so the privacy rule holds even if the API is called directly.
        </p>
      </Card>
    </div>
  );
}

function PersonalRow({ task, ownerId }: { task: PersonalTask; ownerId: string }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <Checkbox
        checked={task.isCompleted}
        onCheckedChange={() => togglePersonalTask(task.id, ownerId)}
      />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm ${task.isCompleted ? "text-slate-400 line-through" : "font-semibold text-slate-800"}`}>
          {task.title}
        </p>
        <div className="mt-0.5 flex items-center gap-2 text-xs">
          <Badge className={`px-1.5 py-0 text-[10px] ${PRIORITY_LOOK[task.priority]}`}>{task.priority}</Badge>
          {task.dueDate && (
            <span className="inline-flex items-center gap-0.5 text-slate-500">
              <CalendarClock className="size-3" />
              {format(parseISO(task.dueDate), "MMM d")}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
