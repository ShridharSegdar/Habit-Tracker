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
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-obsidian">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full border-2 border-cyber/30 border-t-cyber animate-spin" />
          <div className="label mt-4 text-cyber">LOADING YOUR DAY</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-obsidian text-white relative">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute top-0 left-1/3 w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full bg-cyber/[0.04] blur-[160px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[60vw] h-[60vw] max-w-[500px] max-h-[500px] rounded-full bg-violet/[0.05] blur-[140px]" />

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8">
        <Header pct={d.stats.completion_pct} />

        {/* Top KPI strip — mobile: stack, tablet: 2-col with countdown spanning, desktop: 3-col */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6"
        >
          <motion.div variants={itemVariants} className="min-w-0">
            <div className="card-base p-5 sm:p-6 flex items-center gap-5 sm:gap-6 h-full min-h-[180px]">
              <ProgressRing pct={d.stats.completion_pct} />
              <div className="min-w-0">
                <div className="label">COMPLETION</div>
                <div className="font-display font-bold text-2xl mt-1 truncate" data-testid="kpi-completion">
                  {d.stats.completed_today}/{d.stats.total_habits}
                </div>
                <div className="font-mono text-[10px] sm:text-xs text-zinc-500 mt-1">habits done today</div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="min-w-0">
            <StreakCard streak={d.stats.streak} bestStreak={d.stats.best_streak} />
          </motion.div>

          <motion.div variants={itemVariants} className="min-w-0 sm:col-span-2 lg:col-span-1">
            <CountdownCard
              days={d.daysToExam}
              examName={d.settings.exam_name}
              onEdit={() => setEditOpen(true)}
            />
          </motion.div>
        </motion.div>

        {/* Main row — mobile: stack, tablet+: 2 cols, desktop: 5+7 cols */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 lg:gap-6 mt-4 sm:mt-5 lg:mt-6"
        >
          <motion.div variants={itemVariants} className="lg:col-span-5 min-w-0">
            <HabitsCard
              habits={d.habits}
              toggleHabit={d.toggleHabit}
              addHabit={d.addHabit}
              removeHabit={d.removeHabit}
              stats={d.stats}
            />
          </motion.div>

          <motion.div variants={itemVariants} className="lg:col-span-7 min-w-0 flex flex-col gap-4 sm:gap-5 lg:gap-6">
            <HeatmapCard heatmap={d.stats.heatmap} />
            <WeeklyCard weekly={d.stats.weekly} />
          </motion.div>
        </motion.div>

        {/* Timetable (today only) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-4 sm:mt-5 lg:mt-6"
        >
          <TimetableCard
            schedule={d.timetable}
            onAdd={d.addTimetableEntry}
            onRemove={d.removeTimetableEntry}
            onUpload={d.uploadTimetable}
          />
        </motion.div>

        <footer className="mt-10 sm:mt-12 pb-6 sm:pb-8 font-mono text-[10px] text-zinc-700 text-center tracking-widest">
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
