"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { useAppState } from "@/components/providers/app-state-provider";
import { Panel } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ReflectionResponse } from "@/lib/types";
import { formatRelativeProgress, getProgressPercentage } from "@/lib/utils";

export function CheckInPage() {
  const router = useRouter();
  const { activeJourney, saveCheckIn } = useAppState();
  const [progressAdded, setProgressAdded] = useState(1);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [source, setSource] = useState<ReflectionResponse["source"]>("fallback");
  const [loadingQuestion, setLoadingQuestion] = useState(false);

  if (!activeJourney) {
    return (
      <EmptyState
        title="A journey comes first"
        description="Create a goal from the child’s interests first, then come back here for daily progress and reflection."
        ctaHref="/discover"
        ctaLabel="Create a journey"
      />
    );
  }

  async function handleGenerateQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoadingQuestion(true);

    try {
      const response = await fetch("/api/ai/reflection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journey: activeJourney, progressAdded }),
      });
      const data = (await response.json()) as ReflectionResponse;
      setQuestion(data.question);
      setSource(data.source);
    } finally {
      setLoadingQuestion(false);
    }
  }

  function handleSaveCheckIn() {
    if (!question.trim() || !answer.trim()) {
      return;
    }

    saveCheckIn({
      progressAdded,
      reflectionQuestion: question,
      childAnswer: answer,
    });
    router.push("/");
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <Panel>
        <p className="text-sm uppercase tracking-[0.25em] text-secondary">Screen 3</p>
        <h2 className="mt-3 font-display text-4xl text-foreground">
          Daily growth check-in
        </h2>
        <p className="mt-3 text-muted">
          Progress and reflection live together here so the child can share both what happened and how it felt.
        </p>

        <div className="mt-6 rounded-[1.5rem] bg-white/75 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-muted">Current goal</p>
          <h3 className="mt-2 text-2xl font-semibold text-foreground">
            {activeJourney.goalTitle}
          </h3>
          <p className="mt-2 text-muted">{activeJourney.goalDescription}</p>
          <div className="mt-5">
            <ProgressBar
              label={formatRelativeProgress(activeJourney)}
              value={getProgressPercentage(activeJourney)}
            />
          </div>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleGenerateQuestion}>
          <label className="block rounded-[1.5rem] bg-white/75 p-5 shadow-sm">
            <span className="text-sm font-medium text-foreground">Progress added today</span>
            <input
              className="mt-3 w-full rounded-2xl border border-border bg-white px-4 py-3"
              type="number"
              min={1}
              value={progressAdded}
              onChange={(event) => setProgressAdded(Number(event.target.value))}
            />
          </label>

          <button
            type="submit"
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong"
          >
            {loadingQuestion ? "Generating question..." : "Generate reflection question"}
          </button>
        </form>
      </Panel>

      <Panel>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-secondary">Reflection</p>
            <h3 className="mt-2 text-2xl font-semibold text-foreground">
              Capture the feeling behind the progress
            </h3>
          </div>
          <span className="rounded-full bg-secondary-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-secondary">
            {source === "ai" ? "AI prompt" : "Fallback prompt"}
          </span>
        </div>

        <label className="mt-6 block">
          <span className="text-sm font-medium text-foreground">Reflection question</span>
          <textarea
            className="mt-2 min-h-24 w-full rounded-2xl border border-border bg-white px-4 py-3"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Generate a question or type one yourself."
          />
        </label>

        <label className="mt-5 block">
          <span className="text-sm font-medium text-foreground">Child answer</span>
          <textarea
            className="mt-2 min-h-32 w-full rounded-2xl border border-border bg-white px-4 py-3"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="What felt exciting, hard, or surprising today?"
          />
        </label>

        <button
          type="button"
          onClick={handleSaveCheckIn}
          className="mt-6 rounded-full bg-secondary px-5 py-3 text-sm font-semibold text-white transition hover:bg-secondary/90"
        >
          Save check-in
        </button>
      </Panel>
    </div>
  );
}
