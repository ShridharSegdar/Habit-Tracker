import React, { lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { Edit3 } from "lucide-react";

const CountdownScene = lazy(() => import("./three/CountdownScene"));

export default function CountdownCard({ days, examName, onEdit }) {
  return (
    <motion.div
      className="card-base p-6 lg:p-8 min-h-[280px] relative overflow-hidden flex flex-col"
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      data-testid="countdown-card"
    >
      <div className="tracing-beam" />

      <div className="flex items-center justify-between relative z-10">
        <div className="label flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-violet pulse-dot" />
          {(examName || "EXAM").toUpperCase()} · COUNTDOWN
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-white/10 hover:border-cyber/40 hover:text-cyber font-mono text-[10px] tracking-wider transition-colors"
          data-testid="edit-goal-btn"
        >
          <Edit3 className="w-3 h-3" /> EDIT GOAL
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        <div className="absolute inset-0 pointer-events-none">
          <Suspense fallback={null}>
            <CountdownScene />
          </Suspense>
        </div>
        <div className="relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="font-display font-black text-7xl lg:text-8xl tracking-tighter text-white"
            style={{ textShadow: "0 0 40px rgba(0,240,255,0.4)" }}
            data-testid="countdown-days"
          >
            {days}
          </motion.div>
          <div className="font-mono text-xs text-zinc-500 mt-2 tracking-[0.3em]">
            DAYS TO {(examName || "EXAM").toUpperCase()} DAY
          </div>
        </div>
      </div>
    </motion.div>
  );
}
