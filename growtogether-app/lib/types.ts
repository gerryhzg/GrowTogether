export type JourneyStatus = "draft" | "active" | "completed";

export type InterestName =
  | "Music"
  | "Sports"
  | "Science"
  | "Coding"
  | "Art"
  | "Animals";

export interface InterestRating {
  interest: InterestName;
  rating: number;
}

export interface GoalSuggestion {
  title: string;
  description: string;
  targetCount: number;
  unit: string;
  linkedInterest: InterestName;
}

export interface GrowthJourney {
  id: string;
  linkedInterest: InterestName;
  topInterests: InterestName[];
  goalTitle: string;
  goalDescription: string;
  targetCount: number;
  currentCount: number;
  unit: string;
  status: JourneyStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DailyCheckIn {
  id: string;
  journeyId: string;
  date: string;
  progressAdded: number;
  reflectionQuestion: string;
  childAnswer: string;
}

export interface ParentSupportEntry {
  id: string;
  journeyId: string;
  date: string;
  summary: string;
  encouragementText: string;
  activitySuggestion: string;
}

export type HistoryEntryType =
  | "journey-created"
  | "check-in"
  | "parent-support"
  | "journey-completed";

export interface HistoryEntry {
  id: string;
  journeyId: string;
  date: string;
  type: HistoryEntryType;
  title: string;
  detail: string;
  progressSnapshot: number;
}

export interface AppState {
  activeJourneyId: string | null;
  interestRatings: InterestRating[];
  journeys: GrowthJourney[];
  checkIns: DailyCheckIn[];
  parentSupportEntries: ParentSupportEntry[];
  historyEntries: HistoryEntry[];
}

export interface GoalSuggestionRequest {
  interests: InterestRating[];
}

export interface GoalSuggestionResponse {
  goals: GoalSuggestion[];
  source: "ai" | "fallback";
}

export interface ReflectionRequest {
  journey: GrowthJourney;
  progressAdded: number;
}

export interface ReflectionResponse {
  question: string;
  source: "ai" | "fallback";
}

export interface ParentSummaryRequest {
  journey: GrowthJourney;
  latestCheckIn: DailyCheckIn | null;
}

export interface ParentSummaryResponse {
  summary: string;
  source: "ai" | "fallback";
}

export interface ParentSupportRequest {
  journey: GrowthJourney;
  latestCheckIn: DailyCheckIn | null;
  summary: string;
}

export interface ParentSupportResponse {
  encouragement: string;
  activity: string;
  source: "ai" | "fallback";
}
