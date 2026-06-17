import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Plus, X, Clock, FileText, RefreshCw, FileSpreadsheet } from "lucide-react";

function UploadModal({ open, onClose, onUpload }) {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("add");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [drag, setDrag] = useState(false);

  const submit = async () => {
    if (!file) return;
    setBusy(true); setErr("");
    try {
      const res = await onUpload(file, mode);
      onClose(res);
    } catch (e) {
      setErr(e?.response?.data?.detail || e.message || "Upload failed");
    } finally { setBusy(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={() => onClose()}
          data-testid="upload-modal"
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-ink border border-cyber/20 rounded-2xl p-6 w-full max-w-md"
          >
            <button onClick={() => onClose()} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="label mb-2">IMPORT TIMETABLE</div>
            <h3 className="font-display font-bold text-2xl tracking-tight mb-5">Drop your schedule</h3>

            <label
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) setFile(f); }}
              className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                drag ? "border-cyber bg-cyber/5" : "border-white/10 hover:border-cyber/40"
              }`}
              data-testid="upload-dropzone"
            >
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.json"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                data-testid="upload-file-input"
              />
              <FileSpreadsheet className="w-8 h-8 mx-auto text-cyber/60 mb-2" />
              <div className="font-body text-sm text-white">
                {file ? file.name : "Click or drag CSV / XLSX / JSON"}
              </div>
              <div className="font-mono text-[10px] text-zinc-600 mt-1 tracking-wider">
                Columns: subject, teacher, start_time, end_time, date, duration
              </div>
            </label>

            <div className="mt-5">
              <div className="label mb-2">WHEN ROWS EXIST FOR THE SAME DATE</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: "add", label: "Add to existing", desc: "Append new rows" },
                  { val: "replace", label: "Replace", desc: "Wipe those dates first" },
                ].map(o => (
                  <button
                    key={o.val}
                    onClick={() => setMode(o.val)}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      mode === o.val
                        ? "border-cyber bg-cyber/10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                    data-testid={`upload-mode-${o.val}`}
                  >
                    <div className="font-body text-sm text-white">{o.label}</div>
                    <div className="font-mono text-[10px] text-zinc-500 mt-1">{o.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {err && <div className="mt-4 text-danger text-xs font-mono" data-testid="upload-error">{err}</div>}

            <button
              onClick={submit}
              disabled={!file || busy}
              className="w-full mt-6 py-3 rounded-xl bg-cyber text-black font-semibold text-sm hover:shadow-glow transition-shadow disabled:opacity-50"
              data-testid="upload-submit-btn"
            >
              {busy ? "Importing…" : `Import as: ${mode}`}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ManualEntryForm({ onAdd, onClose }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    subject: "", teacher: "", start_time: "", end_time: "", date: today, duration: 60,
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.start_time) return;
    setBusy(true);
    try {
      await onAdd({ ...form, duration: Number(form.duration) || 60 });
      onClose();
    } finally { setBusy(false); }
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      onSubmit={submit}
      className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-black/40 border border-white/5 mt-3"
    >
      <input value={form.subject} onChange={f("subject")} placeholder="Subject *"
        className="col-span-2 bg-black border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-cyber focus:outline-none"
        data-testid="tt-subject" required />
      <input value={form.teacher} onChange={f("teacher")} placeholder="Teacher / Source"
        className="col-span-2 bg-black border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-cyber focus:outline-none"
        data-testid="tt-teacher" />
      <input type="time" value={form.start_time} onChange={f("start_time")}
        className="bg-black border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-cyber focus:outline-none font-mono"
        data-testid="tt-start" required />
      <input type="time" value={form.end_time} onChange={f("end_time")}
        className="bg-black border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-cyber focus:outline-none font-mono"
        data-testid="tt-end" />
      <input type="date" value={form.date} onChange={f("date")}
        className="bg-black border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-cyber focus:outline-none font-mono"
        data-testid="tt-date" required />
      <input type="number" value={form.duration} onChange={f("duration")} placeholder="Min" min="1"
        className="bg-black border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-cyber focus:outline-none font-mono"
        data-testid="tt-duration" />
      <div className="col-span-2 flex gap-2 mt-1">
        <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-white/10 text-zinc-400 text-xs font-mono tracking-wider">CANCEL</button>
        <button type="submit" disabled={busy} className="flex-1 py-2 rounded-lg bg-cyber text-black font-semibold text-xs tracking-wider" data-testid="tt-add-submit">
          {busy ? "ADDING…" : "ADD BLOCK"}
        </button>
      </div>
    </motion.form>
  );
}

export default function TimetableCard({ schedule, onAdd, onRemove, onUpload }) {
  const [showForm, setShowForm] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [toast, setToast] = useState("");

  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const toMins = (t) => {
    if (!t) return -1;
    const parts = t.split(":").map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  };

  const handleUpload = async (file, mode) => {
    const res = await onUpload(file, mode);
    setToast(`Imported ${res.inserted} entries (${res.mode})`);
    setTimeout(() => setToast(""), 4000);
    return res;
  };

  return (
    <motion.div
      className="card-base p-6 lg:p-8 min-h-[300px] flex flex-col relative"
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      data-testid="schedule-card"
    >
      <div className="tracing-beam" />

      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="label">TODAY'S BLOCKS</div>
          <h2 className="font-display font-bold text-2xl tracking-tight mt-1">Schedule</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/10 hover:border-cyber/40 hover:text-cyber font-mono text-[10px] tracking-wider transition-colors"
            data-testid="open-upload-btn"
          >
            <Upload className="w-3 h-3" /> IMPORT
          </button>
          <button
            onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-cyber/10 border border-cyber/30 text-cyber hover:bg-cyber hover:text-black font-mono text-[10px] tracking-wider transition-colors"
            data-testid="open-add-form-btn"
          >
            <Plus className="w-3 h-3" /> ADD
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showForm && <ManualEntryForm onAdd={onAdd} onClose={() => setShowForm(false)} />}
      </AnimatePresence>

      <div className="space-y-1 flex-1 overflow-y-auto pr-1 mt-3">
        {schedule.length === 0 && (
          <div className="text-center py-12 font-mono text-xs text-zinc-600">
            No blocks for today. Add manually or import a file.
          </div>
        )}
        {schedule.map((s, i) => {
          const startM = toMins(s.start_time);
          const endM = startM + (s.duration || 60);
          const isPast = currentMins > endM;
          const isLive = currentMins >= startM && currentMins <= endM;
          return (
            <motion.div
              key={s.entry_id || i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`group relative pl-5 pr-3 py-3 rounded-lg border-l-2 transition-colors flex items-center gap-3 ${
                isLive ? "border-cyber bg-cyber/5" :
                isPast ? "border-white/10 opacity-50" : "border-white/15 hover:bg-white/[0.03]"
              }`}
              data-testid={`schedule-block-${i}`}
            >
              {isLive && (
                <span className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyber pulse-dot" />
              )}
              <div className="font-mono text-cyber text-sm w-14">{s.start_time}</div>
              <div className="flex-1 min-w-0">
                <div className={`font-body text-sm truncate ${isPast ? "line-through text-zinc-500" : "text-white"}`}>{s.subject}</div>
                <div className="flex items-center gap-2 mt-0.5 font-mono text-[10px] text-zinc-500">
                  <Clock className="w-3 h-3" />{s.duration || 60}m
                  {s.teacher && <span>· {s.teacher}</span>}
                </div>
              </div>
              {isLive && <span className="font-mono text-[10px] tracking-wider text-cyber">LIVE</span>}
              <button
                onClick={() => onRemove(s.entry_id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-danger"
                data-testid={`schedule-remove-${i}`}
                aria-label="Delete entry"
              ><X className="w-4 h-4" /></button>
            </motion.div>
          );
        })}
      </div>

      <UploadModal open={showUpload} onClose={() => setShowUpload(false)} onUpload={handleUpload} />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-cyber text-black font-mono text-xs shadow-glow"
            data-testid="upload-toast"
          >{toast}</motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
