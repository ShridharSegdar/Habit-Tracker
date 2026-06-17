import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Plus, X, Check } from "lucide-react";

function localizedBurst(originElement, streak) {
  if (!originElement) return;
  const rect = originElement.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;
  // Colors shift if streak is hot
  const colors = streak >= 7
    ? ["#FF6B00", "#FFD400", "#00F0FF", "#FAFAFA"]
    : ["#00F0FF", "#7B61FF", "#00FF94", "#FAFAFA"];
  confetti({
    particleCount: 60, spread: 70, startVelocity: 35,
    origin: { x, y }, colors, scalar: 0.85, ticks: 120,
    disableForReducedMotion: true,
  });
}

export default function HabitsCard({ habits, toggleHabit, addHabit, removeHabit, stats }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const completedCount = stats.completed_today;
  const completionPct = stats.completion_pct;
  const streak = stats.streak;

  const submit = () => {
    if (draft.trim()) {
      addHabit(draft);
      setDraft("");
      setAdding(false);
    }
  };

  return (
    <motion.div
      className="card-base p-5 sm:p-6 lg:p-8 min-h-[400px] sm:min-h-[420px] flex flex-col w-full max-w-full"
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      data-testid="habits-card"
    >
      <div className="tracing-beam" />
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <div className="label">DAILY HABITS</div>
        <div className="font-mono text-[10px] sm:text-xs text-cyber" data-testid="habits-completion">
          {completedCount}/{habits.length} · {completionPct}%
        </div>
      </div>

      <h2 className="font-display font-bold text-xl sm:text-2xl tracking-tight mb-5">Today&apos;s Mission</h2>

      <div className="h-1 rounded-full bg-white/5 overflow-hidden mb-5">
        <motion.div
          className="h-full bg-cyber"
          initial={{ width: 0 }}
          animate={{ width: `${completionPct}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          style={{ boxShadow: "0 0 12px rgba(0,240,255,0.6)" }}
        />
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {habits.map((h, idx) => {
            const done = h.completed_today;
            return (
              <motion.div
                key={h.habit_id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: idx * 0.04 }}
                className="group flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.03] transition-colors"
                data-testid={`habit-row-${h.habit_id}`}
              >
                <motion.button
                  onClick={(e) => {
                    if (!done) localizedBurst(e.currentTarget, streak);
                    toggleHabit(h.habit_id);
                  }}
                  whileTap={{ scale: 0.85 }}
                  className={`relative w-11 h-11 sm:w-9 sm:h-9 rounded-lg border-2 flex items-center justify-center transition-colors shrink-0 ${
                    done ? "border-cyber bg-cyber" : "border-white/15 hover:border-cyber/60"
                  }`}
                  data-testid={`habit-checkbox-${h.habit_id}`}
                  aria-label={done ? "Mark incomplete" : "Mark complete"}
                >
                  <AnimatePresence>
                    {done && (
                      <motion.span
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: [0, 1.3, 1], rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <Check className="w-5 h-5 sm:w-4 sm:h-4 text-black" strokeWidth={3} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                <div className="flex-1 min-w-0">
                  <div className={`font-body text-sm transition-colors ${done ? "line-through text-zinc-600" : "text-white"}`}>
                    <span className="mr-2">{h.icon}</span>{h.title}
                  </div>
                  <div className="font-mono text-[10px] text-zinc-600 tracking-wider mt-0.5">{h.category}</div>
                </div>

                <button
                  onClick={() => removeHabit(h.habit_id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-danger"
                  data-testid={`habit-delete-${h.habit_id}`}
                  aria-label="Delete habit"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {habits.length === 0 && (
          <div className="text-center py-10 text-zinc-600 font-mono text-xs">
            No habits yet. Add your first one ↓
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-white/5">
        {adding ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2"
          >
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") { setAdding(false); setDraft(""); } }}
              placeholder="New habit…"
              className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-sm font-body text-white placeholder-zinc-600 focus:border-cyber focus:outline-none"
              data-testid="new-habit-input"
            />
            <button
              onClick={submit}
              className="px-4 py-2 rounded-lg bg-cyber text-black font-semibold text-sm hover:shadow-glow transition-shadow"
              data-testid="confirm-add-habit-btn"
            >Add</button>
          </motion.div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-white/10 text-zinc-500 hover:border-cyber/40 hover:text-cyber transition-colors font-mono text-xs tracking-wider"
            data-testid="add-habit-btn"
          >
            <Plus className="w-4 h-4" /> ADD HABIT
          </button>
        )}
      </div>
    </motion.div>
  );
}
