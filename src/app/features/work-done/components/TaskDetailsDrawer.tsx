// The shared Task Details Drawer (spec A3.5). Opens over any board without
// losing scroll position. Reads which task is open from useTaskDrawer.

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../../../components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";
import { Input } from "../../../components/ui/input";
import { Checkbox } from "../../../components/ui/checkbox";
import { Skeleton } from "../../../components/ui/skeleton";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../components/ui/popover";
import { useTaskDrawer } from "../hooks/useTaskDrawer";
import { useCurrentActor } from "../hooks/useCurrentActor";
import { usePermission } from "../hooks/usePermission";
import { useAsync } from "../hooks/useAsync";
import { getTask, changeTaskStatus, transferTaskOwnership } from "../services/taskService";
import { listEmployees } from "../services/employeeService";
import { listComments, addComment } from "../services/commentService";
import { listChecklist, addChecklistItem, toggleChecklistItem } from "../services/checklistService";
import { listTimeLogs, logTime } from "../services/timeLogService";
import { listHistory } from "../services/historyService";
import { TaskStatus, TaskPriority, Employee } from "../types";
import { Can } from "./Can";
import { Send, Plus, UserPlus2 } from "lucide-react";

const STATUS_LABEL: Record<TaskStatus, string> = {
  [TaskStatus.Backlog]: "Backlog",
  [TaskStatus.Todo]: "To Do",
  [TaskStatus.InProgress]: "In Progress",
  [TaskStatus.InReview]: "In Review",
  [TaskStatus.Done]: "Done",
};

const PRIORITY_LOOK: Record<TaskPriority, string> = {
  [TaskPriority.Low]: "bg-slate-100 text-slate-700",
  [TaskPriority.Medium]: "bg-blue-100 text-blue-800",
  [TaskPriority.High]: "bg-amber-100 text-amber-800",
  [TaskPriority.Urgent]: "bg-red-100 text-red-800",
};

function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function timeAgo(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

export function TaskDetailsDrawer() {
  const { openTaskId, close } = useTaskDrawer();
  return (
    <Sheet open={!!openTaskId} onOpenChange={(o) => !o && close()}>
      <SheetContent side="right" className="flex w-full max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        {openTaskId ? (
          <DrawerBody taskId={openTaskId} />
        ) : (
          <SheetTitle className="sr-only">Task details</SheetTitle>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DrawerBody({ taskId }: { taskId: string }) {
  const { data: task, isLoading } = useAsync(() => getTask(taskId), { deps: [taskId] });
  const { data: employees } = useAsync(() => listEmployees());

  if (isLoading || !task) {
    return (
      <div className="space-y-3 p-6">
        <SheetTitle className="sr-only">Task details</SheetTitle>
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const assignee = employees?.find((e) => e.id === task.assigneeId);

  return (
    <>
      <SheetHeader className="border-b border-slate-200 p-5">
        <div className="flex items-start gap-3">
          <Badge variant="outline" className="mt-0.5 font-mono text-[10px]">{task.id}</Badge>
          <SheetTitle className="text-base font-bold text-slate-950">{task.title}</SheetTitle>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <Badge className={PRIORITY_LOOK[task.priority]}>{task.priority}</Badge>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-600">
            {STATUS_LABEL[task.status]}
          </span>
          <span className="rounded-md bg-indigo-100 px-2 py-0.5 font-semibold text-indigo-800">
            {task.storyPoints} pt
          </span>
          {assignee ? (
            <span className="inline-flex items-center gap-1.5">
              <Avatar className="size-5">
                <AvatarFallback className="bg-blue-100 text-[9px] font-bold text-blue-800">
                  {initials(assignee.displayName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-slate-600">{assignee.displayName}</span>
            </span>
          ) : (
            <span className="text-slate-400">Unassigned</span>
          )}
        </div>
      </SheetHeader>

      <Tabs defaultValue="details" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="mx-5 mt-3 shrink-0 justify-start">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="time">Time Log</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <TabsContent value="details" className="mt-0 space-y-4">
            <DetailsTab
              taskId={task.id}
              status={task.status}
              assigneeId={task.assigneeId}
              dueDate={task.dueDate}
              estimatedHours={task.estimatedHours}
              actualHours={task.actualHours}
              storyPoints={task.storyPoints}
              description={task.description}
              employees={employees ?? []}
            />
          </TabsContent>
          <TabsContent value="comments" className="mt-0">
            <CommentsTab taskId={task.id} employees={employees ?? []} />
          </TabsContent>
          <TabsContent value="checklist" className="mt-0">
            <ChecklistTab taskId={task.id} />
          </TabsContent>
          <TabsContent value="time" className="mt-0">
            <TimeLogTab taskId={task.id} assigneeId={task.assigneeId} employees={employees ?? []} />
          </TabsContent>
          <TabsContent value="activity" className="mt-0">
            <ActivityTab taskId={task.id} employees={employees ?? []} />
          </TabsContent>
        </div>
      </Tabs>
    </>
  );
}

// ---------- Details ----------

interface DetailsProps {
  taskId: string;
  status: TaskStatus;
  assigneeId: string | null;
  dueDate?: string;
  estimatedHours?: number;
  actualHours: number;
  storyPoints: number;
  description?: string;
  employees: Employee[];
}

function DetailsTab({
  taskId,
  status,
  assigneeId,
  dueDate,
  estimatedHours,
  actualHours,
  storyPoints,
  description,
  employees,
}: DetailsProps) {
  const actor = useCurrentActor();
  const canChangeStatus = usePermission("task.changeStatus", assigneeId ?? undefined);
  const canTransfer = usePermission("task.transferOwnership", assigneeId ?? undefined);
  const [transferOpen, setTransferOpen] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  return (
    <div className="space-y-5">
      <Field label="Description">
        {description ? (
          <p className="whitespace-pre-wrap text-sm text-slate-700">{description}</p>
        ) : (
          <p className="text-sm italic text-slate-400">No description.</p>
        )}
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Status">
          <Select
            value={status}
            disabled={!canChangeStatus || statusBusy}
            onValueChange={async (v) => {
              setStatusBusy(true);
              try {
                await changeTaskStatus(taskId, v as TaskStatus, actor.id);
              } finally {
                setStatusBusy(false);
              }
            }}
          >
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.values(TaskStatus) as TaskStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Assignee">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm text-slate-700">
              {employees.find((e) => e.id === assigneeId)?.displayName ?? "Unassigned"}
            </span>
            <Can action="task.transferOwnership" resourceOwnerId={assigneeId ?? undefined}>
              <Popover open={transferOpen} onOpenChange={setTransferOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs" disabled={!canTransfer}>
                    <UserPlus2 className="size-3" />
                    Transfer
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64 p-1">
                  <div className="max-h-64 overflow-y-auto">
                    {employees.map((e) => (
                      <button
                        key={e.id}
                        onClick={async () => {
                          await transferTaskOwnership(taskId, e.id, actor.id);
                          setTransferOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-100"
                      >
                        <Avatar className="size-6">
                          <AvatarFallback className="bg-blue-100 text-[10px] font-bold text-blue-800">
                            {initials(e.displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{e.displayName}</span>
                        <span className="ml-auto text-[10px] uppercase text-slate-400">{e.role}</span>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </Can>
          </div>
        </Field>

        <Field label="Story points">
          <div className="text-sm font-semibold text-slate-700">{storyPoints}</div>
        </Field>
        <Field label="Due">
          <div className="text-sm text-slate-700">{dueDate ?? "—"}</div>
        </Field>
        <Field label="Estimated">
          <div className="text-sm text-slate-700">{estimatedHours != null ? `${estimatedHours}h` : "—"}</div>
        </Field>
        <Field label="Actual (from time logs)">
          <div className="text-sm font-semibold text-slate-700">{actualHours}h</div>
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
      {children}
    </div>
  );
}

// ---------- Comments ----------

function CommentsTab({ taskId, employees }: { taskId: string; employees: Employee[] }) {
  const actor = useCurrentActor();
  const { data: comments } = useAsync(() => listComments(taskId), { deps: [taskId] });
  const canComment = usePermission("task.comment");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-4">
      {!comments || comments.length === 0 ? (
        <p className="text-sm italic text-slate-400">No comments yet.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => {
            const author = employees.find((e) => e.id === c.authorId);
            return (
              <li key={c.id} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-2">
                  <Avatar className="size-6">
                    <AvatarFallback className="bg-blue-100 text-[10px] font-bold text-blue-800">
                      {initials(author?.displayName ?? "??")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-semibold text-slate-700">{author?.displayName ?? "?"}</span>
                  <span className="text-[10px] text-slate-400">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{c.body}</p>
              </li>
            );
          })}
        </ul>
      )}
      <Can action="task.comment">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <Textarea
            placeholder="Write a comment…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={!canComment || busy}
            className="min-h-[70px] resize-y text-sm"
          />
          <div className="mt-2 flex justify-end">
            <Button
              size="sm"
              disabled={!body.trim() || !canComment || busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await addComment(taskId, actor.id, body.trim());
                  setBody("");
                } finally { setBusy(false); }
              }}
            >
              <Send className="mr-1 size-3" />
              Post
            </Button>
          </div>
        </div>
      </Can>
    </div>
  );
}

// ---------- Checklist ----------

function ChecklistTab({ taskId }: { taskId: string }) {
  const actor = useCurrentActor();
  const { data: items } = useAsync(() => listChecklist(taskId), { deps: [taskId] });
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-3">
      {(!items || items.length === 0) && (
        <p className="text-sm italic text-slate-400">No items yet.</p>
      )}
      {items?.map((i) => (
        <label key={i.id} className="flex items-start gap-2 rounded-md border border-slate-100 bg-white p-2">
          <Checkbox
            checked={i.isChecked}
            onCheckedChange={() => toggleChecklistItem(i.id, actor.id, taskId)}
            className="mt-0.5"
          />
          <span className={`text-sm ${i.isChecked ? "text-slate-400 line-through" : "text-slate-700"}`}>
            {i.text}
          </span>
        </label>
      ))}
      <div className="flex gap-2">
        <Input
          placeholder="Add an item…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="h-8 text-sm"
        />
        <Button
          size="sm"
          disabled={!text.trim() || busy}
          onClick={async () => {
            setBusy(true);
            try {
              await addChecklistItem(taskId, text.trim());
              setText("");
            } finally { setBusy(false); }
          }}
        >
          <Plus className="mr-1 size-3" />
          Add
        </Button>
      </div>
    </div>
  );
}

// ---------- Time Log ----------

function TimeLogTab({
  taskId,
  assigneeId,
  employees,
}: {
  taskId: string;
  assigneeId: string | null;
  employees: Employee[];
}) {
  const actor = useCurrentActor();
  const canLog = usePermission("timeLog.logOwn", assigneeId ?? undefined);
  const { data: logs } = useAsync(
    () =>
      listTimeLogs({
        taskId,
        dateFrom: "1970-01-01",
        dateTo: "2999-12-31",
      }),
    { deps: [taskId] }
  );
  const [hours, setHours] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-4">
      <Can action="timeLog.logOwn" resourceOwnerId={assigneeId ?? undefined}>
        <div className="flex items-end gap-2 rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex-1">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">Hours</div>
            <Input
              type="number"
              step="0.25"
              min="0"
              placeholder="e.g. 2.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex-1">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">Date</div>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <Button
            size="sm"
            disabled={!canLog || busy || !hours || parseFloat(hours) <= 0}
            onClick={async () => {
              setBusy(true);
              try {
                await logTime(
                  {
                    employeeId: actor.id,
                    taskId,
                    workDate: date,
                    durationMinutes: Math.round(parseFloat(hours) * 60),
                  },
                  actor.id
                );
                setHours("");
              } finally { setBusy(false); }
            }}
          >
            Log
          </Button>
        </div>
      </Can>
      {!logs || logs.length === 0 ? (
        <p className="text-sm italic text-slate-400">No time logged yet.</p>
      ) : (
        <ul className="space-y-2">
          {logs.map((l) => {
            const emp = employees.find((e) => e.id === l.employeeId);
            return (
              <li key={l.id} className="flex items-center justify-between rounded-md border border-slate-100 bg-white p-2 text-sm">
                <div className="flex items-center gap-2">
                  <Avatar className="size-6">
                    <AvatarFallback className="bg-blue-100 text-[10px] font-bold text-blue-800">
                      {initials(emp?.displayName ?? "??")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-slate-700">{emp?.displayName ?? "?"}</span>
                  <span className="text-xs text-slate-400">· {l.workDate}</span>
                </div>
                <span className="font-semibold text-slate-700">{(l.durationMinutes / 60).toFixed(2)}h</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---------- Activity ----------

function ActivityTab({ taskId, employees }: { taskId: string; employees: Employee[] }) {
  const { data: entries } = useAsync(() => listHistory({ taskId }), { deps: [taskId] });
  if (!entries || entries.length === 0) {
    return <p className="text-sm italic text-slate-400">No activity yet.</p>;
  }
  return (
    <ol className="space-y-3">
      {entries.map((h) => {
        const actor = employees.find((e) => e.id === h.actorId);
        return (
          <li key={h.id} className="flex items-start gap-3 text-sm">
            <Avatar className="size-6">
              <AvatarFallback className="bg-slate-200 text-[10px] font-bold text-slate-700">
                {initials(actor?.displayName ?? "??")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-slate-700">
                <span className="font-semibold">{actor?.displayName ?? "System"}</span>{" "}
                <span className="text-slate-500">{humanizeEvent(h.eventType, h.changes)}</span>
              </p>
              <p className="text-[11px] text-slate-400">{timeAgo(h.occurredAt)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function humanizeEvent(eventType: string, changes?: { field: string; from: unknown; to: unknown }[]): string {
  const readable = eventType.toLowerCase().replaceAll("_", " ");
  if (changes?.length) {
    const c = changes[0];
    return `${readable} — ${c.field}: ${String(c.from ?? "—")} → ${String(c.to ?? "—")}`;
  }
  return readable;
}
