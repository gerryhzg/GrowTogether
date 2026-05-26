"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-context";
import { useInterests, useJourney } from "@/lib/supabase-hooks";
import { Panel } from "@/components/ui/panel";

const INTEREST_EMOJIS: Record<string, string> = {
  Music: "🎵", Sports: "⚽", Science: "🔬",
  Coding: "💻", Art: "🎨", Animals: "🐾",
};

export function ParentDiscoverPage() {
  const { user } = useAuth();
  const { interests } = useInterests(user?.familyId);
  const { journey, approveJourney, overrideJourney } = useJourney(user?.familyId);
  const [overriding, setOverriding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTarget, setNewTarget] = useState(10);
  const [newUnit, setNewUnit] = useState("sessions");
  const [saving, setSaving] = useState(false);
  const [approved, setApproved] = useState(false);

  async function handleApprove() {
    setSaving(true);
    await approveJourney();
    setApproved(true);
    setSaving(false);
  }

  async function handleOverride() {
    if (!newTitle.trim()) return;
    setSaving(true);
    await overrideJourney({ goalTitle: newTitle, goalDescription: newDescription, targetCount: newTarget, unit: newUnit });
    setOverriding(false);
    setSaving(false);
  }

  const sortedInterests = [...interests].sort((a, b) => b.rating - a.rating);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel>
        <p className="text-sm uppercase tracking-[0.25em] text-secondary">Your Child's Interests</p>
        <h2 className="mt-3 font-display text-3xl text-foreground">What they love most right now</h2>
        <p className="mt-2 text-muted text-sm">Your child rated these. You can see but not change them.</p>
        {interests.length === 0 ? (
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-border p-8 text-center text-muted">
            <p className="text-4xl">⏳</p>
            <p className="mt-3 font-medium">Waiting for your child to rate their interests...</p>
            <p className="mt-1 text-sm">Ask them to open the app and go to Discover!</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {sortedInterests.map((item) => (
              <div key={item.interest} className="rounded-[1.5rem] bg-white/75 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{INTEREST_EMOJIS[item.interest] ?? "⭐"}</span>
                    <p className="font-semibold text-foreground">{item.interest}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className={`h-3 w-3 rounded-full ${i < item.rating ? "bg-accent" : "bg-gray-200"}`} />
                    ))}
                    <span className="ml-1 text-sm font-bold text-accent">{item.rating}/5</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel>
        <p className="text-sm uppercase tracking-[0.25em] text-secondary">Child's Goal</p>
        <h2 className="mt-3 font-display text-3xl text-foreground">Review and approve</h2>
        {!journey ? (
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-border p-8 text-center text-muted">
            <p className="text-4xl">🎯</p>
            <p className="mt-3 font-medium">No goal created yet</p>
            <p className="mt-1 text-sm">Your child needs to go to Discover and create a goal first!</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="rounded-[1.5rem] bg-white/75 p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-muted">Current goal</p>
              <h3 className="mt-2 text-xl font-semibold text-foreground">{journey.goal_title}</h3>
              <p className="mt-2 text-sm text-muted">{journey.goal_description}</p>
              <p className="mt-3 text-sm font-medium text-foreground">Target: {journey.target_count} {journey.unit}</p>
              {journey.parent_override && <span className="mt-3 inline-block rounded-full bg-secondary-soft px-3 py-1 text-xs font-semibold text-secondary">✏️ Modified by parent</span>}
              {journey.approved_by_parent && <span className="mt-3 ml-2 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">✅ Approved</span>}
            </div>
            {!journey.approved_by_parent && !approved && (
              <div className="flex gap-3">
                <button onClick={handleApprove} disabled={saving} className="flex-1 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-50">
                  {saving ? "Saving..." : "✅ Approve this goal"}
                </button>
                <button onClick={() => { setOverriding(true); setNewTitle(journey.goal_title); setNewDescription(journey.goal_description); setNewTarget(journey.target_count); setNewUnit(journey.unit); }} className="flex-1 rounded-full border border-border px-4 py-3 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent">
                  ✏️ Change the goal
                </button>
              </div>
            )}
            {approved && <div className="rounded-[1.5rem] bg-green-50 p-4 text-center"><p className="font-semibold text-green-700">🎉 Goal approved! Your child can now start!</p></div>}
            {overriding && (
              <div className="rounded-[1.5rem] bg-white/75 p-5 shadow-sm space-y-4">
                <p className="font-semibold text-foreground">✏️ Set a new goal for your child</p>
                <input className="w-full rounded-2xl border border-border bg-white px-4 py-3" placeholder="Goal title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                <textarea className="w-full rounded-2xl border border-border bg-white px-4 py-3 min-h-20" placeholder="Goal description" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <input className="rounded-2xl border border-border bg-white px-4 py-3" type="number" min={1} value={newTarget} onChange={(e) => setNewTarget(Number(e.target.value))} />
                  <input className="rounded-2xl border border-border bg-white px-4 py-3" placeholder="Unit" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} />
                </div>
                <div className="flex gap-3">
                  <button onClick={handleOverride} disabled={saving} className="flex-1 rounded-full bg-secondary px-4 py-3 text-sm font-semibold text-white">{saving ? "Saving..." : "Save new goal"}</button>
                  <button onClick={() => setOverriding(false)} className="flex-1 rounded-full border border-border px-4 py-3 text-sm text-muted">Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}
