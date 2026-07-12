"use client";

import { CoachScore } from "@/lib/types";

interface CheckInResultsProps {
  score: CoachScore;
}

export function CheckInResults({ score }: CheckInResultsProps) {
  return (
    <div className="rounded-[1.5rem] bg-gradient-to-br from-accent/10 to-accent/5 p-6 shadow-sm">
      <p className="text-sm uppercase tracking-[0.25em] text-secondary">AI Growth Coach Score</p>
      <h3 className="mt-3 text-2xl font-semibold text-foreground">
        Your Progress Profile
      </h3>
      <div className="mt-5 space-y-3">
        <ScoreItem label="Consistency" value={score.consistency} />
        <ScoreItem label="Reflection Depth" value={score.reflectionDepth} />
        <ScoreItem label="Motivation" value={score.motivation} />
      </div>
    </div>
  );
}

function ScoreItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] bg-white/70 p-4">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-2 text-lg text-foreground">{value}</p>
    </div>
  );
}
