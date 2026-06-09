"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import {
  STEP,
  OFFICE_BASE,
  RECEPTION_Y,
  RECEPTION_HEIGHT,
  CONNECTOR_HEIGHT,
  ROOM_HEIGHT,
} from "@/lib/office-layout";

type Props = {
  segmentCount: number;
  activeIndex: number;
  missionActive: boolean;
  leftOffset: number;
};

function getArrowY(index: number): number {
  if (index === 0) {
    return RECEPTION_Y + RECEPTION_HEIGHT + CONNECTOR_HEIGHT / 2;
  }
  return (
    OFFICE_BASE +
    (index - 1) * STEP +
    ROOM_HEIGHT +
    CONNECTOR_HEIGHT / 2
  );
}

function WorkflowArrows({
  segmentCount,
  activeIndex,
  missionActive,
  leftOffset,
}: Props) {
  const segments = Array.from({ length: segmentCount }, (_, i) => i);

  return (
    <div
      className="pointer-events-none absolute z-[15]"
      style={{ left: leftOffset - 24, top: 0, width: 24 }}
      aria-hidden
    >
      {segments.map((i) => {
        const y = getArrowY(i);
        const isActive = missionActive && activeIndex >= i;

        return (
          <motion.div
            key={i}
            className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center"
            style={{ top: y }}
          >
            <motion.span
              className="text-xs font-bold leading-none"
              style={{ color: isActive ? "#c4b5fd" : "rgba(255,255,255,0.1)" }}
              animate={
                isActive
                  ? { opacity: [0.35, 1, 0.35], y: [0, 4, 0] }
                  : { opacity: 0.15 }
              }
              transition={
                isActive
                  ? { duration: 1.3, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.3 }
              }
            >
              ▼
            </motion.span>
            {isActive && (
              <motion.span
                className="text-[7px] text-accent/70 mt-0.5 tracking-widest"
                animate={{ opacity: [0, 0.9, 0] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              >
                FLOW
              </motion.span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

export default memo(WorkflowArrows);
