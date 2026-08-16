"use client";

import { useMemo } from "react";
import { useChildTheme } from "@/components/providers/child-theme-context";

interface AdventureMapProps {
  currentCount: number;
  targetCount: number;
  unit: string;
  goalTitle: string;
  avatarIcon: string;
  /** Decoration id from the reward unlocks, e.g. "decoration-lanterns". */
  decorationId?: string | null;
  stopCount?: number;
}

interface Point {
  x: number;
  y: number;
}

const VIEW_WIDTH = 820;
const VIEW_HEIGHT = 260;
const MARGIN_X = 58;
const MID_Y = 132;
const AMPLITUDE = 62;

/** Anchor points for the trail, laid out as a gentle serpentine. */
function buildAnchors(stopCount: number): Point[] {
  const span = VIEW_WIDTH - MARGIN_X * 2;
  return Array.from({ length: stopCount }, (_, index) => {
    const t = stopCount === 1 ? 0 : index / (stopCount - 1);
    return {
      x: MARGIN_X + span * t,
      y: MID_Y - AMPLITUDE * Math.sin(t * Math.PI * 2.1),
    };
  });
}

/**
 * Catmull-Rom spline converted to cubic beziers, so the drawn curve passes
 * exactly through every anchor. That matters here: the milestone dots have
 * to sit on the path, not near it.
 */
function buildSmoothPath(points: Point[]): string {
  if (points.length < 2) {
    return "";
  }

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index];
    const current = points[index];
    const next = points[index + 1];
    const afterNext = points[index + 2] ?? next;

    const control1 = {
      x: current.x + (next.x - previous.x) / 6,
      y: current.y + (next.y - previous.y) / 6,
    };
    const control2 = {
      x: next.x - (afterNext.x - current.x) / 6,
      y: next.y - (afterNext.y - current.y) / 6,
    };

    path += ` C ${control1.x.toFixed(2)} ${control1.y.toFixed(2)}, ${control2.x.toFixed(2)} ${control2.y.toFixed(2)}, ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
  }

  return path;
}

/** Position of the traveller, interpolated between anchors. */
function pointAtFraction(points: Point[], fraction: number): Point {
  if (points.length === 0) {
    return { x: MARGIN_X, y: MID_Y };
  }
  const clamped = Math.max(0, Math.min(1, fraction));
  const scaled = clamped * (points.length - 1);
  const index = Math.min(points.length - 2, Math.floor(scaled));
  const localT = scaled - index;
  const from = points[index];
  const to = points[index + 1] ?? from;

  return {
    x: from.x + (to.x - from.x) * localT,
    y: from.y + (to.y - from.y) * localT,
  };
}

export function AdventureMap({
  currentCount,
  targetCount,
  unit,
  goalTitle,
  avatarIcon,
  decorationId = null,
  stopCount = 8,
}: AdventureMapProps) {
  const { isNeonQuest, isWoodland } = useChildTheme();

  const safeTarget = Math.max(1, targetCount);
  const fraction = Math.max(0, Math.min(1, currentCount / safeTarget));
  const percent = Math.round(fraction * 100);

  const anchors = useMemo(() => buildAnchors(stopCount), [stopCount]);
  const trailPath = useMemo(() => buildSmoothPath(anchors), [anchors]);
  const traveller = useMemo(() => pointAtFraction(anchors, fraction), [anchors, fraction]);

  const heading = isNeonQuest ? "Quest Route" : isWoodland ? "The Trail" : "Your Adventure Map";
  const finishLabel = isNeonQuest ? "BOSS" : "Goal";

  return (
    <div className="adventure-map relative overflow-hidden rounded-[1.75rem] bg-white/70 p-5 shadow-sm">
      {decorationId === "decoration-aurora" ? (
        <div className="adventure-aurora pointer-events-none absolute inset-x-0 top-0 h-24" aria-hidden="true" />
      ) : null}

      <div className="relative flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted">{heading}</p>
          <h3 className="mt-1 text-xl font-semibold text-foreground">{goalTitle}</h3>
        </div>
        <p className="text-sm font-semibold text-accent">
          {currentCount}/{targetCount} {unit}
        </p>
      </div>

      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="mt-2 w-full"
        role="img"
        aria-label={`Adventure map showing ${percent}% progress toward ${goalTitle}`}
      >
        <defs>
          <linearGradient id="trail-progress" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--sun)" />
          </linearGradient>
        </defs>

        {/* Unwalked trail */}
        <path
          d={trailPath}
          fill="none"
          stroke="var(--border)"
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray="2 22"
          opacity={0.9}
        />

        {/* Walked trail - pathLength normalises the dash maths to 0-100 */}
        <path
          className="adventure-trail-progress"
          d={trailPath}
          fill="none"
          stroke="url(#trail-progress)"
          strokeWidth={14}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={100}
          strokeDashoffset={100 - percent}
        />

        {anchors.map((point, index) => {
          const stopFraction = index / (anchors.length - 1);
          const reached = fraction >= stopFraction - 0.001;
          const isFinish = index === anchors.length - 1;
          const stopValue = Math.round(stopFraction * safeTarget);

          return (
            <g key={`stop-${index}`}>
              {decorationId === "decoration-lanterns" && reached && !isFinish ? (
                <circle cx={point.x} cy={point.y - 30} r={5} fill="var(--sun)" opacity={0.75}>
                  <title>Lantern</title>
                </circle>
              ) : null}

              <circle
                cx={point.x}
                cy={point.y}
                r={isFinish ? 21 : 15}
                fill={reached ? "var(--accent)" : "var(--surface-strong)"}
                stroke={reached ? "var(--accent-strong)" : "var(--border)"}
                strokeWidth={3}
              />

              {isFinish ? (
                <text
                  x={point.x}
                  y={point.y + 5}
                  textAnchor="middle"
                  fontSize={16}
                  aria-hidden="true"
                >
                  🏁
                </text>
              ) : null}

              <text
                x={point.x}
                y={point.y + 40}
                textAnchor="middle"
                fontSize={13}
                fontWeight={reached ? 700 : 400}
                fill={reached ? "var(--foreground)" : "var(--muted)"}
              >
                {isFinish ? finishLabel : stopValue}
              </text>
            </g>
          );
        })}

        {/* Traveller */}
        <g
          className="adventure-traveller"
          style={{ transform: `translate(${traveller.x.toFixed(2)}px, ${traveller.y.toFixed(2)}px)` }}
        >
          <circle r={20} fill="var(--surface-strong)" stroke="var(--accent-strong)" strokeWidth={3} />
          <text y={7} textAnchor="middle" fontSize={20} aria-hidden="true">
            {avatarIcon}
          </text>
        </g>

        {decorationId === "decoration-sparkles" && percent > 0
          ? [0, 1, 2].map((index) => (
              <circle
                key={`sparkle-${index}`}
                className="adventure-sparkle"
                cx={traveller.x - 16 - index * 13}
                cy={traveller.y + (index % 2 === 0 ? -9 : 9)}
                r={2.6}
                fill="var(--sun)"
                style={{ animationDelay: `${index * 0.28}s` }}
              />
            ))
          : null}
      </svg>

      <p className="relative mt-1 text-sm text-muted">
        {percent === 0
          ? "Your first check-in puts you on the map."
          : percent >= 100
            ? "You reached the end of the trail."
            : `${percent}% of the way. ${targetCount - currentCount} ${unit} to the finish.`}
      </p>
    </div>
  );
}
