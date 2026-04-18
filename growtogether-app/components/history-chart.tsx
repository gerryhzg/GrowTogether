import { HistoryEntry } from "@/lib/types";

export function HistoryChart({ entries }: { entries: HistoryEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
        Progress snapshots will appear here after the first check-in.
      </div>
    );
  }

  const maxValue = Math.max(...entries.map((entry) => entry.progressSnapshot), 1);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {entries.map((entry) => {
        const height = Math.max(14, Math.round((entry.progressSnapshot / maxValue) * 120));

        return (
          <div
            key={entry.id}
            className="rounded-[1.5rem] bg-white/75 p-4 text-sm shadow-sm"
          >
            <div className="flex h-36 items-end">
              <div
                className="w-full rounded-t-[1rem] bg-gradient-to-t from-secondary to-accent"
                style={{ height }}
              />
            </div>
            <p className="mt-3 font-medium text-foreground">{entry.title}</p>
            <p className="mt-1 text-muted">{entry.progressSnapshot} total</p>
          </div>
        );
      })}
    </div>
  );
}
