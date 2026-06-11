"use client";

import { memo, useEffect, useRef, useState } from "react";
import { motion, type Transition } from "framer-motion";
import AgentCharacter from "./AgentCharacter";
import type { AgentStatus } from "@/lib/types/agent-results";
import type { AgentConfig } from "@/lib/agents";
import {
  STAGE_POSITIONS,
  type MissionStage,
} from "./map-stages";
import type { OfficeRoomTheme } from "./theme";

export type WalkingAgentProps = {
  currentStage: MissionStage;
  currentAgent: string;
  agent: AgentConfig;
  status: AgentStatus | string;
  isActive?: boolean;
};

const MOVE_TRANSITION: Transition = {
  type: "spring",
  stiffness: 90,
  damping: 18,
  mass: 0.85,
};

const WALK_LOOP: Transition = {
  type: "tween",
  duration: 0.36,
  repeat: Infinity,
  ease: "easeInOut",
};

function WalkingAgent({
  currentStage,
  currentAgent,
  agent,
  status,
  isActive = true,
}: WalkingAgentProps) {
  const position = STAGE_POSITIONS[currentStage];
  const prevStage = useRef(currentStage);
  const [isMoving, setIsMoving] = useState(currentStage !== "Reception");
  const enterFromReception = useRef(currentStage !== "Reception");

  useEffect(() => {
    if (prevStage.current !== currentStage) {
      setIsMoving(true);
      prevStage.current = currentStage;
    }
  }, [currentStage]);

  const initialPosition = enterFromReception.current
    ? STAGE_POSITIONS.Reception
    : undefined;

  const displayStatus = isMoving ? "Working" : status;
  const theme = agent.theme as OfficeRoomTheme;

  return (
    <motion.div
      className="absolute z-20 pointer-events-none"
      initial={
        initialPosition
          ? {
              left: `${initialPosition.x}%`,
              top: `${initialPosition.y}%`,
            }
          : false
      }
      animate={{
        left: `${position.x}%`,
        top: `${position.y}%`,
      }}
      transition={MOVE_TRANSITION}
      onAnimationComplete={() => {
        enterFromReception.current = false;
        setIsMoving(false);
      }}
      style={{ willChange: "left, top" }}
      aria-label={`Walking agent ${currentAgent} at ${currentStage}`}
    >
      <motion.div
        className="relative -translate-x-1/2"
        style={{ marginTop: -4 }}
        animate={
          isMoving
            ? {
                y: [0, -6, 0, -6, 0],
                rotate: [-5, 5, -5],
              }
            : { y: 0, rotate: 0 }
        }
        transition={isMoving ? WALK_LOOP : { type: "tween", duration: 0.25 }}
      >
        {isMoving && (
          <motion.div
            className="absolute left-1/2 bottom-0 -translate-x-1/2 rounded-full bg-black/50 blur-[4px]"
            style={{ width: 40, height: 8 }}
            animate={{
              scaleX: [1, 0.7, 1, 0.7, 1],
              opacity: [0.45, 0.25, 0.45, 0.25, 0.45],
            }}
            transition={WALK_LOOP}
            aria-hidden
          />
        )}

        <AgentCharacter
          name={agent.name}
          image={agent.image}
          role={agent.role}
          status={displayStatus}
          isActive={isActive}
          theme={theme}
          size="md"
        />
      </motion.div>
    </motion.div>
  );
}

export default memo(WalkingAgent);
