import OpenAI from "openai";
import {
  GoalSuggestion,
  GoalSuggestionRequest,
  ParentSupportRequest,
  ReflectionRequest,
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
