import { NextResponse } from "next/server";
import { fallbackParentSummary } from "@/lib/ai/fallbacks";
import { generateParentSummaryWithAI } from "@/lib/ai/deepseek";
import { ParentSummaryRequest, ParentSummaryResponse } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as ParentSummaryRequest;

  try {
    const result = await generateParentSummaryWithAI({
      journeyTitle: body.journey.goalTitle,
      linkedInterest: body.journey.linkedInterest,
      unit: body.journey.unit,
      latestCheckInAnswer: body.latestCheckIn?.childAnswer ?? "",
      latestProgressAdded: body.latestCheckIn?.progressAdded ?? null,
    });
    if (result?.summary) {
      return NextResponse.json<ParentSummaryResponse>({
        summary: result.summary,
        source: "ai",
      });
    }
  } catch {
    // Fall back to a deterministic parent summary when AI is unavailable.
  }

  return NextResponse.json<ParentSummaryResponse>({
    summary: fallbackParentSummary(body.journey, body.latestCheckIn),
    source: "fallback",
  });
}
