import React from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { LogOut } from "lucide-react";

export default function Header({ pct }) {
  const { user, logout } = useAuth();
  const firstName = (user?.name || "Aspirant").split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex items-start sm:items-center justify-between gap-3 mb-6 sm:mb-8 w-full"
      data-testid="dashboard-header"
    >
      <div className="min-w-0 flex-1">
        <div className="label mb-1 truncate">CAT HABIT TRACKER · DASHBOARD</div>
        <h1 className="font-display font-black text-[clamp(1.6rem,6vw,3rem)] leading-[1.05] tracking-tighter break-words">
          {greeting},<br className="sm:hidden" />{" "}
          <span className="text-cyber">{firstName}</span>.
        </h1>
        <p className="font-body text-zinc-500 text-xs sm:text-sm mt-2 max-w-md leading-snug">
          {pct >= 80 ? "Elite mode — you're crushing it today." :
           pct >= 40 ? "Steady progress. Push through the last reps." :
           "Today is a blank canvas. Start with one win."}
        </p>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {user?.picture && (
          <img
            src={user.picture}
            alt={user.name}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-cyber/30"
            data-testid="user-avatar"
          />
        )}
        <button
          onClick={logout}
          aria-label="Logout"
          className="flex items-center justify-center gap-2 w-11 h-11 sm:w-auto sm:h-auto sm:px-4 sm:py-2 rounded-full border border-white/10 hover:border-cyber/40 hover:text-cyber font-mono text-xs tracking-wider transition-colors"
          data-testid="logout-btn"
        >
          <LogOut className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          <span className="hidden sm:inline">LOGOUT</span>
        </button>
      </div>
    </motion.header>
  );
}
