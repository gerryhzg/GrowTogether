import { EMPTY_STATE } from "@/lib/constants";
import {
  AppState,
  DailyCheckIn,
  GoalSuggestion,
  GrowthJourney,
  HistoryEntry,
  InterestRating,
  ParentSupportEntry,
} from "@/lib/types";
import { generateId, getTopInterests } from "@/lib/utils";

export function createInitialState() {
  return EMPTY_STATE;
}

export function setInterestRatings(state: AppState, ratings: InterestRating[]): AppState {
  return {
    ...state,
    interestRatings: ratings,
  };
}

export function createJourney(
  state: AppState,
  payload: {
    linkedInterest: GoalSuggestion["linkedInterest"];
    topInterests: GoalSuggestion["linkedInterest"][];
    title: string;
    description: string;
    targetCount: number;
    unit: string;
  },
) {
  const timestamp = new Date().toISOString();
  const archivedJourneys: GrowthJourney[] = state.journeys.map((journey) =>
    journey.status === "active"
      ? { ...journey, status: "completed", updatedAt: timestamp }
      : journey,
  );

  const journey: GrowthJourney = {
    id: generateId("journey"),
    linkedInterest: payload.linkedInterest,
    topInterests: payload.topInterests.length > 0 ? payload.topInterests : getTopInterests(state.interestRatings),
    goalTitle: payload.title,
    goalDescription: payload.description,
    targetCount: payload.targetCount,
    currentCount: 0,
    unit: payload.unit,
    status: "active",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const historyEntries: HistoryEntry[] = [
    ...state.historyEntries,
    {
      id: generateId("history"),
      journeyId: journey.id,
      date: timestamp,
      type: "journey-created",
      title: "Journey started",
      detail: `${journey.linkedInterest} journey: ${journey.goalTitle}`,
      progressSnapshot: 0,
    },
  ];

  return {
    ...state,
    activeJourneyId: journey.id,
    journeys: [...archivedJourneys, journey],
    historyEntries,
  };
}

export function saveCheckIn(
  state: AppState,
  payload: {
    journeyId: string;
    progressAdded: number;
    reflectionQuestion: string;
    childAnswer: string;
  },
) {
  const timestamp = new Date().toISOString();
  const journeys: GrowthJourney[] = state.journeys.map((journey) => {
    if (journey.id !== payload.journeyId) {
      return journey;
    }

    const currentCount = journey.currentCount + payload.progressAdded;
    const completed = currentCount >= journey.targetCount;

    return {
      ...journey,
      currentCount,
      status: completed ? "completed" : journey.status,
      updatedAt: timestamp,
    };
  });

  const journey = journeys.find((entry) => entry.id === payload.journeyId);
  const entry: DailyCheckIn = {
    id: generateId("checkin"),
    journeyId: payload.journeyId,
    date: timestamp,
    progressAdded: payload.progressAdded,
    reflectionQuestion: payload.reflectionQuestion,
    childAnswer: payload.childAnswer,
  };

  const historyEntries: HistoryEntry[] = [
    ...state.historyEntries,
    {
      id: generateId("history"),
      journeyId: payload.journeyId,
      date: timestamp,
      type: "check-in" as const,
      title: `Daily check-in +${payload.progressAdded}`,
      detail: payload.childAnswer,
      progressSnapshot: journey?.currentCount ?? payload.progressAdded,
    },
  ];

  if (journey?.status === "completed") {
    historyEntries.push({
      id: generateId("history"),
      journeyId: payload.journeyId,
      date: timestamp,
      type: "journey-completed",
      title: "Journey completed",
      detail: `${journey.goalTitle} reached its goal.`,
      progressSnapshot: journey.currentCount,
    });
  }

  return {
    ...state,
    activeJourneyId: journey?.status === "completed" ? null : state.activeJourneyId,
    journeys,
    checkIns: [...state.checkIns, entry],
    historyEntries,
  };
}

export function saveParentSupport(
  state: AppState,
  payload: {
    journeyId: string;
    summary: string;
    encouragementText: string;
    activitySuggestion: string;
  },
) {
  const timestamp = new Date().toISOString();
  const entry: ParentSupportEntry = {
    id: generateId("support"),
    journeyId: payload.journeyId,
    date: timestamp,
    summary: payload.summary,
    encouragementText: payload.encouragementText,
    activitySuggestion: payload.activitySuggestion,
  };

  const journey = state.journeys.find((item) => item.id === payload.journeyId);

  const historyEntries: HistoryEntry[] = [
    ...state.historyEntries,
    {
      id: generateId("history"),
      journeyId: payload.journeyId,
      date: timestamp,
      type: "parent-support",
      title: "Parent support added",
      detail: payload.encouragementText,
      progressSnapshot: journey?.currentCount ?? 0,
    },
  ];

  return {
    ...state,
    parentSupportEntries: [...state.parentSupportEntries, entry],
    historyEntries,
  };
}
