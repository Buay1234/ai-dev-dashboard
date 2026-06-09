"use client";

import { useEffect, useRef, useState, useMemo, memo } from "react";
import { motion } from "framer-motion";
import OfficeRoom from "./OfficeRoom";
import ReceptionDesk from "./ReceptionDesk";
import AgentCharacter from "./AgentCharacter";
import OfficeFloorBackground from "./OfficeFloorBackground";
import DataFlowPath from "./DataFlowPath";
import MissionProgressBoard from "./MissionProgressBoard";
import WorkflowArrows from "./WorkflowArrows";
import RoomStatusIndicator from "./RoomStatusIndicator";
import OfficeLights from "./OfficeLights";
import FloatingNotifications from "./FloatingNotifications";
import {
  AGENT_CONFIG,
  AGENT_THEME_STYLES,
  getCharacterRoomIndex,
  isMissionActive,
  toAgentStatusMap,
} from "@/lib/agents";
import {
  CORRIDOR_WIDTH,
  getRoomCenterY,
  getTotalFloorHeight,
  OFFICE_BASE,
  PATH_TRANSITION,
  RECEPTION_HEIGHT,
  ROOM_HEIGHT,
  STEP,
} from "@/lib/office-layout";
import { useFloorNotifications } from "@/hooks/use-floor-notifications";
import type { CharacterMode } from "./AgentCharacter";
import type { AgentStatusProps } from "@/lib/types/agent-results";

export type CompanyFloorProps = AgentStatusProps & {
  progress?: number;
  loading?: boolean;
};

function resolveCharacterMode(
  isWalking: boolean,
  status: string,
  missionActive: boolean
): CharacterMode {
  if (!missionActive) return "idle";
  if (isWalking) return "walking";
  if (status === "Working") return "working";
  return "idle";
}

function CompanyFloor({
  progress = 0,
  loading = false,
  currentAgent,
  ...statusProps
}: CompanyFloorProps) {
  const statuses = useMemo(
    () =>
      toAgentStatusMap({
        currentAgent,
        ...statusProps,
      }),
    [
      currentAgent,
      statusProps.robinStatus,
      statusProps.zoroStatus,
      statusProps.namiStatus,
      statusProps.frankyStatus,
      statusProps.usoppStatus,
    ]
  );
  const missionActive = isMissionActive(statuses, currentAgent);

  const roomIndex = getCharacterRoomIndex(currentAgent);
  const targetY = getRoomCenterY(roomIndex);

  const activeAgent =
    roomIndex >= 0 ? AGENT_CONFIG[roomIndex] : AGENT_CONFIG[0];
  const activeStatus =
    roomIndex >= 0 ? statuses[activeAgent.name] : "Idle";
  const activeTheme = AGENT_THEME_STYLES[activeAgent.theme];

  const prevIndexRef = useRef(roomIndex);
  const [isWalking, setIsWalking] = useState(false);

  useEffect(() => {
    if (prevIndexRef.current !== roomIndex) {
      setIsWalking(true);
      const timer = window.setTimeout(() => setIsWalking(false), 1100);
      prevIndexRef.current = roomIndex;
      return () => window.clearTimeout(timer);
    }
    prevIndexRef.current = roomIndex;
  }, [roomIndex]);

  const characterMode = resolveCharacterMode(
    isWalking,
    activeStatus,
    missionActive
  );

  const { notifications, dismiss } = useFloorNotifications(statuses);

  const totalHeight = getTotalFloorHeight(AGENT_CONFIG.length);
  const flowActiveIndex = roomIndex < 0 ? -1 : roomIndex;
  const roomsLeft = CORRIDOR_WIDTH + 16;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-accent/25 bg-surface-2/80 shadow-[0_0_40px_rgba(139,92,246,0.08)]">
      <OfficeFloorBackground accentColor={activeTheme.glow} />

      <div className="relative z-10 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm sm:text-base font-bold tracking-tight text-text-primary">
              AI Software House Simulator
            </h2>
            <p className="text-[10px] sm:text-xs text-text-muted mt-0.5">
              Reception → Robin → Zoro → Nami → Franky → Usopp
            </p>
          </div>
          <motion.span
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-muted/50 px-2.5 py-1 text-[10px] font-semibold text-accent uppercase tracking-wider"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="size-1.5 rounded-full bg-accent animate-pulse" />
            Live Sim
          </motion.span>
        </div>

        <MissionProgressBoard
          progress={progress}
          currentAgent={currentAgent}
          loading={loading}
          statuses={statuses}
        />

        <div className="relative mt-4" style={{ minHeight: totalHeight }}>
          <FloatingNotifications
            notifications={notifications}
            onDismiss={dismiss}
          />

          <OfficeLights
            statuses={statuses}
            receptionActive={roomIndex < 0}
            corridorWidth={CORRIDOR_WIDTH}
            roomsLeft={roomsLeft}
          />

          <WorkflowArrows
            segmentCount={AGENT_CONFIG.length}
            activeIndex={flowActiveIndex}
            missionActive={missionActive}
            leftOffset={roomsLeft}
          />

          <DataFlowPath
            activeIndex={flowActiveIndex}
            missionActive={missionActive}
            segmentCount={AGENT_CONFIG.length}
            step={STEP}
            corridorLeft={CORRIDOR_WIDTH}
            startY={OFFICE_BASE - 8}
            accentColor={activeTheme.glow}
          />

          <div
            className="absolute left-0 top-0 pointer-events-none z-30"
            style={{ width: CORRIDOR_WIDTH, height: totalHeight }}
          >
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 will-change-transform"
              animate={{
                y: targetY,
                x: isWalking ? [0, 10, 4, -6, 0] : 0,
              }}
              transition={{
                y: PATH_TRANSITION,
                x: isWalking
                  ? { duration: 0.55, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.45, ease: "easeOut" },
              }}
            >
              <motion.div
                animate={
                  isWalking
                    ? { scaleX: [1, 1.06, 1, 1.06, 1] }
                    : { scaleX: 1 }
                }
                transition={
                  isWalking
                    ? { duration: 0.45, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.3 }
                }
              >
                <AgentCharacter
                  agent={activeAgent}
                  status={roomIndex < 0 ? "Idle" : activeStatus}
                  mode={characterMode}
                  size="xl"
                  showLabel
                  priority
                />
              </motion.div>

              {isWalking && (
                <motion.div
                  className="absolute left-1/2 -translate-x-1/2 -bottom-1 flex gap-1"
                  animate={{ opacity: [0.2, 0.7, 0.2] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  aria-hidden
                >
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="size-1 rounded-full bg-accent"
                      animate={{ y: [0, 4, 0], opacity: [0.3, 0.9, 0.3] }}
                      transition={{
                        duration: 0.4,
                        delay: i * 0.12,
                        repeat: Infinity,
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          </div>

          <div className="relative" style={{ paddingLeft: roomsLeft }}>
            <div className="relative">
              <motion.div
                className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 rounded-full border border-accent/30 bg-surface-0/95 px-2 py-0.5 text-[10px] font-semibold text-accent whitespace-nowrap"
                animate={
                  roomIndex < 0
                    ? { boxShadow: ["0 0 6px rgba(139,92,246,0.3)", "0 0 14px rgba(139,92,246,0.5)", "0 0 6px rgba(139,92,246,0.3)"] }
                    : { boxShadow: "0 0 0 transparent" }
                }
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span aria-hidden>🏢</span>
                <span>{roomIndex < 0 ? "Lobby" : "Reception"}</span>
              </motion.div>
              <ReceptionDesk
                isActive={roomIndex < 0}
                missionActive={missionActive}
                height={RECEPTION_HEIGHT}
              />
            </div>

            <div>
              {AGENT_CONFIG.map((agent, index) => {
                const status = statuses[agent.name];
                const isRoomActive =
                  agent.name === currentAgent || status === "Working";

                return (
                  <div key={agent.name} className="relative">
                    <RoomStatusIndicator
                      agent={agent}
                      status={status}
                      isActive={isRoomActive}
                    />
                    <OfficeRoom
                      agent={agent}
                      status={status}
                      isActive={isRoomActive}
                      showConnector={index < AGENT_CONFIG.length - 1}
                      height={ROOM_HEIGHT}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(CompanyFloor);
