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
      className="flex items-center justify-between mb-8"
      data-testid="dashboard-header"
    >
      <div>
        <div className="label mb-1">CAT HABIT TRACKER · DASHBOARD</div>
        <h1 className="font-display font-black text-3xl lg:text-5xl tracking-tighter">
          {greeting}, <span className="text-cyber">{firstName}</span>.
        </h1>
        <p className="font-body text-zinc-500 text-sm mt-2 max-w-md">
          {pct >= 80 ? "Elite mode — you're crushing it today." :
           pct >= 40 ? "Steady progress. Push through the last reps." :
           "Today is a blank canvas. Start with one win."}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {user?.picture && (
          <img
            src={user.picture}
            alt={user.name}
            className="w-10 h-10 rounded-full border border-cyber/30"
            data-testid="user-avatar"
          />
        )}
        <button
          onClick={logout}
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:border-cyber/40 hover:text-cyber font-mono text-xs tracking-wider transition-colors"
          data-testid="logout-btn"
        >
          <LogOut className="w-3.5 h-3.5" /> LOGOUT
        </button>
      </div>
    </motion.header>
  );
}
