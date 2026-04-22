import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Clock, CheckCircle, X } from "lucide-react";
import Layout from "../components/Layout";
import api from "../utils/api";
import { useAuth } from "../contexts/AuthContext";

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState(null);
  const [positions, setPositions] = useState([]);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState("open");
  const [closing, setClosing] = useState(null);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const { refreshUser } = useAuth();

  const load = async () => {
    setLoading(true);
    const [p, pos, hist] = await Promise.all([
      api.get("/portfolio/summary"), api.get("/trading/positions"), api.get("/trading/history"),
    ]);
    setPortfolio(p.data); setPositions(pos.data);
    setHistory(hist.data.filter((t) => t.status === "closed"));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleClose = async (id) => {
    setClosing(id);
    try {
      const r = await api.post(`/trading/close/${id}`);
      setMsg({ ok: true, text: `Closed. P&L: ${r.data.pnl >= 0 ? "+" : ""}$${r.data.pnl.toFixed(2)}` });
      await refreshUser(); await load();
    } catch (e) { setMsg({ ok: false, text: e.response?.data?.detail || "Failed" }); }
    finally { setClosing(null); }
  };

  const pct = portfolio?.total_return_pct ?? 0;
  const fmt = (n) => `$${Math.abs(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  const cards = [
    { l: "Portfolio Value", v: `$${(portfolio?.total_portfolio_value ?? 10000).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, c: "text-[#1B263B]" },
    { l: "Cash Balance", v: `$${(portfolio?.cash_balance ?? 10000).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, c: "text-[#1B263B]" },
    { l: "Unrealized P&L", v: `${(portfolio?.unrealized_pnl ?? 0) >= 0 ? "+" : "-"}${fmt(portfolio?.unrealized_pnl)}`, c: (portfolio?.unrealized_pnl ?? 0) >= 0 ? "text-[#426B1F]" : "text-red-500" },
    { l: "Realized P&L", v: `${(portfolio?.realized_pnl ?? 0) >= 0 ? "+" : "-"}${fmt(portfolio?.realized_pnl)}`, c: (portfolio?.realized_pnl ?? 0) >= 0 ? "text-[#426B1F]" : "text-red-500" },
  ];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto font-inter">
        <div className="mb-8">
          <h1 className="font-outfit text-3xl font-semibold text-[#1B263B] mb-1">Portfolio</h1>
          <p className="text-sm text-slate-400">Your simulated trading performance.</p>
        </div>

        {msg && (
          <div className={`mb-4 flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium ${msg.ok ? "bg-[#EAF0E4] border border-[#426B1F]/30 text-[#426B1F]" : "bg-red-50 border border-red-200 text-red-600"}`}>
            <span>{msg.text}</span><button onClick={() => setMsg(null)}><X size={13} /></button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {cards.map((c, i) => (
            <motion.div key={c.l} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{c.l}</p>
              <p className={`font-outfit text-xl font-semibold ${c.c}`} data-testid={`portfolio-${c.l.toLowerCase().replace(/\s+/g, "-")}`}>{c.v}</p>
            </motion.div>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-500">Overall Performance</span>
            <span className={`font-outfit text-lg font-semibold ${pct >= 0 ? "text-[#426B1F]" : "text-red-500"}`} data-testid="overall-return-pct">
              {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${pct >= 0 ? "bg-[#E07A5F]" : "bg-red-400"}`}
              style={{ width: `${Math.min(Math.abs(pct) * 2, 100)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-2">
            <span>Starting: $10,000</span>
            <span className="font-mono">{portfolio?.total_trades ?? 0} trades completed</span>
          </div>
        </div>

        <div className="flex bg-slate-100 rounded-xl p-0.5 mb-5 w-fit">
          {[{ k: "open", l: `Open (${positions.length})` }, { k: "closed", l: `History (${history.length})` }].map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)} data-testid={`portfolio-tab-${t.k}`}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t.k ? "bg-white text-[#1B263B] shadow-sm" : "text-slate-400"}`}>
              {t.l}
            </button>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card">
          {tab === "open" && (
            loading ? (
              <div className="p-5 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-12 shimmer rounded-lg" />)}</div>
            ) : positions.length === 0 ? (
              <p className="py-14 text-center text-sm text-slate-400">No open positions.</p>
            ) : (
              <table className="w-full" data-testid="open-positions-table">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["Index", "Dir.", "Contracts", "Entry", "Current", "P&L", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => (
                    <tr key={p.position_id} className="border-b border-slate-50 hover:bg-[#F5F5F0] transition-colors">
                      <td className="px-4 py-4 font-outfit text-sm font-semibold text-[#1B263B]">{p.symbol?.replace("^", "")}</td>
                      <td className="px-4 py-4">
                        <span className={`flex items-center gap-1 text-xs font-semibold w-fit px-2 py-0.5 rounded-full ${p.direction === "long" ? "bg-[#EAF0E4] text-[#426B1F]" : "bg-red-50 text-red-600"}`}>
                          {p.direction === "long" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}{p.direction?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono text-sm text-slate-500">{p.contracts}</td>
                      <td className="px-4 py-4 font-mono text-sm text-slate-500">{p.entry_price?.toFixed(2)}</td>
                      <td className="px-4 py-4 font-mono text-sm text-slate-500">{p.current_price?.toFixed(2) || "—"}</td>
                      <td className="px-4 py-4">
                        <span className={`font-mono text-sm font-semibold ${(p.unrealized_pnl ?? 0) >= 0 ? "text-[#426B1F]" : "text-red-500"}`}>
                          {(p.unrealized_pnl ?? 0) >= 0 ? "+" : ""}${Math.abs(p.unrealized_pnl ?? 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button onClick={() => handleClose(p.position_id)} disabled={closing === p.position_id}
                          data-testid={`close-btn-${p.position_id}`}
                          className="text-xs text-slate-500 hover:text-red-500 border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40">
                          {closing === p.position_id ? "..." : "Close"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
          {tab === "closed" && (
            history.length === 0 ? (
              <p className="py-14 text-center text-sm text-slate-400">No closed trades yet.</p>
            ) : (
              <table className="w-full" data-testid="trade-history-table">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["Index", "Dir.", "Contracts", "Entry", "Exit", "P&L", "Date"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((t) => (
                    <tr key={t.position_id} className="border-b border-slate-50 hover:bg-[#F5F5F0]">
                      <td className="px-4 py-4 font-outfit text-sm font-semibold text-[#1B263B]">{t.symbol?.replace("^", "")}</td>
                      <td className="px-4 py-4">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.direction === "long" ? "bg-[#EAF0E4] text-[#426B1F]" : "bg-red-50 text-red-600"}`}>
                          {t.direction?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono text-sm text-slate-500">{t.contracts}</td>
                      <td className="px-4 py-4 font-mono text-sm text-slate-500">{t.entry_price?.toFixed(2)}</td>
                      <td className="px-4 py-4 font-mono text-sm text-slate-500">{t.exit_price?.toFixed(2) || "—"}</td>
                      <td className="px-4 py-4">
                        <span className={`font-mono text-sm font-semibold flex items-center gap-1 ${(t.pnl ?? 0) >= 0 ? "text-[#426B1F]" : "text-red-500"}`}>
                          {(t.pnl ?? 0) >= 0 ? <CheckCircle size={11} /> : <X size={11} />}
                          {(t.pnl ?? 0) >= 0 ? "+" : ""}${Math.abs(t.pnl ?? 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1"><Clock size={11} strokeWidth={1.5} />{t.closed_at ? new Date(t.closed_at).toLocaleDateString() : "—"}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </Layout>
  );
}
