import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Info, X, CheckCircle, Sparkles } from "lucide-react";
import Layout from "../components/Layout";
import api from "../utils/api";
import { useAuth } from "../contexts/AuthContext";

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-md">
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="font-outfit font-semibold text-[#0A2540] text-sm">{payload[0]?.value?.toFixed(2)}</p>
    </div>
  );
}

export default function TradingPage() {
  const location = useLocation();
  const [indices, setIndices] = useState([]);
  const [selected, setSelected] = useState(location.state?.symbol || "^VIX");
  const [chartData, setChartData] = useState([]);
  const [period, setPeriod] = useState("1mo");
  const [positions, setPositions] = useState([]);
  const [direction, setDirection] = useState("long");
  const [contracts, setContracts] = useState("1");
  const [tradeLoading, setTradeLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [rationale, setRationale] = useState(null);
  const [rationaleLoading, setRationaleLoading] = useState(false);
  const { refreshUser } = useAuth();

  useEffect(() => {
    const loadQuotes = () => api.get("/market/quotes").then((r) => setIndices(r.data));
    loadQuotes();
    loadPositions();
    // Poll every 30s for near-live ticks
    const interval = setInterval(() => {
      loadQuotes();
      loadPositions();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { loadChart(); }, [selected, period]);

  const loadChart = () => {
    const s = selected.replace("^", "");
    api.get(`/market/history/${s}?period=${period}`).then((r) => setChartData(r.data.data || []));
  };
  const loadPositions = () => api.get("/trading/positions").then((r) => setPositions(r.data));

  const currentQuote = indices.find((q) => q.symbol === selected) || {};
  const price = currentQuote.price ?? 0;
  const cost = (parseFloat(contracts) || 0) * price;

  const handleTrade = async () => {
    const c = parseFloat(contracts);
    if (!c || c <= 0) return;
    setTradeLoading(true); setMsg(null); setRationale(null);
    try {
      const r = await api.post("/trading/open", { symbol: selected, direction, contracts: c });
      setMsg({ ok: true, text: `${direction.toUpperCase()} ${c}× ${selected.replace("^", "")} opened.` });
      await refreshUser();
      loadPositions();
      // Fetch AI rationale (non-blocking)
      setRationaleLoading(true);
      api.post("/ai/explain-trade", {
        symbol: selected, direction, entry_price: r.data.entry_price, contracts: c,
      })
        .then((res) => setRationale(res.data.rationale))
        .catch(() => {})
        .finally(() => setRationaleLoading(false));
    } catch (e) { setMsg({ ok: false, text: e.response?.data?.detail || "Trade failed" }); }
    finally { setTradeLoading(false); }
  };

  const handleClose = async (id) => {
    try {
      const r = await api.post(`/trading/close/${id}`);
      setMsg({ ok: true, text: `Closed. P&L: ${r.data.pnl >= 0 ? "+" : ""}$${r.data.pnl.toFixed(2)}` });
      await refreshUser();
      loadPositions();
    } catch (e) { setMsg({ ok: false, text: e.response?.data?.detail || "Failed to close" }); }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="font-outfit text-3xl font-semibold text-[#0A2540] mb-1">Trading Terminal</h1>
          <p className="text-sm text-slate-400 font-inter">Practice with live CBOE volatility data — virtual currency only.</p>
        </div>

        <AnimatePresence>
          {msg && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`mb-4 flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium ${
                msg.ok ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-600"
              }`} data-testid="trade-message">
              <div className="flex items-center gap-2">
                {msg.ok ? <CheckCircle size={15} /> : <X size={15} />}{msg.text}
              </div>
              <button onClick={() => setMsg(null)}><X size={13} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {(rationale || rationaleLoading) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 bg-[#0A2540] rounded-xl px-5 py-4 text-white"
              data-testid="trade-rationale"
            >
              <div className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Sparkles size={13} strokeWidth={2.2} />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wider font-semibold text-emerald-300 mb-1">
                    Why this trade · educational
                  </p>
                  {rationaleLoading ? (
                    <p className="text-sm text-slate-300 animate-pulse">SimuBot is analysing your position…</p>
                  ) : (
                    <p className="text-sm leading-relaxed text-slate-100">{rationale}</p>
                  )}
                </div>
                <button onClick={() => setRationale(null)} className="text-slate-400 hover:text-white">
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-6">
          {indices.map((q) => (
            <button key={q.symbol} onClick={() => setSelected(q.symbol)} data-testid={`index-select-${q.display}`}
              className={`shrink-0 px-4 py-3 rounded-xl border text-left transition-all duration-150 ${
                selected === q.symbol ? "bg-[#0A2540] border-[#0A2540] text-white" : "bg-white border-slate-200 text-[#0A2540] hover:border-slate-300 hover:bg-[#F8F9FA]"
              }`}>
              <div className="font-outfit text-sm font-semibold">{q.display}</div>
              <div className={`font-mono text-xs mt-0.5 ${selected === q.symbol ? "text-white/60" : q.change_pct >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {q.price > 0 ? q.price.toFixed(2) : "—"} <span>{q.change_pct >= 0 ? "▲" : "▼"}{Math.abs(q.change_pct).toFixed(1)}%</span>
              </div>
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="font-outfit text-xl font-semibold text-[#0A2540]">{currentQuote.display || selected.replace("^", "")}</h2>
                    <span className={`font-mono text-xl font-semibold ${(currentQuote.change_pct ?? 0) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {price > 0 ? price.toFixed(2) : "—"}
                    </span>
                    <span className={`text-sm font-mono ${(currentQuote.change_pct ?? 0) >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                      {(currentQuote.change_pct ?? 0) >= 0 ? "+" : ""}{(currentQuote.change_pct ?? 0).toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{currentQuote.description}</p>
                </div>
              </div>
              <div className="flex gap-1.5 mb-5">
                {["5d", "1mo", "3mo", "6mo", "1y"].map((p) => (
                  <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${period === p ? "bg-[#0A2540] text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>{p}</button>
                ))}
              </div>
              <div className="h-52" data-testid="price-chart">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0A2540" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#0A2540" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTip />} />
                      <Area type="monotone" dataKey="close" stroke="#0A2540" strokeWidth={1.5} fill="url(#grad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-[#0A2540] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-outfit text-sm font-semibold text-[#0A2540]">Open Positions</h3>
              </div>
              {positions.length === 0 ? (
                <p className="px-5 py-8 text-sm text-slate-400 text-center">No open positions yet.</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {positions.map((pos) => (
                    <div key={pos.position_id} className="px-5 py-3.5 flex items-center justify-between hover:bg-[#F8F9FA]">
                      <div className="flex items-center gap-3">
                        <span className="font-outfit text-sm font-semibold text-[#0A2540]">{pos.symbol?.replace("^", "")}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${pos.direction === "long" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                          {pos.direction?.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-400">{pos.contracts}× @ {pos.entry_price?.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`font-mono text-sm font-semibold ${(pos.unrealized_pnl ?? 0) >= 0 ? "text-emerald-600" : "text-red-500"}`} data-testid={`position-pnl-${pos.position_id}`}>
                          {(pos.unrealized_pnl ?? 0) >= 0 ? "+" : ""}${Math.abs(pos.unrealized_pnl ?? 0).toFixed(2)}
                        </span>
                        <button onClick={() => handleClose(pos.position_id)} data-testid={`close-position-${pos.position_id}`}
                          className="text-xs text-slate-500 hover:text-red-500 border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-all">
                          Close
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card h-fit">
            <h3 className="font-outfit text-base font-semibold text-[#0A2540] mb-5">Place Order</h3>
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Direction</label>
                <button onClick={() => setShowInfo(!showInfo)} className="text-slate-300 hover:text-slate-500"><Info size={14} strokeWidth={1.5} /></button>
              </div>
              {showInfo && (
                <div className="mb-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-500 leading-relaxed">
                  {direction === "long" ? "LONG: Profit when volatility RISES — market becomes more fearful." : "SHORT: Profit when volatility FALLS — market calms down."}
                </div>
              )}
              <div className="flex border border-slate-200 rounded-xl overflow-hidden">
                <button onClick={() => setDirection("long")} data-testid="direction-long"
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all ${direction === "long" ? "bg-emerald-500 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>
                  <TrendingUp size={15} strokeWidth={2} /> Long
                </button>
                <button onClick={() => setDirection("short")} data-testid="direction-short"
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all border-l border-slate-200 ${direction === "short" ? "bg-red-500 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>
                  <TrendingDown size={15} strokeWidth={2} /> Short
                </button>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Contracts</label>
              <input type="number" min="0.1" step="0.1" value={contracts} onChange={(e) => setContracts(e.target.value)} data-testid="contracts-input"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[#0A2540] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#0A2540]/15 focus:border-[#0A2540] transition-all" />
              <div className="flex gap-1.5 mt-2">
                {[1, 5, 10, 25].map((n) => (
                  <button key={n} onClick={() => setContracts(String(n))}
                    className="flex-1 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 font-semibold transition-colors">{n}</button>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Index price</span>
                <span className="font-mono font-medium text-[#0A2540]">{price > 0 ? price.toFixed(2) : "—"}</span>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="flex justify-between">
                <span className="text-sm font-medium text-slate-600">Total Cost</span>
                <span className="font-mono font-semibold text-[#0A2540]" data-testid="trade-cost">${cost.toFixed(2)}</span>
              </div>
            </div>

            <button onClick={handleTrade} disabled={tradeLoading || price <= 0 || !contracts || parseFloat(contracts) <= 0}
              data-testid="trade-submit-button"
              className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${direction === "long" ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-red-500 text-white hover:bg-red-600"}`}>
              {tradeLoading ? "Placing..." : `Open ${direction.toUpperCase()} Position`}
            </button>
            <p className="text-center text-xs text-slate-400 mt-3">Virtual currency only — no real money</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
