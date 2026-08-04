import React, { useCallback, useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { minutesToPx, pxToMinutes, snapToGrid, MIN_DURATION, TOTAL_MINUTES, formatTime, formatDuration } from '../lib/gridUtils';
import { useScheduleStore } from '../store/scheduleStore';

interface TaskProps {
  id: string;
  column_index: number;
  start_minute: number;
  duration: number;
  title: string;
  color: string;
  lane: number;
  laneCount: number;
}

const COLOR_MAP: { [key: string]: string } = {
  blue: 'bg-blue-500 hover:bg-blue-600',
  green: 'bg-green-500 hover:bg-green-600',
  purple: 'bg-purple-500 hover:bg-purple-600',
  pink: 'bg-pink-500 hover:bg-pink-600',
  red: 'bg-red-500 hover:bg-red-600',
  orange: 'bg-orange-500 hover:bg-orange-600',
};

export const Task = React.memo(({
  id,
  column_index,
  start_minute,
  duration,
  title,
  color,
  lane,
  laneCount
}: TaskProps) => {
  const { setNodeRef, isDragging, transform, attributes, listeners } = useDraggable({
    id: `task-${id}`,
    data: { type: 'task', taskId: id, columnIndex: column_index, startMinute: start_minute }
  });

  const updateTask = useScheduleStore(state => state.updateTask);
  const deleteTask = useScheduleStore(state => state.deleteTask);
  const resizeRef = useRef<HTMLDivElement>(null);

  const top = minutesToPx(start_minute);
  const height = minutesToPx(duration);
  const width = 100 / laneCount;
  const left = (width * lane);

  const handleResizeStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const startY = e.clientY;
    const startDuration = duration;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const deltaMinutes = pxToMinutes(deltaY);
      let newDuration = startDuration + deltaMinutes;

      newDuration = snapToGrid(newDuration);
      newDuration = Math.max(MIN_DURATION, newDuration);
      newDuration = Math.min(TOTAL_MINUTES - start_minute, newDuration);

      updateTask(id, { duration: newDuration });
    };

    const handlePointerUp = () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  }, [duration, start_minute, id, updateTask]);

  const handleDelete = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    deleteTask(id);
  }, [id, deleteTask]);

  const dragStyle = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const taskStyle = {
    top: `${top}px`,
    height: `${height}px`,
    left: `${left}%`,
    width: `${width}%`,
    ...dragStyle
  };

  return (
    <div
      ref={setNodeRef}
      style={taskStyle}
      className={`absolute transition-all duration-150 rounded-lg shadow-md border border-opacity-20 border-white overflow-hidden group ${isDragging ? 'opacity-40 z-50 ring-2 ring-blue-400 shadow-lg' : 'z-10 hover:z-20 hover:shadow-lg'} ${COLOR_MAP[color] || COLOR_MAP.blue}`}
    >
      <div className="h-full flex flex-col p-2 text-white text-sm">
        {/* Header with Drag Handle and Delete Button */}
        <div className="flex items-center gap-1 mb-1">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="flex items-center cursor-grab active:cursor-grabbing select-none hover:bg-white hover:bg-opacity-20 px-1 py-0.5 rounded transition-colors"
          >
            <div className="flex flex-col gap-0.5">
              <div className="h-0.5 w-4 bg-white opacity-70"></div>
              <div className="h-0.5 w-4 bg-white opacity-70"></div>
              <div className="h-0.5 w-4 bg-white opacity-70"></div>
            </div>
          </div>
          <div className="font-semibold truncate flex-1">{title}</div>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            className="ml-1 p-1 hover:bg-red-600 hover:bg-opacity-80 rounded transition-colors opacity-0 group-hover:opacity-100"
            title="Delete task"
          >
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="text-xs opacity-90 pl-5">{formatTime(start_minute)}</div>
        <div className="text-xs opacity-75 pl-5">{formatDuration(duration)}</div>
      </div>

      <div
        ref={resizeRef}
        onPointerDown={handleResizeStart}
        className="absolute bottom-0 left-0 right-0 h-1 bg-white bg-opacity-30 hover:bg-opacity-50 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity duration-150"
      />
    </div>
  );
});

Task.displayName = 'Task';
