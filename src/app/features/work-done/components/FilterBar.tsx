// Shared filter bar used by Board, Backlog, and Dashboard. Emits a partial
// TaskFilters shape so it can be passed straight through to listTasks. Which
// facets are shown is controlled per-consumer via the `show` prop — screens
// that don't need a facet (e.g. Board already scopes by milestone) hide it.

import { useMemo } from "react";
import { Employee, TaskFilters, TaskPriority, TaskStatus } from "../types";
import { useAsync } from "../hooks/useAsync";
import { listEmployees } from "../services/employeeService";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../components/ui/popover";
import { Checkbox } from "../../../components/ui/checkbox";
import { Filter, Search, X } from "lucide-react";

export interface FilterBarValue {
  search?: string;
  assigneeIds?: string[];
  statuses?: TaskStatus[];
  priorities?: TaskPriority[];
  labels?: string[];
}

interface FilterBarProps {
  value: FilterBarValue;
  onChange: (next: FilterBarValue) => void;
  show?: {
    assignee?: boolean;
    status?: boolean;
    priority?: boolean;
    label?: boolean;
  };
  availableLabels?: string[];
}

const STATUS_LABEL: Record<TaskStatus, string> = {
  [TaskStatus.Backlog]: "Backlog",
  [TaskStatus.Todo]: "To Do",
  [TaskStatus.InProgress]: "In Progress",
  [TaskStatus.InReview]: "In Review",
  [TaskStatus.Done]: "Done",
};

export function FilterBar({
  value,
  onChange,
  show = { assignee: true, status: true, priority: true, label: true },
  availableLabels = [],
}: FilterBarProps) {
  const { data: employees } = useAsync(() => listEmployees());

  const activeCount = useMemo(() => {
    let n = 0;
    if (value.search?.trim()) n++;
    if (value.assigneeIds?.length) n++;
    if (value.statuses?.length) n++;
    if (value.priorities?.length) n++;
    if (value.labels?.length) n++;
    return n;
  }, [value]);

  function toggle<T>(list: T[] | undefined, item: T): T[] {
    const set = new Set(list ?? []);
    if (set.has(item)) set.delete(item);
    else set.add(item);
    return [...set];
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={value.search ?? ""}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
          placeholder="Search tasks…"
          className="h-8 pl-8 text-sm"
        />
      </div>

      {show.assignee && (
        <FacetPopover
          label="Assignee"
          count={value.assigneeIds?.length ?? 0}
          items={(employees ?? []).map((e) => ({
            value: e.id,
            label: e.displayName,
            hint: e.role,
          }))}
          selected={value.assigneeIds ?? []}
          onToggle={(v) => onChange({ ...value, assigneeIds: toggle(value.assigneeIds, v) })}
        />
      )}

      {show.status && (
        <FacetPopover
          label="Status"
          count={value.statuses?.length ?? 0}
          items={(Object.values(TaskStatus) as TaskStatus[]).map((s) => ({
            value: s,
            label: STATUS_LABEL[s],
          }))}
          selected={value.statuses ?? []}
          onToggle={(v) => onChange({ ...value, statuses: toggle(value.statuses, v as TaskStatus) })}
        />
      )}

      {show.priority && (
        <FacetPopover
          label="Priority"
          count={value.priorities?.length ?? 0}
          items={(Object.values(TaskPriority) as TaskPriority[]).map((p) => ({
            value: p,
            label: p,
          }))}
          selected={value.priorities ?? []}
          onToggle={(v) => onChange({ ...value, priorities: toggle(value.priorities, v as TaskPriority) })}
        />
      )}

      {show.label && availableLabels.length > 0 && (
        <FacetPopover
          label="Label"
          count={value.labels?.length ?? 0}
          items={availableLabels.map((l) => ({ value: l, label: l }))}
          selected={value.labels ?? []}
          onToggle={(v) => onChange({ ...value, labels: toggle(value.labels, v) })}
        />
      )}

      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2 text-xs text-slate-500"
          onClick={() => onChange({})}
        >
          <X className="size-3" />
          Clear ({activeCount})
        </Button>
      )}
    </div>
  );
}

interface FacetPopoverProps<T extends string> {
  label: string;
  count: number;
  items: { value: T; label: string; hint?: string }[];
  selected: T[];
  onToggle: (value: T) => void;
}

function FacetPopover<T extends string>({
  label,
  count,
  items,
  selected,
  onToggle,
}: FacetPopoverProps<T>) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 px-2 text-xs"
        >
          <Filter className="size-3" />
          {label}
          {count > 0 && (
            <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px]">{count}</Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-64 w-56 overflow-y-auto p-1">
        {items.length === 0 ? (
          <p className="p-2 text-xs italic text-slate-400">Nothing to filter by.</p>
        ) : (
          items.map((it) => (
            <label
              key={it.value}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-100"
            >
              <Checkbox
                checked={selected.includes(it.value)}
                onCheckedChange={() => onToggle(it.value)}
              />
              <span className="truncate">{it.label}</span>
              {it.hint && (
                <span className="ml-auto text-[10px] uppercase text-slate-400">{it.hint}</span>
              )}
            </label>
          ))
        )}
      </PopoverContent>
    </Popover>
  );
}
