"use client";

import { memo } from "react";
import { motion } from "framer-motion";

function OfficeBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[#030306]" />

      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6,182,212,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6,182,212,0.15) 1px, transparent 1px)
          `,
          backgroundSize: "28px 28px",
        }}
      />

      <div className="absolute inset-0 office-floor-grid opacity-20" />

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(139,92,246,0.18), transparent), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(6,182,212,0.1), transparent)",
        }}
      />

      <motion.div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
        animate={{ opacity: [0.2, 0.7, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-px w-1/3"
          style={{
            top: `${20 + i * 22}%`,
            background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.25), transparent)",
          }}
          animate={{ x: ["-10%", "120%"] }}
          transition={{
            duration: 10 + i * 3,
            repeat: Infinity,
            ease: "linear",
            delay: i * 1.2,
          }}
        />
      ))}
    </div>
  );
}

export default memo(OfficeBackground);
