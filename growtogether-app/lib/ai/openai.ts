import OpenAI from "openai";
import {
  GoalSuggestion,
  GoalSuggestionRequest,
  ParentSupportRequest,
  ReflectionRequest,
  CoachScoreRequest,
  DifficultyRequest,
  EmotionRequest,
  NextStepRequest,
  HighlightRequest,
  StyledReflectionRequest,
  ExplanationRequest,
  SafetyCheckRequest,
} from "@/lib/types";

let cachedClient: OpenAI | null = null;

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return cachedClient;
}

async function createStructuredJson(prompt: string) {
  const client = getClient();

  if (!client) {
    return null;
  }

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content:
          "You create warm, child-friendly structured JSON for a parent-child growth journey app. Return only valid JSON and no markdown.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return response.output_text;
}

export async function generateGoalsWithAI(payload: GoalSuggestionRequest) {
  const topInterests = payload.interests
    .sort((left, right) => right.rating - left.rating)
    .slice(0, 3)
    .map((entry) => `${entry.interest} (${entry.rating}/5)`)
    .join(", ");

  const text = await createStructuredJson(`Return JSON with shape {"goals":[{"title":"","description":"","targetCount":number,"unit":"","linkedInterest":""}]}. Create 3 to 5 goal ideas based on these ranked interests: ${topInterests}. Linked interest must exactly match one of the provided interest names. Keep titles concrete and descriptions supportive.`);

  return parseGoals(text);
}

export async function generateReflectionWithAI(payload: ReflectionRequest) {
  const text = await createStructuredJson(`Return JSON with shape {"question":""}. Create one short reflection question for a child who added ${payload.progressAdded} ${payload.journey.unit} toward "${payload.journey.goalTitle}" in ${payload.journey.linkedInterest}.`);
  const parsed = safeJsonParse(text);

  if (!parsed || typeof parsed.question !== "string") {
    return null;
  }

  return { question: parsed.question };
}

export async function generateParentSummaryWithAI(payload: {
  journeyTitle: string;
  linkedInterest: string;
  unit: string;
  latestCheckInAnswer: string;
  latestProgressAdded: number | null;
}) {
  const text = await createStructuredJson(`Return JSON with shape {"summary":""}. Write a short summary for a parent. Goal: "${payload.journeyTitle}". Interest: ${payload.linkedInterest}. Latest progress added: ${payload.latestProgressAdded ?? 0} ${payload.unit}. Latest child reflection: "${payload.latestCheckInAnswer || "No answer yet."}"`);
  const parsed = safeJsonParse(text);

  if (!parsed || typeof parsed.summary !== "string") {
    return null;
  }

  return { summary: parsed.summary };
}

export async function generateParentSupportWithAI(payload: ParentSupportRequest) {
  const text = await createStructuredJson(`Return JSON with shape {"encouragement":"","activity":""}. Create one warm encouragement message and one shared parent-child activity idea for the journey "${payload.journey.goalTitle}" in ${payload.journey.linkedInterest}. Parent summary: "${payload.summary}". Child reflection: "${payload.latestCheckIn?.childAnswer ?? "No reflection yet."}"`);
  const parsed = safeJsonParse(text);

  if (
    !parsed ||
    typeof parsed.encouragement !== "string" ||
    typeof parsed.activity !== "string"
  ) {
    return null;
  }

  return {
    encouragement: parsed.encouragement,
    activity: parsed.activity,
  };
}

function parseGoals(text: string | null): { goals: GoalSuggestion[] } | null {
  const parsed = safeJsonParse(text);

  if (!parsed || !Array.isArray(parsed.goals)) {
    return null;
  }

  const goals = parsed.goals.filter(isGoalSuggestion);
  if (goals.length === 0) {
    return null;
  }

  return { goals };
}

function isGoalSuggestion(value: unknown): value is GoalSuggestion {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const goal = value as Record<string, unknown>;

  return (
    typeof goal.title === "string" &&
    typeof goal.description === "string" &&
    typeof goal.targetCount === "number" &&
    typeof goal.unit === "string" &&
    typeof goal.linkedInterest === "string"
  );
}

function safeJsonParse(text: string | null) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// Feature 1: AI Growth Coach Score
export async function generateCoachScoreWithAI(payload: CoachScoreRequest) {
  const recentCheckIns = payload.checkIns.slice(-5);
  const checkInCount = payload.checkIns.length;
  
  const text = await createStructuredJson(`Return JSON with shape {"consistency":"","reflectionDepth":"","motivation":""}. Analyze this journey and check-ins:
Goal: "${payload.journey.goalTitle}" (${payload.journey.currentCount}/${payload.journey.targetCount})
Check-ins count: ${checkInCount}
Latest reflection: "${payload.currentCheckInAnswer}"
Create 3 scores (one sentence each): consistency (is child showing regular progress?), reflectionDepth (is child thinking deeply?), motivation (does child seem motivated?).`);
  
  const parsed = safeJsonParse(text);
  if (!parsed || typeof parsed.consistency !== "string" || typeof parsed.reflectionDepth !== "string" || typeof parsed.motivation !== "string") {
    return null;
  }
  
  return { consistency: parsed.consistency, reflectionDepth: parsed.reflectionDepth, motivation: parsed.motivation };
}

// Feature 2: Smart Goal Difficulty Adjustment
export async function generateDifficultyAdjustmentWithAI(payload: DifficultyRequest) {
  const pace = payload.journey.currentCount / Math.max(1, payload.checkIns.length);
  const daysActive = payload.checkIns.length;
  
  const text = await createStructuredJson(`Return JSON with shape {"suggestion":"","reason":""}. Analyze this goal difficulty:
Goal: "${payload.journey.goalTitle}" - Target: ${payload.journey.targetCount}, Current: ${payload.journey.currentCount}
Check-ins: ${daysActive}, Average pace: ${pace.toFixed(1)} ${payload.journey.unit}/check-in
Suggest if the goal is too easy, too hard, or just right with specific adjustment advice.`);
  
  const parsed = safeJsonParse(text);
  if (!parsed || typeof parsed.suggestion !== "string" || typeof parsed.reason !== "string") {
    return null;
  }
  
  return { suggestion: parsed.suggestion, reason: parsed.reason };
}

// Feature 3: Emotion-Aware Parent Suggestions
export async function generateEmotionDetectionWithAI(payload: EmotionRequest) {
  const text = await createStructuredJson(`Return JSON with shape {"emotion":"","suggestion":""}. Analyze child reflection:
"${payload.childReflection}"
Detect emotion (excited, frustrated, proud, unsure, tired, or curious). Then suggest one parent response tailored to this emotion.`);
  
  const parsed = safeJsonParse(text);
  if (!parsed || typeof parsed.emotion !== "string" || typeof parsed.suggestion !== "string") {
    return null;
  }
  
  return { emotion: parsed.emotion, suggestion: parsed.suggestion };
}

// Feature 4: AI Next Best Step Recommendation
export async function generateNextStepWithAI(payload: NextStepRequest) {
  const progress = payload.journey.currentCount / Math.max(1, payload.journey.targetCount);
  
  const text = await createStructuredJson(`Return JSON with shape {"step":""}. Suggest one concrete next step for this journey:
Goal: "${payload.journey.goalTitle}" (${progress * 100}% complete)
Interest: ${payload.journey.linkedInterest}
Latest check-in: ${payload.latestCheckIn ? `+${payload.latestCheckIn.progressAdded} ${payload.journey.unit}` : "none yet"}
Suggest a specific action the child can do next.`);
  
  const parsed = safeJsonParse(text);
  if (!parsed || typeof parsed.step !== "string") {
    return null;
  }
  
  return { step: parsed.step };
}

// Feature 5: Growth Memory Timeline with AI Highlights
export async function generateWeeklyHighlightsWithAI(payload: HighlightRequest) {
  if (payload.historyEntries.length === 0) {
    return { highlights: [] };
  }
  
  const checkInCount = payload.checkIns.length;
  const totalProgress = payload.checkIns.reduce((sum, c) => sum + c.progressAdded, 0);
  
  const text = await createStructuredJson(`Return JSON with shape {"highlights":[{"weekStart":"","highlight":""}]}. Generate 1-2 AI highlights from this journey history:
Total check-ins: ${checkInCount}
Total progress: ${totalProgress}
Recent entries: ${payload.historyEntries.slice(0, 5).map(e => e.title).join(", ")}
Create uplifting, specific weekly highlights that celebrate the child's effort.`);
  
  const parsed = safeJsonParse(text);
  if (!parsed || !Array.isArray(parsed.highlights)) {
    return null;
  }
  
  return { highlights: parsed.highlights as any[] };
}

// Feature 6: Personalized Reflection Question Styles
export async function generateStyledReflectionWithAI(payload: StyledReflectionRequest) {
  const styleGuides: Record<string, string> = {
    fun: "Make it playful and game-like.",
    thoughtful: "Encourage deep thinking and introspection.",
    short: "Keep it to one simple sentence.",
    creative: "Ask them to imagine or create something.",
    "challenge-based": "Ask them to reflect on what was hard and how they can improve.",
  };
  
  const text = await createStructuredJson(`Return JSON with shape {"question":""}. Create one reflection question in a ${payload.style} style. ${styleGuides[payload.style] || ""}
Goal: "${payload.journey.goalTitle}" in ${payload.journey.linkedInterest}
Progress: +${payload.progressAdded} ${payload.journey.unit}`);
  
  const parsed = safeJsonParse(text);
  if (!parsed || typeof parsed.question !== "string") {
    return null;
  }
  
  return { question: parsed.question };
}

// Feature 7: Goal Recommendation Explanation
export async function generateGoalExplanationWithAI(payload: ExplanationRequest) {
  const topRatedInterests = payload.interests
    .filter(i => i.interest === payload.goal.linkedInterest)
    .map(i => `${i.interest} (${i.rating}/5)`)
    .join(", ");
  
  const text = await createStructuredJson(`Return JSON with shape {"explanation":""}. Explain why this goal matches the child:
Goal: "${payload.goal.title}"
Interest: ${payload.goal.linkedInterest}
Rating for this interest: ${topRatedInterests || "not rated"}
Write 1-2 sentences explaining the connection.`);
  
  const parsed = safeJsonParse(text);
  if (!parsed || typeof parsed.explanation !== "string") {
    return null;
  }
  
  return { explanation: parsed.explanation };
}

// Feature 10: AI Safety Filter for Parent Messages
export async function generateSafetyCheckWithAI(payload: SafetyCheckRequest) {
  const text = await createStructuredJson(`You are a child safety filter for a family app. A parent is writing an encouragement message to their child.

Check this message strictly:
"${payload.message}"

Mark isSafe as FALSE if the message contains ANY of the following:
- Swear words, profanity, or offensive language (e.g. fuck, bitch, shit, damn, ass, hell used offensively)
- Insults or name-calling
- Harsh or discouraging language
- Anything that could hurt a child emotionally

If isSafe is false, provide a kind, warm rewrite as the suggestion.
If the message is genuinely warm and supportive, set isSafe to true and suggestion to null.

Return ONLY valid JSON with this exact shape: {"isSafe": boolean, "suggestion": string | null}`);
  
  const parsed = safeJsonParse(text);
  if (!parsed) {
    return null;
  }
  
  return {
    isSafe: parsed.isSafe === true,
    suggestion: typeof parsed.suggestion === "string" ? parsed.suggestion : null,
  };
}
