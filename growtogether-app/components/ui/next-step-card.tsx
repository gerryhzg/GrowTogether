"use client";

import { useChildTheme } from "@/components/providers/child-theme-context";

interface NextStepCardProps {
  step: string | null;
  loading?: boolean;
  onLoadStep?: () => void;
}

export function NextStepCard({ step, loading = false, onLoadStep }: NextStepCardProps) {
  const { isNeonQuest } = useChildTheme();

  if (!step) {
    return (
      <div className="rounded-[1.5rem] bg-gradient-to-br from-green-50 to-green-25 p-6 shadow-sm border border-green-100">
        <p className="text-sm uppercase tracking-[0.25em] text-green-600">{isNeonQuest ? "Next Move" : "Next Best Step"}</p>
        <button
          onClick={onLoadStep}
          disabled={loading}
          className="mt-4 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? (isNeonQuest ? "Thinking..." : "Loading...") : isNeonQuest ? "Give me the play" : "Get next step"}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-[1.5rem] bg-gradient-to-br from-green-50 to-green-25 p-6 shadow-sm border border-green-100">
      <p className="text-sm uppercase tracking-[0.25em] text-green-600">{isNeonQuest ? "Next Move" : "Next Best Step"}</p>
      <h3 className="mt-3 text-xl font-semibold text-foreground">
        {step}
      </h3>
      <p className="mt-3 text-sm text-muted">
        {isNeonQuest ? "AI cooked up the next play. Run it." : "AI-recommended action for today's growth"}
      </p>
    </div>
  );
}
