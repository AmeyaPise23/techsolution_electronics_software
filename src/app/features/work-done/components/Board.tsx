import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { PIXELS_PER_MINUTE, TOTAL_MINUTES, pxToMinutes, snapToGrid, detectOverlaps, minutesToPx, formatTime } from '../lib/gridUtils';
import { Column } from './Column';
import { useScheduleStore } from '../store/scheduleStore';
import { Task as TaskType } from '../store/scheduleStore';

const COLOR_MAP: { [key: string]: string } = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
};

const DragPreview: React.FC<{ task: TaskType }> = ({ task }) => {
  const height = minutesToPx(task.duration);
  return (
    <div
      className={`rounded-lg shadow-lg border border-opacity-20 border-white overflow-hidden ${COLOR_MAP[task.color] || COLOR_MAP.blue}`}
      style={{
        width: '300px',
        height: `${Math.min(height, 200)}px`,
        minHeight: '60px',
      }}
    >
      <div className="h-full flex flex-col p-2 text-white text-sm justify-center">
        <div className="font-semibold truncate">{task.title}</div>
        <div className="text-xs opacity-90">{formatTime(task.start_minute)}</div>
      </div>
    </div>
  );
};

export const Board: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tasks = useScheduleStore(state => state.tasks);
  const columns = useScheduleStore(state => state.columns);
  const weekdaysOnly = useScheduleStore(state => state.weekdaysOnly);
  const toggleWeekdaysOnly = useScheduleStore(state => state.toggleWeekdaysOnly);
  const updateTask = useScheduleStore(state => state.updateTask);
  const fetchTasks = useScheduleStore(state => state.fetchTasks);
  const fetchColumns = useScheduleStore(state => state.fetchColumns);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [draggedTask, setDraggedTask] = useState<TaskType | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const getWeekDateRange = (offset: number) => {
    const today = new Date();
    const first = today.getDate() - today.getDay() + 1; // Start from Monday
    const monday = new Date(today.setDate(first + offset * 7));
    const sunday = new Date(today.setDate(first + offset * 7 + 6));
    return { monday, sunday };
  };

  const weekRange = getWeekDateRange(weekOffset);
  const formatDateRange = (monday: Date, sunday: Date) => {
    const monthShort = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${monthShort(monday)} - ${monthShort(sunday)}`;
  };

  const isCurrentWeek = weekOffset === 0;
  const weekDisplayText = formatDateRange(weekRange.monday, weekRange.sunday);

  const displayedColumns = useMemo(
    () => (weekdaysOnly ? columns.filter(col => col.column_index < 5) : columns),
    [columns, weekdaysOnly]
  );


  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchColumns();
    fetchTasks();

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchColumns, fetchTasks]);

  const tasksWithLanes = detectOverlaps(tasks);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const taskId = event.active.data?.current?.taskId;
    if (taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setDraggedTask(task);
      }
    }
  }, [tasks]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over, delta } = event;
    setDraggedTask(null);

    const taskId = active.data?.current?.taskId;
    const isTaskDrag = active.data?.current?.type === 'task';

    if (!isTaskDrag || !taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    let newColumnIndex = task.column_index;

    // If we have drop target information from collision detection, use it
    if (over?.data?.current?.type === 'column') {
      newColumnIndex = over.data.current.columnIndex;
    } else if (over === null && delta.x !== 0) {
      // Fallback: detect column based on horizontal movement
      const columnWidth = (containerRef.current?.offsetWidth ?? 0) / displayedColumns.length;
      const columnDelta = Math.round(delta.x / columnWidth);
      newColumnIndex = Math.max(0, Math.min(displayedColumns.length - 1, task.column_index + columnDelta));
    }

    // Calculate new position using delta
    const deltaY = delta.y;
    let newStartMinute = task.start_minute + pxToMinutes(deltaY);
    newStartMinute = snapToGrid(newStartMinute);
    newStartMinute = Math.max(0, Math.min(TOTAL_MINUTES - task.duration, newStartMinute));

    // Only update if something actually changed
    if (task.column_index !== newColumnIndex || task.start_minute !== newStartMinute) {
      updateTask(taskId, {
        column_index: newColumnIndex,
        start_minute: newStartMinute,
      });
    }
  }, [displayedColumns.length, tasks, updateTask]);

  const columnHeight = PIXELS_PER_MINUTE * TOTAL_MINUTES;
  const currentTimePixels = PIXELS_PER_MINUTE * ((currentTime.getHours() * 60) + currentTime.getMinutes());

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full h-full flex flex-col bg-gray-50">
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Task logs</h1>

            {/* Week Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekOffset(weekOffset - 1)}
                className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                title="Previous week"
              >
                ← Prev
              </button>
              <button
                onClick={() => setWeekOffset(0)}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  isCurrentWeek
                    ? 'bg-blue-500 text-white border border-blue-600 hover:bg-blue-600'
                    : 'bg-white border border-gray-300 hover:bg-gray-100'
                }`}
                title="Current week"
              >
                Now
              </button>
              <button
                onClick={() => setWeekOffset(weekOffset + 1)}
                className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                title="Next week"
              >
                Next →
              </button>
              <span className="text-sm text-gray-600 font-semibold ml-2 min-w-fit">
                {weekDisplayText}
              </span>
            </div>

            <button
              onClick={toggleWeekdaysOnly}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                weekdaysOnly
                  ? 'bg-blue-500 text-white shadow-md hover:bg-blue-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title={weekdaysOnly ? 'Showing weekdays (Mon-Fri)' : 'Showing full week (Mon-Sun)'}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
              </svg>
              <span className="text-sm font-medium">{weekdaysOnly ? 'Mon-Fri' : 'Full Week'}</span>
            </button>
          </div>
        </div>

        {/* Header Row with Time Label Area and Column Headers */}
        <div className="sticky top-16 z-30 bg-white border-b border-gray-200 shadow-sm h-16 flex overflow-hidden">
          {/* Time label header area with alignment to left sidebar */}
          <div className="w-24 border-r border-gray-200 flex items-center justify-center font-semibold text-gray-600 flex-shrink-0"></div>

          {/* Column headers */}
          <div className="flex flex-1 overflow-y-scroll">
            {displayedColumns.map((column, index) => (
              <div
                key={column.id}
                className={`flex-1 flex items-center justify-center font-semibold text-gray-900 ${index < displayedColumns.length - 1 ? 'border-r' : ''} border-gray-200`}
              >
                {column.label}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="flex">
            <div
              className="sticky left-0 z-20 bg-white border-r border-gray-200 w-24 flex flex-col"
              style={{ minHeight: `${columnHeight}px` }}
            >
              {/* Time Labels */}
              <div className="flex flex-col h-full">
                {Array.from({ length: 24 }).map((_, i) => {
                  const minutes = i * 60;
                  return (
                    <div
                      key={i}
                      className="flex-1 border-b border-gray-200 flex items-center justify-center font-semibold text-gray-600"
                      style={{ minHeight: `${PIXELS_PER_MINUTE * 60}px` }}
                    >
                      <div className="text-sm">
                        {minutes === 0
                          ? '12:00 AM'
                          : minutes < 720
                          ? `${minutes / 60}:00 AM`
                          : minutes === 720
                          ? '12:00 PM'
                          : `${(minutes - 720) / 60}:00 PM`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              ref={containerRef}
              className="flex-1 relative"
              style={{ minHeight: `${columnHeight}px` }}
            >
              {/* Current time indicator */}
              <div
                className="absolute inset-x-0 pointer-events-none z-10"
                style={{ top: `${currentTimePixels}px` }}
              >
                <div className="h-0.5 bg-red-500 w-full" />
              </div>

              <div className="flex h-full">
                {displayedColumns.map((column) => {
                  const columnTasks = tasksWithLanes.filter(t => t.column_index === column.column_index);
                  return (
                    <div key={column.id} data-column={column.column_index} className="flex-1 relative border-r border-gray-200 last:border-r-0">
                      <Column
                        column_index={column.column_index}
                        tasks={columnTasks}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DragOverlay>
        {draggedTask ? <DragPreview task={draggedTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
};
