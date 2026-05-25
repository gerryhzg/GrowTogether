"use client";

import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { HistoryChart } from "@/components/history-chart";
import { WeeklyHighlightCard } from "@/components/ui/weekly-highlight-card";
import { useAppState } from "@/components/providers/app-state-provider";
import { Panel } from "@/components/ui/panel";
import { formatDate } from "@/lib/utils";

export function MemoryPage() {
  const { state } = useAppState();
  const [weeklyHighlight, setWeeklyHighlight] = useState<string | null>(null);
  const [highlightLoading, setHighlightLoading] = useState(false);

  const historyEntries = [...state.historyEntries].sort((left, right) =>
    right.date.localeCompare(left.date),
  );

  async function loadWeeklyHighlight() {
    if (weeklyHighlight || highlightLoading) return;
    
    setHighlightLoading(true);

    try {
      const response = await fetch("/api/ai/weekly-highlight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journeyId: state.activeJourneyId,
          historyEntries,
          checkIns: state.checkIns,
        }),
      });
      const data = await response.json();
      if (data.highlights && data.highlights.length > 0) {
        setWeeklyHighlight(data.highlights[0].highlight);
      }
    } finally {
      setHighlightLoading(false);
    }
  }

  if (historyEntries.length === 0) {
    return (
      <EmptyState
        title="Growth memory starts with the first journey"
        description="As soon as the child starts a goal and checks in, this page will begin telling the full story with progress, reflection, and family support."
        ctaHref="/discover"
        ctaLabel="Create the first journey"
      />
    );
  }

  return (
    <div className="space-y-5">
      <Panel>
        <p className="text-sm uppercase tracking-[0.25em] text-secondary">Screen 5</p>
        <h2 className="mt-3 font-display text-4xl text-foreground">
          Growth memory
        </h2>
        <p className="mt-3 max-w-3xl text-muted">
          Each saved moment becomes part of the family story: the goal, the effort, the reflection, and the encouragement that came after it.
        </p>
      </Panel>

      <WeeklyHighlightCard
        highlight={weeklyHighlight}
        loading={highlightLoading}
        onLoadHighlight={loadWeeklyHighlight}
      />

      <Panel>
        <p className="text-sm uppercase tracking-[0.25em] text-secondary">Progress graph</p>
        <h3 className="mt-2 text-2xl font-semibold text-foreground">
          Snapshot of momentum over time
        </h3>
        <div className="mt-6">
          <HistoryChart entries={historyEntries.slice().reverse()} />
        </div>
      </Panel>

      <Panel>
        <p className="text-sm uppercase tracking-[0.25em] text-secondary">Timeline</p>
        <div className="mt-6 space-y-4">
          {historyEntries.map((entry) => (
            <article
              key={entry.id}
              className="rounded-[1.5rem] bg-white/75 p-5 shadow-sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-muted">
                    {entry.type.replace("-", " ")}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-foreground">
                    {entry.title}
                  </h3>
                </div>
                <p className="text-sm text-muted">{formatDate(entry.date)}</p>
              </div>
              <p className="mt-3 text-muted">{entry.detail}</p>
              <p className="mt-3 text-sm font-medium text-foreground">
                Progress snapshot: {entry.progressSnapshot}
              </p>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
