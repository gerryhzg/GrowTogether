import { AppState, InterestName } from "@/lib/types";

export const INTEREST_OPTIONS: InterestName[] = [
  "Music",
  "Sports",
  "Science",
  "Coding",
  "Art",
  "Animals",
];

export const STORAGE_KEY = "growtogether.app-state.v1";

export const EMPTY_STATE: AppState = {
  activeJourneyId: null,
  interestRatings: [],
  journeys: [],
  checkIns: [],
  parentSupportEntries: [],
  historyEntries: [],
};
