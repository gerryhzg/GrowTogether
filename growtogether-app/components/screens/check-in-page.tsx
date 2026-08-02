"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/components/providers/auth-context";
import { useChildTheme } from "@/components/providers/child-theme-context";
import { useJourney, useCheckIns } from "@/lib/supabase-hooks";
import { Panel } from "@/components/ui/panel";
import { EmptyState } from "@/components/empty-state";

export function CheckInPage() {
  const { user } = useAuth();
  const { isNeonQuest } = useChildTheme();
  const { journey } = useJourney(user?.familyId);
  const { saveCheckIn } = useCheckIns(user?.familyId, journey?.id);
  const [progressAdded, setProgressAdded] = useState(1);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  if (!journey) {
    return (
      <EmptyState
        title="A journey comes first"
        description={
          isNeonQuest
            ? "No quest loaded. Hit Quest Lab first so you have something worth grinding."
            : "Create a goal from the child's interests first, then come back here for daily progress and reflection."
        }
        ctaHref="/discover"
        ctaLabel={isNeonQuest ? "Open Quest Lab" : "Create a journey"}
      />
    );
  }

  const activeJourney = journey;
  const displayedCurrentCount = Math.min(
    activeJourney.current_count,
    activeJourney.target_count,
  );
  const remainingProgress = Math.max(
    0,
    activeJourney.target_count - activeJourney.current_count,
  );
  const progress = Math.min(
    100,
    Math.round((displayedCurrentCount / activeJourney.target_count) * 100),
  );
  const canCheckIn = remainingProgress > 0;
  const inputValue = canCheckIn
    ? Math.min(progressAdded, remainingProgress)
    : 1;

  function validateProgress() {
    if (!canCheckIn) {
      return "This goal is already complete. Choose a new journey to keep growing.";
    }

    if (!Number.isFinite(progressAdded) || progressAdded < 1) {
      return `Add between 1 and ${remainingProgress} ${activeJourney.unit}.`;
    }

    if (progressAdded > remainingProgress) {
      return `You only have ${remainingProgress} ${activeJourney.unit} left for this goal.`;
    }

    return "";
  }

  async function handleGenerateQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    setError("");

    const validationError = validateProgress();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoadingQuestion(true);
    try {
      const response = await fetch("/api/ai/reflection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journey: {
            goalTitle: activeJourney.goal_title,
            goalDescription: activeJourney.goal_description,
            linkedInterest: activeJourney.linked_interest,
            unit: activeJourney.unit,
          },
          progressAdded,
        }),
      });
      const data = await response.json();
      setQuestion(data.question);
    } finally {
      setLoadingQuestion(false);
    }
  }

  async function handleSaveCheckIn() {
    if (!question.trim() || !answer.trim()) return;
    setSaved(false);
    setError("");

    const validationError = validateProgress();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      const result = await saveCheckIn({
        journeyId: activeJourney.id,
        progressAdded,
        reflectionQuestion: question,
        childAnswer: answer,
      });

      if (result?.error) {
        setError(result.error.message);
        return;
      }

      setSaved(true);
      setQuestion("");
      setAnswer("");
      setProgressAdded(1);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <Panel>
        <p className="text-sm uppercase tracking-[0.25em] text-secondary">
          {isNeonQuest ? "Mission Log" : "Daily Check-In"}
        </p>
        <h2 className="mt-3 font-display text-4xl text-foreground">
          {isNeonQuest ? "Drop the XP. What went down?" : "How did it go today?"}
        </h2>
        <p className="mt-3 text-muted">
          {isNeonQuest
            ? "Log the run, spill the debrief, and let your squad see the W."
            : "Share your progress and how it felt. Your parent will see this."}
        </p>

        {saved && (
          <div className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {isNeonQuest
              ? "Mission posted. Squad can see the W."
              : "Check-in saved. Your parent can now see your progress."}
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 rounded-[1.5rem] bg-white/75 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-muted">
            {isNeonQuest ? "Current Quest" : "Current goal"}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-foreground">
            {activeJourney.goal_title}
          </h3>
          <p className="mt-2 text-muted">{activeJourney.goal_description}</p>
          <div className="mt-5">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-muted">
                {displayedCurrentCount}/{activeJourney.target_count}{" "}
                {activeJourney.unit}
              </span>
              <span className="font-semibold text-accent">{progress}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-100">
              <div
                className="h-3 rounded-full bg-accent transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {canCheckIn ? (
          <form className="mt-6 space-y-5" onSubmit={handleGenerateQuestion}>
            <label className="block rounded-[1.5rem] bg-white/75 p-5 shadow-sm">
              <span className="text-sm font-medium text-foreground">
                How much did you do today?
                {isNeonQuest ? " Drop the XP count." : ""}
              </span>
              <input
                className="mt-3 w-full rounded-2xl border border-border bg-white px-4 py-3"
                type="number"
                min={1}
                max={remainingProgress}
                value={inputValue}
                onChange={(event) => {
                  setSaved(false);
                  setError("");
                  setProgressAdded(Number(event.target.value));
                }}
              />
              <p className="mt-2 text-sm text-muted">
                {isNeonQuest
                  ? `Max XP drop: ${remainingProgress} ${activeJourney.unit}. Do not overshoot the boss bar.`
                  : `You can add up to ${remainingProgress} ${activeJourney.unit}.`}
              </p>
            </label>
            <button
              type="submit"
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong"
            >
              {loadingQuestion
                ? isNeonQuest
                  ? "Spawning prompt..."
                  : "Generating question..."
                : isNeonQuest
                  ? "Spawn debrief prompt"
                  : "Generate reflection question"}
            </button>
          </form>
        ) : (
          <div className="mt-6 rounded-[1.5rem] bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
            {isNeonQuest
              ? "Quest cleared. Massive W. Hit Quest Lab when you want the next boss fight."
              : "This journey is complete. Start a new journey from Discover when you are ready."}
          </div>
        )}
      </Panel>

      <Panel>
        <p className="text-sm uppercase tracking-[0.25em] text-secondary">
          {isNeonQuest ? "Debrief Zone" : "Reflection"}
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-foreground">
          {isNeonQuest ? "Be real. How was the run?" : "How did it feel?"}
        </h3>
        <label className="mt-6 block">
          <span className="text-sm font-medium text-foreground">
            {isNeonQuest ? "Debrief prompt" : "Reflection question"}
          </span>
          <textarea
            className="mt-2 min-h-24 w-full rounded-2xl border border-border bg-white px-4 py-3"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={isNeonQuest ? "Spawn a prompt or freestyle it." : "Generate a question or type one yourself."}
          />
        </label>
        <label className="mt-5 block">
          <span className="text-sm font-medium text-foreground">
            {isNeonQuest ? "Your take" : "Your answer"}
          </span>
          <textarea
            className="mt-2 min-h-32 w-full rounded-2xl border border-border bg-white px-4 py-3"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder={isNeonQuest ? "What was fire, awkward, clutch, or lowkey hard?" : "What felt exciting, hard, or surprising today?"}
          />
        </label>
        <button
          type="button"
          onClick={handleSaveCheckIn}
          disabled={saving || !canCheckIn || !question.trim() || !answer.trim()}
          className="mt-6 rounded-full bg-secondary px-5 py-3 text-sm font-semibold text-white transition hover:bg-secondary/90 disabled:opacity-50"
        >
          {saving ? (isNeonQuest ? "Posting..." : "Saving...") : isNeonQuest ? "Post mission log" : "Save check-in"}
        </button>
      </Panel>
    </div>
  );
}
