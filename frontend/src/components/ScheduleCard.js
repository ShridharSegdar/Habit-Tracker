import React from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

export default function ScheduleCard({ schedule }) {
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const toMins = (t) => { const [h,m] = t.split(":").map(Number); return h*60+m; };

  return (
    <motion.div
      className="card-base p-6 lg:p-8 min-h-[420px] flex flex-col"
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      data-testid="schedule-card"
    >
      <div className="tracing-beam" />
      <div className="label mb-1">TODAY'S BLOCKS</div>
      <h2 className="font-display font-bold text-2xl tracking-tight mb-5">Schedule</h2>

      <div className="space-y-1 flex-1 overflow-y-auto pr-1">
        {schedule.map((s, i) => {
          const startM = toMins(s.time);
          const endM = startM + s.duration;
          const isPast = currentMins > endM;
          const isLive = currentMins >= startM && currentMins <= endM;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`relative pl-6 pr-3 py-3 rounded-lg border-l-2 transition-colors ${
                isLive ? "border-cyber bg-cyber/5" :
                isPast ? "border-white/10 opacity-50" : "border-white/15 hover:bg-white/[0.03]"
              }`}
              data-testid={`schedule-block-${i}`}
            >
              {isLive && (
                <span className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyber pulse-dot shadow-glow" />
              )}
              <div className="flex items-center gap-3">
                <div className="font-mono text-cyber text-sm w-14">{s.time}</div>
                <div className="flex-1">
                  <div className={`font-body text-sm ${isPast ? "line-through" : ""}`}>{s.task}</div>
                  <div className="flex items-center gap-1 mt-0.5 font-mono text-[10px] text-zinc-500">
                    <Clock className="w-3 h-3" />{s.duration} MIN
                  </div>
                </div>
                {isLive && <span className="font-mono text-[10px] tracking-wider text-cyber">LIVE</span>}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
