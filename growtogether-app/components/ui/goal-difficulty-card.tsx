"use client";

import { DifficultyAdjustment } from "@/lib/types";

interface GoalDifficultyCardProps {
  adjustment: DifficultyAdjustment | null;
}

export function GoalDifficultyCard({ adjustment }: GoalDifficultyCardProps) {
  if (!adjustment) {
    return null;
  }

  return (
    <div className="rounded-[1.5rem] bg-gradient-to-br from-blue-50 to-blue-25 p-6 shadow-sm border border-blue-100">
      <p className="text-sm uppercase tracking-[0.25em] text-blue-600">Smart Adjustment Suggestion</p>
      <h3 className="mt-3 text-xl font-semibold text-foreground">
        {adjustment.suggestion}
      </h3>
      <p className="mt-3 text-muted">
        {adjustment.reason}
      </p>
    </div>
  );
}
