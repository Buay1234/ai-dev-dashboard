"use client";

import { motion } from "framer-motion";
import Card, { CardHeader } from "./ui/Card";
import Badge from "./ui/Badge";

type Props = {
  progress: number;
  currentAgent: string;
  loading?: boolean;
};

export default function ProgressBar({
  progress,
  currentAgent,
  loading = false,
}: Props) {
  return (
    <Card padding="md">
      <CardHeader
        title="Mission Progress"
        description={
          loading
            ? `Agent ${currentAgent} is working...`
            : progress === 100
              ? "All agents completed successfully"
              : "Track real-time workflow progress"
        }
      />
      <div
        className="relative h-2 w-full overflow-hidden rounded-full bg-surface-3"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Mission progress ${progress} percent`}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent to-accent-hover"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        {loading && (
          <div className="absolute inset-0 animate-shimmer opacity-30 rounded-full" />
        )}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-2xl font-semibold tabular-nums tracking-tight text-text-primary">
          {progress}%
        </span>
        <Badge
          variant={
            loading ? "working" : progress === 100 ? "completed" : "idle"
          }
          pulse={loading}
        >
          {currentAgent}
        </Badge>
      </div>
    </Card>
  );
}
