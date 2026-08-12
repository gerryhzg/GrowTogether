"use client";

import { useEffect, useMemo } from "react";
import { RewardBadge } from "@/lib/rewards";
import { useNewlyEarnedBadges } from "@/lib/cosmetics";

interface AchievementToastProps {
  badge: RewardBadge | null;
  onDismiss: (badgeId: string) => void;
  /** Auto-close delay in ms. Set to 0 to require a tap. */
  autoCloseMs?: number;
}

const CONFETTI_COLORS = [
  "var(--accent)",
  "var(--sun)",
  "var(--secondary)",
  "var(--accent-strong)",
];

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** mulberry32 - small, fast, and deterministic for a given seed. */
function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let result = Math.imul(state ^ (state >>> 15), 1 | state);
    result = (result + Math.imul(result ^ (result >>> 7), 61 | result)) ^ result;
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export function AchievementToast({ badge, onDismiss, autoCloseMs = 5200 }: AchievementToastProps) {
  const badgeId = badge?.id ?? null;

  const confetti = useMemo(() => {
    // Seeded from the badge id so the burst is varied per badge but stable
    // across re-renders. Math.random() during render is impure and would
    // reshuffle the pieces on every paint.
    const random = createSeededRandom(hashString(badgeId ?? "none"));

    return Array.from({ length: 28 }, (_, index) => ({
      id: index,
      left: 8 + random() * 84,
      color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
      width: 5 + random() * 7,
      height: 4 + random() * 6,
      delay: random() * 0.5,
      duration: 1.1 + random() * 0.7,
    }));
  }, [badgeId]);

  useEffect(() => {
    if (!badgeId || autoCloseMs <= 0) {
      return;
    }
    const timer = window.setTimeout(() => onDismiss(badgeId), autoCloseMs);
    return () => window.clearTimeout(timer);
  }, [badgeId, autoCloseMs, onDismiss]);

  if (!badge) {
    return null;
  }

  return (
    <div
      className="achievement-overlay fixed inset-x-0 top-4 z-50 flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div className="achievement-card relative w-full max-w-sm overflow-hidden rounded-[1.5rem] border border-border bg-surface-strong p-5 text-center shadow-xl">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {confetti.map((piece) => (
            <span
              key={piece.id}
              className="confetti-piece absolute top-0 block"
              style={{
                left: `${piece.left}%`,
                backgroundColor: piece.color,
                width: piece.width,
                height: piece.height,
                borderRadius: 2,
                animationDelay: `${piece.delay}s`,
                animationDuration: `${piece.duration}s`,
              }}
            />
          ))}
        </div>

        <div className="relative">
          <p className="text-xs uppercase tracking-[0.25em] text-muted">Badge earned</p>
          <div className="achievement-icon mt-2 text-5xl" aria-hidden="true">
            {badge.icon}
          </div>
          <h3 className="mt-2 text-xl font-semibold text-foreground">{badge.title}</h3>
          <p className="mt-1 text-sm text-muted">{badge.howToEarn}</p>
          <p className="mt-2 text-sm font-semibold text-accent">+{badge.points} points</p>

          <button
            type="button"
            onClick={() => onDismiss(badge.id)}
            className="mt-4 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white"
          >
            Nice
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Watches a badge list and celebrates anything newly earned.
 *
 * Kept as its own component so the hook only runs on screens that actually
 * have badge data - the dashboard returns early when there is no journey.
 */
export function AchievementWatcher({ badges }: { badges: RewardBadge[] }) {
  const { newBadges, dismiss } = useNewlyEarnedBadges(badges);
  return <AchievementToast badge={newBadges[0] ?? null} onDismiss={dismiss} />;
}
