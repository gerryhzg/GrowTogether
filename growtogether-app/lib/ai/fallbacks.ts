import {
  DailyCheckIn,
  GoalSuggestion,
  GrowthJourney,
  InterestRating,
  ParentSupportRequest,
  CoachScore,
  DifficultyAdjustment,
  EmotionDetection,
  WeeklyHighlight,
  MessageSafetyCheck,
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

// Feature 1: Fallback Coach Score
export function fallbackCoachScore(checkIns: DailyCheckIn[]): CoachScore {
  const consistency = checkIns.length >= 3 ? "Consistency: Strong" : checkIns.length >= 1 ? "Consistency: Building" : "Consistency: Just starting";
  const reflectionDepth = "Reflection depth: Growing";
  const motivation = "Motivation: Energized";
  
  return { consistency, reflectionDepth, motivation };
}

// Feature 2: Fallback Difficulty Adjustment
export function fallbackDifficultyAdjustment(journey: GrowthJourney, checkIns: DailyCheckIn[]): DifficultyAdjustment | null {
  const progress = journey.currentCount / Math.max(1, journey.targetCount);
  
  if (checkIns.length < 2) {
    return null;
  }
  
  if (progress > 0.8) {
    return {
      suggestion: "This goal may be too easy. Try increasing the target by 50%.",
      reason: "The child is progressing quickly toward the target."
    };
  }
  
  if (progress < 0.2 && checkIns.length > 5) {
    return {
      suggestion: "This goal may be too challenging. Consider breaking it into smaller steps.",
      reason: "The child is progressing slower than expected."
    };
  }
  
  return null;
}

// Feature 3: Fallback Emotion Detection
export function fallbackEmotionDetection(reflection: string): EmotionDetection {
  const lower = reflection.toLowerCase();
  
  if (lower.includes("frustrated") || lower.includes("hard") || lower.includes("difficult")) {
    return {
      emotion: "frustrated",
      suggestion: "Praise persistence: 'I see how hard you're trying. Every effort counts.'"
    };
  }
  
  if (lower.includes("proud") || lower.includes("amazing") || lower.includes("great")) {
    return {
      emotion: "proud",
      suggestion: "Celebrate progress: 'Look at what you've accomplished! You should feel proud.'"
    };
  }
  
  if (lower.includes("curious") || lower.includes("wonder") || lower.includes("interesting")) {
    return {
      emotion: "curious",
      suggestion: "Suggest exploring: 'Let's dive deeper into this together next time.'"
    };
  }
  
  if (lower.includes("tired") || lower.includes("hard") || lower.includes("stuck")) {
    return {
      emotion: "tired",
      suggestion: "Offer encouragement: 'Rest when you need to, and we'll keep going together.'"
    };
  }
  
  if (lower.includes("excited") || lower.includes("fun") || lower.includes("love")) {
    return {
      emotion: "excited",
      suggestion: "Share enthusiasm: 'Your excitement is wonderful! Let's keep this momentum.'"
    };
  }
  
  return {
    emotion: "unsure",
    suggestion: "Offer support: 'I'm here to help. Let's figure this out together.'"
  };
}

// Feature 4: Fallback Next Step
export function fallbackNextStep(journey: GrowthJourney): string {
  const progress = journey.currentCount / Math.max(1, journey.targetCount);
  
  if (progress < 0.25) {
    return `Start with a small step toward ${journey.goalTitle}—even 10 minutes today would be wonderful.`;
  }
  
  if (progress < 0.5) {
    return `Keep the momentum going. Try one more session toward ${journey.goalTitle} this week.`;
  }
  
  if (progress < 0.75) {
    return `You're halfway there! Ask your parent to help with the tricky parts of ${journey.goalTitle}.`;
  }
  
  return `You're so close! One more push to finish ${journey.goalTitle}.`;
}

// Feature 5: Fallback Weekly Highlights
export function fallbackWeeklyHighlights(checkInCount: number, totalProgress: number, journey: GrowthJourney): WeeklyHighlight[] {
  if (checkInCount === 0) {
    return [];
  }
  
  const now = new Date().toISOString();
  const highlights: WeeklyHighlight[] = [];
  
  if (checkInCount >= 3) {
    highlights.push({
      weekStart: now,
      highlight: `This week, you checked in ${checkInCount} times and made ${totalProgress} progress on ${journey.goalTitle}. That's wonderful consistency!`
    });
  } else if (checkInCount === 1) {
    highlights.push({
      weekStart: now,
      highlight: `You took your first step on ${journey.goalTitle}! Every beginning is important.`
    });
  }
  
  return highlights;
}

// Feature 6: Fallback Styled Reflection
export function fallbackStyledReflection(journey: GrowthJourney, progressAdded: number, style: string): string {
  const styles: Record<string, string> = {
    fun: `What part of ${journey.goalTitle} felt like a game today?`,
    thoughtful: `What did you learn about yourself while working on ${journey.goalTitle}?`,
    short: `How did it feel?`,
    creative: `If you could draw your progress, what colors would you use?`,
    "challenge-based": `What was the hardest part, and how did you handle it?`,
  };
  
  return styles[style] || `What did you feel while working on ${journey.goalTitle}?`;
}

// Feature 7: Fallback Goal Explanation
export function fallbackGoalExplanation(goal: GoalSuggestion, topInterests: InterestRating[]): string {
  const matchedInterest = topInterests.find(i => i.interest === goal.linkedInterest);
  const rating = matchedInterest ? `(${matchedInterest.rating}/5)` : "";
  
  return `This goal matches ${goal.linkedInterest} ${rating} because it builds on your interests and helps you grow in this area.`;
}

// Feature 8: Achievement Badges (calculation in utils)
// Feature 9: Streak calculation in utils

// Feature 10: Fallback Safety Check
export function fallbackSafetyCheck(message: string): MessageSafetyCheck {
  const lower = message.toLowerCase();
  
  // Check for swear words and offensive language
  const badWords = [
    "fuck", "shit", "bitch", "bastard", "asshole", "damn", "crap",
    "motherfucker", "idiot", "stupid", "dumbass", "loser"
  ];
  const hasBadWords = badWords.some(word => lower.includes(word));

  // Check for harsh discouraging words
  const harshWords = ["lazy", "failure", "give up", "never", "pathetic", "worthless", "useless", "hopeless"];
  const isHarsh = harshWords.some(word => lower.includes(word));
  
  if (hasBadWords || isHarsh) {
    return {
      isSafe: false,
      suggestion: "This message isn't suitable for a child. Try: 'I believe in you, and I'm so proud of the effort you're putting in. Keep going!'"
    };
  }
  
  return {
    isSafe: true,
    suggestion: null
  };
}
