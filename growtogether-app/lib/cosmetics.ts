"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { RewardBadge, THEME_UNLOCK_MAP } from "@/lib/rewards";

/**
 * Cosmetic choices are per-child and purely visual, so they live in
 * localStorage rather than Supabase. Keeping them client-side means the
 * reward system ships without a database migration.
 *
 * localStorage is an external store, so it is read through
 * useSyncExternalStore rather than copied into state inside an effect.
 */

const AVATAR_KEY = "growtogether-avatar";
const DECORATION_KEY = "growtogether-decoration";
const SEEN_BADGES_KEY = "growtogether-seen-badges";

/** The app shell already reads this key; we reuse it so themes stay in sync. */
export const CHILD_THEME_STORAGE_KEY = "growtogether-child-theme";

/** Fired after a theme change so the shell can react without a page reload. */
export const CHILD_THEME_EVENT = "growtogether:child-theme";

/** Fired after any cosmetic write so every subscriber re-reads storage. */
const COSMETICS_EVENT = "growtogether:cosmetics";

export const DEFAULT_AVATAR_ID = "avatar-fox";

/* ------------------------------------------------------------------ */
/* Storage plumbing                                                    */
/* ------------------------------------------------------------------ */

function subscribe(onChange: () => void): () => void {
  window.addEventListener(COSMETICS_EVENT, onChange);
  // Keeps two open tabs in step.
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(COSMETICS_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // A full or blocked storage quota should never break the page.
  }
  window.dispatchEvent(new Event(COSMETICS_EVENT));
}

/** Reads a single key. Returns the fallback during SSR and first hydration. */
function useStoredValue(key: string, fallback: string): string {
  const getSnapshot = useCallback(() => readRaw(key) ?? fallback, [key, fallback]);
  const getServerSnapshot = useCallback(() => fallback, [fallback]);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/* ------------------------------------------------------------------ */
/* Public hooks                                                        */
/* ------------------------------------------------------------------ */

export function useCosmetics() {
  const avatarId = useStoredValue(AVATAR_KEY, DEFAULT_AVATAR_ID);
  const storedDecoration = useStoredValue(DECORATION_KEY, "");
  const decorationId = storedDecoration.length > 0 ? storedDecoration : null;

  const setAvatarId = useCallback((next: string) => {
    writeRaw(AVATAR_KEY, next);
  }, []);

  const setDecorationId = useCallback((next: string | null) => {
    writeRaw(DECORATION_KEY, next ?? "");
  }, []);

  /** Applies an unlocked theme and tells the app shell to repaint. */
  const applyTheme = useCallback((unlockId: string) => {
    const themeValue = THEME_UNLOCK_MAP[unlockId];
    if (!themeValue) return;
    writeRaw(CHILD_THEME_STORAGE_KEY, themeValue);
    window.dispatchEvent(new CustomEvent(CHILD_THEME_EVENT, { detail: themeValue }));
  }, []);

  return { avatarId, setAvatarId, decorationId, setDecorationId, applyTheme };
}

function parseSeen(raw: string | null): string[] | null {
  if (raw === null) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === "string")
      : [];
  } catch {
    return [];
  }
}

/**
 * Works out which badges the child has not been congratulated for yet.
 *
 * The "seen" list is derived from storage during render rather than copied
 * into state, so there is no setState-inside-effect cascade. The only effect
 * writes to storage, which is what effects are for.
 */
export function useNewlyEarnedBadges(badges: RewardBadge[]) {
  const seenRaw = useSyncExternalStore(
    subscribe,
    () => readRaw(SEEN_BADGES_KEY),
    () => null
  );

  const unlockedKey = badges
    .filter((badge) => badge.unlockedAt !== null)
    .map((badge) => badge.id)
    .join(",");

  // First run on a device: treat everything already earned as seen, so the
  // child is not buried under celebrations for progress they already made.
  useEffect(() => {
    if (seenRaw !== null || unlockedKey.length === 0) {
      return;
    }
    writeRaw(SEEN_BADGES_KEY, JSON.stringify(unlockedKey.split(",")));
  }, [seenRaw, unlockedKey]);

  const newBadges = useMemo(() => {
    const seen = parseSeen(seenRaw);
    if (seen === null) {
      return [];
    }
    return badges.filter(
      (badge) => badge.unlockedAt !== null && !seen.includes(badge.id)
    );
  }, [badges, seenRaw]);

  const dismiss = useCallback((badgeId: string) => {
    const current = parseSeen(readRaw(SEEN_BADGES_KEY)) ?? [];
    if (current.includes(badgeId)) {
      return;
    }
    writeRaw(SEEN_BADGES_KEY, JSON.stringify([...current, badgeId]));
  }, []);

  return { newBadges, dismiss };
}
