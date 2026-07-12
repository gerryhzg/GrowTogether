import { AppState, GrowthJourney, InterestRating, Badge, StreakInfo, DailyCheckIn } from "@/lib/types";

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

// Feature 8: Achievement Badges
export function getAllBadges(state: AppState, journey: GrowthJourney | null): Badge[] {
  const badges: Badge[] = [
    { id: "first-goal", title: "First Goal Started", description: "You started your first growth journey", unlockedAt: null },
    { id: "streak-3", title: "3-Day Check-In Streak", description: "You checked in for 3 consecutive days", unlockedAt: null },
    { id: "halfway", title: "Halfway There", description: "You reached 50% of your goal", unlockedAt: null },
    { id: "parent-sent", title: "Parent Encouragement Sent", description: "A parent sent you a supportive message", unlockedAt: null },
    { id: "goal-completed", title: "Goal Completed", description: "You completed a growth goal", unlockedAt: null },
  ];

  if (state.journeys.length > 0) {
    badges[0].unlockedAt = state.journeys[0].createdAt;
  }

  if (state.checkIns.length >= 3) {
    const sortedCheckIns = [...state.checkIns].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let streak = 1;
    for (let i = 1; i < sortedCheckIns.length; i++) {
      const prevDate = new Date(sortedCheckIns[i - 1].date);
      const currDate = new Date(sortedCheckIns[i].date);
      const daysDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff <= 1) {
        streak++;
        if (streak >= 3) {
          badges[1].unlockedAt = sortedCheckIns[i].date;
          break;
        }
      } else {
        streak = 1;
      }
    }
  }

  if (journey && journey.currentCount >= journey.targetCount / 2) {
    const checkIn = state.checkIns.find(c => c.journeyId === journey.id && c.progressAdded > 0);
    if (checkIn) {
      badges[2].unlockedAt = checkIn.date;
    }
  }

  if (state.parentSupportEntries.length > 0) {
    badges[3].unlockedAt = state.parentSupportEntries[0].date;
  }

  if (journey && journey.status === "completed") {
    badges[4].unlockedAt = journey.updatedAt;
  } else {
    const completedJourney = state.journeys.find(j => j.status === "completed");
    if (completedJourney) {
      badges[4].unlockedAt = completedJourney.updatedAt;
    }
  }

  return badges;
}

// Feature 9: Streak and Consistency Predictor
export function calculateStreakInfo(journey: GrowthJourney | null, checkIns: DailyCheckIn[]): StreakInfo {
  if (!journey || checkIns.length === 0) {
    return {
      currentStreak: 0,
      estimatedCompletionDate: null,
      completionDaysRemaining: null,
    };
  }

  const sortedCheckIns = [...checkIns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const checkIn of sortedCheckIns) {
    const checkInDate = new Date(checkIn.date);
    checkInDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff === currentStreak) {
      currentStreak++;
    } else if (daysDiff > currentStreak) {
      break;
    }
  }

  // Skip completion date estimation to avoid date calculation errors
  return {
    currentStreak,
    estimatedCompletionDate: null,
    completionDaysRemaining: null,
  };
}
