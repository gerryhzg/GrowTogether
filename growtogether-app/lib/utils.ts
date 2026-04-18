import { AppState, GrowthJourney, InterestRating } from "@/lib/types";

export function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatRelativeProgress(journey: GrowthJourney) {
  return `${journey.currentCount}/${journey.targetCount} ${journey.unit}`;
}

export function getProgressPercentage(journey: GrowthJourney) {
  if (journey.targetCount <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((journey.currentCount / journey.targetCount) * 100));
}

export function rankInterests(interests: InterestRating[]) {
  return [...interests].sort((left, right) => right.rating - left.rating);
}

export function getTopInterests(interests: InterestRating[], count = 3) {
  return rankInterests(interests)
    .slice(0, count)
    .map((entry) => entry.interest);
}

export function getActiveJourney(state: AppState) {
  return state.journeys.find((journey) => journey.id === state.activeJourneyId) ?? null;
}

export function getLatestCheckIn(state: AppState, journeyId: string | null) {
  if (!journeyId) {
    return null;
  }

  return (
    [...state.checkIns]
      .filter((entry) => entry.journeyId === journeyId)
      .sort((left, right) => right.date.localeCompare(left.date))[0] ?? null
  );
}

export function getLatestParentSupport(state: AppState, journeyId: string | null) {
  if (!journeyId) {
    return null;
  }

  return (
    [...state.parentSupportEntries]
      .filter((entry) => entry.journeyId === journeyId)
      .sort((left, right) => right.date.localeCompare(left.date))[0] ?? null
  );
}
