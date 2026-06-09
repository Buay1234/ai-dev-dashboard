"use client";

import { motion } from "framer-motion";
import Card from "./ui/Card";
import Badge, { statusToBadgeVariant } from "./ui/Badge";

type Props = {
  icon: string;
  name: string;
  role: string;
  status: string;
};

export default function AgentCard({ icon, name, role, status }: Props) {
  const isWorking = status === "Working";
  const isIdle = status === "Idle";

  const renderStatus = () => {
    if (isWorking) {
      return (
        <>
          <motion.span
            className="inline-block"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            aria-hidden
          >
            ⚙️
          </motion.span>
          Working...
        </>
      );
    }
    if (status === "Completed") return "Completed";
    if (status === "Error") return "Error";
    return status;
  };

  return (
    <motion.div
      animate={isIdle ? { y: [0, -4, 0] } : { y: 0 }}
      transition={
        isIdle
          ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.3 }
      }
    >
      <Card
        hover
        padding="md"
        className={`
          h-full
          ${isWorking ? "border-warning/40 ring-1 ring-warning/20" : ""}
          ${status === "Completed" ? "border-success/30" : ""}
          ${status === "Error" ? "border-error/30" : ""}
        `}
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <span
            className="flex size-10 items-center justify-center rounded-lg bg-surface-3 text-xl"
            aria-hidden
          >
            {icon}
          </span>
          <Badge variant={statusToBadgeVariant(status)} pulse={isWorking}>
            {renderStatus()}
          </Badge>
        </div>
        <h3 className="text-sm font-semibold text-text-primary">{name}</h3>
        <p className="mt-0.5 text-xs text-text-muted">{role}</p>
      </Card>
    </motion.div>
  );
}
