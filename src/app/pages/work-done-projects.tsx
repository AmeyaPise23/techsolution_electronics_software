import { useEffect } from "react";
import { ProjectsView } from "../features/work-done/components/ProjectsView";
import { useScheduleStore } from "../features/work-done/store/scheduleStore";

export function WorkDoneProjects() {
  const projects = useScheduleStore(state => state.projects);
  const fetchProjects = useScheduleStore(state => state.fetchProjects);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="flex h-full">
      <ProjectsView
        projects={projects.map((p) => ({
          ...p,
          taskCount: Math.floor(Math.random() * 20) + 1,
        }))}
        onSelectProject={(projectId) => {
          console.log("Selected project:", projectId);
        }}
      />
    </div>
  );
}
