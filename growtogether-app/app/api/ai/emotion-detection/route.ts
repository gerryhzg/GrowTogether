import { NextResponse } from "next/server";
import { fallbackEmotionDetection } from "@/lib/ai/fallbacks";
import { generateEmotionDetectionWithAI } from "@/lib/ai/deepseek";
import { EmotionRequest, EmotionResponse } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as EmotionRequest;

  try {
    const result = await generateEmotionDetectionWithAI(body);
    if (result?.emotion && result?.suggestion) {
      return NextResponse.json<EmotionResponse>({
        detection: result,
        source: "ai",
      });
    }
  } catch {
    // Fall back when AI is unavailable.
  }

  return NextResponse.json<EmotionResponse>({
    detection: fallbackEmotionDetection(body.childReflection),
    source: "fallback",
  });
}
