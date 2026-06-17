"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AGENT_NAMES } from "@/lib/agents/config";
import type { AgentStatus } from "@/lib/types/agent-results";

export type FloorNotification = {
  id: string;
  message: string;
  agent: string;
  tone: "info" | "success" | "warning" | "error";
};

const AGENT_MESSAGES: Record<
  string,
  Partial<Record<AgentStatus, string>>
> = {
  Robin: {
    Working: "Robin started analysis.",
    Completed: "Robin completed analysis.",
    Error: "Robin analysis failed.",
  },
  Zoro: {
    Working: "Zoro started backend generation.",
    Completed: "Zoro completed backend generation.",
    Error: "Zoro backend generation failed.",
  },
  Nami: {
    Working: "Nami started frontend generation.",
    Completed: "Nami completed frontend generation.",
    Error: "Nami frontend generation failed.",
  },
  Franky: {
    Working: "Franky started architecture design.",
    Completed: "Franky generated architecture.",
    Error: "Franky architecture failed.",
  },
  Usopp: {
    Working: "Usopp started testing.",
    Completed: "Usopp completed testing.",
    Error: "Usopp testing failed.",
  },
};

function toneForStatus(status: AgentStatus): FloorNotification["tone"] {
  if (status === "Completed") return "success";
  if (status === "Error") return "error";
  if (status === "Working") return "warning";
  return "info";
}

const MAX_NOTIFICATIONS = 4;

export function useFloorNotifications(statuses: Record<string, string>) {
  const [notifications, setNotifications] = useState<FloorNotification[]>([]);
  const prevRef = useRef<Record<string, string>>({ ...statuses });
  const idRef = useRef(0);

  useEffect(() => {
    const prev = prevRef.current;
    const next: FloorNotification[] = [];

    for (const name of AGENT_NAMES) {
      const oldStatus = prev[name];
      const newStatus = statuses[name];

      if (oldStatus === newStatus || newStatus === "Idle") continue;

      const message = AGENT_MESSAGES[name]?.[newStatus as AgentStatus];
      if (!message) continue;

      idRef.current += 1;
      next.push({
        id: `${name}-${idRef.current}`,
        message,
        agent: name,
        tone: toneForStatus(newStatus as AgentStatus),
      });
    }

    if (next.length > 0) {
      setNotifications((current) =>
        [...next, ...current].slice(0, MAX_NOTIFICATIONS)
      );
    }

    prevRef.current = { ...statuses };
  }, [statuses]);

  const dismiss = useCallback((id: string) => {
    setNotifications((current) => current.filter((n) => n.id !== id));
  }, []);

  return { notifications, dismiss };
}
