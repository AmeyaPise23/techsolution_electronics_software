import { useState } from "react";
import { useAsync } from "../hooks/useAsync";
import { useCurrentActor } from "../hooks/useCurrentActor";
import { usePermission } from "../hooks/usePermission";
import { getLeaderboard } from "../services/leaderboardService";
import { LeaderboardWindow } from "../types";
import { Card } from "../../../components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Skeleton } from "../../../components/ui/skeleton";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { Badge } from "../../../components/ui/badge";
import { Crown, Medal, Trophy, Zap } from "lucide-react";

function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

const WINDOW_LABEL: Record<LeaderboardWindow, string> = {
  [LeaderboardWindow.Today]:   "Today",
  [LeaderboardWindow.Week]:    "This Week",
  [LeaderboardWindow.Month]:   "This Month",
  [LeaderboardWindow.Year]:    "This Year",
  [LeaderboardWindow.AllTime]: "All Time",
};

const RANK_LOOK: Record<number, { icon: React.ReactNode; ring: string }> = {
  1: { icon: <Crown className="size-4 text-amber-500" />, ring: "ring-2 ring-amber-300" },
  2: { icon: <Medal className="size-4 text-slate-400" />, ring: "ring-2 ring-slate-300" },
  3: { icon: <Trophy className="size-4 text-orange-500" />, ring: "ring-2 ring-orange-300" },
};

export function LeaderboardPage() {
  const actor = useCurrentActor();
  const canSeeBreakdown = usePermission("leaderboard.viewFullBreakdown");
  const [window, setWindow] = useState<LeaderboardWindow>(LeaderboardWindow.Week);

  const { data: rows, isLoading } = useAsync(
    () => getLeaderboard(window),
    { deps: [window] }
  );

  const totalPoints = (rows ?? []).reduce((s, r) => s + r.totalPoints, 0);
  const totalTasks = (rows ?? []).reduce((s, r) => s + r.tasksCompleted, 0);
  const yourRow = (rows ?? []).find((r) => r.employeeId === actor.id);

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Leaderboard</h2>
            <p className="text-sm text-slate-500">Story points credited to each teammate on task completion.</p>
          </div>
          <Tabs value={window} onValueChange={(v) => setWindow(v as LeaderboardWindow)}>
            <TabsList>
              {(Object.values(LeaderboardWindow) as LeaderboardWindow[]).map((w) => (
                <TabsTrigger key={w} value={w}>{WINDOW_LABEL[w]}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {canSeeBreakdown && rows && rows.length > 0 && (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <MiniStat label="Total points" value={`${totalPoints}`} accent="text-indigo-700" />
            <MiniStat label="Tasks completed" value={`${totalTasks}`} accent="text-emerald-700" />
            <MiniStat label="Contributors" value={`${rows.length}`} accent="text-blue-700" />
          </div>
        )}

        {yourRow && (
          <Card className="mt-4 border-blue-200 bg-blue-50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                  YOU
                </span>
                <span className="text-sm font-semibold text-blue-900">
                  Rank #{yourRow.rank} · {yourRow.totalPoints} pt · {yourRow.tasksCompleted} tasks
                </span>
              </div>
            </div>
          </Card>
        )}
      </Card>

      <Card className="overflow-hidden p-0">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
          </div>
        ) : !rows || rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            No credited points in this window yet.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => {
              const isYou = r.employeeId === actor.id;
              const decoration = RANK_LOOK[r.rank];
              return (
                <li
                  key={r.employeeId}
                  className={`flex items-center gap-3 p-4 ${isYou ? "bg-blue-50/60" : ""}`}
                >
                  <div className="flex w-10 items-center justify-center">
                    {decoration?.icon ?? (
                      <span className="text-sm font-bold text-slate-400">#{r.rank}</span>
                    )}
                  </div>
                  <Avatar className={`size-10 ${decoration?.ring ?? ""}`}>
                    <AvatarFallback className="bg-blue-100 text-sm font-bold text-blue-800">
                      {initials(r.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {r.displayName}
                      {isYou && (
                        <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">You</Badge>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">{r.tasksCompleted} tasks completed</p>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center gap-1 text-lg font-bold text-indigo-700">
                      <Zap className="size-4" />
                      {r.totalPoints}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-slate-400">points</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <Card className="p-3">
      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-xl font-bold ${accent}`}>{value}</div>
    </Card>
  );
}
