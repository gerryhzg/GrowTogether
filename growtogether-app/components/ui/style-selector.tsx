"use client";

import { ReflectionStyle } from "@/lib/types";

interface StyleSelectorProps {
  selectedStyle: ReflectionStyle;
  onStyleSelect: (style: ReflectionStyle) => void;
}

const STYLES: { value: ReflectionStyle; label: string; description: string }[] = [
  { value: "fun", label: "🎮 Fun", description: "Playful and game-like" },
  { value: "thoughtful", label: "🤔 Thoughtful", description: "Deep and reflective" },
  { value: "short", label: "⚡ Short", description: "Quick and simple" },
  { value: "creative", label: "🎨 Creative", description: "Imaginative and expressive" },
  { value: "challenge-based", label: "🏆 Challenge", description: "Growth-focused" },
];

export function StyleSelector({ selectedStyle, onStyleSelect }: StyleSelectorProps) {
  return (
    <div className="rounded-[1.5rem] bg-white/75 p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.25em] text-muted">How do you want to reflect?</p>
      <p className="mt-2 text-sm text-foreground">Choose a reflection style that feels right for you today.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {STYLES.map((style) => (
          <button
            key={style.value}
            onClick={() => onStyleSelect(style.value)}
            className={`rounded-[1.25rem] p-3 transition-all ${
              selectedStyle === style.value
                ? "bg-accent text-white shadow-md"
                : "bg-gray-50 text-foreground hover:bg-gray-100 border border-border"
            }`}
          >
            <p className="font-semibold text-sm">{style.label}</p>
            <p className="mt-1 text-xs opacity-75">{style.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
