"use client";

import { StreakInfo } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useChildTheme } from "@/components/providers/child-theme-context";

interface StreakCardProps {
  streakInfo: StreakInfo;
}

export function StreakCard({ streakInfo }: StreakCardProps) {
  const { isNeonQuest } = useChildTheme();

  return (
    <div className="rounded-[1.5rem] bg-white/75 p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.25em] text-muted">{isNeonQuest ? "Streak Meter" : "Consistency Tracker"}</p>
      
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-secondary">{isNeonQuest ? "Current heater" : "Current streak"}</p>
          <p className="mt-2 text-2xl font-bold text-accent">
            {streakInfo.currentStreak}-day{streakInfo.currentStreak !== 1 ? "s" : ""}
          </p>
        </div>
        
        {streakInfo.completionDaysRemaining !== null && (
          <div>
            <p className="text-sm font-medium text-secondary">{isNeonQuest ? "Days till boss cleared" : "Days to completion"}</p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {streakInfo.completionDaysRemaining} day{streakInfo.completionDaysRemaining !== 1 ? "s" : ""}
            </p>
            {streakInfo.estimatedCompletionDate && (
              <p className="mt-1 text-xs text-muted">
                Est. {formatDate(streakInfo.estimatedCompletionDate)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
