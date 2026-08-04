import React, { useState, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { TOTAL_MINUTES, minutesToPx, pxToMinutes, snapToGrid } from '../lib/gridUtils';
import { Task } from './Task';
import { TaskWithLane } from '../lib/gridUtils';
import { useScheduleStore } from '../store/scheduleStore';
import { TaskModal } from './TaskModal';

interface ColumnProps {
  column_index: number;
  tasks: TaskWithLane[];
}

export const Column = React.memo(({
  column_index,
  tasks
}: ColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column_index}`,
    data: { type: 'column', columnIndex: column_index }
  });

  const [showModal, setShowModal] = useState(false);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const columnHeight = minutesToPx(TOTAL_MINUTES);

  const addTask = useScheduleStore(state => state.addTask);

  const handleColumnClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const clickedMinute = snapToGrid(pxToMinutes(clickY));

    setSelectedMinute(Math.max(0, Math.min(TOTAL_MINUTES - 60, clickedMinute)));
    setShowModal(true);
  }, []);

  const handleCreateTask = useCallback(async (title: string, duration: number, color: string) => {
    await addTask({
      column_index,
      start_minute: selectedMinute,
      duration,
      title,
      color
    });
    setShowModal(false);
  }, [column_index, selectedMinute, addTask]);

  return (
    <>
      <div
        ref={setNodeRef}
        onClick={handleColumnClick}
        className={`flex-1 relative border-l border-gray-200 transition-all duration-150 ${isOver ? 'bg-blue-100 shadow-inset' : 'bg-white hover:bg-gray-50'}`}
        style={{ height: `${columnHeight}px`, minHeight: '100%' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                to bottom,
                transparent 0px,
                transparent ${minutesToPx(30) - 1}px,
                rgba(229, 231, 235, 0.5) ${minutesToPx(30) - 1}px,
                rgba(229, 231, 235, 0.5) ${minutesToPx(30)}px,
                transparent ${minutesToPx(30)}px,
                transparent ${minutesToPx(60) - 1}px,
                rgba(229, 231, 235, 0.8) ${minutesToPx(60) - 1}px,
                rgba(229, 231, 235, 0.8) ${minutesToPx(60)}px
              )
            `
          }}
        />

        {tasks.map(task => (
          <Task
            key={task.id}
            id={task.id}
            column_index={task.column_index}
            start_minute={task.start_minute}
            duration={task.duration}
            title={task.title}
            color={task.color}
            lane={task.lane}
            laneCount={task.laneCount}
          />
        ))}
      </div>

      {showModal && (
        <TaskModal
          initialMinute={selectedMinute}
          onClose={() => setShowModal(false)}
          onCreate={handleCreateTask}
        />
      )}
    </>
  );
});

Column.displayName = 'Column';
