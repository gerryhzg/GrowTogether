import { NextResponse } from "next/server";
import { fallbackCoachScore } from "@/lib/ai/fallbacks";
import { generateCoachScoreWithAI } from "@/lib/ai/openai";
import { CoachScoreRequest, CoachScoreResponse } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as CoachScoreRequest;

  try {
    const result = await generateCoachScoreWithAI(body);
    if (result?.consistency && result?.reflectionDepth && result?.motivation) {
      return NextResponse.json<CoachScoreResponse>({
        score: result,
        source: "ai",
      });
    }
  } catch {
    // Fall back to deterministic coach score when AI is unavailable.
  }

  return NextResponse.json<CoachScoreResponse>({
    score: fallbackCoachScore(body.checkIns),
    source: "fallback",
  });
}
