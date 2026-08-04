import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Clock } from 'lucide-react';

// ============================================================================
// Types & Interfaces
// ============================================================================

type TimerStatus = 'idle' | 'running' | 'paused';

interface Task {
  id: string;
  title: string;
  project: string;
  totalTimeSeconds: number;
  elapsedSeconds?: number;
}

interface TrackedTask extends Task {
  status: TimerStatus;
  startTimestamp?: number; // Timestamp when task started/resumed
}

// ============================================================================
// Utility Functions
// ============================================================================

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  return `${minutes}m ${secs}s`;
};

const calculateElapsedTime = (
  totalSeconds: number,
  status: TimerStatus,
  startTimestamp?: number
): number => {
  if (status === 'idle') return totalSeconds;
  if (status === 'paused') return totalSeconds;

  if (startTimestamp && status === 'running') {
    const currentTime = Date.now();
    const elapsed = Math.floor((currentTime - startTimestamp) / 1000);
    return totalSeconds + elapsed;
  }

  return totalSeconds;
};

// ============================================================================
// Custom Hook: useTimerInterval
// ============================================================================

interface UseTimerIntervalOptions {
  activeTaskId: string | null;
  onTick: () => void;
}

const useTimerInterval = ({
  activeTaskId,
  onTick,
}: UseTimerIntervalOptions): void => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (activeTaskId) {
      intervalRef.current = setInterval(() => {
        onTick();
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [activeTaskId, onTick]);
};

// ============================================================================
// Task Card Component
// ============================================================================

interface TaskCardProps {
  task: TrackedTask;
  isActive: boolean;
  onToggleTracker: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isActive,
  onToggleTracker,
}): React.ReactElement => {
  const displayTime = calculateElapsedTime(
    task.totalTimeSeconds,
    task.status,
    task.startTimestamp
  );

  return (
    <div
      className={`rounded-2xl p-6 transition-all duration-200 ${
        isActive
          ? 'bg-gradient-to-br from-slate-900 to-slate-800 shadow-lg ring-2 ring-blue-500'
          : 'bg-white border border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3
            className={`text-lg font-semibold ${
              isActive ? 'text-white' : 'text-slate-900'
            }`}
          >
            {task.title}
          </h3>
          <p
            className={`text-sm ${
              isActive ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            {task.project}
          </p>
        </div>
        {isActive && task.status === 'running' && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-green-400 font-medium">Running</span>
          </div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div className="flex-1">
          <p
            className={`text-3xl font-bold tabular-nums ${
              isActive ? 'text-white' : 'text-slate-900'
            }`}
          >
            {formatTime(displayTime)}
          </p>
        </div>

        <button
          onClick={onToggleTracker}
          className={`p-3 rounded-xl transition-all ${
            task.status === 'running'
              ? 'bg-red-500 hover:bg-red-600 text-white ring-2 ring-red-300'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
          title={task.status === 'running' ? 'Stop tracking' : 'Start tracking'}
        >
          <Play
            className={`w-5 h-5 ${
              task.status === 'running' ? 'rotate-90' : ''
            }`}
            fill="currentColor"
          />
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// Summary Card Component
// ============================================================================

interface SummaryCardProps {
  totalTimeToday: number;
  tasksCount: number;
  activeTaskId: string | null;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  totalTimeToday,
  tasksCount,
  activeTaskId,
}): React.ReactElement => {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white shadow-lg mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-2">
            Total Time Today
          </p>
          <h2 className="text-5xl font-bold text-white">
            {formatTime(totalTimeToday)}
          </h2>
        </div>
        <Clock className="w-16 h-16 text-slate-600" />
      </div>

      <div className="flex gap-4">
        <div className="flex-1 bg-slate-700 bg-opacity-50 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Active Tasks</p>
          <p className="text-2xl font-semibold text-white">
            {activeTaskId ? '1' : '0'}
          </p>
        </div>
        <div className="flex-1 bg-slate-700 bg-opacity-50 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Total Tasks</p>
          <p className="text-2xl font-semibold text-white">{tasksCount}</p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Main TimeTracker Component
// ============================================================================

interface TimeTrackerProps {
  initialTasks?: Task[];
}

export const TimeTracker: React.FC<TimeTrackerProps> = ({
  initialTasks = [],
}): React.ReactElement => {
  const [tasks, setTasks] = useState<TrackedTask[]>(
    initialTasks.map((task) => ({
      ...task,
      status: 'idle' as TimerStatus,
      elapsedSeconds: 0,
    }))
  );

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [, setRefreshKey] = useState<number>(0);

  // Handle timer tick
  const handleTick = useCallback((): void => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Start timer interval
  useTimerInterval({
    activeTaskId,
    onTick: handleTick,
  });

  // Toggle task tracking
  const handleToggleTracker = useCallback((taskId: string): void => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === taskId) {
          // If running, stop it
          if (task.status === 'running') {
            return {
              ...task,
              status: 'idle' as TimerStatus,
              totalTimeSeconds: calculateElapsedTime(
                task.totalTimeSeconds,
                task.status,
                task.startTimestamp
              ),
              startTimestamp: undefined,
            };
          }
          // If idle or paused, start it
          else {
            return {
              ...task,
              status: 'running' as TimerStatus,
              startTimestamp: Date.now(),
            };
          }
        }
        // Stop other running tasks
        if (task.status === 'running') {
          return {
            ...task,
            status: 'idle' as TimerStatus,
            totalTimeSeconds: calculateElapsedTime(
              task.totalTimeSeconds,
              task.status,
              task.startTimestamp
            ),
            startTimestamp: undefined,
          };
        }
        return task;
      })
    );

    // Update active task
    const toggledTask = tasks.find(t => t.id === taskId);
    if (toggledTask?.status === 'running') {
      setActiveTaskId(null);
    } else {
      setActiveTaskId(taskId);
    }
  }, [tasks]);

  // Calculate total time for today
  const totalTimeToday: number = tasks.reduce((sum, task) => {
    return sum + calculateElapsedTime(task.totalTimeSeconds, task.status, task.startTimestamp);
  }, 0);

  return (
    <div className="min-h-full bg-white p-6 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Time Tracker</h1>
          <p className="text-slate-600 mt-2">
            Monitor and track your task completion time
          </p>
        </div>

        {/* Summary Card */}
        <SummaryCard
          totalTimeToday={totalTimeToday}
          tasksCount={tasks.length}
          activeTaskId={activeTaskId}
        />

        {/* Tasks List */}
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center">
              <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No tasks added yet</p>
              <p className="text-slate-500 text-sm mt-1">
                Create a task to start tracking time
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isActive={activeTaskId === task.id}
                onToggleTracker={() => handleToggleTracker(task.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeTracker;
