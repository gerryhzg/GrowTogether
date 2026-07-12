"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/components/providers/auth-context";
import { useJourney, useCheckIns } from "@/lib/supabase-hooks";
import { Panel } from "@/components/ui/panel";
import { EmptyState } from "@/components/empty-state";

export function CheckInPage() {
  const { user } = useAuth();
  const { journey } = useJourney(user?.familyId);
  const { saveCheckIn } = useCheckIns(user?.familyId, journey?.id);
  const [progressAdded, setProgressAdded] = useState(1);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!journey) {
    return <EmptyState title="A journey comes first" description="Create a goal from the child's interests first, then come back here for daily progress and reflection." ctaHref="/discover" ctaLabel="Create a journey" />;
  }

  const activeJourney = journey;
  const progress = Math.min(100, Math.round((activeJourney.current_count / activeJourney.target_count) * 100));

  async function handleGenerateQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoadingQuestion(true);
    try {
      const response = await fetch("/api/ai/reflection", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ journey: { goalTitle: activeJourney.goal_title, goalDescription: activeJourney.goal_description, linkedInterest: activeJourney.linked_interest }, progressAdded }) });
      const data = await response.json();
      setQuestion(data.question);
    } finally { setLoadingQuestion(false); }
  }

  async function handleSaveCheckIn() {
    if (!question.trim() || !answer.trim()) return;
    setSaving(true);
    try {
      await saveCheckIn({ journeyId: activeJourney.id, progressAdded, reflectionQuestion: question, childAnswer: answer });
      setSaved(true);
      setQuestion(""); setAnswer(""); setProgressAdded(1);
    } finally { setSaving(false); }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <Panel>
        <p className="text-sm uppercase tracking-[0.25em] text-secondary">✅ Daily Check-In</p>
        <h2 className="mt-3 font-display text-4xl text-foreground">How did it go today? 🌟</h2>
        <p className="mt-3 text-muted">Share your progress and how it felt. Your parent will see this!</p>
        {saved && <div className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">🎉 Check-in saved! Your parent can now see your progress!</div>}
        <div className="mt-6 rounded-[1.5rem] bg-white/75 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-muted">Current goal</p>
          <h3 className="mt-2 text-2xl font-semibold text-foreground">{activeJourney.goal_title}</h3>
          <p className="mt-2 text-muted">{activeJourney.goal_description}</p>
          <div className="mt-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted">{activeJourney.current_count}/{activeJourney.target_count} {activeJourney.unit}</span>
              <span className="font-semibold text-accent">{progress}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-100"><div className="h-3 rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} /></div>
          </div>
        </div>
        <form className="mt-6 space-y-5" onSubmit={handleGenerateQuestion}>
          <label className="block rounded-[1.5rem] bg-white/75 p-5 shadow-sm">
            <span className="text-sm font-medium text-foreground">How much did you do today? 💪</span>
            <input className="mt-3 w-full rounded-2xl border border-border bg-white px-4 py-3" type="number" min={1} value={progressAdded} onChange={(e) => setProgressAdded(Number(e.target.value))} />
          </label>
          <button type="submit" className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong">{loadingQuestion ? "Generating question..." : "Generate reflection question ✨"}</button>
        </form>
      </Panel>
      <Panel>
        <p className="text-sm uppercase tracking-[0.25em] text-secondary">Reflection 💭</p>
        <h3 className="mt-2 text-2xl font-semibold text-foreground">How did it feel?</h3>
        <label className="mt-6 block">
          <span className="text-sm font-medium text-foreground">Reflection question</span>
          <textarea className="mt-2 min-h-24 w-full rounded-2xl border border-border bg-white px-4 py-3" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Generate a question or type one yourself." />
        </label>
        <label className="mt-5 block">
          <span className="text-sm font-medium text-foreground">Your answer 📝</span>
          <textarea className="mt-2 min-h-32 w-full rounded-2xl border border-border bg-white px-4 py-3" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="What felt exciting, hard, or surprising today?" />
        </label>
        <button type="button" onClick={handleSaveCheckIn} disabled={saving || !question.trim() || !answer.trim()} className="mt-6 rounded-full bg-secondary px-5 py-3 text-sm font-semibold text-white transition hover:bg-secondary/90 disabled:opacity-50">{saving ? "Saving..." : "Save check-in 🚀"}</button>
      </Panel>
    </div>
  );
}
