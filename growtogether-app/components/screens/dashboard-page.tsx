"use client";

import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { Panel } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useAppState } from "@/components/providers/app-state-provider";
import { formatDate, formatRelativeProgress, getProgressPercentage } from "@/lib/utils";

export function DashboardPage() {
  const {
    activeJourney,
    hydrated,
    latestCheckIn,
    latestParentSupport,
    topInterests,
  } = useAppState();

  if (!hydrated) {
    return <Panel>Loading your growth journey...</Panel>;
  }

  if (!activeJourney) {
    return (
      <EmptyState
        title="Create your first growth journey"
        description="Start by discovering what the child loves most, then turn that interest into one meaningful goal the whole family can support."
        ctaHref="/discover"
        ctaLabel="Discover interests"
      />
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
      <Panel className="relative overflow-hidden">
        <div className="absolute -right-12 top-0 h-28 w-28 rounded-full bg-accent/15 blur-2xl" />
        <div className="relative">
          <p className="text-sm uppercase tracking-[0.25em] text-secondary">My Growth Journey</p>
          <h2 className="mt-3 font-display text-4xl text-foreground">
            {activeJourney.goalTitle}
          </h2>
          <p className="mt-3 max-w-2xl text-muted">{activeJourney.goalDescription}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <InfoCard label="Top interest" value={activeJourney.linkedInterest} />
            <InfoCard
              label="Progress"
              value={formatRelativeProgress(activeJourney)}
            />
            <InfoCard
              label="Last update"
              value={formatDate(activeJourney.updatedAt)}
            />
          </div>

          <div className="mt-6">
            <ProgressBar
              label="Journey progress"
              value={getProgressPercentage(activeJourney)}
            />
          </div>
        </div>
      </Panel>

      <Panel className="bg-secondary text-white">
        <p className="text-sm uppercase tracking-[0.25em] text-white/70">Family snapshot</p>
        <h3 className="mt-3 font-display text-3xl">Today feels connected.</h3>
        <p className="mt-3 text-sm leading-7 text-white/80">
          {topInterests.length > 0
            ? `The strongest interests right now are ${topInterests.join(", ")}.`
            : "Interest discovery will fill this space once the child rates what they love."}
        </p>
        <div className="mt-6 space-y-3 text-sm text-white/85">
          <p>Daily check-in and parent encouragement are designed to stay tied to the same goal.</p>
          <p>When this journey is complete, it moves into Growth Memory automatically.</p>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm uppercase tracking-[0.25em] text-secondary">Today&apos;s reflection</p>
        <h3 className="mt-3 text-2xl font-semibold text-foreground">
          {latestCheckIn?.reflectionQuestion ?? "No reflection yet today."}
        </h3>
        <p className="mt-4 rounded-[1.25rem] bg-white/70 p-4 text-muted">
          {latestCheckIn?.childAnswer ??
            "Head to Daily Check-In to add progress and unlock a reflection question."}
        </p>
        <Link
          href="/check-in"
          className="mt-5 inline-flex rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
        >
          Open Daily Check-In
        </Link>
      </Panel>

      <Panel>
        <p className="text-sm uppercase tracking-[0.25em] text-secondary">Parent encouragement</p>
        <h3 className="mt-3 text-2xl font-semibold text-foreground">
          {latestParentSupport?.encouragementText ?? "No parent message yet."}
        </h3>
        <p className="mt-4 text-muted">
          {latestParentSupport?.activitySuggestion ??
            "Parent Support Center can suggest a warm message and a shared activity next."}
        </p>
        <Link
          href="/parent"
          className="mt-5 inline-flex rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
        >
          Visit Parent Center
        </Link>
      </Panel>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] bg-white/75 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.25em] text-muted">{label}</p>
      <p className="mt-3 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
