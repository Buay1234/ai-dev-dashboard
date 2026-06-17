"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { motion, type Transition } from "framer-motion";
import SpriteAnimator from "./SpriteAnimator";
import type { MapAnchor } from "./office-map-config";
import {
  AGENT_HOME,
  STEP_MS,
  anchorsEqual,
  buildAnchorPath,
  directionBetween,
  type GridIntent,
  type WalkDirection,
} from "./office-grid";
import {
  resolveMapSpriteState,
  type ArrivedSpriteState,
} from "./sprite-anim-state";
import { PIXEL_AGENT } from "./sprite-layout";
import { THEME_STYLES, type OfficeRoomTheme } from "./theme";

export type PixelAgentProps = {
  agentName: string;
  intent: GridIntent;
  isCurrent: boolean;
  theme?: OfficeRoomTheme;
  latestMessage?: string;
};

const { width: SPRITE_W, maxHeight: SPRITE_H } = PIXEL_AGENT;

const IDLE_LOOP: Transition = {
  type: "tween",
  duration: 2.6,
  repeat: Infinity,
  ease: "easeInOut",
};

const WALK_LOOP: Transition = {
  type: "tween",
  duration: 0.34,
  repeat: Infinity,
  ease: "easeInOut",
};

function PixelAgent({
  agentName,
  intent,
  isCurrent,
  theme = "purple",
  latestMessage,
}: PixelAgentProps) {
  const home =
    AGENT_HOME[agentName as keyof typeof AGENT_HOME] ??
    ({ x: 50, y: 50 } as MapAnchor);

  const [anchor, setAnchor] = useState<MapAnchor>(home);
  const anchorRef = useRef<MapAnchor>(home);
  const [isWalking, setIsWalking] = useState(false);
  const [facing, setFacing] = useState<WalkDirection>("down");
  const [arrivedPose, setArrivedPose] = useState<ArrivedSpriteState>("idle");

  const intentKey = useRef("");
  const walkTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pathRef = useRef<MapAnchor[]>([]);
  const stepRef = useRef(0);

  const clearWalkTimer = useCallback(() => {
    if (walkTimer.current) {
      clearInterval(walkTimer.current);
      walkTimer.current = null;
    }
  }, []);

  const startWalk = useCallback(
    (path: MapAnchor[], onArrive: ArrivedSpriteState) => {
      clearWalkTimer();
      if (path.length <= 1) {
        setAnchor(path[0] ?? home);
        anchorRef.current = path[0] ?? home;
        setIsWalking(false);
        setArrivedPose(onArrive);
        return;
      }

      pathRef.current = path;
      stepRef.current = 1;
      setAnchor(path[0]);
      anchorRef.current = path[0];
      setIsWalking(true);
      setArrivedPose(onArrive);
      setFacing(directionBetween(path[0], path[1]));

      walkTimer.current = setInterval(() => {
        const path = pathRef.current;
        const idx = stepRef.current;

        if (idx >= path.length) {
          clearWalkTimer();
          setIsWalking(false);
          return;
        }

        const prev = path[idx - 1];
        const next = path[idx];
        setFacing(directionBetween(prev, next));
        setAnchor(next);
        anchorRef.current = next;
        stepRef.current += 1;

        if (idx >= path.length - 1) {
          clearWalkTimer();
          setIsWalking(false);
        }
      }, STEP_MS);
    },
    [clearWalkTimer, home]
  );

  useEffect(() => {
    const key = JSON.stringify(intent);
    if (intentKey.current === key) return;
    intentKey.current = key;

    const startAnchor = intent.pathOrigin ?? anchorRef.current;
    const path = buildAnchorPath(startAnchor, intent.targetAnchor);

    if (intent.pathOrigin && !anchorsEqual(intent.pathOrigin, anchorRef.current)) {
      setAnchor(intent.pathOrigin);
      anchorRef.current = intent.pathOrigin;
    }

    if (path.length > 1) {
      startWalk(path, intent.arrivedPose);
    } else {
      setAnchor(intent.targetAnchor);
      anchorRef.current = intent.targetAnchor;
      setIsWalking(false);
      setArrivedPose(intent.arrivedPose);
    }
  }, [intent, startWalk]);

  useEffect(() => clearWalkTimer, [clearWalkTimer]);

  const themeStyle = THEME_STYLES[theme];
  const spriteState = resolveMapSpriteState(isWalking, arrivedPose);

  const bodyAnim = { y: 0, scale: 1 };

  return (
    <motion.div
      className="absolute pointer-events-none z-20"
      animate={{
        left: `${anchor.x}%`,
        top: `${anchor.y}%`,
      }}
      transition={{
        duration: STEP_MS / 1000,
        ease: "linear",
      }}
      style={{
        willChange: "left, top",
        x: "-50%",
        y: "-100%",
      }}
      aria-label={`${agentName}${isWalking ? ", walking" : `, ${spriteState}`}`}
    >
      <motion.div
        className="relative flex flex-col items-center"
        style={{ width: SPRITE_W }}
        animate={bodyAnim}
        transition={isWalking ? WALK_LOOP : IDLE_LOOP}
      >
        {latestMessage && isCurrent && (
          <div
            className="absolute -top-12 left-1/2 z-20 max-w-[120px] -translate-x-1/2 whitespace-normal rounded-lg border border-cyan-500/40 bg-black/80 px-2 py-1 text-center text-[7px] leading-tight text-white"
            style={{ imageRendering: "pixelated" }}
          >
            {latestMessage}
          </div>
        )}

        {isCurrent && (
          <span
            className="absolute -top-4 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded border px-1 py-px text-[7px] font-mono uppercase tracking-wider text-yellow-300"
            style={{
              borderColor: `${themeStyle.glowRgb}88`,
              background: `${themeStyle.glowRgb}33`,
              imageRendering: "pixelated",
            }}
          >
            ▶ Active
          </span>
        )}

        <span
          className="absolute -top-2.5 left-1/2 z-10 -translate-x-1/2 text-[7px] font-mono uppercase tracking-wider text-cyan-400/70"
          style={{ imageRendering: "pixelated" }}
        >
          {agentName}
        </span>

        <div
          className="relative flex items-end justify-center"
          style={{
            width: SPRITE_W,
            height: SPRITE_H,
            filter: isCurrent
              ? `drop-shadow(0 0 5px ${themeStyle.glowRgb})`
              : undefined,
          }}
        >
          <SpriteAnimator
            agentName={agentName}
            state={spriteState}
            width={SPRITE_W}
            maxHeight={SPRITE_H}
            flipX={facing === "left"}
            alt={`${agentName} — ${spriteState}`}
          />

          <motion.div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-black/50 blur-[3px]"
            style={{ width: SPRITE_W * 0.62, height: 5 }}
            animate={
              isWalking
                ? {
                    scaleX: [1, 0.7, 1, 0.7, 1],
                    opacity: [0.38, 0.2, 0.38, 0.2, 0.38],
                  }
                : {
                    scaleX: [1, 0.88, 1],
                    opacity: [0.32, 0.22, 0.32],
                  }
            }
            transition={isWalking ? WALK_LOOP : IDLE_LOOP}
            aria-hidden
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default memo(PixelAgent);
