import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import { Mail, Lock, User as UserIcon, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, apiErr } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      if (mode === "register") {
        if (!name.trim()) throw new Error("Name is required");
        const { data } = await api.post("/auth/register", { email, password, name });
        setUser(data);
      } else {
        const { data } = await api.post("/auth/login", { email, password });
        setUser(data);
      }
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setErr(apiErr(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-obsidian flex items-center justify-center px-4 sm:px-6 py-12">
      {/* Background image */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: "url(https://images.pexels.com/photos/6066072/pexels-photo-6066072.jpeg)",
          backgroundSize: "cover", backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-obsidian/95 via-obsidian/90 to-obsidian" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-cyber/10 blur-[120px]" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-violet/10 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 max-w-5xl w-full items-center"
      >
        {/* Left: brand */}
        <div>
          <div className="label mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyber pulse-dot" />
            HABIT TRACKER · v2.0
          </div>
          <h1 className="font-display font-black text-5xl sm:text-6xl leading-[0.95] tracking-tighter mb-6">
            Daily<br />
            <span className="text-cyber">Discipline.</span><br />
            Built for Goals.
          </h1>
          <p className="font-body text-zinc-400 max-w-sm leading-relaxed mb-8">
            Track your habits. Watch your streaks ignite. Dominate every day until exam day — whether it&apos;s CAT, GMAT, GATE, UPSC, or your own goal.
          </p>
          <div className="hidden lg:grid grid-cols-2 gap-3 font-mono text-xs text-zinc-500">
            <div>· 3D streak visualizer</div>
            <div>· Editable goal & date</div>
            <div>· 30-day heatmap</div>
            <div>· CSV / XLSX / JSON import</div>
            <div>· Confetti rewards</div>
            <div>· Multi-device sync</div>
          </div>
        </div>

        {/* Right: auth card */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="bg-ink/80 backdrop-blur-xl border border-white/[0.07] rounded-2xl p-6 sm:p-8 shadow-2xl">
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-black/40 rounded-xl mb-6">
              {["login", "register"].map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setErr(""); }}
                  className={`flex-1 py-2 rounded-lg font-mono text-xs tracking-wider uppercase transition-colors ${
                    mode === m ? "bg-cyber text-black" : "text-zinc-500 hover:text-white"
                  }`}
                  data-testid={`auth-tab-${m}`}
                >
                  {m === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-4">
              <AnimatePresence initial={false}>
                {mode === "register" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-3 py-3 bg-black/60 border border-white/10 rounded-xl text-white text-sm focus:border-cyber focus:outline-none transition-colors"
                        data-testid="auth-name-input"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-black/60 border border-white/10 rounded-xl text-white text-sm focus:border-cyber focus:outline-none transition-colors"
                  data-testid="auth-email-input"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-black/60 border border-white/10 rounded-xl text-white text-sm focus:border-cyber focus:outline-none transition-colors"
                  data-testid="auth-password-input"
                  minLength={6}
                  required
                />
              </div>

              {err && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-danger text-xs font-mono"
                  data-testid="auth-error"
                >{err}</motion.div>
              )}

              <motion.button
                type="submit"
                disabled={busy}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cyber text-black font-semibold font-body text-sm hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] transition-shadow disabled:opacity-60"
                data-testid="auth-submit-btn"
              >
                {busy ? "Working…" : mode === "login" ? "Sign In" : "Create Account"}
                {!busy && <ArrowRight className="w-4 h-4" />}
              </motion.button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-white/5" />
              <span className="font-mono text-[10px] text-zinc-600 tracking-wider">OR</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <div className="space-y-3">
              <button
                onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl border border-white/10 hover:border-cyber/40 bg-black/40 text-white font-body text-sm transition-colors"
                data-testid="login-with-google-btn"
              >
                <FcGoogle className="w-5 h-5" />
                Continue with Google
              </button>

              <button
                disabled
                title="Apple Sign-In — Coming soon"
                className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl border border-white/5 bg-black/20 text-zinc-600 font-body text-sm cursor-not-allowed relative"
                data-testid="login-with-apple-btn"
              >
                <FaApple className="w-5 h-5" />
                Sign in with Apple
                <span className="absolute right-3 text-[9px] font-mono tracking-wider text-zinc-700 uppercase border border-zinc-700 rounded px-1.5 py-0.5">Soon</span>
              </button>
            </div>
          </div>

          <p className="text-center font-mono text-[10px] text-zinc-700 mt-6 tracking-wider">
            BY CONTINUING YOU AGREE TO THE FOCUS PROTOCOL
          </p>
        </div>
      </motion.div>
    </div>
  );
}
