import React from 'react';
import { Plus, Calendar, CheckCircle2, Clock } from 'lucide-react';

interface Milestone {
  id: string;
  name: string;
  description?: string;
  dueDate?: string;
  status?: 'completed' | 'in-progress' | 'planned';
  taskCount?: number;
}

interface MilestonesViewProps {
  milestones: Milestone[];
  onSelectMilestone: (milestoneId: string) => void;
  onAddMilestone?: () => void;
}

const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 size={16} className="text-green-600" />;
    case 'in-progress':
      return <Clock size={16} className="text-blue-600" />;
    default:
      return <Clock size={16} className="text-slate-400" />;
  }
};

const getStatusLabel = (status?: string) => {
  return status ? status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ') : 'Planned';
};

export const MilestonesView: React.FC<MilestonesViewProps> = ({
  milestones,
  onSelectMilestone,
  onAddMilestone,
}) => {
  const completedCount = milestones.filter(m => m.status === 'completed').length;
  const inProgressCount = milestones.filter(m => m.status === 'in-progress').length;

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Milestones</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {milestones.length} milestone{milestones.length !== 1 ? 's' : ''} (
              <span className="text-green-600">{completedCount} completed</span>,{' '}
              <span className="text-blue-600">{inProgressCount} in progress</span>)
            </p>
          </div>
          {onAddMilestone && (
            <button
              onClick={onAddMilestone}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={20} />
              New Milestone
            </button>
          )}
        </div>

        {/* Milestones List */}
        {milestones.length > 0 ? (
          <div className="space-y-3">
            {milestones.map(milestone => (
              <button
                key={milestone.id}
                onClick={() => onSelectMilestone(milestone.id)}
                className="w-full flex items-start gap-4 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all text-left group"
              >
                <div className="flex-shrink-0 mt-1">{getStatusIcon(milestone.status)}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {milestone.name}
                  </h3>
                  {milestone.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">
                      {milestone.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    {milestone.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500">
                        <Calendar size={14} />
                        {milestone.dueDate}
                      </div>
                    )}
                    {milestone.taskCount !== undefined && (
                      <div className="text-xs text-slate-500 dark:text-slate-500">
                        {milestone.taskCount} task{milestone.taskCount !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {getStatusLabel(milestone.status)}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400 mb-4">No milestones yet</p>
            {onAddMilestone && (
              <button
                onClick={onAddMilestone}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus size={20} />
                Create your first milestone
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
