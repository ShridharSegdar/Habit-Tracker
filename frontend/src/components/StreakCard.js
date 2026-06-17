import React, { lazy, Suspense } from "react";
import { motion } from "framer-motion";

const StreakScene = lazy(() => import("./three/StreakScene"));

export default function StreakCard({ streak, bestStreak }) {
  const accent = streak >= 7 ? "text-[#FF6B00]" : streak >= 3 ? "text-cyber" : "text-zinc-400";
  return (
    <motion.div
      className="card-base p-5 sm:p-6 lg:p-8 min-h-[200px] sm:min-h-[240px] lg:min-h-[280px] relative overflow-hidden w-full h-full"
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      data-testid="streak-card"
    >
      <div className="tracing-beam animate" />
      <div className="absolute inset-0 opacity-90 pointer-events-none">
        <Suspense fallback={<div className="w-full h-full" />}>
          <StreakScene streak={streak} />
        </Suspense>
      </div>

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <div className="label flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full pulse-dot ${streak >= 7 ? "bg-[#FF6B00]" : "bg-cyber"}`} />
            CURRENT STREAK
          </div>
        </div>

        <div className="mt-auto pt-12">
          <div className="flex items-baseline gap-2 flex-wrap">
            <motion.span
              key={streak}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="font-display font-black text-6xl sm:text-7xl lg:text-8xl tracking-tighter text-white leading-none"
              data-testid="streak-value"
            >
              {streak}
            </motion.span>
            <span className="font-mono text-zinc-500 text-xs sm:text-sm">DAYS</span>
          </div>
          <div className="mt-2 font-mono text-[10px] sm:text-xs text-zinc-500 flex flex-wrap items-center gap-x-2">
            <span>BEST · <span className={accent}>{bestStreak}</span> DAYS</span>
            {streak >= 7 && <span className="text-[#FF6B00]">🔥 ON FIRE</span>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
