import React from "react";
import { motion } from "framer-motion";

function intensity(count, total) {
  if (!total || count === 0) return 0;
  const r = count / total;
  if (r >= 0.99) return 4;
  if (r >= 0.66) return 3;
  if (r >= 0.33) return 2;
  return 1;
}

const SHADES = [
  "bg-white/[0.04] border border-white/5",
  "bg-cyber/20",
  "bg-cyber/40",
  "bg-cyber/70",
  "bg-cyber shadow-[0_0_10px_rgba(0,240,255,0.7)]",
];

export default function HeatmapCard({ heatmap }) {
  return (
    <motion.div
      className="card-base p-6 lg:p-8 min-h-[260px] flex flex-col"
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      data-testid="heatmap-card"
    >
      <div className="tracing-beam" />
      <div className="flex items-center justify-between mb-2">
        <div className="label">30-DAY CONSISTENCY</div>
        <div className="font-mono text-xs text-zinc-500">
          {heatmap.filter(d => d.count > 0).length}/30 ACTIVE
        </div>
      </div>
      <h2 className="font-display font-bold text-2xl tracking-tight mb-6">Heatmap</h2>

      <div className="grid grid-cols-10 gap-1.5 sm:gap-2 flex-1">
        {heatmap.map((d, i) => {
          const lvl = intensity(d.count, d.total);
          return (
            <motion.div
              key={d.date}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.015, duration: 0.3 }}
              whileHover={{ scale: 1.3, zIndex: 5 }}
              className={`aspect-square rounded-md ${SHADES[lvl]} cursor-pointer relative group`}
              data-testid={`heatmap-cell-${d.date}`}
            >
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-black border border-white/10 font-mono text-[10px] text-cyber whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {d.date} · {d.count}/{d.total}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-5 font-mono text-[10px] text-zinc-600">
        <span>LESS</span>
        <div className="flex gap-1">
          {SHADES.map((s, i) => <div key={i} className={`w-3 h-3 rounded ${s}`} />)}
        </div>
        <span>MORE</span>
      </div>
    </motion.div>
  );
}
