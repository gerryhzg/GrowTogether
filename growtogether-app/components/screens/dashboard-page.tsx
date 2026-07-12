"use client";

import Link from "next/link";
import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { Panel } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress-bar";
import { NextStepCard } from "@/components/ui/next-step-card";
import { StreakCard } from "@/components/ui/streak-card";
import { BadgesSection } from "@/components/ui/badges-section";
import { useAuth } from "@/components/providers/auth-context";
import { useCheckIns, useInterests, useJourney, useParentSupport } from "@/lib/supabase-hooks";
import {
  calculateStreakInfo,
  formatDate,
  formatRelativeProgress,
  getAllBadges,
  getProgressPercentage,
} from "@/lib/utils";
import { AppState, DailyCheckIn, GrowthJourney, InterestName, ParentSupportEntry } from "@/lib/types";

function toInterestName(value: string): InterestName {
  const allowed: InterestName[] = ["Music", "Sports", "Science", "Coding", "Art", "Animals"];
  return allowed.includes(value as InterestName) ? value as InterestName : "Music";
}

export function DashboardPage() {
  const { user } = useAuth();
  const { interests } = useInterests(user?.familyId);
  const { journey } = useJourney(user?.familyId);
  const { checkIns } = useCheckIns(user?.familyId, journey?.id);
  const { parentSupport } = useParentSupport(user?.familyId, journey?.id);
  const [nextStepLoading, setNextStepLoading] = useState(false);
  const [nextStep, setNextStep] = useState<string | null>(null);

  if (!journey) {
    return (
      <EmptyState
        title="Create your first growth journey"
        description="Start by discovering what the child loves most, then turn that interest into one meaningful goal the whole family can support."
        ctaHref="/discover"
        ctaLabel="Discover interests"
      />
    );
  }

  const activeJourney: GrowthJourney = {
    id: journey.id,
    linkedInterest: toInterestName(journey.linked_interest),
    topInterests: [toInterestName(journey.linked_interest)],
    goalTitle: journey.goal_title,
    goalDescription: journey.goal_description,
    targetCount: journey.target_count,
    currentCount: journey.current_count,
    unit: journey.unit,
    status: journey.status as GrowthJourney["status"],
    createdAt: journey.created_at ?? "",
    updatedAt: journey.created_at ?? "",
  };

  const latestCheckInRow = checkIns[0];
  const latestCheckIn: DailyCheckIn | null = latestCheckInRow
    ? {
        id: latestCheckInRow.id,
        journeyId: latestCheckInRow.journey_id,
        date: latestCheckInRow.created_at ?? "",
        progressAdded: latestCheckInRow.progress_added,
        reflectionQuestion: latestCheckInRow.reflection_question,
        childAnswer: latestCheckInRow.child_answer,
      }
    : null;

  const latestParentSupportRow = parentSupport[0];
  const latestParentSupport: ParentSupportEntry | null = latestParentSupportRow
    ? {
        id: latestParentSupportRow.id,
        journeyId: latestParentSupportRow.journey_id,
        date: latestParentSupportRow.created_at ?? "",
        summary: latestParentSupportRow.summary,
        encouragementText: latestParentSupportRow.encouragement_text,
        activitySuggestion: latestParentSupportRow.activity_suggestion,
      }
    : null;

  const topInterests = [...interests]
    .sort((left, right) => right.rating - left.rating)
    .slice(0, 3)
    .map((entry) => entry.interest);
  const mappedCheckIns = checkIns.map((entry): DailyCheckIn => ({
    id: entry.id,
    journeyId: entry.journey_id,
    date: entry.created_at ?? "",
    progressAdded: entry.progress_added,
    reflectionQuestion: entry.reflection_question,
    childAnswer: entry.child_answer,
  }));
  const mappedParentSupport = parentSupport.map((entry): ParentSupportEntry => ({
    id: entry.id,
    journeyId: entry.journey_id,
    date: entry.created_at ?? "",
    summary: entry.summary,
    encouragementText: entry.encouragement_text,
    activitySuggestion: entry.activity_suggestion,
  }));
  const dashboardState: AppState = {
    activeJourneyId: activeJourney.id,
    interestRatings: interests.map((entry) => ({ interest: toInterestName(entry.interest), rating: entry.rating })),
    journeys: [activeJourney],
    checkIns: mappedCheckIns,
    parentSupportEntries: mappedParentSupport,
    historyEntries: [],
  };

  async function loadNextStep() {
    if (nextStep || nextStepLoading) return;
    setNextStepLoading(true);

    try {
      const response = await fetch("/api/ai/next-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journey: activeJourney, latestCheckIn }),
      });
      const data = await response.json();
      setNextStep(data.step);
    } finally {
      setNextStepLoading(false);
    }
  }

  const badges = getAllBadges(dashboardState, activeJourney);
  const streakInfo = calculateStreakInfo(activeJourney, mappedCheckIns);
  const isParent = user?.role === "parent";

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
            <InfoCard label="Progress" value={formatRelativeProgress(activeJourney)} />
            <InfoCard label="Last update" value={formatDate(activeJourney.updatedAt)} />
          </div>

          <div className="mt-6">
            <ProgressBar
              label="Journey progress"
              value={getProgressPercentage(activeJourney)}
            />
          </div>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm uppercase tracking-[0.25em] text-secondary">Family snapshot</p>
        <h3 className="mt-3 font-display text-3xl text-foreground">Today feels connected.</h3>
        <p className="mt-3 text-sm leading-7 text-muted">
          {topInterests.length > 0
            ? `The strongest interests right now are ${topInterests.join(", ")}.`
            : "Interest discovery will fill this space once the child rates what they love."}
        </p>
        <div className="mt-6 space-y-3 text-sm text-muted">
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
            (isParent
              ? "Parent Support Center can suggest a warm message and a shared activity next."
              : "Your parent can send a warm message from Parent Center.")}
        </p>
        {isParent && (
          <Link
            href="/parent"
            className="mt-5 inline-flex rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
          >
            Visit Parent Center
          </Link>
        )}
      </Panel>

      <NextStepCard
        step={nextStep}
        loading={nextStepLoading}
        onLoadStep={loadNextStep}
      />

      <StreakCard streakInfo={streakInfo} />

      <BadgesSection badges={badges} />
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
