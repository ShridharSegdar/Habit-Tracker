import { useState, useEffect, useCallback } from "react";

const todayKey = () => new Date().toISOString().slice(0, 10);

const DEFAULT_HABITS = [
  { id: "h1", title: "Quant: 25 LOD questions", category: "QA", icon: "🧮" },
  { id: "h2", title: "VARC: 2 RC passages", category: "VARC", icon: "📚" },
  { id: "h3", title: "LRDI: 1 caselet set", category: "LRDI", icon: "🧩" },
  { id: "h4", title: "Mock analysis (30 min)", category: "Mock", icon: "📊" },
  { id: "h5", title: "Vocab: 10 new words", category: "VARC", icon: "🔤" },
];

const DEFAULT_SCHEDULE = [
  { time: "06:30", task: "Quant — Algebra revision", duration: 90 },
  { time: "09:00", task: "Mock test (sectional)", duration: 60 },
  { time: "11:00", task: "VARC — RC + Para Jumbles", duration: 90 },
  { time: "15:00", task: "LRDI — Set practice", duration: 75 },
  { time: "19:00", task: "Mock analysis & error log", duration: 45 },
  { time: "21:00", task: "Vocab + reading", duration: 30 },
];

const EXAM_DATE = "2026-11-30"; // CAT exam date (configurable)

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch { return fallback; }
}
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

export function useHabitData() {
  const [habits, setHabits] = useState(() => load("cat_habits", DEFAULT_HABITS));
  const [completion, setCompletion] = useState(() => load("cat_completion", {}));
  const [schedule, setSchedule] = useState(() => load("cat_schedule", DEFAULT_SCHEDULE));

  useEffect(() => save("cat_habits", habits), [habits]);
  useEffect(() => save("cat_completion", completion), [completion]);
  useEffect(() => save("cat_schedule", schedule), [schedule]);

  const today = todayKey();
  const todays = completion[today] || [];
  const completedCount = habits.filter(h => todays.includes(h.id)).length;
  const completionPct = habits.length ? Math.round((completedCount / habits.length) * 100) : 0;

  const toggleHabit = useCallback((habitId) => {
    setCompletion(prev => {
      const day = prev[today] || [];
      const next = day.includes(habitId) ? day.filter(x => x !== habitId) : [...day, habitId];
      return { ...prev, [today]: next };
    });
  }, [today]);

  const addHabit = useCallback((title) => {
    if (!title.trim()) return;
    const newHabit = { id: `h${Date.now()}`, title: title.trim(), category: "Custom", icon: "✦" };
    setHabits(p => [...p, newHabit]);
  }, []);

  const removeHabit = useCallback((habitId) => {
    setHabits(p => p.filter(h => h.id !== habitId));
  }, []);

  // Compute streak: consecutive days where ALL habits were done (or at least one if today incomplete)
  const computeStreak = () => {
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const k = d.toISOString().slice(0, 10);
      const list = completion[k] || [];
      const isToday = i === 0;
      if (list.length === 0) {
        if (isToday) { d.setDate(d.getDate() - 1); continue; }
        break;
      }
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  };
  const streak = computeStreak();

  // Best streak ever (rough computation)
  const computeBest = () => {
    const keys = Object.keys(completion).filter(k => (completion[k] || []).length > 0).sort();
    if (!keys.length) return streak;
    let best = 1, cur = 1;
    for (let i = 1; i < keys.length; i++) {
      const prev = new Date(keys[i - 1]);
      const now = new Date(keys[i]);
      const diff = (now - prev) / (1000 * 60 * 60 * 24);
      if (diff === 1) { cur++; best = Math.max(best, cur); } else { cur = 1; }
    }
    return Math.max(best, streak);
  };
  const bestStreak = computeBest();

  // 30-day heatmap data
  const heatmap = (() => {
    const arr = [];
    const d = new Date();
    for (let i = 29; i >= 0; i--) {
      const dt = new Date(d);
      dt.setDate(d.getDate() - i);
      const k = dt.toISOString().slice(0, 10);
      const count = (completion[k] || []).length;
      arr.push({ date: k, count, total: habits.length });
    }
    return arr;
  })();

  // Weekly consistency (last 7 days)
  const weekly = (() => {
    const arr = [];
    const d = new Date();
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(d);
      dt.setDate(d.getDate() - i);
      const k = dt.toISOString().slice(0, 10);
      const count = (completion[k] || []).length;
      arr.push({
        date: k,
        day: ["S","M","T","W","T","F","S"][dt.getDay()],
        pct: habits.length ? Math.round((count / habits.length) * 100) : 0
      });
    }
    return arr;
  })();

  // Days to exam
  const examDate = new Date(EXAM_DATE);
  const now = new Date();
  const daysToExam = Math.max(0, Math.ceil((examDate - now) / (1000 * 60 * 60 * 24)));

  return {
    habits, completion, schedule,
    toggleHabit, addHabit, removeHabit,
    completedCount, completionPct,
    streak, bestStreak,
    heatmap, weekly,
    daysToExam,
    isCompleted: (id) => todays.includes(id),
    setSchedule,
  };
}
