"use client";

import Link from "next/link";
import { ChallengeCard } from "@/lib/rewards";
import { useChildTheme } from "@/components/providers/child-theme-context";

interface ChallengeCardsProps {
  challenges: ChallengeCard[];
}

export function ChallengeCards({ challenges }: ChallengeCardsProps) {
  const { isNeonQuest, isWoodland } = useChildTheme();

  if (challenges.length === 0) {
    return null;
  }

  const heading = isNeonQuest ? "Side Quests" : isWoodland ? "Today's Detours" : "Today's Challenges";
  const subheading = isNeonQuest
    ? "Optional. Extra points if you clear one."
    : "Pick one if you want a bit more out of today.";

  return (
    <div className="rounded-[1.75rem] bg-white/75 p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.25em] text-muted">{heading}</p>
      <p className="mt-1 text-sm text-muted">{subheading}</p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {challenges.map((challenge, index) => (
          <li
            key={challenge.id}
            className="challenge-card flex h-full flex-col rounded-[1.25rem] border border-border bg-surface-strong p-4"
            style={{ animationDelay: `${index * 0.09}s` }}
          >
            <span className="text-2xl" aria-hidden="true">
              {challenge.icon}
            </span>
            <h4 className="mt-2 text-base font-semibold text-foreground">{challenge.title}</h4>
            <p className="mt-1 flex-1 text-sm leading-snug text-muted">{challenge.description}</p>
            <span className="mt-3 inline-block w-fit rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-foreground">
              +{challenge.points} points
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-sm text-muted">
        Finished one?{" "}
        <Link href="/check-in" className="font-semibold text-accent underline-offset-4 hover:underline">
          Log it in your check-in
        </Link>{" "}
        and say what you did.
      </p>
    </div>
  );
}
