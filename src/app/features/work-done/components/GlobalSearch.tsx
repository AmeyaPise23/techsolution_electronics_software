// ⌘K / Ctrl+K global search across tasks, milestones, and projects. Clicking
// a task result opens the shared Task Details Drawer; milestones and projects
// navigate to their respective screens.

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "../../../components/ui/command";
import { useAsync } from "../hooks/useAsync";
import { listTasks } from "../services/taskService";
import { listMilestones } from "../services/milestoneService";
import { listProjects } from "../services/projectService";
import { useTaskDrawer } from "../hooks/useTaskDrawer";
import { Flag, Folder, ListChecks } from "lucide-react";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const openDrawer = useTaskDrawer((s) => s.open);

  // Keyboard shortcut: ⌘K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const { data: taskPage } = useAsync(() => listTasks({}, { page: 0, size: 500 }));
  const { data: milestones } = useAsync(() => listMilestones());
  const { data: projectPage } = useAsync(() => listProjects());

  const q = query.trim().toLowerCase();

  const taskMatches = useMemo(() => {
    if (!taskPage) return [];
    const items = taskPage.content;
    const filtered = q ? items.filter((t) => t.title.toLowerCase().includes(q)) : items.slice(0, 10);
    return filtered.slice(0, 15);
  }, [taskPage, q]);

  const milestoneMatches = useMemo(() => {
    if (!milestones) return [];
    return (q ? milestones.filter((m) => m.name.toLowerCase().includes(q)) : milestones).slice(0, 8);
  }, [milestones, q]);

  const projectMatches = useMemo(() => {
    if (!projectPage) return [];
    return (
      q
        ? projectPage.content.filter(
            (p) => p.name.toLowerCase().includes(q) || p.key.toLowerCase().includes(q)
          )
        : projectPage.content
    ).slice(0, 6);
  }, [projectPage, q]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Find tasks, milestones, and projects">
      <CommandInput
        placeholder="Type to search — tasks, milestones, projects…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No matches.</CommandEmpty>

        {taskMatches.length > 0 && (
          <CommandGroup heading={q ? "Tasks" : "Recent tasks"}>
            {taskMatches.map((t) => (
              <CommandItem
                key={t.id}
                value={`task-${t.id}-${t.title}`}
                onSelect={() => {
                  openDrawer(t.id);
                  close();
                }}
              >
                <ListChecks className="mr-2 size-4 text-slate-400" />
                <div className="flex-1 truncate">{t.title}</div>
                <span className="ml-2 text-[10px] font-semibold uppercase text-slate-400">
                  {t.status.replaceAll("_", " ")}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {milestoneMatches.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Milestones">
              {milestoneMatches.map((m) => (
                <CommandItem
                  key={m.id}
                  value={`milestone-${m.id}-${m.name}`}
                  onSelect={() => {
                    navigate(`/admin/work-done/projects/${m.projectId}/timeline`);
                    close();
                  }}
                >
                  <Flag className="mr-2 size-4 text-slate-400" />
                  <div className="flex-1 truncate">{m.name}</div>
                  <span className="ml-2 text-[10px] font-semibold uppercase text-slate-400">
                    {m.status}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {projectMatches.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projects">
              {projectMatches.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`project-${p.id}-${p.name}`}
                  onSelect={() => {
                    navigate(`/admin/work-done/projects/${p.id}/overview`);
                    close();
                  }}
                >
                  <Folder className="mr-2 size-4 text-slate-400" />
                  <div className="flex-1 truncate">
                    <span className="mr-2 font-mono text-[10px] text-slate-400">{p.key}</span>
                    {p.name}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

// Small button/hint you can drop into the module header. Clicking it opens the
// palette by dispatching the same keyboard shortcut.
export function GlobalSearchTrigger() {
  function trigger() {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true })
    );
  }
  return (
    <button
      onClick={trigger}
      className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-500 hover:border-slate-300 hover:bg-slate-50"
    >
      <span className="inline-flex size-4 items-center justify-center rounded bg-slate-100 text-slate-400">⌘</span>
      Search…
      <kbd className="ml-2 rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px]">K</kbd>
    </button>
  );
}
