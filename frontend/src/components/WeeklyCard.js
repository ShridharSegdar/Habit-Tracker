import React from "react";
import { motion } from "framer-motion";

export default function WeeklyCard({ weekly }) {
  return (
    <motion.div
      className="card-base p-6 min-h-[200px]"
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      data-testid="weekly-card"
    >
      <div className="tracing-beam" />
      <div className="label mb-4">WEEKLY CONSISTENCY</div>
      <div className="flex items-end justify-between gap-2 h-32">
        {weekly.map((d, i) => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(8, d.pct)}%` }}
              transition={{ delay: i * 0.05, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="w-full rounded-t-md relative"
              style={{
                background: d.pct >= 80 ? "linear-gradient(to top, #00F0FF, #7B61FF)" : d.pct > 0 ? "rgba(0,240,255,0.5)" : "rgba(255,255,255,0.08)",
                boxShadow: d.pct >= 80 ? "0 0 12px rgba(0,240,255,0.5)" : "none"
              }}
              data-testid={`weekly-bar-${d.date}`}
            />
            <div className="font-mono text-[10px] text-zinc-500">{d.day}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
