"use client";

import { memo, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  getSpriteFallbackPath,
  type SpriteAnimState,
} from "./sprite-anim-state";
import {
  getSheetAnimation,
  getSpriteSheetPath,
  getSpriteSheetStyles,
} from "./sprite-sheet-config";
import { SPRITE_IMAGE_CLASS, SPRITE_NATIVE } from "./sprite-layout";

type Props = {
  agentName: string;
  state: SpriteAnimState;
  width: number;
  maxHeight: number;
  flipX?: boolean;
  alt?: string;
  className?: string;
};

function SpriteAnimator({
  agentName,
  state,
  width,
  maxHeight,
  flipX = false,
  alt,
  className = "",
}: Props) {
  const [fallbackSrc, setFallbackSrc] = useState<string | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);

  const animation = useMemo(
    () => getSheetAnimation(agentName, state),
    [agentName, state]
  );

  useEffect(() => {
    setFrameIndex(0);
    if (animation.frames.length <= 1) return;

    const ms = 1000 / animation.fps;
    const timer = setInterval(() => {
      setFrameIndex((current) => {
        const next = current + 1;
        if (next >= animation.frames.length) {
          return animation.loop ? 0 : current;
        }
        return next;
      });
    }, ms);

    return () => clearInterval(timer);
  }, [animation, state]);

  const frame = animation.frames[frameIndex] ?? animation.frames[0];

  const sheetStyles = useMemo(
    () =>
      getSpriteSheetStyles(agentName, state, { width, maxHeight }, frame),
    [agentName, state, width, maxHeight, frame.col, frame.row]
  );

  const label = alt ?? `${agentName} — ${state}`;

  if (fallbackSrc) {
    return (
      <Image
        src={fallbackSrc}
        alt={label}
        width={SPRITE_NATIVE.width}
        height={SPRITE_NATIVE.height}
        className={`${SPRITE_IMAGE_CLASS} ${flipX ? "scale-x-[-1]" : ""} ${className}`}
        style={{
          width,
          maxWidth: width,
          maxHeight,
          height: "auto",
          imageRendering: "pixelated",
        }}
        draggable={false}
        onError={() => {
          const idle = getSpriteFallbackPath(agentName, "idle");
          if (fallbackSrc !== idle) setFallbackSrc(idle);
        }}
      />
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getSpriteSheetPath(agentName)}
        alt=""
        aria-hidden
        className="hidden"
        onError={() =>
          setFallbackSrc(getSpriteFallbackPath(agentName, state))
        }
      />
      <div
        role="img"
        aria-label={label}
        className={`pointer-events-none select-none ${flipX ? "scale-x-[-1]" : ""} ${className}`}
        style={sheetStyles}
      />
    </>
  );
}

export default memo(SpriteAnimator);
