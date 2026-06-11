"use client";

import { memo } from "react";
import { motion } from "framer-motion";

type LightState = {
  key: string;
  top: number;
  status: string;
  active: boolean;
};

type Props = {
  lights: LightState[];
};

function getLightColor(status: string, active: boolean): string {
  if (status === "Working") return "#fde047";
  if (status === "Completed") return "#4ade80";
  if (status === "Error") return "#f87171";
  if (active) return "#a78bfa";
  return "rgba(255,255,255,0.15)";
}

function OfficeLights({ lights }: Props) {
  return (
    <div className="pointer-events-none absolute left-3 top-0 bottom-0 w-3 z-[5]" aria-hidden>
      {lights.map((light) => {
        const lit =
          light.active ||
          light.status === "Working" ||
          light.status === "Completed" ||
          light.status === "Error";
        const color = getLightColor(light.status, light.active);

        return (
          <motion.div
            key={light.key}
            className="absolute left-0 size-2 rounded-full"
            style={{ top: light.top }}
            animate={{
              backgroundColor: color,
              boxShadow: lit
                ? [`0 0 6px ${color}`, `0 0 14px ${color}`, `0 0 6px ${color}`]
                : "0 0 2px rgba(255,255,255,0.1)",
              opacity: lit ? [0.65, 1, 0.65] : 0.35,
            }}
            transition={
              lit
                ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.35 }
            }
          />
        );
      })}
    </div>
  );
}

export default memo(OfficeLights);
