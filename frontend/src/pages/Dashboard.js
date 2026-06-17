import React, { useState } from "react";
import { motion } from "framer-motion";
import { useDashboardData } from "../hooks/useDashboardData";
import Header from "../components/Header";
import StreakCard from "../components/StreakCard";
import CountdownCard from "../components/CountdownCard";
import HabitsCard from "../components/HabitsCard";
import HeatmapCard from "../components/HeatmapCard";
import WeeklyCard from "../components/WeeklyCard";
import TimetableCard from "../components/TimetableCard";
import ProgressRing from "../components/ProgressRing";
import EditGoalModal from "../components/EditGoalModal";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export default function Dashboard() {
  const d = useDashboardData();
  const [editOpen, setEditOpen] = useState(false);

  if (d.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-obsidian">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full border-2 border-cyber/30 border-t-cyber animate-spin" />
          <div className="label mt-4 text-cyber">LOADING YOUR DAY</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian text-white px-4 sm:px-8 lg:px-12 py-8 relative">
      <div className="pointer-events-none absolute top-0 left-1/3 w-[600px] h-[600px] rounded-full bg-cyber/[0.04] blur-[160px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-violet/[0.05] blur-[140px]" />

      <div className="max-w-7xl mx-auto relative">
        <Header pct={d.stats.completion_pct} />

        {/* Top KPI strip */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6"
        >
          <motion.div variants={itemVariants} className="md:col-span-4">
            <div className="card-base p-6 flex items-center gap-6 min-h-[200px]">
              <ProgressRing pct={d.stats.completion_pct} />
              <div>
                <div className="label">COMPLETION</div>
                <div className="font-display font-bold text-2xl mt-1" data-testid="kpi-completion">
                  {d.stats.completed_today}/{d.stats.total_habits}
                </div>
                <div className="font-mono text-xs text-zinc-500 mt-1">habits done today</div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="md:col-span-4">
            <StreakCard streak={d.stats.streak} bestStreak={d.stats.best_streak} />
          </motion.div>

          <motion.div variants={itemVariants} className="md:col-span-4">
            <CountdownCard
              days={d.daysToExam}
              examName={d.settings.exam_name}
              onEdit={() => setEditOpen(true)}
            />
          </motion.div>
        </motion.div>

        {/* Main row */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 mt-6"
        >
          <motion.div variants={itemVariants} className="lg:col-span-5">
            <HabitsCard
              habits={d.habits}
              toggleHabit={d.toggleHabit}
              addHabit={d.addHabit}
              removeHabit={d.removeHabit}
              stats={d.stats}
            />
          </motion.div>

          <motion.div variants={itemVariants} className="lg:col-span-7 space-y-6">
            <HeatmapCard heatmap={d.stats.heatmap} />
            <WeeklyCard weekly={d.stats.weekly} />
          </motion.div>
        </motion.div>

        {/* Timetable (today only) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-6"
        >
          <TimetableCard
            schedule={d.timetable}
            onAdd={d.addTimetableEntry}
            onRemove={d.removeTimetableEntry}
            onUpload={d.uploadTimetable}
          />
        </motion.div>

        <footer className="mt-12 pb-8 font-mono text-[10px] text-zinc-700 text-center tracking-widest">
          BUILT FOR DISCIPLINE · {(d.settings.exam_name || "GOAL").toUpperCase()} {new Date(d.settings.target_exam_date).getFullYear()}
        </footer>
      </div>

      <EditGoalModal
        open={editOpen}
        settings={d.settings}
        onClose={() => setEditOpen(false)}
        onSave={d.updateSettings}
      />
    </div>
  );
}
