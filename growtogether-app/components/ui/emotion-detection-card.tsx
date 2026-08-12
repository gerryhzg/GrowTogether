"use client";

interface EmotionDetectionCardProps {
  emotion: string;
  suggestion: string;
}

export function EmotionDetectionCard({ emotion, suggestion }: EmotionDetectionCardProps) {
  const emotionEmojis: Record<string, string> = {
    excited: "🎉",
    frustrated: "😤",
    proud: "😊",
    unsure: "🤔",
    tired: "😴",
    curious: "🧐",
  };

  return (
    <div className="rounded-[1.5rem] bg-gradient-to-br from-pink-50 to-pink-25 p-6 shadow-sm border border-pink-100">
      <p className="text-sm uppercase tracking-[0.25em] text-pink-600">Emotion-Aware Suggestion</p>
      <div className="mt-4 flex items-start gap-4">
        <div className="text-4xl">{emotionEmojis[emotion] || "💭"}</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground capitalize">
            {emotion} feelings detected
          </h3>
          <p className="mt-2 text-foreground">{suggestion}</p>
        </div>
      </div>
    </div>
  );
}
