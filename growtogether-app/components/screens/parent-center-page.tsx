"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/components/providers/auth-context";
import { useJourney, useCheckIns, useParentSupport } from "@/lib/supabase-hooks";
import { Panel } from "@/components/ui/panel";
import { EmptyState } from "@/components/empty-state";
import {
  DailyCheckIn,
  GrowthJourney,
  MessageSafetyCheck,
  ParentSummaryResponse,
  ParentSupportResponse,
  SafetyCheckResponse,
} from "@/lib/types";

type JsonResult<T> = { data: T | null; error: string | null };

async function readJsonResponse<T>(response: Response): Promise<JsonResult<T>> {
  if (!response.ok) {
    return { data: null, error: `Request failed with status ${response.status}.` };
  }

  try {
    return { data: (await response.json()) as T, error: null };
  } catch {
    return { data: null, error: "The server returned an empty response. Please try again." };
  }
}

export function ParentCenterPage() {
  const { user } = useAuth();
  const { journey } = useJourney(user?.familyId);
  const { checkIns } = useCheckIns(user?.familyId, journey?.id);
  const { parentSupport, saveParentSupport } = useParentSupport(user?.familyId, journey?.id);
  const [summary, setSummary] = useState("");
  const [encouragement, setEncouragement] = useState("");
  const [activity, setActivity] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingSupport, setLoadingSupport] = useState(false);
  const [safetyLoading, setSafetyLoading] = useState(false);
  const [safetyCheck, setSafetyCheck] = useState<MessageSafetyCheck | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [actionError, setActionError] = useState("");

  const latestCheckIn = checkIns[0];
  const latestSupport = parentSupport[0];

  if (!journey) {
    return <EmptyState title="Waiting for your child to start a journey" description="Once your child creates a goal and does their first check-in, this screen will help you support them." ctaHref="/discover" ctaLabel="View child's interests" />;
  }

  const activeJourney = journey;
  const progress = Math.min(100, Math.round((activeJourney.current_count / activeJourney.target_count) * 100));
  const journeyPayload: GrowthJourney = {
    id: activeJourney.id,
    linkedInterest: activeJourney.linked_interest as GrowthJourney["linkedInterest"],
    topInterests: [activeJourney.linked_interest as GrowthJourney["linkedInterest"]],
    goalTitle: activeJourney.goal_title,
    goalDescription: activeJourney.goal_description,
    targetCount: activeJourney.target_count,
    currentCount: activeJourney.current_count,
    unit: activeJourney.unit,
    status: activeJourney.status as GrowthJourney["status"],
    createdAt: activeJourney.created_at ?? "",
    updatedAt: activeJourney.created_at ?? "",
  };
  const latestCheckInPayload: DailyCheckIn | null = latestCheckIn
    ? {
        id: latestCheckIn.id,
        journeyId: latestCheckIn.journey_id,
        date: latestCheckIn.created_at ?? "",
        progressAdded: latestCheckIn.progress_added,
        reflectionQuestion: latestCheckIn.reflection_question,
        childAnswer: latestCheckIn.child_answer,
      }
    : null;

  async function handleGenerateSummary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoadingSummary(true);
    setActionError("");
    try {
      const response = await fetch("/api/ai/parent-summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ journey: journeyPayload, latestCheckIn: latestCheckInPayload }) });
      const { data, error } = await readJsonResponse<ParentSummaryResponse>(response);
      if (error || !data) {
        setActionError(error ?? "Could not generate a parent summary.");
        return;
      }
      setSummary(data.summary);
    } finally { setLoadingSummary(false); }
  }

  async function handleGenerateSupport() {
    setLoadingSupport(true);
    setActionError("");
    try {
      const response = await fetch("/api/ai/parent-support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ journey: journeyPayload, latestCheckIn: latestCheckInPayload, summary }) });
      const { data, error } = await readJsonResponse<ParentSupportResponse>(response);
      if (error || !data) {
        setActionError(error ?? "Could not generate encouragement.");
        return;
      }
      setEncouragement(data.encouragement);
      setActivity(data.activity);
    } finally { setLoadingSupport(false); }
  }

  async function handleSafetyCheck() {
    if (!encouragement.trim()) return;
    setSafetyLoading(true);
    setSafetyCheck(null);
    setActionError("");
    try {
      const response = await fetch("/api/ai/safety-filter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: encouragement }) });
      const { data, error } = await readJsonResponse<SafetyCheckResponse>(response);
      if (error || !data) {
        setActionError(error ?? "Could not check message safety.");
        return;
      }
      setSafetyCheck(data.check);
    } finally { setSafetyLoading(false); }
  }

  async function handleSaveSupport() {
    if (!encouragement.trim()) return;
    setSaving(true);
    try {
      await saveParentSupport({ journeyId: activeJourney.id, summary, encouragementText: encouragement, activitySuggestion: activity });
      setSaved(true);
    } finally { setSaving(false); }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel>
        <p className="text-sm uppercase tracking-[0.25em] text-secondary">💛 Parent Center</p>
        <h2 className="mt-3 font-display text-3xl text-foreground">Support your child&apos;s growth</h2>
        <div className="mt-6 rounded-[1.5rem] bg-white/75 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-muted">Active goal</p>
          <h3 className="mt-2 text-xl font-semibold text-foreground">{activeJourney.goal_title}</h3>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted">{activeJourney.current_count}/{activeJourney.target_count} {activeJourney.unit}</span>
              <span className="font-semibold text-accent">{progress}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-100"><div className="h-3 rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} /></div>
          </div>
        </div>
        <div className="mt-5 rounded-[1.5rem] bg-white/75 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-muted">Latest check-in from your child</p>
          {latestCheckIn ? (
            <>
              <p className="mt-3 font-medium text-foreground">{latestCheckIn.reflection_question}</p>
              <p className="mt-2 text-sm text-muted italic">&quot;{latestCheckIn.child_answer}&quot;</p>
              <p className="mt-3 text-xs text-muted">Progress added: +{latestCheckIn.progress_added} {activeJourney.unit}</p>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted">No check-ins yet. Ask your child to do their first check-in!</p>
          )}
        </div>
        {checkIns.length > 1 && (
          <div className="mt-5">
            <p className="text-sm font-medium text-foreground mb-3">All check-ins ({checkIns.length})</p>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {checkIns.slice(1).map((c) => (
                <div key={c.id} className="rounded-[1.25rem] bg-white/60 p-4 text-sm">
                  <p className="text-muted italic">&quot;{c.child_answer}&quot;</p>
                  <p className="mt-1 text-xs text-muted">+{c.progress_added} {activeJourney.unit}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>
      <Panel>
        <p className="text-sm uppercase tracking-[0.25em] text-secondary">Send encouragement</p>
        <h2 className="mt-3 font-display text-3xl text-foreground">Write a warm message</h2>
        <form className="mt-6" onSubmit={handleGenerateSummary}>
          <button type="submit" className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong">{loadingSummary ? "Generating..." : "1. Generate parent summary"}</button>
        </form>
        {actionError && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{actionError}</p>}
        {summary && (
          <div className="mt-4 rounded-[1.5rem] bg-white/75 p-4 shadow-sm">
            <p className="text-sm text-foreground">{summary}</p>
            <button onClick={handleGenerateSupport} className="mt-3 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-white">{loadingSupport ? "Generating..." : "2. Generate encouragement"}</button>
          </div>
        )}
        {encouragement && (
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-foreground">Encouragement message</span>
              <textarea className="mt-2 min-h-28 w-full rounded-2xl border border-border bg-white px-4 py-3" value={encouragement} onChange={(e) => { setEncouragement(e.target.value); setSafetyCheck(null); }} />
            </label>
            {activity && (
              <label className="block">
                <span className="text-sm font-medium text-foreground">Activity suggestion</span>
                <textarea className="mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3" value={activity} onChange={(e) => setActivity(e.target.value)} />
              </label>
            )}
            <button onClick={handleSafetyCheck} disabled={safetyLoading} className="w-full rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground">{safetyLoading ? "Checking..." : "🛡️ Safety filter"}</button>
            {safetyCheck && (
              <div className={`rounded-2xl p-4 text-sm ${safetyCheck.isSafe ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {safetyCheck.isSafe ? "✅ Message looks warm and supportive!" : (
                  <>
                    <p className="font-semibold">⚠️ This message needs a warmer tone.</p>
                    {safetyCheck.suggestion && (
                      <div className="mt-3">
                        <p className="text-xs font-medium mb-1">Suggested rewrite:</p>
                        <p className="italic">{safetyCheck.suggestion}</p>
                        <button onClick={() => { setEncouragement(safetyCheck.suggestion ?? ""); setSafetyCheck(null); }} className="mt-2 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">Use suggestion</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            {saved ? (
              <div className="rounded-2xl bg-green-50 p-4 text-center text-sm font-semibold text-green-700">🎉 Message sent! Your child will see it on their dashboard!</div>
            ) : (
              <button onClick={handleSaveSupport} disabled={saving} className="w-full rounded-full bg-secondary px-5 py-3 text-sm font-semibold text-white transition hover:bg-secondary/90 disabled:opacity-50">{saving ? "Sending..." : "💛 Send to my child"}</button>
            )}
          </div>
        )}
        {latestSupport && (
          <div className="mt-6 rounded-[1.5rem] bg-white/75 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.25em] text-muted">Last message sent</p>
            <p className="mt-3 text-sm text-foreground">{latestSupport.encouragement_text}</p>
          </div>
        )}
      </Panel>
    </div>
  );
}
