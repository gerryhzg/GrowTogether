import { NextResponse } from "next/server";
import { fallbackGoalSuggestions } from "@/lib/ai/fallbacks";
import { generateGoalsWithAI } from "@/lib/ai/deepseek";
import { GoalSuggestionRequest, GoalSuggestionResponse } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as GoalSuggestionRequest;

  try {
    const result = await generateGoalsWithAI(body);
    if (result?.goals?.length) {
      return NextResponse.json<GoalSuggestionResponse>({
        goals: result.goals,
        source: "ai",
      });
    }
  } catch {
    // Fall back to deterministic goal suggestions when AI is unavailable.
  }

  return NextResponse.json<GoalSuggestionResponse>({
    goals: fallbackGoalSuggestions(body.interests),
    source: "fallback",
  });
}
