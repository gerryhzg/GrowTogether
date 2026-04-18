import { NextResponse } from "next/server";
import { fallbackReflectionQuestion } from "@/lib/ai/fallbacks";
import { generateReflectionWithAI } from "@/lib/ai/openai";
import { ReflectionRequest, ReflectionResponse } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as ReflectionRequest;

  try {
    const result = await generateReflectionWithAI(body);
    if (result?.question) {
      return NextResponse.json<ReflectionResponse>({
        question: result.question,
        source: "ai",
      });
    }
  } catch {
    // Fall back to a deterministic reflection question when AI is unavailable.
  }

  return NextResponse.json<ReflectionResponse>({
    question: fallbackReflectionQuestion(body.journey, body.progressAdded),
    source: "fallback",
  });
}
