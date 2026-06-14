"use client";

import Image from "next/image";
import { memo, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, type Transition } from "framer-motion";
import type { AgentStatus } from "@/lib/types/agent-results";
import {
  STAGE_POSITIONS,
  getAgentSpritePath,
  getAgentVisualStatus,
  getHomeStage,
  getPreviousStage,
  poseFromVisualStatus,
} from "./map-stages";
import {
  MAP_SPRITE,
  SPRITE_IMAGE_CLASS,
  SPRITE_NATIVE,
} from "./sprite-layout";
import { THEME_STYLES, type OfficeRoomTheme } from "./theme";

export type WalkingAgentProps = {
  agentName: string;
  agentStatus: AgentStatus | string;
  currentAgent: string;
  theme?: OfficeRoomTheme;
  isCurrent?: boolean;
};

const { width: SPRITE_W, height: SPRITE_H } = MAP_SPRITE;

const MOVE_TRANSITION: Transition = {
  type: "spring",
  stiffness: 82,
  damping: 16,
  mass: 0.88,
};

const WALK_LOOP: Transition = {
  type: "tween",
  duration: 0.34,
  repeat: Infinity,
  ease: "easeInOut",
};

const IDLE_LOOP: Transition = {
  type: "tween",
  duration: 2.6,
  repeat: Infinity,
  ease: "easeInOut",
};

function WalkingAgent({
  agentName,
  agentStatus,
  currentAgent,
  theme = "purple",
  isCurrent = false,
}: WalkingAgentProps) {
  const homeStage = getHomeStage(agentName);
  const homePos = STAGE_POSITIONS[homeStage];
  const walkFromPos = STAGE_POSITIONS[getPreviousStage(agentName)];
  const themeStyle = THEME_STYLES[theme];

  const shouldWalk =
    currentAgent === agentName && agentStatus === "Working";

  const [walkGen, setWalkGen] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const prevShouldWalk = useRef(false);

  useEffect(() => {
    if (shouldWalk && !prevShouldWalk.current) {
      setWalkGen((g) => g + 1);
      setIsMoving(true);
    }
    if (agentStatus === "Idle" && currentAgent === "Idle") {
      setWalkGen(0);
      setIsMoving(false);
    }
    prevShouldWalk.current = shouldWalk;
  }, [shouldWalk, agentStatus, currentAgent]);

  const visualStatus = getAgentVisualStatus(
    agentName,
    agentStatus,
    currentAgent
  );
  const resolvedVisual =
    shouldWalk && !isMoving ? "working" : visualStatus;
  const pose = poseFromVisualStatus(resolvedVisual, isMoving);
  const spriteSrc = getAgentSpritePath(agentName, pose);

  const startPos = walkGen > 0 && isMoving ? walkFromPos : homePos;

  return (
    <motion.div
      key={`${agentName}-${walkGen}`}
      className="absolute pointer-events-none"
      style={{
        zIndex: isCurrent ? 30 : isMoving ? 28 : 20,
        willChange: "left, top",
      }}
      initial={{
        left: `${startPos.x}%`,
        top: `${startPos.y}%`,
      }}
      animate={{
        left: `${homePos.x}%`,
        top: `${homePos.y}%`,
      }}
      transition={isMoving ? MOVE_TRANSITION : { type: "tween", duration: 0.15 }}
      onAnimationComplete={() => {
        if (isMoving) setIsMoving(false);
      }}
      aria-label={`${agentName}${isMoving ? ", walking" : `, ${pose}`}`}
    >
      <motion.div
        className="relative -translate-x-1/2 -translate-y-[42%] flex flex-col items-center"
        style={{ width: SPRITE_W }}
        animate={
          isMoving
            ? { y: [0, -6, 0, -6, 0], rotate: [-4, 4, -4] }
            : pose === "wave"
              ? { y: [0, -4, 0], rotate: [0, 3, 0, -3, 0] }
              : { y: [0, -4, 0], scale: [1, 1.03, 1] }
        }
        transition={isMoving ? WALK_LOOP : IDLE_LOOP}
      >
        {isCurrent && (
          <motion.span
            className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider text-yellow-300"
            style={{
              borderColor: `${themeStyle.glowRgb}66`,
              background: `${themeStyle.glowRgb}22`,
            }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            Active
          </motion.span>
        )}

        <div
          className="relative flex items-center justify-center rounded-md border bg-transparent"
          style={{
            width: SPRITE_W,
            height: SPRITE_H,
            borderColor: isCurrent
              ? themeStyle.borderColor
              : "rgba(255,255,255,0.08)",
            boxShadow: isCurrent
              ? `0 0 20px ${themeStyle.glowRgb}55, inset 0 0 12px ${themeStyle.glowRgb}15`
              : `0 0 10px ${themeStyle.glowRgb}22`,
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={spriteSrc}
              className="flex size-full items-center justify-center"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "tween", duration: 0.12 }}
            >
              <Image
                src={spriteSrc}
                alt={`${agentName} — ${pose}`}
                width={SPRITE_NATIVE.width}
                height={SPRITE_NATIVE.height}
                className={SPRITE_IMAGE_CLASS}
                style={{ width: "100%", height: "100%", maxHeight: SPRITE_H }}
                draggable={false}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <div
          className="mt-0.5 h-0.5 w-3/4 rounded-sm"
          style={{
            background: `linear-gradient(to bottom, ${themeStyle.glowRgb}40, transparent)`,
          }}
          aria-hidden
        />

        <motion.div
          className="rounded-full bg-black/55 blur-[3px] -mt-0.5"
          style={{ width: SPRITE_W * 0.65, height: 5 }}
          animate={
            isMoving
              ? {
                  scaleX: [1, 0.65, 1, 0.65, 1],
                  opacity: [0.45, 0.22, 0.45, 0.22, 0.45],
                }
              : {
                  scaleX: [1, 0.88, 1],
                  opacity: [0.32, 0.24, 0.32],
                }
          }
          transition={isMoving ? WALK_LOOP : IDLE_LOOP}
          aria-hidden
        />

        <span className="mt-0.5 text-[8px] font-mono uppercase tracking-wider text-zinc-500">
          {agentName}
        </span>
      </motion.div>
    </motion.div>
  );
}

export default memo(WalkingAgent);
