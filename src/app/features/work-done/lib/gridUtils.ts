export const PIXELS_PER_MINUTE = 1.33;
export const TOTAL_MINUTES = 1440;
export const SNAP_INTERVAL = 5;
export const COLUMN_COUNT = 7;
export const MIN_DURATION = 15;

export const minutesToPx = (minutes: number): number => {
  return minutes * PIXELS_PER_MINUTE;
};

export const pxToMinutes = (px: number): number => {
  return Math.round(px / PIXELS_PER_MINUTE);
};

export const snapToGrid = (minutes: number, interval: number = SNAP_INTERVAL): number => {
  return Math.round(minutes / interval) * interval;
};

export const clampMinutes = (minutes: number, min: number = 0, max: number = TOTAL_MINUTES): number => {
  return Math.max(min, Math.min(max, minutes));
};

export const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${ampm}`;
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
};

export interface TaskWithLane {
  id: string;
  column_index: number;
  start_minute: number;
  duration: number;
  title: string;
  color: string;
  lane: number;
  laneCount: number;
}

export interface TaskGroup {
  [key: string]: TaskWithLane[];
}

type SchedulableTask = {
  id: string;
  column_index: number;
  start_minute: number;
  duration: number;
  title: string;
  color: string;
};

export const detectOverlaps = (
  tasks: SchedulableTask[]
): TaskWithLane[] => {
  const grouped: { [columnIndex: number]: SchedulableTask[] } = {};

  tasks.forEach(task => {
    if (!grouped[task.column_index]) {
      grouped[task.column_index] = [];
    }
    grouped[task.column_index].push(task);
  });

  const result: TaskWithLane[] = [];

  Object.values(grouped).forEach(columnTasks => {
    const sorted = columnTasks.sort((a, b) => a.start_minute - b.start_minute);

    const lanes: TaskWithLane[][] = [];

    sorted.forEach(task => {
      let placed = false;

      for (let laneIndex = 0; laneIndex < lanes.length; laneIndex++) {
        const lane = lanes[laneIndex];
        const canPlaceInLane = lane.every(
          existingTask =>
            task.start_minute >= existingTask.start_minute + existingTask.duration ||
            task.start_minute + task.duration <= existingTask.start_minute
        );

        if (canPlaceInLane) {
          lane.push({
            ...task,
            lane: laneIndex,
            laneCount: 0
          });
          placed = true;
          break;
        }
      }

      if (!placed) {
        lanes.push([
          {
            ...task,
            lane: lanes.length,
            laneCount: 0
          }
        ]);
      }
    });

    lanes.forEach((lane) => {
      const laneCount = lanes.length;
      lane.forEach(task => {
        task.laneCount = laneCount;
        result.push(task);
      });
    });
  });

  return result;
};
