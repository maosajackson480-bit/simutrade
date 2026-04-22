import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Marquee from "react-fast-marquee";
import {
  ArrowRight, Shield, TrendingUp, BookOpen, BarChart2, Smartphone,
  Clock, Lock, Heart, CheckCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import LiveChartPreview from "../components/LiveChartPreview";

const TICKERS = [
  { sym: "VIX", val: "19.11", up: true },
  { sym: "VXN", val: "23.51", up: false },
  { sym: "OVX", val: "31.28", up: true },
  { sym: "GVZ", val: "14.87", up: false },
  { sym: "RVX", val: "27.43", up: true },
  { sym: "EVZ", val: "7.05", up: false },
  { sym: "VVIX", val: "99.11", up: true },
];

const FEATURES = [
  { icon: BarChart2, title: "Live charts with real market prices" },
  { icon: TrendingUp, title: "Instant buy & sell simulation" },
  { icon: Shield, title: "Track your profits and losses" },
  { icon: BookOpen, title: "Simple, beginner-friendly interface" },
];

const TRUST = [
  { icon: Lock, t: "Your data is safe" },
  { icon: Heart, t: "No real money used in demo mode" },
  { icon: CheckCircle, t: "Transparent and beginner-friendly" },
];

export default function LandingPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [guestLoading, setGuestLoading] = useState(false);

  const goDemo = async () => {
    if (user) return navigate("/dashboard");
    setGuestLoading(true);
    try {
      const API = process.env.REACT_APP_BACKEND_URL;
      const res = await fetch(`${API}/api/auth/guest`, { method: "POST" });
      const data = await res.json();
      if (data.token) {
        login(data.user, data.token);
        navigate("/dashboard");
      }
    } finally {
      setGuestLoading(false);
    }
  };

  const goReal = () => navigate(user ? "/brokers" : "/auth?next=/brokers");

  // Reusable primary/secondary CTAs
  const PrimaryCTA = ({ testid, label }) => (
    <button onClick={goDemo} disabled={guestLoading} data-testid={testid}
      className="inline-flex items-center gap-2 bg-[#E07A5F] text-white px-7 py-3.5 rounded-xl text-base font-medium hover:bg-[#D36649] active:scale-[0.98] transition-all duration-200 shadow-card disabled:opacity-70">
      {guestLoading ? "Starting…" : (label || "Start Demo Trading")}
      <ArrowRight size={17} strokeWidth={2} />
    </button>
  );

  const SecondaryCTA = ({ testid, label }) => (
    <button onClick={goReal} data-testid={testid}
      className="inline-flex items-center gap-2 bg-[#1B263B] text-white px-7 py-3.5 rounded-xl text-base font-medium hover:bg-[#2B3A55] active:scale-[0.98] transition-all duration-200">
      {label || "Go Live with Real Trading"}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F0] font-manrope text-[#1B263B]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#F5F5F0]/90 backdrop-blur-xl border-b border-[#E5E5DF]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#1B263B] rounded-lg flex items-center justify-center">
              <span className="text-white font-outfit font-medium text-sm">S</span>
            </div>
            <span className="font-outfit text-lg font-medium text-[#1B263B]">SimuTrade</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/learn" className="text-sm text-[#415A77] hover:text-[#1B263B] transition-colors">Learn</Link>
            <Link to="/terms" className="text-sm text-[#415A77] hover:text-[#1B263B] transition-colors">Legal</Link>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <button onClick={() => navigate("/dashboard")} data-testid="nav-dashboard-cta"
                className="bg-[#1B263B] text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-[#2B3A55] transition-colors">
                Dashboard
              </button>
            ) : (
              <>
                <Link to="/auth" data-testid="nav-login" className="text-sm text-[#415A77] hover:text-[#1B263B] transition-colors">Sign In</Link>
                <button onClick={goDemo} data-testid="nav-signup"
                  className="bg-[#E07A5F] text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-[#D36649] transition-colors">
                  Start Free
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Global disclaimer */}
      <div className="bg-[#FCF6DF] border-b border-[#E3B505]/30 text-center py-2 px-4">
        <p className="text-xs text-[#1B263B] font-medium">
          Simulation Platform Only — All demo trades use virtual currency. No real financial transactions in demo mode.
        </p>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden" data-testid="hero-section">
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
              className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-[#1B263B] bg-[#F9EAE6] border border-[#E07A5F]/30 rounded-full px-4 py-1.5 mb-7">
                <Clock size={12} /> Start in 5 Seconds
              </span>
              <h1 className="font-outfit text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.04] mb-5 text-[#1B263B]">
                Start Trading in 5 Seconds —{" "}
                <span className="text-[#E07A5F]">No Risk, No Signup</span>
              </h1>
              <p className="text-base md:text-lg text-[#415A77] leading-relaxed max-w-xl lg:mx-0 mx-auto mb-8">
                Practice with real market data, learn fast, then switch to real trading when you're ready.
              </p>
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-5">
                <PrimaryCTA testid="hero-cta-demo" label="Start Demo Trading" />
                <SecondaryCTA testid="hero-cta-real" label="Go Live with Real Trading" />
              </div>
              <p className="text-xs text-[#778DA9]">
                No signup required · Free demo balance · Beginner-friendly
              </p>
            </motion.div>

            {/* Live chart preview */}
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative w-full aspect-[16/11] lg:aspect-[4/3] max-w-xl mx-auto">
              {/* Decorative backdrop */}
              <div className="absolute -inset-6 bg-gradient-to-br from-[#F9EAE6] via-transparent to-[#EAF0E4] rounded-3xl -z-0 blur-xl opacity-70" />
              <div className="relative z-10 w-full h-full">
                <LiveChartPreview />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Ticker strip */}
      <div className="border-y border-[#E5E5DF] bg-white py-3">
        <Marquee speed={28} gradient={false} pauseOnHover>
          {TICKERS.map((t, i) => (
            <span key={i} className="mx-10 text-xs font-outfit font-medium tracking-widest uppercase text-[#778DA9]">
              <span className="text-[#1B263B] font-medium">{t.sym}</span>
              <span className="mx-1.5 text-[#E5E5DF]">·</span>
              <span className="font-mono text-[#415A77]">{t.val}</span>
              <span className={`ml-1.5 font-mono text-xs ${t.up ? "text-[#426B1F]" : "text-[#9E2A2B]"}`}>
                {t.up ? "▲" : "▼"}
              </span>
              <span className="ml-8 text-[#E5E5DF]">|</span>
            </span>
          ))}
        </Marquee>
      </div>

      {/* SECTION 2 — Show what they get */}
      <section className="py-24 px-6" data-testid="section-features">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <motion.h2 initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="font-outfit text-3xl md:text-4xl font-medium text-[#1B263B] mb-4 tracking-tight">
              Everything You Need to Trade — Without Losing Money
            </motion.h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                className="bg-white border border-[#E5E5DF] rounded-2xl p-6 flex items-start gap-4 card-hover">
                <div className="w-11 h-11 bg-[#F9EAE6] rounded-xl flex items-center justify-center shrink-0">
                  <f.icon size={20} className="text-[#E07A5F]" strokeWidth={1.8} />
                </div>
                <p className="font-outfit text-base font-medium text-[#1B263B] pt-2">{f.title}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center">
            <PrimaryCTA testid="features-cta" label="Try It Now (Demo)" />
          </div>
        </div>
      </section>

      {/* SECTION 3 — Education angle */}
      <section className="py-24 px-6 bg-white border-y border-[#E5E5DF]" data-testid="section-education">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-outfit text-3xl md:text-4xl font-medium text-[#1B263B] mb-6 tracking-tight">
            Learn Before You Risk Real Money
          </h2>
          <p className="text-lg text-[#415A77] leading-relaxed mb-10 max-w-2xl mx-auto">
            Most people lose money because they jump in blindly. This platform lets you practice,
            understand trades, and build confidence first.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {["No risk", "No pressure", "Learn at your own pace"].map((t) => (
              <span key={t} className="inline-flex items-center gap-2 bg-[#EAF0E4] border border-[#426B1F]/30 text-[#426B1F] px-4 py-2 rounded-full text-sm font-medium">
                <CheckCircle size={14} /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — Monetization push */}
      <section className="py-24 px-6" data-testid="section-monetization">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-[#1B263B] rounded-3xl p-10 md:p-14 text-center relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-[#E07A5F]/20 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h2 className="font-outfit text-3xl md:text-5xl font-medium text-white mb-5 tracking-tight">
                Ready to Trade for Real?
              </h2>
              <p className="text-lg text-[#778DA9] max-w-xl mx-auto mb-8 leading-relaxed">
                Once you're confident, switch to real trading and start earning from your skills.
              </p>
              <button onClick={goReal} data-testid="monetize-cta"
                className="inline-flex items-center gap-2 bg-[#E07A5F] text-white px-8 py-4 rounded-xl text-base font-medium hover:bg-[#D36649] active:scale-[0.98] transition-all shadow-card">
                Start Real Trading <ArrowRight size={18} strokeWidth={2} />
              </button>
              <p className="text-xs text-[#778DA9] mt-4">
                Real trading is powered by trusted external platforms.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 5 — How it works */}
      <section className="py-24 px-6 bg-white border-y border-[#E5E5DF]" data-testid="section-how-it-works">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-outfit text-3xl md:text-4xl font-medium text-[#1B263B] tracking-tight">
              How It Works
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: "1", t: "Click \"Start Demo Trading\"" },
              { n: "2", t: "Practice with virtual money" },
              { n: "3", t: "Switch to real trading anytime" },
            ].map((s, i) => (
              <motion.div key={s.n} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="bg-[#F5F5F0] border border-[#E5E5DF] rounded-2xl p-7 card-hover">
                <div className="w-10 h-10 bg-[#1B263B] text-white font-outfit font-medium rounded-xl flex items-center justify-center text-sm mb-4">
                  {s.n}
                </div>
                <p className="font-outfit text-base font-medium text-[#1B263B]">{s.t}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6 — Mobile */}
      <section className="py-24 px-6" data-testid="section-mobile">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="font-outfit text-3xl md:text-4xl font-medium text-[#1B263B] mb-5 tracking-tight">
              Trade Anywhere, Anytime
            </h2>
            <p className="text-lg text-[#415A77] leading-relaxed mb-6">
              Fully optimized for mobile — no downloads needed.
            </p>
            <PrimaryCTA testid="mobile-cta" label="Start on Mobile" />
          </div>
          <div className="bg-white border border-[#E5E5DF] rounded-3xl p-8 md:p-10 flex items-center justify-center">
            <div className="w-40 h-72 bg-[#1B263B] rounded-[2rem] p-3 shadow-card">
              <div className="bg-[#F5F5F0] rounded-[1.5rem] h-full flex flex-col items-center justify-center gap-3">
                <Smartphone size={28} className="text-[#E07A5F]" strokeWidth={1.5} />
                <p className="font-outfit text-xs text-[#1B263B] font-medium">SimuTrade</p>
                <p className="font-mono text-[10px] text-[#778DA9]">$10,000.00</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 — Trust & safety */}
      <section className="py-24 px-6 bg-white border-y border-[#E5E5DF]" data-testid="section-trust">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-outfit text-3xl md:text-4xl font-medium text-[#1B263B] mb-12 tracking-tight">
            Built on Trust
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TRUST.map((t, i) => (
              <motion.div key={t.t} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="bg-[#F5F5F0] border border-[#E5E5DF] rounded-2xl p-6 flex items-center gap-4">
                <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shrink-0 border border-[#E5E5DF]">
                  <t.icon size={18} className="text-[#1B263B]" strokeWidth={1.8} />
                </div>
                <p className="font-outfit text-base font-medium text-[#1B263B] text-left">{t.t}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-28 px-6 bg-[#F5F5F0]" data-testid="final-cta">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2 initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="font-outfit text-4xl md:text-6xl font-medium text-[#1B263B] mb-10 tracking-tight leading-[1.05]">
            Stop Watching.{" "}
            <span className="text-[#E07A5F]">Start Trading.</span>
          </motion.h2>
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={goDemo} disabled={guestLoading} data-testid="final-cta-demo"
              className="inline-flex items-center gap-2 bg-[#E07A5F] text-white px-10 py-4 rounded-xl text-lg font-medium hover:bg-[#D36649] active:scale-[0.98] transition-all shadow-card disabled:opacity-70">
              {guestLoading ? "Starting…" : "Start Demo Trading Now"} <ArrowRight size={20} strokeWidth={2} />
            </button>
            <button onClick={goReal} data-testid="final-cta-real"
              className="inline-flex items-center gap-2 bg-[#1B263B] text-white px-10 py-4 rounded-xl text-lg font-medium hover:bg-[#2B3A55] active:scale-[0.98] transition-all">
              Go Live with Real Trading
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1B263B] text-white py-14 px-6" data-testid="footer">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <span className="font-outfit font-medium text-sm">S</span>
                </div>
                <span className="font-outfit text-lg font-medium">SimuTrade</span>
              </div>
              <p className="text-sm text-[#778DA9] max-w-md leading-relaxed">
                A trading simulation platform — built for learning, built for clarity.
              </p>
            </div>
            <div className="flex gap-8 text-sm">
              <Link to="/terms" className="text-[#778DA9] hover:text-white transition-colors">Terms</Link>
              <Link to="/privacy" className="text-[#778DA9] hover:text-white transition-colors">Privacy</Link>
              <Link to="/learn" className="text-[#778DA9] hover:text-white transition-colors">Learn</Link>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 space-y-2">
            <p className="text-xs text-[#778DA9] leading-relaxed">
              <strong className="text-white">Disclaimer:</strong> This is a trading simulation platform.
              Real trading is executed via third-party providers. Not affiliated with any external trading company.
              All simulated trading uses virtual currency — no real financial transactions occur in demo mode.
              Real trading carries risk; only trade what you can afford to lose.
            </p>
            <p className="text-xs text-[#778DA9]">© {new Date().getFullYear()} SimuTrade · Terms | Privacy Policy</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
