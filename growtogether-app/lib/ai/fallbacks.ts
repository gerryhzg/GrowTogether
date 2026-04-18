import {
  DailyCheckIn,
  GoalSuggestion,
  GrowthJourney,
  InterestRating,
  ParentSupportRequest,
} from "@/lib/types";
import { rankInterests } from "@/lib/utils";

const goalBank: Record<string, Omit<GoalSuggestion, "linkedInterest">[]> = {
  Music: [
    {
      title: "Practice piano 15 times",
      description: "Build a steady music habit with short, focused practice sessions.",
      targetCount: 15,
      unit: "sessions",
    },
    {
      title: "Learn 3 family sing-along songs",
      description: "Choose songs you love and grow confidence performing them together.",
      targetCount: 3,
      unit: "songs",
    },
  ],
  Sports: [
    {
      title: "Complete 12 active training days",
      description: "Build strength and confidence through short daily movement goals.",
      targetCount: 12,
      unit: "days",
    },
    {
      title: "Practice ball skills 20 times",
      description: "Use repeated practice to make coordination feel more natural.",
      targetCount: 20,
      unit: "sessions",
    },
  ],
  Science: [
    {
      title: "Finish 4 science experiments",
      description: "Turn curiosity into hands-on discovery with a new experiment each week.",
      targetCount: 4,
      unit: "experiments",
    },
    {
      title: "Keep a 10-day nature notebook",
      description: "Observe the world closely and record one scientific detail each day.",
      targetCount: 10,
      unit: "entries",
    },
  ],
  Coding: [
    {
      title: "Complete 5 coding lessons",
      description: "Build momentum by finishing short coding lessons that unlock small wins.",
      targetCount: 5,
      unit: "lessons",
    },
    {
      title: "Create 3 mini games",
      description: "Turn ideas into playful code projects that feel exciting to share.",
      targetCount: 3,
      unit: "games",
    },
  ],
  Art: [
    {
      title: "Make 8 art pieces",
      description: "Try new techniques and watch your creative confidence grow.",
      targetCount: 8,
      unit: "pieces",
    },
    {
      title: "Fill 12 sketchbook pages",
      description: "Practice little and often so art feels playful instead of pressured.",
      targetCount: 12,
      unit: "pages",
    },
  ],
  Animals: [
    {
      title: "Learn about 6 animals",
      description: "Pick favorite animals and discover what makes each one unique.",
      targetCount: 6,
      unit: "animals",
    },
    {
      title: "Complete 5 animal care activities",
      description: "Turn kindness and curiosity into hands-on care habits.",
      targetCount: 5,
      unit: "activities",
    },
  ],
};

export function fallbackGoalSuggestions(interests: InterestRating[]) {
  const ranked = rankInterests(interests);
  const suggestions: GoalSuggestion[] = ranked.slice(0, 3).flatMap((entry) => {
    return (goalBank[entry.interest] ?? []).map((goal) => ({
      ...goal,
      linkedInterest: entry.interest,
    }));
  });

  return suggestions.slice(0, 5);
}

export function fallbackReflectionQuestion(journey: GrowthJourney, progressAdded: number) {
  return `You added ${progressAdded} ${journey.unit} toward ${journey.goalTitle}. What part of that felt most exciting or challenging today?`;
}

export function fallbackParentSummary(
  journey: GrowthJourney,
  latestCheckIn: DailyCheckIn | null,
) {
  if (!latestCheckIn) {
    return `The child has started a ${journey.linkedInterest.toLowerCase()} journey called "${journey.goalTitle}" and is ready for steady encouragement as they begin.`;
  }

  return `The child is working on "${journey.goalTitle}" in ${journey.linkedInterest.toLowerCase()}. Today they added ${latestCheckIn.progressAdded} ${journey.unit} and shared: "${latestCheckIn.childAnswer}".`;
}

export function fallbackParentSupport({
  journey,
  latestCheckIn,
}: ParentSupportRequest) {
  const encouragement = latestCheckIn
    ? `I noticed how you kept going with ${journey.goalTitle}. I am proud of the effort you showed today.`
    : `I love that you started this ${journey.linkedInterest.toLowerCase()} journey. I am excited to grow alongside you.`;

  const activity = `Plan one short ${journey.linkedInterest.toLowerCase()} activity together this week that supports ${journey.goalTitle}.`;

  return { encouragement, activity };
}
