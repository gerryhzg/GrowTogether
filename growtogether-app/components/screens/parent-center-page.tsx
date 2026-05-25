"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { useAppState } from "@/components/providers/app-state-provider";
import { Panel } from "@/components/ui/panel";
import { EmotionDetectionCard } from "@/components/ui/emotion-detection-card";
import { SafetyCheckCard } from "@/components/ui/safety-check-card";
import {
  ParentSummaryResponse,
  ParentSupportResponse,
  MessageSafetyCheck,
} from "@/lib/types";

export function ParentCenterPage() {
  const router = useRouter();
  const { activeJourney, latestCheckIn, saveParentSupport } = useAppState();
  const [summary, setSummary] = useState("");
  const [encouragement, setEncouragement] = useState("");
  const [activity, setActivity] = useState("");
  const [summarySource, setSummarySource] =
    useState<ParentSummaryResponse["source"]>("fallback");
  const [supportSource, setSupportSource] =
    useState<ParentSupportResponse["source"]>("fallback");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingSupport, setLoadingSupport] = useState(false);
  const [emotionLoading, setEmotionLoading] = useState(false);
  const [emotionData, setEmotionData] = useState<any>(null);
  const [safetyLoading, setSafetyLoading] = useState(false);
  const [safetyCheck, setSafetyCheck] = useState<MessageSafetyCheck | null>(null);
  const [suggestedRewrite, setSuggestedRewrite] = useState("");

  if (!activeJourney) {
    return (
      <EmptyState
        title="Create a journey before the parent joins in"
        description="Once the child has an active goal and a first check-in, this screen will turn that progress into warm, specific support."
        ctaHref="/discover"
        ctaLabel="Start a journey"
      />
    );
  }

  async function handleGenerateSummary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoadingSummary(true);

    try {
      const response = await fetch("/api/ai/parent-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journey: activeJourney, latestCheckIn }),
      });
      const data = (await response.json()) as ParentSummaryResponse;
      setSummary(data.summary);
      setSummarySource(data.source);
    } finally {
      setLoadingSummary(false);
    }
  }

  async function handleGenerateSupport() {
    setLoadingSupport(true);

    try {
      const response = await fetch("/api/ai/parent-support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journey: activeJourney, latestCheckIn, summary }),
      });
      const data = (await response.json()) as ParentSupportResponse;
      setEncouragement(data.encouragement);
      setActivity(data.activity);
      setSupportSource(data.source);
    } finally {
      setLoadingSupport(false);
    }
  }

  async function handleCheckEmotion() {
    if (!encouragement.trim()) return;
    
    setEmotionLoading(true);

    try {
      const response = await fetch("/api/ai/emotion-detection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childReflection: encouragement }),
      });
      const data = await response.json();
      setEmotionData(data.detection);
    } finally {
      setEmotionLoading(false);
    }
  }

  async function handleCheckSafety() {
    if (!encouragement.trim()) return;
    
    setSafetyLoading(true);

    try {
      const response = await fetch("/api/ai/safety-filter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: encouragement }),
      });
      const data = await response.json();
      setSafetyCheck(data.check);
      if (!data.check.isSafe && data.check.suggestion) {
        setSuggestedRewrite(data.check.suggestion);
      }
    } finally {
      setSafetyLoading(false);
    }
  }

  function handleAcceptSuggestion() {
    if (suggestedRewrite) {
      setEncouragement(suggestedRewrite);
      setSafetyCheck(null);
      setSuggestedRewrite("");
    }
  }

  function handleSaveSupport() {
    if (!summary.trim() || !encouragement.trim() || !activity.trim()) {
      return;
    }

    saveParentSupport({
      summary,
      encouragementText: encouragement,
      activitySuggestion: activity,
    });
    router.push("/");
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
      <Panel>
        <p className="text-sm uppercase tracking-[0.25em] text-secondary">Screen 4</p>
        <h2 className="mt-3 font-display text-4xl text-foreground">
          Parent support center
        </h2>
        <p className="mt-3 text-muted">
          Parents can see the goal, the latest progress, and the child’s reflection together before responding.
        </p>

        <div className="mt-6 space-y-4">
          <Snapshot label="Interest" value={activeJourney.linkedInterest} />
          <Snapshot label="Goal" value={activeJourney.goalTitle} />
          <Snapshot
            label="Latest progress"
            value={latestCheckIn ? `+${latestCheckIn.progressAdded} today` : "No check-in yet"}
          />
          <Snapshot
            label="Latest reflection"
            value={latestCheckIn?.childAnswer ?? "The child has not answered a reflection yet."}
          />
        </div>

        <form className="mt-6" onSubmit={handleGenerateSummary}>
          <button
            type="submit"
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong"
          >
            {loadingSummary ? "Generating summary..." : "Generate parent summary"}
          </button>
        </form>

        <label className="mt-6 block">
          <span className="text-sm font-medium text-foreground">
            Parent-facing summary
          </span>
          <textarea
            className="mt-2 min-h-32 w-full rounded-2xl border border-border bg-white px-4 py-3"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="A short summary of what the child did and how they felt."
          />
        </label>
        <p className="mt-2 text-xs uppercase tracking-[0.25em] text-muted">
          {summarySource === "ai" ? "AI summary" : "Fallback summary"}
        </p>
      </Panel>

      <Panel>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-secondary">Warm response</p>
            <h3 className="mt-2 text-2xl font-semibold text-foreground">
              Turn insight into encouragement
            </h3>
          </div>
          <button
            type="button"
            onClick={handleGenerateSupport}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
          >
            {loadingSupport ? "Generating..." : "Suggest support"}
          </button>
        </div>

        <label className="mt-6 block">
          <span className="text-sm font-medium text-foreground">Encouragement message</span>
          <textarea
            className="mt-2 min-h-32 w-full rounded-2xl border border-border bg-white px-4 py-3"
            value={encouragement}
            onChange={(event) => {
              setEncouragement(event.target.value);
              setSafetyCheck(null);
              setSuggestedRewrite("");
              setEmotionData(null);
            }}
            placeholder="I noticed how steady you stayed today..."
          />
        </label>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={handleCheckEmotion}
            className="flex-1 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
          >
            {emotionLoading ? "Analyzing..." : "Check emotion tone"}
          </button>
          <button
            type="button"
            onClick={handleCheckSafety}
            className="flex-1 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
          >
            {safetyLoading ? "Checking..." : "Safety filter"}
          </button>
        </div>

        {emotionData && (
          <div className="mt-4">
            <EmotionDetectionCard
              emotion={emotionData.emotion}
              suggestion={emotionData.suggestion}
            />
          </div>
        )}

        {safetyCheck && (
          <div className="mt-4">
            <SafetyCheckCard
              isSafe={safetyCheck.isSafe}
              suggestion={safetyCheck.suggestion}
              onAcceptSuggestion={handleAcceptSuggestion}
            />
          </div>
        )}

        <label className="mt-5 block">
          <span className="text-sm font-medium text-foreground">
            Parent-child activity suggestion
          </span>
          <textarea
            className="mt-2 min-h-28 w-full rounded-2xl border border-border bg-white px-4 py-3"
            value={activity}
            onChange={(event) => setActivity(event.target.value)}
            placeholder="Try one small activity you can do together next."
          />
        </label>

        <p className="mt-2 text-xs uppercase tracking-[0.25em] text-muted">
          {supportSource === "ai" ? "AI encouragement + activity" : "Fallback support"}
        </p>

        <button
          type="button"
          onClick={handleSaveSupport}
          className="mt-6 rounded-full bg-secondary px-5 py-3 text-sm font-semibold text-white transition hover:bg-secondary/90"
        >
          Save support message
        </button>
      </Panel>
    </div>
  );
}

function Snapshot({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] bg-white/75 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.25em] text-muted">{label}</p>
      <p className="mt-2 text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}
