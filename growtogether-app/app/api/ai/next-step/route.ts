import { NextResponse } from "next/server";
import { fallbackNextStep } from "@/lib/ai/fallbacks";
import { generateNextStepWithAI } from "@/lib/ai/openai";
import { NextStepRequest, NextStepResponse } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as NextStepRequest;

  try {
    const result = await generateNextStepWithAI(body);
    if (result?.step) {
      return NextResponse.json<NextStepResponse>({
        step: result.step,
        source: "ai",
      });
    }
  } catch {
    // Fall back when AI is unavailable.
  }

  return NextResponse.json<NextStepResponse>({
    step: fallbackNextStep(body.journey),
    source: "fallback",
  });
}
