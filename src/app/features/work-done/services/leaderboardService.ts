import { ID, LeaderboardEntry, LeaderboardWindow } from "../types";
import { wmGet, s } from "./api";

interface BackendLeaderboardEntry {
  employeeUserId: number;
  displayName: string;
  totalPoints: number;
  tasksCompleted: number;
  rank: number;
}

export async function getLeaderboard(
  window: LeaderboardWindow,
  projectId?: ID
): Promise<LeaderboardEntry[]> {
  const params = new URLSearchParams();
  params.set("window", window);
  if (projectId) params.set("projectId", projectId);
  const raw = await wmGet<BackendLeaderboardEntry[]>(`/leaderboard?${params}`);
  return raw.map((b) => ({
    employeeId: s(b.employeeUserId),
    displayName: b.displayName,
    totalPoints: b.totalPoints,
    tasksCompleted: b.tasksCompleted,
    rank: b.rank,
    window,
  }));
}
