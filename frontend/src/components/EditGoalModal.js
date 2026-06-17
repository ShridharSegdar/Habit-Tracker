import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Target, Calendar } from "lucide-react";

export default function EditGoalModal({ open, settings, onClose, onSave }) {
  const [name, setName] = useState(settings.exam_name || "CAT");
  const [date, setDate] = useState(settings.target_exam_date || "2026-11-30");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await onSave({ exam_name: name, target_exam_date: date });
      onClose();
    } finally { setBusy(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={onClose}
          data-testid="edit-goal-modal"
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-ink border border-cyber/20 rounded-2xl p-6 sm:p-8 w-full max-w-md"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
              data-testid="edit-goal-close"
            ><X className="w-5 h-5" /></button>

            <div className="label mb-2">EDIT YOUR GOAL</div>
            <h2 className="font-display font-bold text-3xl tracking-tight mb-6">Your Exam, Your Pace.</h2>

            <div className="space-y-5">
              <div>
                <label className="label flex items-center gap-2 mb-2"><Target className="w-3.5 h-3.5" /> EXAM NAME</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 30))}
                  placeholder="CAT, GMAT, UPSC…"
                  className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white text-sm focus:border-cyber focus:outline-none"
                  data-testid="edit-goal-name"
                />
              </div>

              <div>
                <label className="label flex items-center gap-2 mb-2"><Calendar className="w-3.5 h-3.5" /> TARGET DATE</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white text-sm focus:border-cyber focus:outline-none font-mono"
                  data-testid="edit-goal-date"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 font-mono text-xs tracking-wider transition-colors"
                  data-testid="edit-goal-cancel"
                >CANCEL</button>
                <button
                  onClick={save}
                  disabled={busy || !name.trim() || !date}
                  className="flex-1 py-3 rounded-xl bg-cyber text-black font-semibold text-sm hover:shadow-glow transition-shadow disabled:opacity-50"
                  data-testid="edit-goal-save"
                >{busy ? "Saving…" : "Save Goal"}</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
