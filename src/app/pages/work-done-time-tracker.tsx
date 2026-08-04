import { TimeTracker } from "../features/work-done/components/TimeTracker";

// Sample tasks so the tracker isn't empty on first load — matches the
// standalone project's behavior when initialTasks are provided.
const SAMPLE_TASKS = [
  {
    id: "sample-1",
    title: "Design review",
    project: "Personal Tasks",
    totalTimeSeconds: 0,
  },
  {
    id: "sample-2",
    title: "Sprint planning",
    project: "Work Projects",
    totalTimeSeconds: 0,
  },
  {
    id: "sample-3",
    title: "Portfolio update",
    project: "Side Projects",
    totalTimeSeconds: 0,
  },
];

export function WorkDoneTimeTracker() {
  return (
    <div className="h-full overflow-y-auto">
      <TimeTracker initialTasks={SAMPLE_TASKS} />
    </div>
  );
}
