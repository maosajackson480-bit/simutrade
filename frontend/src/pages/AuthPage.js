import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, Chrome } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/api";

export default function AuthPage() {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const update = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleGoogle = () => {
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const ep = tab === "login" ? "/auth/login" : "/auth/register";
      const body = tab === "login" ? { email: form.email, password: form.password } : form;
      const res = await api.post(ep, body);
      login(res.data.user, res.data.token);
      navigate(res.data.user.onboarding_complete ? "/dashboard" : "/onboarding");
    } catch (err) {
      const d = err.response?.data?.detail;
      setError(typeof d === "string" ? d : "Something went wrong. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white flex font-inter">
      <div className="hidden lg:flex lg:w-5/12 bg-[#1B263B] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url('https://static.prod-images.emergentagent.com/jobs/665453e7-75d6-45f5-8709-92527a0aed60/images/8416bbb983af3d725369b77c67c3ea95cf1e6b2f4308940c69041dbfbb456aec.png')`,
          backgroundSize: "cover", backgroundPosition: "center",
        }} />
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white font-outfit font-bold">S</span>
            </div>
            <span className="font-outfit text-xl font-semibold text-white">SimuTrade</span>
          </Link>
        </div>
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="font-outfit text-4xl font-semibold text-white leading-tight mb-4">
              Learn volatility trading.<br /><span className="text-[#E07A5F]">Risk-free.</span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">Practice with CBOE volatility indices using virtual currency.</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[["$10K", "Virtual Balance"], ["7", "Indices"], ["Free", "Forever"]].map(([v, l]) => (
              <div key={l} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="font-outfit text-xl font-semibold text-white">{v}</p>
                <p className="text-xs text-slate-400 mt-0.5">{l}</p>
              </div>
            ))}
          </div>
          <div className="bg-amber-500/10 border border-amber-400/20 rounded-xl p-4">
            <p className="text-xs text-amber-300">Simulation only — no real money. Not affiliated with CBOE or any broker.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-[#F5F5F0]">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-[#1B263B] rounded-lg flex items-center justify-center">
              <span className="text-white font-outfit font-bold text-sm">S</span>
            </div>
            <span className="font-outfit text-lg font-semibold text-[#1B263B]">SimuTrade</span>
          </Link>

          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-card">
            <h1 className="font-outfit text-2xl font-semibold text-[#1B263B] mb-1">
              {tab === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-slate-500 text-sm mb-7">
              {tab === "login" ? "Sign in to your SimuTrade account." : "Start learning volatility trading for free."}
            </p>

            <div className="flex bg-slate-100 rounded-xl p-0.5 mb-6">
              {["login", "register"].map((t) => (
                <button key={t} onClick={() => { setTab(t); setError(""); }} data-testid={`auth-tab-${t}`}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    tab === t ? "bg-white text-[#1B263B] shadow-sm" : "text-slate-400 hover:text-slate-600"
                  }`}>
                  {t === "login" ? "Sign In" : "Register"}
                </button>
              ))}
            </div>

            <button onClick={handleGoogle} data-testid="google-auth-btn"
              className="w-full flex items-center justify-center gap-3 border border-slate-200 bg-white rounded-xl py-3 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all mb-5">
              <Chrome size={18} strokeWidth={1.5} />Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs text-slate-400 font-medium">or</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {tab === "register" && (
                  <motion.div key="name" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                    <div className="relative">
                      <User size={15} strokeWidth={1.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" value={form.name} onChange={update("name")} placeholder="Alex Johnson"
                        required={tab === "register"} data-testid="register-name-input"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B263B]/15 focus:border-[#1B263B] transition-all" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={15} strokeWidth={1.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" value={form.email} onChange={update("email")} placeholder="you@example.com"
                    required data-testid="auth-email-input"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B263B]/15 focus:border-[#1B263B] transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={15} strokeWidth={1.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type={showPw ? "text" : "password"} value={form.password} onChange={update("password")}
                    placeholder="Min. 6 characters" required minLength={6} data-testid="auth-password-input"
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B263B]/15 focus:border-[#1B263B] transition-all" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPw ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
                  </button>
                </div>
              </div>

              {error && (
                <div data-testid="auth-error" className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600 font-medium">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} data-testid="auth-submit-btn"
                className="w-full bg-[#1B263B] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#051A2E] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? "Please wait..." : tab === "login" ? "Sign In" : "Create Account"}
              </button>
            </form>

            <p className="text-center text-xs text-slate-400 mt-5">
              By continuing, you agree to our{" "}
              <Link to="/terms" className="text-slate-600 hover:text-slate-900 underline">Terms</Link> and{" "}
              <Link to="/privacy" className="text-slate-600 hover:text-slate-900 underline">Privacy Policy</Link>.
            </p>
            <p className="text-center text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg py-2 px-3 mt-3">
              Simulation platform — no real money involved
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
