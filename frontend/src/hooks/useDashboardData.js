import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../lib/api";

export function useDashboardData() {
  const [habits, setHabits] = useState([]);
  const [stats, setStats] = useState({
    streak: 0, best_streak: 0, completed_today: 0, total_habits: 0,
    completion_pct: 0, heatmap: [], weekly: [],
  });
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({ exam_name: "CAT", target_exam_date: "2026-11-30" });
  const dirty = useRef(false);

  const today = new Date().toISOString().slice(0, 10);

  const refreshHabits = useCallback(async () => {
    const [h, s, t, set] = await Promise.all([
      api.get("/habits").then(r => r.data),
      api.get("/habits/stats").then(r => r.data),
      api.get(`/timetable?date=${today}`).then(r => r.data),
      api.get("/me/settings").then(r => r.data),
    ]);
    setHabits(h);
    setStats(s);
    setTimetable(t);
    setSettings(set);
  }, [today]);

  useEffect(() => {
    (async () => {
      try { await refreshHabits(); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [refreshHabits]);

  const toggleHabit = useCallback(async (habitId) => {
    // optimistic
    setHabits(prev => prev.map(h => h.habit_id === habitId
      ? { ...h, completed_today: !h.completed_today,
          completed_dates: h.completed_today
            ? h.completed_dates.filter(d => d !== today)
            : [...h.completed_dates, today].sort()
        }
      : h));
    try {
      await api.post(`/habits/${habitId}/toggle`);
      const s = await api.get("/habits/stats").then(r => r.data);
      setStats(s);
    } catch (e) {
      refreshHabits();
    }
  }, [today, refreshHabits]);

  const addHabit = useCallback(async (title) => {
    const t = title.trim();
    if (!t) return;
    try {
      const { data } = await api.post("/habits", { title: t });
      setHabits(prev => [...prev, data]);
      const s = await api.get("/habits/stats").then(r => r.data);
      setStats(s);
    } catch (e) { console.error(e); }
  }, []);

  const removeHabit = useCallback(async (habitId) => {
    setHabits(prev => prev.filter(h => h.habit_id !== habitId));
    try {
      await api.delete(`/habits/${habitId}`);
      const s = await api.get("/habits/stats").then(r => r.data);
      setStats(s);
    } catch (e) { refreshHabits(); }
  }, [refreshHabits]);

  const updateSettings = useCallback(async (patch) => {
    const { data } = await api.put("/me/settings", patch);
    setSettings(data);
  }, []);

  const addTimetableEntry = useCallback(async (entry) => {
    const { data } = await api.post("/timetable", entry);
    if (entry.date === today) setTimetable(prev => [...prev, data].sort((a, b) => a.start_time.localeCompare(b.start_time)));
  }, [today]);

  const removeTimetableEntry = useCallback(async (entry_id) => {
    setTimetable(prev => prev.filter(e => e.entry_id !== entry_id));
    try { await api.delete(`/timetable/${entry_id}`); }
    catch (e) { /* refresh on error */ }
  }, []);

  const uploadTimetable = useCallback(async (file, mode) => {
    const form = new FormData();
    form.append("file", file);
    form.append("mode", mode);
    const { data } = await api.post("/timetable/upload", form, { headers: { "Content-Type": "multipart/form-data" }});
    // refresh
    const t = await api.get(`/timetable?date=${today}`).then(r => r.data);
    setTimetable(t);
    return data;
  }, [today]);

  // Days to exam
  const examDate = new Date(settings.target_exam_date);
  const now = new Date();
  const daysToExam = Math.max(0, Math.ceil((examDate - now) / (1000 * 60 * 60 * 24)));

  return {
    habits, stats, timetable, settings, loading, daysToExam,
    toggleHabit, addHabit, removeHabit,
    updateSettings, addTimetableEntry, removeTimetableEntry, uploadTimetable,
    refreshHabits,
  };
}
