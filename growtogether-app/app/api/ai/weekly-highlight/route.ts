import { NextResponse } from "next/server";
import { fallbackWeeklyHighlights } from "@/lib/ai/fallbacks";
import { generateWeeklyHighlightsWithAI } from "@/lib/ai/openai";
import { HighlightRequest, HighlightResponse } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as HighlightRequest;

  try {
    const result = await generateWeeklyHighlightsWithAI(body);
    if (result?.highlights) {
      return NextResponse.json<HighlightResponse>({
        highlights: result.highlights,
        source: "ai",
      });
    }
  } catch {
    // Fall back when AI is unavailable.
  }

  const totalProgress = body.checkIns.reduce((sum, c) => sum + c.progressAdded, 0);
  const journey = { goalTitle: "", linkedInterest: "", unit: "" } as any;
  
  // Try to get journey details from history entries
  const journeyCreateEntry = body.historyEntries.find(e => e.type === "journey-created");
  if (journeyCreateEntry) {
    const parts = journeyCreateEntry.detail.split(": ");
    if (parts.length === 2) {
      journey.linkedInterest = parts[0];
      journey.goalTitle = parts[1];
    }
  }

  return NextResponse.json<HighlightResponse>({
    highlights: fallbackWeeklyHighlights(body.checkIns.length, totalProgress, journey),
    source: "fallback",
  });
}
