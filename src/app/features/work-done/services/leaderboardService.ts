import { ID, LeaderboardEntry, LeaderboardWindow } from "../types";
import { simulateLatency } from "../mock/latency";
import { snapshot } from "../mock/store";

// Backend (Phase B5) will do this as an aggregation query over the ledger; the
// signature is identical, so screens don't have to change on swap-in.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function windowStart(window: LeaderboardWindow, now: Date): Date {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  switch (window) {
    case LeaderboardWindow.Today: return d;
    case LeaderboardWindow.Week:  return new Date(d.getTime() - 6 * MS_PER_DAY);
    case LeaderboardWindow.Month: return new Date(d.getTime() - 29 * MS_PER_DAY);
    case LeaderboardWindow.Year:  return new Date(d.getTime() - 364 * MS_PER_DAY);
    case LeaderboardWindow.AllTime: return new Date(0);
  }
}

export async function getLeaderboard(
  window: LeaderboardWindow,
  projectId?: ID
): Promise<LeaderboardEntry[]> {
  await simulateLatency();
  const { employees, storyPointLedger } = snapshot();
  const startMs = windowStart(window, new Date()).getTime();

  const byEmployee = new Map<ID, { points: number; tasks: Set<ID> }>();
  for (const e of storyPointLedger) {
    const ts = Date.parse(e.creditedAt);
    if (Number.isNaN(ts) || ts < startMs) continue;
    if (projectId && e.projectId !== projectId) continue;
    const bucket = byEmployee.get(e.employeeId) ?? { points: 0, tasks: new Set<ID>() };
    bucket.points += e.points;
    bucket.tasks.add(e.taskId);
    byEmployee.set(e.employeeId, bucket);
  }

  const rows = [...byEmployee.entries()]
    .map(([empId, bucket]) => {
      const emp = employees.find((e) => e.id === empId);
      return {
        employeeId: empId,
        displayName: emp?.displayName ?? "Unknown",
        avatarUrl: emp?.avatarUrl,
        totalPoints: bucket.points,
        tasksCompleted: bucket.tasks.size,
        window,
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  return rows;
}
