"use client";

import { memo } from "react";
import { motion } from "framer-motion";

type Segment = {
  id: string;
  d: string;
  active: boolean;
  completed: boolean;
};

type Props = {
  segments: Segment[];
};

function MapConnections({ segments }: Props) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="map-line-idle" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(113,113,122,0.15)" />
          <stop offset="50%" stopColor="rgba(113,113,122,0.45)" />
          <stop offset="100%" stopColor="rgba(113,113,122,0.15)" />
        </linearGradient>
        <linearGradient id="map-line-active" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(234,179,8,0.2)" />
          <stop offset="50%" stopColor="rgba(234,179,8,0.9)" />
          <stop offset="100%" stopColor="rgba(234,179,8,0.2)" />
        </linearGradient>
        <linearGradient id="map-line-done" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(34,197,94,0.2)" />
          <stop offset="50%" stopColor="rgba(34,197,94,0.85)" />
          <stop offset="100%" stopColor="rgba(34,197,94,0.2)" />
        </linearGradient>
      </defs>

      {segments.map((seg) => {
        const stroke =
          seg.completed
            ? "url(#map-line-done)"
            : seg.active
              ? "url(#map-line-active)"
              : "url(#map-line-idle)";
        const width = seg.active ? 0.55 : seg.completed ? 0.45 : 0.35;
        const opacity = seg.active ? 1 : seg.completed ? 0.85 : 0.55;

        return (
          <g key={seg.id}>
            <path
              d={seg.d}
              fill="none"
              stroke="rgba(0,0,0,0.35)"
              strokeWidth={width + 0.25}
              strokeLinecap="round"
            />
            <motion.path
              d={seg.d}
              fill="none"
              stroke={stroke}
              strokeWidth={width}
              strokeLinecap="round"
              strokeDasharray={seg.active ? "3 2" : "2 3"}
              opacity={opacity}
              initial={{ strokeDashoffset: 0 }}
              animate={{ strokeDashoffset: seg.active ? [0, -10] : [0, -6] }}
              transition={{
                duration: seg.active ? 0.8 : 2.4,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </g>
        );
      })}
    </svg>
  );
}

export default memo(MapConnections);
