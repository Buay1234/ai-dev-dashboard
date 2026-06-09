"use client";

import { motion } from "framer-motion";
import FloatingParticles from "./FloatingParticles";

type Props = {
  className?: string;
  accentColor?: string;
};

export default function OfficeFloorBackground({
  className = "",
  accentColor = "rgba(139, 92, 246, 0.5)",
}: Props) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden rounded-xl ${className}`}
      aria-hidden
    >
      <div className="absolute inset-0 office-floor-grid opacity-60" />

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 0%, rgba(139,92,246,0.12) 0%, transparent 55%), radial-gradient(ellipse at 70% 100%, rgba(59,130,246,0.08) 0%, transparent 50%)",
        }}
      />

      <motion.div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(139,92,246,0.5), transparent)",
        }}
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      <FloatingParticles count={22} color={accentColor} />

      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-16 h-px"
          style={{
            top: `${15 + i * 14}%`,
            left: 0,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            opacity: 0.15,
          }}
          animate={{ x: ["-20%", "120%"] }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: "linear",
            delay: i * 0.8,
          }}
        />
      ))}
    </div>
  );
}
