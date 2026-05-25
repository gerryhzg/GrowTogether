"use client";

interface GoalExplanationCardProps {
  explanation: string | null;
  loading?: boolean;
}

export function GoalExplanationCard({ explanation, loading = false }: GoalExplanationCardProps) {
  if (loading) {
    return (
      <div className="rounded-[1.25rem] bg-white/70 p-4 shadow-sm animate-pulse">
        <p className="text-xs uppercase tracking-[0.25em] text-muted">Loading explanation...</p>
      </div>
    );
  }

  if (!explanation) {
    return null;
  }

  return (
    <div className="rounded-[1.25rem] bg-white/70 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.25em] text-muted">Why this goal</p>
      <p className="mt-2 text-sm text-foreground">{explanation}</p>
    </div>
  );
}
