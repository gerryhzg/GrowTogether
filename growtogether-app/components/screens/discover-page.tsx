"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/components/providers/auth-context";
import { useChildTheme } from "@/components/providers/child-theme-context";
import { useInterests, useJourney } from "@/lib/supabase-hooks";
import { Panel } from "@/components/ui/panel";
import { GoalExplanationCard } from "@/components/ui/goal-explanation-card";
import { INTEREST_OPTIONS } from "@/lib/constants";
import { GoalSuggestion, GoalSuggestionResponse, InterestName } from "@/lib/types";

export function DiscoverPage() {
  const { user } = useAuth();
  const { isNeonQuest } = useChildTheme();
  const { interests, saveInterests } = useInterests(user?.familyId);
  const { journey, createJourney } = useJourney(user?.familyId);

  const [ratings, setRatings] = useState<Record<InterestName, number>>(() =>
    INTEREST_OPTIONS.reduce((acc, interest) => ({
      ...acc,
      [interest]: interests.find((i) => i.interest === interest)?.rating ?? 3,
    }), {} as Record<InterestName, number>)
  );

  const [goalSuggestions, setGoalSuggestions] = useState<GoalSuggestion[]>([]);
  const [selectedGoalIndex, setSelectedGoalIndex] = useState(0);
  const [customTitle, setCustomTitle] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customTargetCount, setCustomTargetCount] = useState(5);
  const [customUnit, setCustomUnit] = useState("sessions");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [startingJourney, setStartingJourney] = useState(false);
  const [journeyMessage, setJourneyMessage] = useState("");
  const [journeyError, setJourneyError] = useState("");
  const [explanations, setExplanations] = useState<Record<number, string>>({});
  const [loadingExplanations, setLoadingExplanations] = useState<Record<number, boolean>>({});

  const isChild = user?.role === "child";

  async function handleGenerateGoals(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const interestPayload = INTEREST_OPTIONS.map((interest) => ({ interest, rating: ratings[interest] }));
    await saveInterests(interestPayload);
    setSaved(true);

    try {
      const response = await fetch("/api/ai/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests: interestPayload }),
      });
      const data = (await response.json()) as GoalSuggestionResponse;
      setGoalSuggestions(data.goals);
      setSelectedGoalIndex(0);
      setCustomTitle(data.goals[0]?.title ?? "");
      setCustomDescription(data.goals[0]?.description ?? "");
      setCustomTargetCount(data.goals[0]?.targetCount ?? 5);
      setCustomUnit(data.goals[0]?.unit ?? "sessions");
      setJourneyMessage("");
      setJourneyError("");
    } finally {
      setLoading(false);
    }
  }

  async function handleStartJourney() {
    const selectedGoal = goalSuggestions[selectedGoalIndex];
    if (!selectedGoal) return;

    setStartingJourney(true);
    setJourneyMessage("");
    setJourneyError("");

    try {
      const result = await createJourney({
        goalTitle: customTitle || selectedGoal.title,
        goalDescription: customDescription || selectedGoal.description,
        targetCount: customTargetCount,
        unit: customUnit,
        linkedInterest: selectedGoal.linkedInterest,
      });

      if (result.error) {
        setJourneyError(`Could not start your journey. ${result.error.message}`);
        return;
      }

      setJourneyMessage(
        isNeonQuest
          ? "Quest queued. Waiting for parent approval, then it is go time."
          : "Journey started! Waiting for your parent to approve your goal.",
      );
    } finally {
      setStartingJourney(false);
    }
  }

  async function loadExplanation(index: number) {
    if (explanations[index] || loadingExplanations[index]) return;
    const goal = goalSuggestions[index];
    if (!goal) return;
    setLoadingExplanations((c) => ({ ...c, [index]: true }));

    try {
      const response = await fetch("/api/ai/goal-explanation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, interests: INTEREST_OPTIONS.map((i) => ({ interest: i, rating: ratings[i] })) }),
      });
      const data = await response.json();
      setExplanations((c) => ({ ...c, [index]: data.explanation }));
    } finally {
      setLoadingExplanations((c) => ({ ...c, [index]: false }));
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <Panel>
        <p className="text-sm uppercase tracking-[0.25em] text-secondary">
          {isChild
            ? isNeonQuest
              ? "Stat Builder"
              : "What do you love?"
            : "Screen 2"}
        </p>
        <h2 className="mt-3 font-display text-4xl text-foreground">
          {isChild
            ? isNeonQuest
              ? "Build your loadout. Make it loud."
              : "Rate what makes you excited!"
            : "Discover what the child loves most."}
        </h2>
        <p className="mt-3 max-w-2xl text-muted">
          {isChild
            ? isNeonQuest
              ? "Slide your stats. The higher the score, the more the app cooks up quests that actually hit."
              : "Move the slider to show how much you love each thing! Your parent will see your choices."
            : "Rate each interest from 1 to 5."}
        </p>
        {saved && (
          <div className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {isNeonQuest
              ? "Stats saved. Quest engine is cooking."
              : "Your interests are saved! Your parent can now see them."}
          </div>
        )}
        <form className="mt-8 space-y-5" onSubmit={handleGenerateGoals}>
          {INTEREST_OPTIONS.map((interest) => (
            <label key={interest} className="block rounded-[1.5rem] bg-white/75 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-foreground">{interest}</p>
                  <p className="text-sm text-muted">
                    {isChild
                      ? isNeonQuest
                        ? "How hard does this go?"
                        : "How much do you love this?"
                      : "How excited does this feel?"}
                  </p>
                </div>
                <span className="rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent-strong">{ratings[interest]}/5</span>
              </div>
              <input className="mt-4 w-full accent-accent" type="range" min={1} max={5} value={ratings[interest]} onChange={(e) => setRatings((c) => ({ ...c, [interest]: Number(e.target.value) }))} />
            </label>
          ))}
          <button type="submit" className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong">{loading ? (isNeonQuest ? "Cooking quests..." : "Generating...") : isChild ? isNeonQuest ? "Cook my quests" : "Find my goals!" : "Generate matching goals"}</button>
        </form>
      </Panel>

      <Panel>
        <p className="text-sm uppercase tracking-[0.25em] text-secondary">
          {isNeonQuest ? "Quest Drops" : "Suggested goals"}
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-foreground">
          {isChild
            ? isNeonQuest
              ? "Pick the mission with main-character energy."
              : "Your perfect goals!"
            : "Goals grounded in real interests"}
        </h3>
        {isChild && journey && (
          <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-medium ${journey.approved_by_parent ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
            {journey.approved_by_parent
              ? journey.parent_override
                ? isNeonQuest
                  ? "Parent remixed the quest. Check the new build."
                  : "Your parent changed your goal! Check it out!"
                : isNeonQuest
                  ? "Quest approved. We are so back."
                  : "Your parent approved your goal! Let's go!"
              : isNeonQuest
                ? "Quest pending. Parent approval loading..."
                : "Waiting for your parent to approve your goal..."}
          </div>
        )}
        <div className="mt-6 space-y-3">
          {goalSuggestions.length > 0 ? goalSuggestions.map((goal, index) => {
            const active = selectedGoalIndex === index;
            return (
              <div key={`${goal.title}-${index}`}>
                <button type="button" onClick={() => { setSelectedGoalIndex(index); setCustomTitle(goal.title); setCustomDescription(goal.description); setCustomTargetCount(goal.targetCount); setCustomUnit(goal.unit); loadExplanation(index); }} className={`block w-full rounded-[1.5rem] border p-4 text-left transition ${active ? "border-accent bg-accent-soft/55" : "border-border bg-white/70 hover:border-accent/40"}`}>
                  <p className="text-xs uppercase tracking-[0.25em] text-secondary">{goal.linkedInterest}</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{goal.title}</p>
                  <p className="mt-2 text-sm text-muted">{goal.description}</p>
                  <p className="mt-3 text-sm font-medium text-foreground">{isNeonQuest ? "Win condition" : "Goal"}: {goal.targetCount} {goal.unit}</p>
                </button>
                {active && <div className="mt-3"><GoalExplanationCard explanation={explanations[index] ?? null} loading={loadingExplanations[index] ?? false} /></div>}
              </div>
            );
          }) : <div className="rounded-[1.5rem] border border-dashed border-border px-4 py-8 text-sm text-muted">{isChild ? isNeonQuest ? "Set your stats, then let the quest engine cook." : "Rate your interests above and click Find my goals!" : "Rate interests above to see suggestions."}</div>}
        </div>
        {goalSuggestions.length > 0 && (
          <div className="mt-8 space-y-4 rounded-[1.5rem] bg-white/75 p-5 shadow-sm">
            <p className="text-sm uppercase tracking-[0.25em] text-muted">{isNeonQuest ? "Remix Quest" : "Customise"}</p>
            <input className="w-full rounded-2xl border border-border bg-white px-4 py-3" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} placeholder="Goal title" />
            <textarea className="w-full min-h-20 rounded-2xl border border-border bg-white px-4 py-3" value={customDescription} onChange={(e) => setCustomDescription(e.target.value)} placeholder="Goal description" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="rounded-2xl border border-border bg-white px-4 py-3" type="number" min={1} value={customTargetCount} onChange={(e) => setCustomTargetCount(Number(e.target.value))} />
              <input className="rounded-2xl border border-border bg-white px-4 py-3" value={customUnit} onChange={(e) => setCustomUnit(e.target.value)} placeholder="sessions" />
            </div>
            {journeyMessage && <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{journeyMessage}</p>}
            {journeyError && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{journeyError}</p>}
            <button type="button" disabled={startingJourney || !customTitle.trim()} onClick={handleStartJourney} className="rounded-full bg-secondary px-5 py-3 text-sm font-semibold text-white transition hover:bg-secondary/90 disabled:opacity-50">{startingJourney ? isNeonQuest ? "Loading quest..." : "Starting..." : isChild ? isNeonQuest ? "Launch the quest" : "Start my journey!" : "Start this growth journey"}</button>
          </div>
        )}
      </Panel>
    </div>
  );
}
