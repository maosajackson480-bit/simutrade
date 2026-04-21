import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, BarChart2, ArrowRight, Activity } from "lucide-react";
import Layout from "../components/Layout";
import api from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import { useMode } from "../contexts/ModeContext";

function MetricCard({ label, value, sub, colorClass = "text-[#0A2540]", i = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
      className="bg-white border border-slate-200 rounded-xl p-6 shadow-card">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{label}</p>
      <p className={`font-outfit text-2xl font-semibold mb-1 ${colorClass}`} data-testid={`metric-${label.toLowerCase().replace(/\s+/g, "-")}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </motion.div>
  );
}

export default function DashboardPage() {
  const [portfolio, setPortfolio] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isDemo } = useMode();
  const navigate = useNavigate();

  useEffect(() => {
    const load = () =>
      Promise.all([api.get("/portfolio/summary"), api.get("/market/quotes"), api.get("/trading/positions")])
        .then(([p, q, pos]) => {
          setPortfolio(p.data); setQuotes(q.data); setPositions(pos.data.slice(0, 5));
        }).finally(() => setLoading(false));
    load();
    // Real-time polling every 30s for near-live VIX ticks
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const pct = portfolio?.total_return_pct ?? 0;
  const fmt = (n) => `$${(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Live mode banner */}
        {!isDemo && (
          <div className="mb-6 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3">
            <div className="flex items-center gap-2.5">
              <Activity size={16} className="text-emerald-600" strokeWidth={2} />
              <p className="text-sm font-semibold text-emerald-700">Live Mode Active</p>
              <span className="text-sm text-emerald-600">— Real trading is via broker partners.</span>
            </div>
            <button onClick={() => navigate("/brokers")}
              className="text-xs font-semibold text-emerald-700 bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-1">
              View Brokers <ArrowRight size={12} />
            </button>
          </div>
        )}

        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-outfit text-3xl font-semibold text-[#0A2540]">
              Good to see you, {user?.name?.split(" ")[0] || "Trader"}
            </h1>
            <p className="text-slate-400 text-sm mt-1 font-inter">
              {isDemo ? "Virtual portfolio overview" : "Live mode — practice data shown below"}
            </p>
          </div>
          <button onClick={() => navigate(isDemo ? "/trading" : "/brokers")} data-testid="header-trade-btn"
            className="hidden md:flex items-center gap-2 bg-[#0A2540] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#051A2E] transition-colors shadow-button">
            {isDemo ? "Open Trade" : "Live Brokers"} <ArrowRight size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard label="Portfolio Value" value={fmt(portfolio?.total_portfolio_value ?? 10000)} sub="Total virtual" i={0} />
          <MetricCard label="Cash Balance" value={fmt(portfolio?.cash_balance ?? 10000)} sub="Available" i={1} />
          <MetricCard
            label="Total Return"
            value={`${pct >= 0 ? "+" : ""}${fmt(portfolio?.total_return ?? 0)}`}
            sub="vs. $10K start"
            colorClass={pct > 0 ? "text-emerald-600" : pct < 0 ? "text-red-500" : "text-[#0A2540]"}
            i={2}
          />
          <MetricCard
            label="Return %"
            value={`${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`}
            sub={`${portfolio?.total_trades ?? 0} closed trades`}
            colorClass={pct > 0 ? "text-emerald-600" : pct < 0 ? "text-red-500" : "text-[#0A2540]"}
            i={3}
          />
        </div>

        {/* Market + Quick */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-outfit text-base font-semibold text-[#0A2540]">Volatility Watchlist</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full live-dot" />
                <span className="text-xs text-slate-400">Live</span>
              </div>
            </div>
            {loading ? (
              <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-11 shimmer rounded-lg" />)}</div>
            ) : (
              <table className="w-full" data-testid="watchlist-table">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Index</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Price</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((q) => (
                    <tr key={q.symbol} onClick={() => navigate(isDemo ? "/trading" : "/brokers", { state: { symbol: q.symbol } })}
                      className="border-b border-slate-50 hover:bg-[#F8F9FA] cursor-pointer transition-colors"
                      data-testid={`watchlist-row-${q.display}`}>
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-outfit text-sm font-semibold text-[#0A2540]">{q.display}</span>
                          <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">{q.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-sm font-medium text-[#0A2540]">
                        {q.price > 0 ? q.price.toFixed(2) : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-mono text-sm font-semibold ${q.change_pct >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {q.change_pct >= 0 ? "+" : ""}{q.change_pct.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Right panel */}
          <div className="bg-[#0A2540] rounded-xl p-6 flex flex-col shadow-card">
            <h2 className="font-outfit text-base font-semibold text-white mb-1">
              {isDemo ? "Practice Account" : "Live Trading"}
            </h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              {isDemo
                ? "Trade volatility indices with your virtual balance. No real money."
                : "Access real broker platforms. SimuTrade doesn't execute real trades."}
            </p>
            <div className="space-y-3 flex-1">
              {(isDemo
                ? [
                    [fmt(portfolio?.cash_balance ?? 10000), "Available Cash"],
                    [(portfolio?.open_positions ?? 0) + " open", "Positions"],
                    [(portfolio?.total_trades ?? 0) + " done", "Trades"],
                  ]
                : [
                    ["6 Partners", "Broker Options"],
                    ["Commission-free", "Some Platforms"],
                    ["Secure", "OAuth Login"],
                  ]
              ).map(([v, l]) => (
                <div key={l} className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-xs text-slate-300">{l}</span>
                  <span className="font-mono text-sm text-white font-medium">{v}</span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate(isDemo ? "/trading" : "/brokers")} data-testid="quick-trade-btn"
              className="flex items-center justify-center gap-2 bg-emerald-500 text-white py-3 rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-colors mt-6">
              {isDemo ? "Open Position" : "View Brokers"} <ArrowRight size={15} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Positions */}
        {positions.length > 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-outfit text-base font-semibold text-[#0A2540]">Open Positions</h2>
              <button onClick={() => navigate("/portfolio")}
                className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1">
                View all <ArrowRight size={12} />
              </button>
            </div>
            <div className="divide-y divide-slate-50">
              {positions.map((pos) => (
                <div key={pos.position_id} className="px-6 py-4 flex items-center justify-between hover:bg-[#F8F9FA] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-outfit font-semibold text-sm text-[#0A2540]">{pos.symbol?.replace("^", "")}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      pos.direction === "long" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                    }`}>{pos.direction?.toUpperCase()}</span>
                    <span className="text-xs text-slate-400">{pos.contracts} × {pos.entry_price?.toFixed(2)}</span>
                  </div>
                  <span className={`font-mono text-sm font-semibold ${(pos.unrealized_pnl ?? 0) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {(pos.unrealized_pnl ?? 0) >= 0 ? "+" : ""}${Math.abs(pos.unrealized_pnl ?? 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : !loading && (
          <div className="border border-dashed border-slate-200 rounded-xl p-12 text-center bg-[#F8F9FA]">
            <Wallet size={32} strokeWidth={1} className="text-slate-300 mx-auto mb-3" />
            <p className="font-outfit font-semibold text-slate-500 mb-1">No open positions</p>
            <p className="text-sm text-slate-400 mb-5">Open your first position in the trading terminal.</p>
            <button onClick={() => navigate(isDemo ? "/trading" : "/brokers")} data-testid="no-positions-trade-btn"
              className="bg-[#0A2540] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#051A2E] transition-colors">
              {isDemo ? "Start Trading" : "View Brokers"}
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
