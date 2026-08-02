import { NextResponse } from "next/server";
import { fallbackDifficultyAdjustment } from "@/lib/ai/fallbacks";
import { generateDifficultyAdjustmentWithAI } from "@/lib/ai/deepseek";
import { DifficultyRequest, DifficultyResponse } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as DifficultyRequest;

  try {
    const result = await generateDifficultyAdjustmentWithAI(body);
    if (result?.suggestion && result?.reason) {
      return NextResponse.json<DifficultyResponse>({
        adjustment: result,
        source: "ai",
      });
    }
  } catch {
    // Fall back when AI is unavailable.
  }

  return NextResponse.json<DifficultyResponse>({
    adjustment: fallbackDifficultyAdjustment(body.journey, body.checkIns),
    source: "fallback",
  });
}
