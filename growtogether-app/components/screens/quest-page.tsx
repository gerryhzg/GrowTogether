"use client";

import Link from "next/link";
import { Panel } from "@/components/ui/panel";
import { LevelCard } from "@/components/ui/level-card";
import { RewardBadgeGrid } from "@/components/ui/reward-badge-grid";
import { useAuth } from "@/components/providers/auth-context";
import { useChildTheme } from "@/components/providers/child-theme-context";
import { useCosmetics } from "@/lib/cosmetics";
import { useRewardProfile } from "@/lib/use-reward-profile";
import { LEVEL_TIERS, THEME_UNLOCK_MAP, Unlockable, UNLOCKABLES } from "@/lib/rewards";

function findIcon(unlockId: string): string {
  return UNLOCKABLES.find((entry) => entry.id === unlockId)?.icon ?? "🦊";
}

export function QuestPage() {
  const { user } = useAuth();
  const { childTheme } = useChildTheme();
  const { profile, hasJourney } = useRewardProfile();
  const { avatarId, setAvatarId, decorationId, setDecorationId, applyTheme } = useCosmetics();

  const currentLevel = profile.level.tier.level;
  const isUnlocked = (entry: Unlockable) => entry.requiredLevel <= currentLevel;

  const avatars = UNLOCKABLES.filter((entry) => entry.kind === "avatar");
  const themes = UNLOCKABLES.filter((entry) => entry.kind === "theme");
  const decorations = UNLOCKABLES.filter((entry) => entry.kind === "decoration");

  const activeAvatarIcon = findIcon(avatarId);

  return (
    <div className="space-y-5">
      <Panel>
        <p className="text-xs uppercase tracking-[0.25em] text-secondary">Reward room</p>
        <h2 className="mt-2 font-display text-3xl text-foreground">
          {user?.name ? `${user.name}'s collection` : "Your collection"}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Points come from checking in, writing real reflections, and keeping streaks going.
          Levels unlock new looks for the app.
        </p>

        {!hasJourney ? (
          <p className="mt-4 rounded-[1.25rem] border border-border bg-surface-strong p-4 text-sm text-muted">
            You have no goal yet, so there is nothing to earn points from.{" "}
            <Link href="/discover" className="font-semibold text-accent underline-offset-4 hover:underline">
              Pick a goal
            </Link>{" "}
            to start the map.
          </p>
        ) : null}
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <LevelCard profile={profile} avatarIcon={activeAvatarIcon} />

        <div className="rounded-[1.75rem] bg-white/75 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-muted">The ladder</p>
          <ol className="mt-4 space-y-2">
            {LEVEL_TIERS.map((tier) => {
              const reached = tier.level <= currentLevel;
              const isCurrent = tier.level === currentLevel;

              return (
                <li
                  key={tier.level}
                  className={`flex items-center gap-3 rounded-[1rem] px-3 py-2 ${
                    isCurrent ? "bg-accent-soft" : reached ? "bg-secondary-soft/60" : "bg-gray-100/60"
                  }`}
                >
                  <span className={`text-xl ${reached ? "" : "grayscale opacity-50"}`} aria-hidden="true">
                    {tier.icon}
                  </span>
                  <span className="flex-1">
                    <span className={`block text-sm font-semibold ${reached ? "text-foreground" : "text-muted"}`}>
                      {tier.name}
                    </span>
                    <span className="block text-xs text-muted">{tier.blurb}</span>
                  </span>
                  <span className="text-xs font-semibold text-muted">{tier.threshold} pts</span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Avatars */}
      <div className="rounded-[1.75rem] bg-white/75 p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.25em] text-muted">Your traveller</p>
        <p className="mt-1 text-sm text-muted">This is who walks your adventure map.</p>

        <ul className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-6">
          {avatars.map((avatar) => {
            const unlocked = isUnlocked(avatar);
            const selected = avatarId === avatar.id;

            return (
              <li key={avatar.id}>
                <button
                  type="button"
                  disabled={!unlocked}
                  onClick={() => setAvatarId(avatar.id)}
                  aria-pressed={selected}
                  title={unlocked ? avatar.description : `Unlocks at level ${avatar.requiredLevel}`}
                  className={`w-full rounded-[1.25rem] p-3 text-center transition-transform duration-200 ${
                    unlocked ? "cursor-pointer hover:scale-105" : "cursor-not-allowed opacity-55"
                  } ${selected ? "bg-accent text-white ring-2 ring-accent-strong" : "bg-accent-soft/60"}`}
                >
                  <span className="block text-2xl" aria-hidden="true">
                    {unlocked ? avatar.icon : "🔒"}
                  </span>
                  <span className="mt-1 block text-[0.7rem] font-semibold leading-tight">
                    {avatar.name}
                  </span>
                  {!unlocked ? (
                    <span className="mt-0.5 block text-[0.65rem] text-muted">Lv {avatar.requiredLevel}</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Themes */}
      <div className="rounded-[1.75rem] bg-white/75 p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.25em] text-muted">Looks</p>
        <p className="mt-1 text-sm text-muted">Change how the whole app feels.</p>

        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {themes.map((theme) => {
            const unlocked = isUnlocked(theme);
            const active = childTheme === THEME_UNLOCK_MAP[theme.id];

            return (
              <li
                key={theme.id}
                className={`rounded-[1.25rem] border p-4 ${
                  active ? "border-accent bg-accent-soft" : "border-border bg-surface-strong"
                } ${unlocked ? "" : "opacity-60"}`}
              >
                <span className="text-2xl" aria-hidden="true">
                  {unlocked ? theme.icon : "🔒"}
                </span>
                <h4 className="mt-2 text-base font-semibold text-foreground">{theme.name}</h4>
                <p className="mt-1 text-sm text-muted">{theme.description}</p>

                {unlocked ? (
                  <button
                    type="button"
                    onClick={() => applyTheme(theme.id)}
                    disabled={active}
                    className={`mt-3 rounded-full px-4 py-1.5 text-sm font-semibold ${
                      active ? "bg-accent/30 text-foreground" : "bg-accent text-white"
                    }`}
                  >
                    {active ? "In use" : "Use this look"}
                  </button>
                ) : (
                  <p className="mt-3 text-sm font-semibold text-muted">
                    Unlocks at level {theme.requiredLevel}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Decorations */}
      <div className="rounded-[1.75rem] bg-white/75 p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.25em] text-muted">Map decorations</p>
        <p className="mt-1 text-sm text-muted">One at a time. These show up on your adventure map.</p>

        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {decorations.map((decoration) => {
            const unlocked = isUnlocked(decoration);
            const active = decorationId === decoration.id;

            return (
              <li
                key={decoration.id}
                className={`rounded-[1.25rem] border p-4 ${
                  active ? "border-accent bg-accent-soft" : "border-border bg-surface-strong"
                } ${unlocked ? "" : "opacity-60"}`}
              >
                <span className="text-2xl" aria-hidden="true">
                  {unlocked ? decoration.icon : "🔒"}
                </span>
                <h4 className="mt-2 text-base font-semibold text-foreground">{decoration.name}</h4>
                <p className="mt-1 text-sm text-muted">{decoration.description}</p>

                {unlocked ? (
                  <button
                    type="button"
                    onClick={() => setDecorationId(active ? null : decoration.id)}
                    className={`mt-3 rounded-full px-4 py-1.5 text-sm font-semibold ${
                      active ? "bg-accent/30 text-foreground" : "bg-accent text-white"
                    }`}
                  >
                    {active ? "Turn off" : "Turn on"}
                  </button>
                ) : (
                  <p className="mt-3 text-sm font-semibold text-muted">
                    Unlocks at level {decoration.requiredLevel}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <RewardBadgeGrid badges={profile.badges} />
    </div>
  );
}
