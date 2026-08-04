import React from 'react';
import { Plus, ChevronRight } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  taskCount?: number;
}

interface ProjectsViewProps {
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  onAddProject?: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  onSelectProject,
  onAddProject,
}) => {
  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Projects</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </p>
          </div>
          {onAddProject && (
            <button
              onClick={onAddProject}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={20} />
              New Project
            </button>
          )}
        </div>

        {/* Projects Grid */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
              <button
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className="flex items-start gap-4 p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg transition-all text-left group"
              >
                {project.color && (
                  <div
                    className="w-12 h-12 rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: project.color }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  {project.taskCount !== undefined && (
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                      {project.taskCount} task{project.taskCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <ChevronRight className="flex-shrink-0 text-slate-400 dark:text-slate-600 group-hover:text-blue-600 transition-colors" />
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400 mb-4">No projects yet</p>
            {onAddProject && (
              <button
                onClick={onAddProject}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus size={20} />
                Create your first project
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
