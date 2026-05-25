import { NextResponse } from "next/server";
import { fallbackSafetyCheck } from "@/lib/ai/fallbacks";
import { generateSafetyCheckWithAI } from "@/lib/ai/openai";
import { SafetyCheckRequest, SafetyCheckResponse } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as SafetyCheckRequest;

  try {
    const result = await generateSafetyCheckWithAI(body);
    if (result?.isSafe !== undefined) {
      return NextResponse.json<SafetyCheckResponse>({
        check: result,
        source: "ai",
      });
    }
  } catch {
    // Fall back when AI is unavailable.
  }

  return NextResponse.json<SafetyCheckResponse>({
    check: fallbackSafetyCheck(body.message),
    source: "fallback",
  });
}
