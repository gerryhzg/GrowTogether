import { NextResponse } from "next/server";
import { fallbackParentSupport } from "@/lib/ai/fallbacks";
import { generateParentSupportWithAI } from "@/lib/ai/openai";
import { ParentSupportRequest, ParentSupportResponse } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as ParentSupportRequest;

  try {
    const result = await generateParentSupportWithAI(body);
    if (result?.encouragement && result?.activity) {
      return NextResponse.json<ParentSupportResponse>({
        encouragement: result.encouragement,
        activity: result.activity,
        source: "ai",
      });
    }
  } catch {
    // Fall back to deterministic parent support when AI is unavailable.
  }

  const fallback = fallbackParentSupport(body);

  return NextResponse.json<ParentSupportResponse>({
    encouragement: fallback.encouragement,
    activity: fallback.activity,
    source: "fallback",
  });
}
