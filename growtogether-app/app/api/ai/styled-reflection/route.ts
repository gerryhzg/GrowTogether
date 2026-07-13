import { NextResponse } from "next/server";
import { fallbackStyledReflection } from "@/lib/ai/fallbacks";
import { generateStyledReflectionWithAI } from "@/lib/ai/deepseek";
import { StyledReflectionRequest, StyledReflectionResponse } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as StyledReflectionRequest;

  try {
    const result = await generateStyledReflectionWithAI(body);
    if (result?.question) {
      return NextResponse.json<StyledReflectionResponse>({
        question: result.question,
        source: "ai",
      });
    }
  } catch {
    // Fall back when AI is unavailable.
  }

  return NextResponse.json<StyledReflectionResponse>({
    question: fallbackStyledReflection(body.journey, body.progressAdded, body.style),
    source: "fallback",
  });
}
