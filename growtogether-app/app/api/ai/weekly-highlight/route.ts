import { NextResponse } from "next/server";
import { fallbackWeeklyHighlights } from "@/lib/ai/fallbacks";
import { generateWeeklyHighlightsWithAI } from "@/lib/ai/deepseek";
import {
  GrowthJourney,
  HighlightRequest,
  HighlightResponse,
  InterestName,
} from "@/lib/types";

function isInterestName(value: string): value is InterestName {
  return (
    value === "Music" ||
    value === "Sports" ||
    value === "Science" ||
    value === "Coding" ||
    value === "Art" ||
    value === "Animals"
  );
}

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
  const journey: GrowthJourney = {
    id: body.journeyId,
    linkedInterest: "Coding",
    topInterests: [],
    goalTitle: "your journey",
    goalDescription: "",
    targetCount: Math.max(1, totalProgress),
    currentCount: totalProgress,
    unit: "steps",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  // Try to get journey details from history entries
  const journeyCreateEntry = body.historyEntries.find(e => e.type === "journey-created");
  if (journeyCreateEntry) {
    const parts = journeyCreateEntry.detail.split(": ");
    if (parts.length === 2) {
      if (isInterestName(parts[0])) {
        journey.linkedInterest = parts[0];
      }
      journey.goalTitle = parts[1];
    }
  }

  return NextResponse.json<HighlightResponse>({
    highlights: fallbackWeeklyHighlights(body.checkIns.length, totalProgress, journey),
    source: "fallback",
  });
}
