"use client";

interface WeeklyHighlightCardProps {
  highlight: string | null;
  loading?: boolean;
  onLoadHighlight?: () => void;
}

export function WeeklyHighlightCard({ highlight, loading = false, onLoadHighlight }: WeeklyHighlightCardProps) {
  if (!highlight && !loading) {
    return (
      <div className="rounded-[1.5rem] bg-gradient-to-br from-purple-50 to-purple-25 p-6 shadow-sm border border-purple-100">
        <p className="text-sm uppercase tracking-[0.25em] text-purple-600">AI Weekly Highlight</p>
        {onLoadHighlight && (
          <button
            onClick={onLoadHighlight}
            disabled={loading}
            className="mt-4 rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
          >
            Generate highlight
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-[1.5rem] bg-gradient-to-br from-purple-50 to-purple-25 p-6 shadow-sm border border-purple-100 animate-pulse">
        <p className="text-sm uppercase tracking-[0.25em] text-purple-600">Generating highlight...</p>
      </div>
    );
  }

  if (!highlight) {
    return null;
  }

  return (
    <div className="rounded-[1.5rem] bg-gradient-to-br from-purple-50 to-purple-25 p-6 shadow-sm border border-purple-100">
      <p className="text-sm uppercase tracking-[0.25em] text-purple-600">AI Weekly Highlight</p>
      <div className="mt-4 rounded-[1.25rem] bg-white/70 p-4">
        <p className="text-lg font-semibold text-foreground">{highlight}</p>
      </div>
    </div>
  );
}
