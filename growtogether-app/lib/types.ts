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

// Feature 1: AI Growth Coach Score
export interface CoachScore {
  consistency: string;
  reflectionDepth: string;
  motivation: string;
}

export interface CoachScoreRequest {
  journey: GrowthJourney;
  checkIns: DailyCheckIn[];
  currentCheckInAnswer: string;
}

export interface CoachScoreResponse {
  score: CoachScore;
  source: "ai" | "fallback";
}

// Feature 2: Smart Goal Difficulty Adjustment
export interface DifficultyAdjustment {
  suggestion: string;
  reason: string;
}

export interface DifficultyRequest {
  journey: GrowthJourney;
  checkIns: DailyCheckIn[];
}

export interface DifficultyResponse {
  adjustment: DifficultyAdjustment | null;
  source: "ai" | "fallback";
}

// Feature 3: Emotion-Aware Parent Suggestions
export type EmotionType = "excited" | "frustrated" | "proud" | "unsure" | "tired" | "curious";

export interface EmotionDetection {
  emotion: EmotionType;
  suggestion: string;
}

export interface EmotionRequest {
  childReflection: string;
}

export interface EmotionResponse {
  detection: EmotionDetection;
  source: "ai" | "fallback";
}

// Feature 4: AI Next Best Step Recommendation
export interface NextStepRequest {
  journey: GrowthJourney;
  latestCheckIn: DailyCheckIn | null;
}

export interface NextStepResponse {
  step: string;
  source: "ai" | "fallback";
}

// Feature 5: Growth Memory Timeline with AI Highlights
export interface WeeklyHighlight {
  weekStart: string;
  highlight: string;
}

export interface HighlightRequest {
  journeyId: string;
  historyEntries: HistoryEntry[];
  checkIns: DailyCheckIn[];
}

export interface HighlightResponse {
  highlights: WeeklyHighlight[];
  source: "ai" | "fallback";
}

// Feature 6: Personalized Reflection Question Styles
export type ReflectionStyle = "fun" | "thoughtful" | "short" | "creative" | "challenge-based";

export interface StyledReflectionRequest {
  journey: GrowthJourney;
  progressAdded: number;
  style: ReflectionStyle;
}

export interface StyledReflectionResponse {
  question: string;
  source: "ai" | "fallback";
}

// Feature 7: Goal Recommendation Explanation
export interface GoalExplanation {
  explanation: string;
}

export interface ExplanationRequest {
  goal: GoalSuggestion;
  interests: InterestRating[];
}

export interface ExplanationResponse {
  explanation: string;
  source: "ai" | "fallback";
}

// Feature 8: Achievement Badges
export type BadgeType = "first-goal" | "streak-3" | "halfway" | "parent-sent" | "goal-completed";

export interface Badge {
  id: BadgeType;
  title: string;
  description: string;
  unlockedAt: string | null;
}

// Feature 9: Streak and Consistency Predictor
export interface StreakInfo {
  currentStreak: number;
  estimatedCompletionDate: string | null;
  completionDaysRemaining: number | null;
}

// Feature 10: AI Safety Filter for Parent Messages
export interface MessageSafetyCheck {
  isSafe: boolean;
  suggestion: string | null;
}

export interface SafetyCheckRequest {
  message: string;
}

export interface SafetyCheckResponse {
  check: MessageSafetyCheck;
  source: "ai" | "fallback";
}
