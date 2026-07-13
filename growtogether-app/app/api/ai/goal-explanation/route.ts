import { NextResponse } from "next/server";
import { fallbackGoalExplanation } from "@/lib/ai/fallbacks";
import { generateGoalExplanationWithAI } from "@/lib/ai/deepseek";
import { ExplanationRequest, ExplanationResponse } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as ExplanationRequest;

  try {
    const result = await generateGoalExplanationWithAI(body);
    if (result?.explanation) {
      return NextResponse.json<ExplanationResponse>({
        explanation: result.explanation,
        source: "ai",
      });
    }
  } catch {
    // Fall back when AI is unavailable.
  }

  return NextResponse.json<ExplanationResponse>({
    explanation: fallbackGoalExplanation(body.goal, body.interests),
    source: "fallback",
  });
}
