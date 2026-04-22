import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Marquee from "react-fast-marquee";
import { ArrowRight, Shield, TrendingUp, BookOpen, BarChart2, Zap, ChevronRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

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
  { icon: BarChart2, title: "7 Volatility Indices", desc: "Trade VIX, VXN, OVX, GVZ, RVX, EVZ, and VVIX with real CBOE market data." },
  { icon: Shield, title: "Zero Risk", desc: "Start with $10,000 in virtual currency. Learn professional strategies without financial exposure." },
  { icon: BookOpen, title: "Learning Center", desc: "Guided tutorials on volatility mechanics, trading strategy, and risk management." },
  { icon: TrendingUp, title: "Long & Short", desc: "Bet on volatility rising or falling. Explore both directions of the market." },
  { icon: Zap, title: "Real-Time Data", desc: "Live prices from Yahoo Finance. No simulated or stale data." },
  { icon: ChevronRight, title: "Mode Switching", desc: "Practice in Demo mode, then step up to Live mode with broker partner links." },
];

const STEPS = [
  { n: "01", t: "Create Free Account", d: "Sign up in seconds. No payment or credit card required." },
  { n: "02", t: "Complete Onboarding", d: "Set your experience level and complete a 3-minute orientation." },
  { n: "03", t: "Trade & Learn", d: "Open positions on live volatility data. Track your P&L in real-time." },
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

  return (
    <div className="min-h-screen bg-white font-inter">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#1B263B] rounded-lg flex items-center justify-center">
              <span className="text-white font-outfit font-bold text-sm">S</span>
            </div>
            <span className="font-outfit text-lg font-semibold text-[#1B263B]">SimuTrade</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/learn" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Learn</Link>
            <Link to="/terms" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Legal</Link>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <button onClick={() => navigate("/dashboard")} data-testid="nav-dashboard-cta"
                className="bg-[#1B263B] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#051A2E] transition-colors shadow-button">
                Dashboard
              </button>
            ) : (
              <>
                <Link to="/auth" data-testid="nav-login" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Sign In</Link>
                <Link to="/auth" data-testid="nav-signup"
                  className="bg-[#1B263B] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#051A2E] transition-colors shadow-button">
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Disclaimer */}
      <div className="bg-amber-50 border-b border-amber-100 text-center py-2 px-4">
        <p className="text-xs text-amber-700 font-medium">
          Simulation Platform Only — All trades use virtual currency. No real financial transactions.
        </p>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url('${process.env.PUBLIC_URL}/grid.svg')`,
            backgroundSize: "40px 40px",
          }}
        />
        <div
          className="absolute right-0 top-0 w-1/2 h-full opacity-40"
          style={{
            backgroundImage: `url('https://static.prod-images.emergentagent.com/jobs/665453e7-75d6-45f5-8709-92527a0aed60/images/56ce5b489ce823c85513cc281e1843c75566586a51f60abfa5266ff703637928.png')`,
            backgroundSize: "cover",
            backgroundPosition: "left center",
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 md:py-36">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#1B263B] bg-slate-100 border border-slate-200 rounded-full px-4 py-1.5 mb-8">
              Free Volatility Trading Simulator
            </span>
            <h1 className="font-outfit text-5xl sm:text-6xl lg:text-7xl font-medium text-[#1B263B] tracking-tight leading-[1.05] mb-6">
              Master Volatility.<br />
              <span className="text-[#E07A5F]">Without the Risk.</span>
            </h1>
            <p className="text-lg text-[#415A77] leading-relaxed max-w-2xl mb-10 font-manrope">
              Trade CBOE volatility indices — VIX, VXN, OVX, and more — using $10,000 in virtual currency.
              Zero signup friction. Connect Deriv later for real execution.
            </p>
            <div className="flex flex-wrap gap-3 mb-10">
              <button onClick={goDemo} disabled={guestLoading} data-testid="hero-cta-demo"
                className="flex items-center gap-2 bg-[#E07A5F] text-white px-7 py-3.5 rounded-xl text-base font-medium hover:bg-[#D36649] active:scale-[0.98] transition-all duration-200 shadow-card disabled:opacity-70">
                {guestLoading ? "Starting..." : "Start Demo Trading"} <ArrowRight size={17} strokeWidth={2} />
              </button>
              <button onClick={goReal} data-testid="hero-cta-real"
                className="flex items-center gap-2 bg-[#1B263B] text-white px-7 py-3.5 rounded-xl text-base font-medium hover:bg-[#2B3A55] active:scale-[0.98] transition-all duration-200">
                Start Real Trading
              </button>
              <Link to="/learn" data-testid="hero-cta-learn"
                className="flex items-center gap-2 bg-white text-[#1B263B] border-2 border-[#E5E5DF] px-7 py-3.5 rounded-xl text-base font-medium hover:border-[#1B263B] transition-all duration-200">
                Learning Center
              </Link>
            </div>
            <p className="text-xs text-[#778DA9] mb-10">
              No signup required for demo. Real trading is executed via <span className="font-semibold text-[#1B263B]">Deriv</span> — we never hold funds.
            </p>
            <div className="flex flex-wrap gap-10">
              {[["7", "Volatility Indices"], ["$10K", "Virtual Balance"], ["0s", "Signup Time"]].map(([v, l]) => (
                <div key={l}>
                  <p className="font-outfit text-2xl font-medium text-[#1B263B]">{v}</p>
                  <p className="text-sm text-[#778DA9] mt-0.5">{l}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Ticker */}
      <div className="border-y border-slate-100 bg-slate-50 py-3">
        <Marquee speed={28} gradient={false} pauseOnHover>
          {TICKERS.map((t, i) => (
            <span key={i} className="mx-10 text-xs font-outfit font-medium tracking-widest uppercase text-slate-400">
              <span className="text-[#1B263B] font-semibold">{t.sym}</span>
              <span className="mx-1.5 text-slate-300">·</span>
              <span className="font-mono text-slate-600">{t.val}</span>
              <span className={`ml-1.5 font-mono text-xs ${t.up ? "text-[#426B1F]" : "text-red-400"}`}>
                {t.up ? "▲" : "▼"}
              </span>
              <span className="ml-8 text-slate-200">|</span>
            </span>
          ))}
        </Marquee>
      </div>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="font-outfit text-4xl font-semibold text-[#1B263B] mb-4">
              Everything you need to learn volatility
            </motion.h2>
            <p className="text-slate-500 max-w-xl mx-auto text-base">
              Professional-grade tools and real market data — built for beginners.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="bg-white border border-slate-200 rounded-xl p-6 card-hover">
                <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center mb-4">
                  <f.icon size={20} strokeWidth={1.5} className="text-[#1B263B]" />
                </div>
                <h3 className="font-outfit text-base font-semibold text-[#1B263B] mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-[#F5F5F0]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-outfit text-4xl font-semibold text-[#1B263B] mb-4">Up and running in minutes</h2>
            <p className="text-slate-500 max-w-md mx-auto">Three steps to start your volatility trading journey.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <motion.div key={s.n} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="font-outfit text-5xl font-bold text-slate-200 mb-4 select-none">{s.n}</div>
                <h3 className="font-outfit text-xl font-semibold text-[#1B263B] mb-3">{s.t}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.d}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-14">
            <button onClick={goDemo} data-testid="steps-cta"
              className="inline-flex items-center gap-2 bg-[#426B1F] text-white px-10 py-4 rounded-xl font-semibold hover:bg-[#D36649] transition-all hover:shadow-lg duration-200">
              Start Simulating Now <ArrowRight size={17} strokeWidth={2} />
            </button>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-16 px-6 border-y border-slate-100">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-6">Market Data Provided By</p>
          <div className="flex items-center justify-center gap-12 flex-wrap">
            {["CBOE Global Markets", "Yahoo Finance API", "S&P 500 Data"].map((p) => (
              <span key={p} className="font-outfit text-sm font-medium text-slate-400">{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-[#1B263B]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-outfit text-4xl font-semibold text-white mb-5">
            Ready to learn volatility trading?
          </h2>
          <p className="text-slate-400 mb-10 text-base">
            Join thousands of learners mastering volatility indices — completely risk-free.
          </p>
          <button onClick={goDemo}
            className="bg-[#426B1F] text-white px-10 py-4 rounded-xl font-semibold text-base hover:bg-[#D36649] transition-colors inline-flex items-center gap-2">
            Create Free Account <ArrowRight size={17} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-10">
            <p className="text-xs text-amber-700 leading-relaxed">
              <span className="font-semibold">Disclaimer:</span> SimuTrade is a <strong>simulation platform only</strong>.
              All trading uses virtual currency with no real financial impact. This is not financial advice.
              SimuTrade is <strong>not affiliated</strong> with CBOE Global Markets, NYSE, or any real trading platform.
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-[#1B263B] rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-xs font-outfit">S</span>
              </div>
              <span className="font-outfit font-semibold text-[#1B263B]">SimuTrade</span>
              <span className="text-slate-300 text-sm">·</span>
              <span className="text-xs text-slate-400">Not affiliated with any real trading platform</span>
            </div>
            <div className="flex gap-6 text-sm text-slate-400">
              <Link to="/learn" className="hover:text-slate-700 transition-colors">Learn</Link>
              <Link to="/terms" className="hover:text-slate-700 transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-slate-700 transition-colors">Privacy</Link>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} SimuTrade. Educational simulation platform. All virtual.
          </div>
        </div>
      </footer>
    </div>
  );
}
