"use client";

interface SafetyCheckCardProps {
  isSafe: boolean;
  suggestion: string | null;
  onAcceptSuggestion?: () => void;
}

export function SafetyCheckCard({ isSafe, suggestion, onAcceptSuggestion }: SafetyCheckCardProps) {
  if (isSafe) {
    return (
      <div className="rounded-[1.25rem] bg-green-50 p-4 border border-green-100">
        <p className="text-sm font-medium text-green-700">✓ Message looks warm and supportive!</p>
      </div>
    );
  }

  return (
    <div className="rounded-[1.5rem] bg-gradient-to-br from-yellow-50 to-yellow-25 p-5 shadow-sm border border-yellow-100">
      <p className="text-sm uppercase tracking-[0.25em] text-yellow-600">Safety Check</p>
      <h3 className="mt-3 text-lg font-semibold text-foreground">
        This message might sound harsh
      </h3>
      {suggestion && (
        <div className="mt-4 rounded-[1.25rem] bg-white/70 p-4">
          <p className="text-sm text-muted mb-2">Suggested rewrite:</p>
          <p className="text-foreground">{suggestion}</p>
          {onAcceptSuggestion && (
            <button
              onClick={onAcceptSuggestion}
              className="mt-3 text-sm font-medium text-yellow-600 hover:text-yellow-700 transition"
            >
              Use this version
            </button>
          )}
        </div>
      )}
    </div>
  );
}
