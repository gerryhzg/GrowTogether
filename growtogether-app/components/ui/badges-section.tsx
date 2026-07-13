"use client";

import { useState } from "react";
import { Badge } from "@/lib/types";
import { useChildTheme } from "@/components/providers/child-theme-context";

interface BadgesSectionProps {
  badges: Badge[];
}

const BADGE_ICONS: Record<string, string> = {
  "first-goal": "🎯",
  "streak-3": "🔥",
  "halfway": "⭐",
  "parent-sent": "💛",
  "goal-completed": "🏆",
};

const CONFETTI_COLORS = [
  "#ff6bb5", "#fbbf24", "#34d399", "#60a5fa",
  "#a78bfa", "#f87171", "#fb923c", "#4ade80",
];

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  width: number;
  height: number;
  rotation: number;
  delay: number;
}

export function BadgesSection({ badges }: BadgesSectionProps) {
  const { isNeonQuest } = useChildTheme();
  const [celebrating, setCelebrating] = useState<string | null>(null);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const unlockedBadges = badges.filter((b) => b.unlockedAt !== null);

  function celebrate(badgeId: string) {
    setCelebrating(badgeId);

    // Generate small colorful rectangles
    const pieces: ConfettiPiece[] = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: 20 + Math.random() * 60, // spread across middle
      y: 0,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      width: 6 + Math.random() * 8,   // small rectangles 6-14px wide
      height: 4 + Math.random() * 6,  // 4-10px tall
      rotation: Math.random() * 360,
      delay: Math.random() * 0.6,
    }));

    setConfetti(pieces);

    setTimeout(() => {
      setCelebrating(null);
      setConfetti([]);
    }, 2500);
  }

  return (
    <div className="lg:col-span-2 relative overflow-hidden">
      {/* Confetti rectangles */}
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="confetti-piece pointer-events-none absolute z-50"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            backgroundColor: piece.color,
            width: piece.width,
            height: piece.height,
            borderRadius: 2,
            transform: `rotate(${piece.rotation}deg)`,
            animationDelay: `${piece.delay}s`,
          }}
        />
      ))}

      <div className="rounded-[2rem] bg-white/80 p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-secondary">{isNeonQuest ? "Flex Badges" : "Achievement Badges"}</p>
        <h3 className="mt-2 text-2xl font-semibold text-foreground">
          {unlockedBadges.length}/{badges.length} {isNeonQuest ? "unlocked. W energy." : "unlocked"}
        </h3>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {badges.map((badge) => {
            const unlocked = badge.unlockedAt !== null;
            const icon = BADGE_ICONS[badge.id] ?? "🏅";
            const isCelebrating = celebrating === badge.id;

            return (
              <button
                key={badge.id}
                onClick={() => unlocked && celebrate(badge.id)}
                disabled={!unlocked}
                className={`rounded-[1.5rem] p-4 text-center transition-all duration-200 ${
                  unlocked
                    ? isCelebrating
                      ? "scale-115 bg-accent text-white shadow-xl ring-4 ring-accent/30"
                      : "bg-accent/10 hover:bg-accent/20 hover:scale-105 cursor-pointer"
                    : "bg-gray-100 opacity-40 cursor-not-allowed"
                }`}
              >
                <div className={`text-3xl ${isCelebrating ? "float-emoji" : ""}`}>{icon}</div>
                <p className="mt-2 text-xs font-semibold text-foreground leading-4">{badge.title}</p>
                {unlocked && !isCelebrating && (
                  <p className="mt-1 text-xs text-accent font-medium">{isNeonQuest ? "Flex it" : "Tap!"}</p>
                )}
                {isCelebrating && (
                  <p className="mt-1 text-xs text-white font-bold">{isNeonQuest ? "BIG W" : "YAY!"}</p>
                )}
                {!unlocked && (
                  <p className="mt-1 text-xs text-muted leading-3">{badge.description}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
