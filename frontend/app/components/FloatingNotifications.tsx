"use client";

import { memo, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { FloorNotification } from "@/hooks/use-floor-notifications";

const TONE_STYLES: Record<FloorNotification["tone"], string> = {
  info: "border-accent/40 bg-accent-muted/90 text-accent",
  success: "border-success/40 bg-success-muted/90 text-success",
  warning: "border-warning/40 bg-warning-muted/90 text-warning",
  error: "border-error/40 bg-error-muted/90 text-error",
};

type Props = {
  notifications: FloorNotification[];
  onDismiss: (id: string) => void;
};

function FloatingNotifications({ notifications, onDismiss }: Props) {
  useEffect(() => {
    if (notifications.length === 0) return;

    const timers = notifications.map((n) =>
      window.setTimeout(() => onDismiss(n.id), 4500)
    );

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [notifications, onDismiss]);

  return (
    <div className="absolute top-3 right-3 z-40 flex flex-col gap-2 w-[min(100%,260px)] pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            layout
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className={`pointer-events-auto rounded-lg border px-3 py-2 text-xs font-medium shadow-lg backdrop-blur-md ${TONE_STYLES[n.tone]}`}
          >
            <div className="flex items-start gap-2">
              <span className="shrink-0 opacity-80">📡</span>
              <span className="leading-snug">{n.message}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default memo(FloatingNotifications);
