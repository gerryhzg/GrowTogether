"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/components/providers/app-state-provider";
import { Panel } from "@/components/ui/panel";
import { INTEREST_OPTIONS } from "@/lib/constants";
import {
  GoalSuggestion,
  GoalSuggestionResponse,
  InterestName,
  InterestRating,
} from "@/lib/types";

const defaultGoalSuggestion: GoalSuggestion = {
  title: "Start a growth goal",
  description: "Pick something meaningful and take it one step at a time.",
  targetCount: 5,
  unit: "steps",
  linkedInterest: "Music",
};

export function DiscoverPage() {
  const router = useRouter();
  const { setInterestRatings, createJourney, state, topInterests } = useAppState();
  const [ratings, setRatings] = useState<Record<InterestName, number>>(() =>
    INTEREST_OPTIONS.reduce(
      (accumulator, interest) => ({
        ...accumulator,
        [interest]:
          state.interestRatings.find((entry) => entry.interest === interest)?.rating ?? 3,
      }),
      {} as Record<InterestName, number>,
    ),
  );
  const [goalSuggestions, setGoalSuggestions] = useState<GoalSuggestion[]>([]);
  const [selectedGoalIndex, setSelectedGoalIndex] = useState(0);
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customTargetCount, setCustomTargetCount] = useState(5);
  const [customUnit, setCustomUnit] = useState("sessions");
  const [source, setSource] = useState<GoalSuggestionResponse["source"]>("fallback");
  const [loading, setLoading] = useState(false);

  const interestPayload: InterestRating[] = INTEREST_OPTIONS.map((interest) => ({
    interest,
    rating: ratings[interest],
  }));

  async function handleGenerateGoals(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInterestRatings(interestPayload);
    setLoading(true);

    try {
      const response = await fetch("/api/ai/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests: interestPayload }),
      });
      const data = (await response.json()) as GoalSuggestionResponse;
      setGoalSuggestions(data.goals);
      setSelectedGoalIndex(0);
      setSource(data.source);
      setCustomTitle(data.goals[0]?.title ?? "");
      setCustomDescription(data.goals[0]?.description ?? "");
      setCustomTargetCount(data.goals[0]?.targetCount ?? 5);
      setCustomUnit(data.goals[0]?.unit ?? "sessions");
    } finally {
      setLoading(false);
    }
  }

  function handleStartJourney() {
    const selectedGoal = goalSuggestions[selectedGoalIndex] ?? {
      ...defaultGoalSuggestion,
      linkedInterest: topInterests[0] ?? "Music",
    };

    createJourney({
      suggestion: selectedGoal,
      customTitle,
      customDescription,
      customTargetCount,
      customUnit,
    });

    router.push("/");
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <Panel>
        <p className="text-sm uppercase tracking-[0.25em] text-secondary">Screen 2</p>
        <h2 className="mt-3 font-display text-4xl text-foreground">
          Discover what the child loves most.
        </h2>
        <p className="mt-3 max-w-2xl text-muted">
          Rate each interest from 1 to 5. The strongest ones will guide goal ideas, reflection prompts, and family support suggestions.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleGenerateGoals}>
          {INTEREST_OPTIONS.map((interest) => (
            <label
              key={interest}
              className="block rounded-[1.5rem] bg-white/75 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-foreground">{interest}</p>
                  <p className="text-sm text-muted">
                    How excited does this feel right now?
                  </p>
                </div>
                <span className="rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent-strong">
                  {ratings[interest]}/5
                </span>
              </div>
              <input
                className="mt-4 w-full accent-accent"
                type="range"
                min={1}
                max={5}
                value={ratings[interest]}
                onChange={(event) =>
                  setRatings((current) => ({
                    ...current,
                    [interest]: Number(event.target.value),
                  }))
                }
              />
            </label>
          ))}

          <button
            type="submit"
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong"
          >
            {loading ? "Generating goal ideas..." : "Generate matching goals"}
          </button>
        </form>
      </Panel>

      <Panel>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-secondary">Suggested goals</p>
            <h3 className="mt-2 text-2xl font-semibold text-foreground">
              Goals grounded in real interests
            </h3>
          </div>
          <span className="rounded-full bg-secondary-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-secondary">
            {source === "ai" ? "AI powered" : "Fallback ready"}
          </span>
        </div>

        <div className="mt-6 space-y-3">
          {goalSuggestions.length > 0 ? (
            goalSuggestions.map((goal, index) => {
              const active = selectedGoalIndex === index;
              return (
                <button
                  key={`${goal.title}-${index}`}
                  type="button"
                  onClick={() => {
                    setSelectedGoalIndex(index);
                    setCustomTitle(goal.title);
                    setCustomDescription(goal.description);
                    setCustomTargetCount(goal.targetCount);
                    setCustomUnit(goal.unit);
                  }}
                  className={`block w-full rounded-[1.5rem] border p-4 text-left transition ${
                    active
                      ? "border-accent bg-accent-soft/55"
                      : "border-border bg-white/70 hover:border-accent/40"
                  }`}
                >
                  <p className="text-xs uppercase tracking-[0.25em] text-secondary">
                    {goal.linkedInterest}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{goal.title}</p>
                  <p className="mt-2 text-sm text-muted">{goal.description}</p>
                  <p className="mt-3 text-sm font-medium text-foreground">
                    Goal size: {goal.targetCount} {goal.unit}
                  </p>
                </button>
              );
            })
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-border px-4 py-8 text-sm text-muted">
              Once you rate the child&apos;s interests, this panel will suggest 3 to 5 goal ideas tied to the strongest interests.
            </div>
          )}
        </div>

        <div className="mt-8 space-y-4 rounded-[1.5rem] bg-white/75 p-5 shadow-sm">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-muted">Optional edits</p>
            <h4 className="mt-2 text-xl font-semibold text-foreground">
              Make the goal feel just right
            </h4>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Goal title</span>
            <input
              className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3"
              value={customTitle}
              onChange={(event) => setCustomTitle(event.target.value)}
              placeholder="Practice piano 15 times"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Goal description</span>
            <textarea
              className="mt-2 min-h-24 w-full rounded-2xl border border-border bg-white px-4 py-3"
              value={customDescription}
              onChange={(event) => setCustomDescription(event.target.value)}
              placeholder="A short encouraging description of the goal."
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-foreground">Target count</span>
              <input
                className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3"
                type="number"
                min={1}
                value={customTargetCount}
                onChange={(event) => setCustomTargetCount(Number(event.target.value))}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-foreground">Unit</span>
              <input
                className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3"
                value={customUnit}
                onChange={(event) => setCustomUnit(event.target.value)}
                placeholder="sessions"
              />
            </label>
          </div>

          <button
            type="button"
            disabled={!customTitle.trim()}
            onClick={handleStartJourney}
            className="rounded-full bg-secondary px-5 py-3 text-sm font-semibold text-white transition hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Start this growth journey
          </button>
        </div>
      </Panel>
    </div>
  );
}
