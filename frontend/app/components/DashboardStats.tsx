"use client";

import { motion } from "framer-motion";
import Card from "./ui/Card";

type Props = {
  projectCount: number;
  successCount: number;
};

const stats = [
  {
    key: "projects",
    label: "Total Projects",
    getValue: (p: Props) => p.projectCount,
    accent: "text-text-primary",
    icon: "📊",
  },
  {
    key: "success",
    label: "Successful Missions",
    getValue: (p: Props) => p.successCount,
    accent: "text-success",
    icon: "✓",
  },
] as const;

export default function DashboardStats(props: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.08 }}
        >
          <Card padding="md" hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  {stat.label}
                </p>
                <p
                  className={`mt-1 text-3xl font-semibold tabular-nums tracking-tight ${stat.accent}`}
                >
                  {stat.getValue(props)}
                </p>
              </div>
              <span
                className="flex size-10 items-center justify-center rounded-lg bg-surface-3 text-lg opacity-80"
                aria-hidden
              >
                {stat.icon}
              </span>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
