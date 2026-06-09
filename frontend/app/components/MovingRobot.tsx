"use client";

import { motion } from "framer-motion";

const ROBOT_TRANSITION = { duration: 0.8, ease: "easeInOut" as const };

type Props = {
  activeIndex: number;
  step: number;
  trackHeight: number;
  trackClassName?: string;
  robotClassName?: string;
};

export default function MovingRobot({
  activeIndex,
  step,
  trackHeight,
  trackClassName = "w-8 shrink-0",
  robotClassName = "text-2xl leading-none",
}: Props) {
  return (
    <div
      className={`relative ${trackClassName}`}
      style={{ height: trackHeight }}
    >
      <motion.span
        className={`absolute left-0 top-0 ${robotClassName}`}
        animate={{ y: activeIndex * step }}
        transition={ROBOT_TRANSITION}
        aria-hidden
      >
        🤖
      </motion.span>
    </div>
  );
}
