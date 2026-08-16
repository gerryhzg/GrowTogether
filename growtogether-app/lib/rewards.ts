import { DailyCheckIn, GrowthJourney, InterestName, ParentSupportEntry } from "@/lib/types";

/**
 * Reward engine.
 *
 * Everything here is DERIVED from data the app already stores in Supabase
 * (journeys, check-ins, parent support). Nothing new is written to the
 * database, so this feature needs no migration and no new RLS policies.
 *
 * Cosmetic choices a child makes (avatar, decoration) are the only stored
 * values, and they live in localStorage - see `lib/cosmetics.ts`.
 */

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type RewardBadgeId =
  | "first-goal"
  | "first-check-in"
  | "streak-3"
  | "streak-7"
  | "streak-14"
  | "quarter"
  | "halfway"
  | "almost-there"
  | "goal-completed"
  | "parent-sent"
  | "parent-trio"
  | "storyteller"
  | "deep-thinker"
  | "big-leap"
  | "ten-check-ins";

export interface RewardBadge {
  id: RewardBadgeId;
  title: string;
  /** Shown while still locked - tells the child exactly how to earn it. */
  howToEarn: string;
  icon: string;
  points: number;
  unlockedAt: string | null;
}

export interface LevelTier {
  level: number;
  name: string;
  icon: string;
  /** Total points needed to reach this tier. */
  threshold: number;
  blurb: string;
}

export interface LevelProgress {
  tier: LevelTier;
  nextTier: LevelTier | null;
  pointsIntoTier: number;
  pointsNeededForTier: number;
  percentToNextTier: number;
  pointsToNextTier: number;
}

export type UnlockKind = "theme" | "avatar" | "decoration";

export interface Unlockable {
  id: string;
  kind: UnlockKind;
  name: string;
  description: string;
  icon: string;
  requiredLevel: number;
}

export interface PointEntry {
  label: string;
  points: number;
}

export interface RewardProfile {
  totalPoints: number;
  breakdown: PointEntry[];
  level: LevelProgress;
  badges: RewardBadge[];
  unlockedBadgeCount: number;
  currentStreak: number;
  longestStreak: number;
  unlocks: Unlockable[];
  unlockedIds: string[];
}

export interface ChallengeCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
}

/* ------------------------------------------------------------------ */
/* Point rules                                                         */
/* ------------------------------------------------------------------ */

export const POINT_RULES = {
  checkIn: 10,
  perProgressUnit: 4,
  reflectionWritten: 8,
  reflectionDetailed: 12,
  perLongestStreakDay: 5,
  goalCompleted: 150,
} as const;

const REFLECTION_MIN_CHARS = 40;
const REFLECTION_DETAILED_CHARS = 120;

/* ------------------------------------------------------------------ */
/* Level ladder                                                        */
/* ------------------------------------------------------------------ */

/**
 * The ladder uses the app's own growth vocabulary rather than generic
 * "Level 1 / Level 2" labels, so the reward system reads as part of the
 * growth journey instead of a bolted-on game.
 */
export const LEVEL_TIERS: LevelTier[] = [
  { level: 1, name: "Seedling", icon: "🌱", threshold: 0, blurb: "Every journey starts underground." },
  { level: 2, name: "Sprout", icon: "🌿", threshold: 120, blurb: "You broke through the soil." },
  { level: 3, name: "Sapling", icon: "🪴", threshold: 300, blurb: "Small, but standing on your own." },
  { level: 4, name: "Bud", icon: "🌷", threshold: 560, blurb: "Something is about to open." },
  { level: 5, name: "Bloom", icon: "🌸", threshold: 900, blurb: "Your work is showing." },
  { level: 6, name: "Branch", icon: "🌳", threshold: 1320, blurb: "Strong enough to hold others up." },
  { level: 7, name: "Grove", icon: "🏞️", threshold: 1820, blurb: "You have grown a whole habit." },
  { level: 8, name: "Evergreen", icon: "🌲", threshold: 2400, blurb: "You keep going in every season." },
];

export function getLevelProgress(totalPoints: number): LevelProgress {
  let tier = LEVEL_TIERS[0];
  for (const candidate of LEVEL_TIERS) {
    if (totalPoints >= candidate.threshold) {
      tier = candidate;
    }
  }

  const nextTier = LEVEL_TIERS.find((entry) => entry.level === tier.level + 1) ?? null;

  if (!nextTier) {
    return {
      tier,
      nextTier: null,
      pointsIntoTier: totalPoints - tier.threshold,
      pointsNeededForTier: 0,
      percentToNextTier: 100,
      pointsToNextTier: 0,
    };
  }

  const pointsNeededForTier = nextTier.threshold - tier.threshold;
  const pointsIntoTier = totalPoints - tier.threshold;

  return {
    tier,
    nextTier,
    pointsIntoTier,
    pointsNeededForTier,
    // Floored, so the bar never reads 100% while points are still owed.
    percentToNextTier: Math.min(100, Math.floor((pointsIntoTier / pointsNeededForTier) * 100)),
    pointsToNextTier: Math.max(0, nextTier.threshold - totalPoints),
  };
}

/* ------------------------------------------------------------------ */
/* Unlockables                                                         */
/* ------------------------------------------------------------------ */

export const UNLOCKABLES: Unlockable[] = [
  { id: "avatar-fox", kind: "avatar", name: "Fox", description: "A curious explorer.", icon: "🦊", requiredLevel: 1 },
  { id: "avatar-owl", kind: "avatar", name: "Owl", description: "Quiet and thoughtful.", icon: "🦉", requiredLevel: 1 },
  { id: "theme-original", kind: "theme", name: "Sunrise", description: "The bright starter look.", icon: "🌞", requiredLevel: 1 },
  { id: "avatar-otter", kind: "avatar", name: "Otter", description: "Playful and hard to discourage.", icon: "🦦", requiredLevel: 2 },
  { id: "decoration-sparkles", kind: "decoration", name: "Sparkle Trail", description: "Sparkles follow your progress bar.", icon: "✨", requiredLevel: 2 },
  { id: "theme-woodland", kind: "theme", name: "Woodland", description: "Watercolour forest, drifting leaves.", icon: "🍃", requiredLevel: 3 },
  { id: "avatar-dragon", kind: "avatar", name: "Dragon", description: "For goals that need some fire.", icon: "🐉", requiredLevel: 4 },
  { id: "decoration-lanterns", kind: "decoration", name: "Lantern Glow", description: "Warm lanterns light your map.", icon: "🏮", requiredLevel: 4 },
  { id: "theme-neon-quest", kind: "theme", name: "Neon Quest", description: "Dark arcade HUD with neon edges.", icon: "🎮", requiredLevel: 5 },
  { id: "avatar-astronaut", kind: "avatar", name: "Astronaut", description: "You went further than the map.", icon: "🧑‍🚀", requiredLevel: 6 },
  { id: "decoration-aurora", kind: "decoration", name: "Aurora", description: "Northern lights across your header.", icon: "🌌", requiredLevel: 6 },
  { id: "avatar-phoenix", kind: "avatar", name: "Phoenix", description: "Only for Evergreen growers.", icon: "🔥", requiredLevel: 8 },
];

export function getUnlockedIds(level: number): string[] {
  return UNLOCKABLES.filter((entry) => entry.requiredLevel <= level).map((entry) => entry.id);
}

/** Maps an unlockable theme id onto the ChildTheme value the app shell uses. */
export const THEME_UNLOCK_MAP: Record<string, string> = {
  "theme-original": "original",
  "theme-woodland": "woodland",
  "theme-neon-quest": "neon-quest",
};

/* ------------------------------------------------------------------ */
/* Streaks                                                             */
/* ------------------------------------------------------------------ */

function toDayNumber(iso: string): number | null {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return Math.floor(
    Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()) / 86_400_000
  );
}

function uniqueSortedDays(checkIns: DailyCheckIn[]): number[] {
  const days = new Set<number>();
  for (const entry of checkIns) {
    const day = toDayNumber(entry.date);
    if (day !== null) {
      days.add(day);
    }
  }
  return [...days].sort((left, right) => left - right);
}

export function getLongestStreak(checkIns: DailyCheckIn[]): number {
  const days = uniqueSortedDays(checkIns);
  if (days.length === 0) {
    return 0;
  }

  let longest = 1;
  let running = 1;
  for (let index = 1; index < days.length; index += 1) {
    running = days[index] - days[index - 1] === 1 ? running + 1 : 1;
    longest = Math.max(longest, running);
  }
  return longest;
}

export function getCurrentStreak(checkIns: DailyCheckIn[]): number {
  const days = uniqueSortedDays(checkIns);
  if (days.length === 0) {
    return 0;
  }

  const now = new Date();
  const today = Math.floor(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000
  );
  const mostRecent = days[days.length - 1];

  // A streak survives one missed day only if today's check-in is still open.
  if (today - mostRecent > 1) {
    return 0;
  }

  let streak = 1;
  for (let index = days.length - 1; index > 0; index -= 1) {
    if (days[index] - days[index - 1] === 1) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

interface BadgeDefinition {
  id: RewardBadgeId;
  title: string;
  howToEarn: string;
  icon: string;
  points: number;
}

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { id: "first-goal", title: "Journey Begun", howToEarn: "Pick your first goal", icon: "🎯", points: 30 },
  { id: "first-check-in", title: "First Steps", howToEarn: "Check in once", icon: "👟", points: 30 },
  { id: "ten-check-ins", title: "Regular", howToEarn: "Check in 10 times", icon: "📆", points: 60 },
  { id: "streak-3", title: "Three in a Row", howToEarn: "Check in 3 days running", icon: "🔥", points: 40 },
  { id: "streak-7", title: "Full Week", howToEarn: "Check in 7 days running", icon: "⚡", points: 70 },
  { id: "streak-14", title: "Unstoppable", howToEarn: "Check in 14 days running", icon: "💫", points: 120 },
  { id: "quarter", title: "Quarter Way", howToEarn: "Reach 25% of your goal", icon: "🌱", points: 30 },
  { id: "halfway", title: "Halfway There", howToEarn: "Reach 50% of your goal", icon: "⭐", points: 50 },
  { id: "almost-there", title: "Home Stretch", howToEarn: "Reach 80% of your goal", icon: "🚀", points: 70 },
  { id: "goal-completed", title: "Goal Complete", howToEarn: "Finish a whole goal", icon: "🏆", points: 150 },
  { id: "big-leap", title: "Big Leap", howToEarn: "Log 3 or more in one check-in", icon: "🦘", points: 40 },
  { id: "storyteller", title: "Storyteller", howToEarn: "Write 5 real reflections", icon: "📖", points: 60 },
  { id: "deep-thinker", title: "Deep Thinker", howToEarn: "Write one long, thoughtful reflection", icon: "🧠", points: 50 },
  { id: "parent-sent", title: "Cheered On", howToEarn: "Get a message from a parent", icon: "💛", points: 30 },
  { id: "parent-trio", title: "Team Effort", howToEarn: "Get 3 messages from a parent", icon: "🤝", points: 60 },
];

function sortByDate<T extends { date: string }>(entries: T[]): T[] {
  return [...entries].sort(
    (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime()
  );
}

/** Returns the date of the Nth check-in that satisfies a predicate, or null. */
function dateOfNth(
  checkIns: DailyCheckIn[],
  count: number,
  predicate: (entry: DailyCheckIn) => boolean
): string | null {
  let seen = 0;
  for (const entry of sortByDate(checkIns)) {
    if (!predicate(entry)) continue;
    seen += 1;
    if (seen >= count) {
      return entry.date;
    }
  }
  return null;
}

/** Date at which cumulative progress first crossed a percentage of the target. */
function dateProgressCrossed(
  checkIns: DailyCheckIn[],
  journey: GrowthJourney | null,
  percent: number
): string | null {
  if (!journey || journey.targetCount <= 0) {
    return null;
  }
  const needed = journey.targetCount * (percent / 100);
  let running = 0;
  for (const entry of sortByDate(checkIns)) {
    running += entry.progressAdded;
    if (running >= needed) {
      return entry.date;
    }
  }
  // Progress may predate the check-ins we can see (e.g. a parent override).
  return journey.currentCount >= needed ? journey.updatedAt || journey.createdAt : null;
}

function dateOfStreak(checkIns: DailyCheckIn[], length: number): string | null {
  const sorted = sortByDate(checkIns);
  const days = uniqueSortedDays(checkIns);
  if (days.length < length) {
    return null;
  }

  let running = 1;
  for (let index = 1; index < days.length; index += 1) {
    running = days[index] - days[index - 1] === 1 ? running + 1 : 1;
    if (running >= length) {
      const targetDay = days[index];
      const match = sorted.find((entry) => toDayNumber(entry.date) === targetDay);
      return match?.date ?? null;
    }
  }
  return null;
}

export function buildBadges(
  journey: GrowthJourney | null,
  checkIns: DailyCheckIn[],
  parentSupport: ParentSupportEntry[]
): RewardBadge[] {
  const sortedCheckIns = sortByDate(checkIns);
  const sortedSupport = sortByDate(parentSupport);

  /** Supabase can hand back an empty created_at; that is not an unlock date. */
  const orNull = (value: string | null | undefined): string | null =>
    value && value.trim().length > 0 ? value : null;

  const unlockedAtById: Partial<Record<RewardBadgeId, string | null>> = {
    "first-goal": journey ? orNull(journey.createdAt) : null,
    "first-check-in": orNull(sortedCheckIns[0]?.date),
    "ten-check-ins": orNull(sortedCheckIns[9]?.date),
    "streak-3": orNull(dateOfStreak(checkIns, 3)),
    "streak-7": orNull(dateOfStreak(checkIns, 7)),
    "streak-14": orNull(dateOfStreak(checkIns, 14)),
    quarter: orNull(dateProgressCrossed(checkIns, journey, 25)),
    halfway: orNull(dateProgressCrossed(checkIns, journey, 50)),
    "almost-there": orNull(dateProgressCrossed(checkIns, journey, 80)),
    "goal-completed":
      journey?.status === "completed"
        ? orNull(journey.updatedAt) ?? orNull(journey.createdAt)
        : null,
    "big-leap": orNull(dateOfNth(checkIns, 1, (entry) => entry.progressAdded >= 3)),
    storyteller: orNull(
      dateOfNth(checkIns, 5, (entry) => entry.childAnswer.trim().length >= REFLECTION_MIN_CHARS)
    ),
    "deep-thinker": orNull(
      dateOfNth(checkIns, 1, (entry) => entry.childAnswer.trim().length >= REFLECTION_DETAILED_CHARS)
    ),
    "parent-sent": orNull(sortedSupport[0]?.date),
    "parent-trio": orNull(sortedSupport[2]?.date),
  };

  return BADGE_DEFINITIONS.map((definition) => ({
    ...definition,
    unlockedAt: unlockedAtById[definition.id] ?? null,
  }));
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

export function calculateRewardProfile(
  journey: GrowthJourney | null,
  checkIns: DailyCheckIn[],
  parentSupport: ParentSupportEntry[]
): RewardProfile {
  const badges = buildBadges(journey, checkIns, parentSupport);
  const longestStreak = getLongestStreak(checkIns);
  const currentStreak = getCurrentStreak(checkIns);

  const progressUnits = checkIns.reduce((total, entry) => total + Math.max(0, entry.progressAdded), 0);
  const reflectionCount = checkIns.filter(
    (entry) => entry.childAnswer.trim().length >= REFLECTION_MIN_CHARS
  ).length;
  const detailedCount = checkIns.filter(
    (entry) => entry.childAnswer.trim().length >= REFLECTION_DETAILED_CHARS
  ).length;
  const badgePoints = badges
    .filter((badge) => badge.unlockedAt !== null)
    .reduce((total, badge) => total + badge.points, 0);

  const breakdown: PointEntry[] = [
    { label: `${checkIns.length} check-in${checkIns.length === 1 ? "" : "s"}`, points: checkIns.length * POINT_RULES.checkIn },
    { label: `${progressUnits} progress logged`, points: progressUnits * POINT_RULES.perProgressUnit },
    { label: `${reflectionCount} reflection${reflectionCount === 1 ? "" : "s"} written`, points: reflectionCount * POINT_RULES.reflectionWritten },
    { label: `${detailedCount} in real depth`, points: detailedCount * POINT_RULES.reflectionDetailed },
    { label: `Best streak: ${longestStreak} day${longestStreak === 1 ? "" : "s"}`, points: longestStreak * POINT_RULES.perLongestStreakDay },
    { label: `${badges.filter((b) => b.unlockedAt).length} badges earned`, points: badgePoints },
  ];

  if (journey?.status === "completed") {
    breakdown.push({ label: "Goal completed", points: POINT_RULES.goalCompleted });
  }

  const totalPoints = breakdown.reduce((total, entry) => total + entry.points, 0);
  const level = getLevelProgress(totalPoints);

  return {
    totalPoints,
    breakdown: breakdown.filter((entry) => entry.points > 0),
    level,
    badges,
    unlockedBadgeCount: badges.filter((badge) => badge.unlockedAt !== null).length,
    currentStreak,
    longestStreak,
    unlocks: UNLOCKABLES,
    unlockedIds: getUnlockedIds(level.tier.level),
  };
}

/* ------------------------------------------------------------------ */
/* Daily challenges                                                    */
/* ------------------------------------------------------------------ */

const CHALLENGE_POOL: Omit<ChallengeCard, "id">[] = [
  { title: "Beat yesterday", description: "Log more progress today than you did last time.", icon: "📈", points: 15 },
  { title: "Say why", description: "In your reflection, explain why today felt easy or hard.", icon: "💭", points: 15 },
  { title: "Teach someone", description: "Show one person at home what you practised.", icon: "🗣️", points: 20 },
  { title: "Ten more minutes", description: "Stay with it ten minutes past where you wanted to stop.", icon: "⏱️", points: 20 },
  { title: "Start first", description: "Do your practice before anything on a screen.", icon: "🌅", points: 15 },
  { title: "Name one win", description: "Write down one thing you did better than last week.", icon: "🏅", points: 15 },
  { title: "Try it slower", description: "Do the hard part at half speed and see what changes.", icon: "🐢", points: 20 },
  { title: "Ask a question", description: "Write one thing you still want to figure out.", icon: "❓", points: 15 },
];

const INTEREST_CHALLENGES: Partial<Record<InterestName, Omit<ChallengeCard, "id">>> = {
  Music: { title: "Play it for someone", description: "Perform one piece for a person in your house.", icon: "🎵", points: 20 },
  Sports: { title: "Warm up properly", description: "Do a full warm-up before you practise today.", icon: "⚽", points: 15 },
  Science: { title: "Make a guess first", description: "Predict what will happen before you test it.", icon: "🔬", points: 20 },
  Coding: { title: "Break it on purpose", description: "Change one line, see what breaks, then fix it.", icon: "💻", points: 20 },
  Art: { title: "Use one new colour", description: "Add a colour you normally avoid.", icon: "🎨", points: 15 },
  Animals: { title: "Watch closely", description: "Spend five minutes just observing, no phone.", icon: "🐾", points: 15 },
};

/**
 * Deterministic per-day selection so the cards stay put if the page
 * re-renders, but rotate for the child each morning.
 */
export function getDailyChallenges(
  interest: InterestName | null,
  seedDate: Date = new Date(),
  count = 3
): ChallengeCard[] {
  const daySeed = Math.floor(
    Date.UTC(seedDate.getFullYear(), seedDate.getMonth(), seedDate.getDate()) / 86_400_000
  );

  const cards: ChallengeCard[] = [];
  const interestCard = interest ? INTEREST_CHALLENGES[interest] : undefined;
  if (interestCard) {
    cards.push({ ...interestCard, id: `challenge-interest-${daySeed}` });
  }

  const remaining = Math.max(0, count - cards.length);
  for (let offset = 0; offset < remaining; offset += 1) {
    const index = (daySeed * 3 + offset * 5) % CHALLENGE_POOL.length;
    cards.push({ ...CHALLENGE_POOL[index], id: `challenge-${daySeed}-${offset}` });
  }

  return cards;
}
