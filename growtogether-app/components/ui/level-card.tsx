"use client";

import { useState } from "react";
import Link from "next/link";
import { RewardProfile } from "@/lib/rewards";
import { useChildTheme } from "@/components/providers/child-theme-context";

interface LevelCardProps {
  profile: RewardProfile;
  avatarIcon: string;
  /** Parents see the same data described as progress, not as a game. */
  audience?: "child" | "parent";
}

export function LevelCard({ profile, avatarIcon, audience = "child" }: LevelCardProps) {
  const { isNeonQuest, isWoodland } = useChildTheme();
  const [showBreakdown, setShowBreakdown] = useState(false);

  const { level, totalPoints, currentStreak } = profile;
  const isParent = audience === "parent";

  const eyebrow = isParent
    ? "Growth level"
    : isNeonQuest
      ? "Rank"
      : isWoodland
        ? "How far you've grown"
        : "Your level";

  return (
    <div className="rounded-[1.75rem] bg-white/75 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.25em] text-muted">{eyebrow}</p>
          <h3 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-foreground">
            <span aria-hidden="true">{level.tier.icon}</span>
            <span className="truncate">{level.tier.name}</span>
          </h3>
          <p className="mt-1 text-sm text-muted">{level.tier.blurb}</p>
        </div>

        <div className="shrink-0 text-right">
          <div className="level-avatar grid h-14 w-14 place-items-center rounded-full bg-accent-soft text-2xl">
            <span aria-hidden="true">{avatarIcon}</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-accent">Lv {level.tier.level}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-foreground">{totalPoints} points</span>
          <span className="text-muted">
            {level.nextTier
              ? `${level.pointsToNextTier} to ${level.nextTier.name}`
              : "Top level reached"}
          </span>
        </div>

        <div
          className="h-3.5 overflow-hidden rounded-full bg-secondary-soft"
          role="progressbar"
          aria-valuenow={level.percentToNextTier}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progress to next level"
        >
          <div
            className="level-bar-fill h-full rounded-full bg-gradient-to-r from-accent to-sun"
            style={{ width: `${Math.max(level.percentToNextTier, totalPoints > 0 ? 4 : 0)}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-foreground">
          🔥 {currentStreak} day streak
        </span>
        <span className="rounded-full bg-secondary-soft px-3 py-1 text-xs font-semibold text-foreground">
          🏅 {profile.unlockedBadgeCount}/{profile.badges.length} badges
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <button
          type="button"
          onClick={() => setShowBreakdown((current) => !current)}
          className="font-semibold text-accent underline-offset-4 hover:underline"
          aria-expanded={showBreakdown}
        >
          {showBreakdown ? "Hide points" : "Where points came from"}
        </button>

        {!isParent ? (
          <Link href="/quest" className="font-semibold text-secondary underline-offset-4 hover:underline">
            Open reward room
          </Link>
        ) : null}
      </div>

      {showBreakdown ? (
        <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
          {profile.breakdown.length === 0 ? (
            <li className="text-sm text-muted">
              No points yet. Your first check-in starts the count.
            </li>
          ) : (
            profile.breakdown.map((entry) => (
              <li key={entry.label} className="flex items-center justify-between text-sm">
                <span className="text-muted">{entry.label}</span>
                <span className="font-semibold text-foreground">+{entry.points}</span>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
