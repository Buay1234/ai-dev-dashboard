"use client";

import { motion } from "framer-motion";

type Props = {
  activeIndex: number;
  missionActive: boolean;
  segmentCount: number;
  step: number;
  corridorLeft: number;
  startY: number;
  accentColor: string;
};

export default function DataFlowPath({
  activeIndex,
  missionActive,
  segmentCount,
  step,
  corridorLeft,
  startY,
  accentColor,
}: Props) {
  const segments = Array.from({ length: segmentCount }, (_, i) => i);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10"
      aria-hidden
    >
      {segments.map((i) => {
        const y = startY + i * step + step / 2;
        const isFlowing = missionActive && activeIndex >= i;

        return (
          <div key={i}>
            <motion.div
              className="absolute rounded-full"
              style={{
                left: corridorLeft / 2 - 1,
                top: y,
                width: 2,
                height: step - 8,
                background: isFlowing
                  ? `linear-gradient(to bottom, ${accentColor}, rgba(255,255,255,0.05))`
                  : "rgba(255,255,255,0.06)",
              }}
              animate={
                isFlowing
                  ? { opacity: [0.4, 0.95, 0.4] }
                  : { opacity: 0.2 }
              }
              transition={
                isFlowing
                  ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.3 }
              }
            />

            {isFlowing && (
              <motion.span
                className="absolute size-1.5 rounded-full"
                style={{
                  left: corridorLeft / 2 - 3,
                  top: y,
                  backgroundColor: accentColor,
                  boxShadow: `0 0 8px ${accentColor}`,
                }}
                animate={{ y: [0, step - 12, 0], opacity: [0, 1, 0] }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.15,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
