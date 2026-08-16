"use client";

import { useState } from "react";
import { RewardBadge } from "@/lib/rewards";
import { formatDate } from "@/lib/utils";
import { useChildTheme } from "@/components/providers/child-theme-context";

interface RewardBadgeGridProps {
  badges: RewardBadge[];
  /** Hides locked badges - useful in tight dashboard space. */
  showLocked?: boolean;
}

export function RewardBadgeGrid({ badges, showLocked = true }: RewardBadgeGridProps) {
  const { isNeonQuest, isWoodland } = useChildTheme();
  const [celebrating, setCelebrating] = useState<string | null>(null);

  const unlocked = badges.filter((badge) => badge.unlockedAt !== null);
  const visible = showLocked ? badges : unlocked;

  const heading = isNeonQuest ? "Trophy Case" : isWoodland ? "Growth Markers" : "Badges";

  function celebrate(badgeId: string) {
    setCelebrating(badgeId);
    window.setTimeout(() => setCelebrating(null), 1400);
  }

  return (
    <div className="rounded-[1.75rem] bg-white/75 p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.25em] text-muted">{heading}</p>
        <p className="text-sm font-semibold text-accent">
          {unlocked.length} of {badges.length} earned
        </p>
      </div>

      {visible.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          No badges yet. Check in once to earn your first.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-5">
          {visible.map((badge) => {
            const isUnlocked = badge.unlockedAt !== null;
            const isCelebrating = celebrating === badge.id;

            return (
              <li key={badge.id}>
                <button
                  type="button"
                  onClick={() => isUnlocked && celebrate(badge.id)}
                  disabled={!isUnlocked}
                  title={
                    isUnlocked
                      ? `${badge.title} - earned ${badge.unlockedAt ? formatDate(badge.unlockedAt) : ""}`
                      : `Locked - ${badge.howToEarn}`
                  }
                  className={`badge-tile w-full rounded-[1.25rem] p-3 text-center transition-transform duration-200 ${
                    isUnlocked
                      ? "cursor-pointer bg-accent-soft hover:scale-105"
                      : "cursor-not-allowed bg-gray-100 opacity-55"
                  } ${isCelebrating ? "badge-tile-celebrating" : ""}`}
                >
                  <span
                    className={`block text-2xl ${isUnlocked ? "" : "grayscale"}`}
                    aria-hidden="true"
                  >
                    {isUnlocked ? badge.icon : "🔒"}
                  </span>
                  <span className="mt-1.5 block text-[0.7rem] font-semibold leading-tight text-foreground">
                    {badge.title}
                  </span>
                  <span className="mt-1 block text-[0.65rem] leading-tight text-muted">
                    {isUnlocked ? `+${badge.points}` : badge.howToEarn}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
