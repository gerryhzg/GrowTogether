"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useSyncExternalStore,
} from "react";
import {
  createJourney as createJourneyInState,
  saveCheckIn as saveCheckInInState,
  saveParentSupport as saveParentSupportInState,
  setInterestRatings as setInterestRatingsInState,
} from "@/lib/repositories/app-state-repository";
import {
  getAppStateSnapshot,
  getServerAppStateSnapshot,
  subscribeToAppState,
  updateStoredAppState,
} from "@/lib/storage/local-state";
import {
  AppState,
  GoalSuggestion,
  InterestRating,
  ParentSupportEntry,
} from "@/lib/types";
import {
  getActiveJourney,
  getLatestCheckIn,
  getLatestParentSupport,
  getTopInterests,
} from "@/lib/utils";

interface AppStateContextValue {
  hydrated: boolean;
  state: AppState;
  activeJourney: ReturnType<typeof getActiveJourney>;
  latestCheckIn: ReturnType<typeof getLatestCheckIn>;
  latestParentSupport: ReturnType<typeof getLatestParentSupport>;
  topInterests: ReturnType<typeof getTopInterests>;
  setInterestRatings: (ratings: InterestRating[]) => void;
  createJourney: (payload: {
    suggestion: GoalSuggestion;
    customTitle?: string;
    customDescription?: string;
    customTargetCount?: number;
    customUnit?: string;
  }) => void;
  saveCheckIn: (payload: {
    progressAdded: number;
    reflectionQuestion: string;
    childAnswer: string;
  }) => void;
  saveParentSupport: (payload: {
    summary: string;
    encouragementText: string;
    activitySuggestion: string;
  }) => ParentSupportEntry | null;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(
    subscribeToAppState,
    getAppStateSnapshot,
    getServerAppStateSnapshot,
  );
  const hydrated = true;

  const activeJourney = getActiveJourney(state);
  const latestCheckIn = getLatestCheckIn(state, activeJourney?.id ?? null);
  const latestParentSupport = getLatestParentSupport(state, activeJourney?.id ?? null);
  const topInterests = getTopInterests(state.interestRatings);

  const value: AppStateContextValue = {
    hydrated,
    state,
    activeJourney,
    latestCheckIn,
    latestParentSupport,
    topInterests,
    setInterestRatings(ratings) {
      updateStoredAppState((currentState) => setInterestRatingsInState(currentState, ratings));
    },
    createJourney(payload) {
      updateStoredAppState((currentState) =>
        createJourneyInState(currentState, {
          linkedInterest: payload.suggestion.linkedInterest,
          topInterests: getTopInterests(currentState.interestRatings),
          title: payload.customTitle?.trim() || payload.suggestion.title,
          description: payload.customDescription?.trim() || payload.suggestion.description,
          targetCount: payload.customTargetCount || payload.suggestion.targetCount,
          unit: payload.customUnit?.trim() || payload.suggestion.unit,
        }),
      );
    },
    saveCheckIn(payload) {
      if (!activeJourney) {
        return;
      }

      updateStoredAppState((currentState) =>
        saveCheckInInState(currentState, {
          journeyId: activeJourney.id,
          progressAdded: payload.progressAdded,
          reflectionQuestion: payload.reflectionQuestion,
          childAnswer: payload.childAnswer,
        }),
      );
    },
    saveParentSupport(payload) {
      if (!activeJourney) {
        return null;
      }

      let created: ParentSupportEntry | null = null;

      updateStoredAppState((currentState) => {
        const nextState = saveParentSupportInState(currentState, {
          journeyId: activeJourney.id,
          summary: payload.summary,
          encouragementText: payload.encouragementText,
          activitySuggestion: payload.activitySuggestion,
        });

        created = nextState.parentSupportEntries[nextState.parentSupportEntries.length - 1] ?? null;

        return nextState;
      });

      return created;
    },
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }

  return context;
}
