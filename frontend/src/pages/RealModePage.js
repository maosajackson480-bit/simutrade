import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2, LogOut, AlertTriangle, CheckCircle, ExternalLink, Loader2, Shield,
  TrendingUp, TrendingDown, X,
} from "lucide-react";
import Layout from "../components/Layout";
import api from "../utils/api";
import { useMode } from "../contexts/ModeContext";

function TokenModal({ open, onClose, onConnected }) {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setErr(null);
    try {
      const res = await api.post("/deriv/connect", { api_token: token.trim() });
      onConnected(res.data);
      setToken("");
    } catch (e) {
      setErr(e.response?.data?.detail || "Connection failed");
    } finally { setLoading(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1B263B]/40 backdrop-blur-sm p-4"
          onClick={onClose}>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-dropdown w-full max-w-md overflow-hidden border border-[#E5E5DF]">
            <div className="bg-[#1B263B] text-white px-6 py-5 flex items-center justify-between">
              <div>
                <p className="font-outfit text-lg font-medium">Connect Deriv</p>
                <p className="text-xs text-[#778DA9] mt-0.5">Token-based · We never store your password</p>
              </div>
              <button onClick={onClose} className="text-[#778DA9] hover:text-white" data-testid="deriv-modal-close">
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#778DA9] mb-2">
                  Deriv API Token
                </label>
                <input
                  type="password"
                  autoFocus
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste your token…"
                  data-testid="deriv-token-input"
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E5DF] bg-white text-[#1B263B] text-sm font-mono focus:outline-none focus:border-[#1B263B] transition-colors"
                  disabled={loading}
                />
                <p className="text-xs text-[#778DA9] mt-2 leading-relaxed">
                  Get one from{" "}
                  <a href="https://app.deriv.com/account/api-token" target="_blank" rel="noopener noreferrer"
                    className="underline text-[#E07A5F] hover:text-[#D36649]">
                    app.deriv.com/account/api-token
                  </a>
                  . Enable <span className="font-mono">read</span> + <span className="font-mono">trade</span> scopes.
                </p>
              </div>

              {err && (
                <div className="bg-[#F5E6E6] border border-[#9E2A2B]/30 rounded-xl px-3 py-2 flex items-start gap-2" data-testid="deriv-error">
                  <AlertTriangle size={14} className="text-[#9E2A2B] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#9E2A2B]">{err}</p>
                </div>
              )}

              <button type="submit" disabled={loading || !token.trim()}
                data-testid="deriv-connect-submit"
                className="w-full flex items-center justify-center gap-2 bg-[#E07A5F] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#D36649] active:scale-[0.99] transition-all disabled:opacity-50">
                {loading ? <><Loader2 size={15} className="animate-spin" /> Verifying…</> : <>Connect Account</>}
              </button>

              <p className="text-[11px] text-[#778DA9] leading-relaxed">
                Tokens are encrypted at rest. Real trades are executed by Deriv — SimuTrade does not hold funds or process transactions.
              </p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BuyForm({ account, onTrade, symbols }) {
  const [symbol, setSymbol] = useState("R_100");
  const [contractType, setContractType] = useState("CALL");
  const [amount, setAmount] = useState("1");
  const [duration, setDuration] = useState("60");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const r = await api.post("/deriv/buy", {
        symbol,
        contract_type: contractType,
        amount: parseFloat(amount),
        duration: parseInt(duration, 10),
        duration_unit: "s",
      });
      setMsg({ ok: true, text: `Contract ${r.data.contract_id} — payout ${r.data.payout} ${account.currency}` });
      onTrade();
    } catch (e) {
      setMsg({ ok: false, text: e.response?.data?.detail || "Trade failed" });
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4" data-testid="deriv-buy-form">
      {msg && (
        <div className={`rounded-xl px-3 py-2 text-xs ${msg.ok ? "bg-[#EAF0E4] border border-[#426B1F]/30 text-[#426B1F]" : "bg-[#F5E6E6] border border-[#9E2A2B]/30 text-[#9E2A2B]"}`}>
          {msg.text}
        </div>
      )}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-[#778DA9] mb-2">Symbol</label>
        <select value={symbol} onChange={(e) => setSymbol(e.target.value)} data-testid="deriv-symbol-select"
          className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E5DF] bg-white text-[#1B263B] text-sm font-mono focus:outline-none focus:border-[#1B263B]">
          {symbols.slice(0, 40).map((s) => (
            <option key={s.symbol} value={s.symbol}>{s.display_name} · {s.submarket}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-[#778DA9] mb-2">Direction</label>
        <div className="flex border-2 border-[#E5E5DF] rounded-xl overflow-hidden">
          <button type="button" onClick={() => setContractType("CALL")} data-testid="deriv-call-btn"
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all ${contractType === "CALL" ? "bg-[#426B1F] text-white" : "bg-white text-[#415A77]"}`}>
            <TrendingUp size={14} /> Rise (CALL)
          </button>
          <button type="button" onClick={() => setContractType("PUT")} data-testid="deriv-put-btn"
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all border-l-2 border-[#E5E5DF] ${contractType === "PUT" ? "bg-[#9E2A2B] text-white" : "bg-white text-[#415A77]"}`}>
            <TrendingDown size={14} /> Fall (PUT)
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[#778DA9] mb-2">Stake ({account.currency})</label>
          <input type="number" min="1" step="0.5" value={amount} onChange={(e) => setAmount(e.target.value)}
            data-testid="deriv-amount-input"
            className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E5DF] bg-white text-[#1B263B] text-sm font-mono focus:outline-none focus:border-[#1B263B]" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[#778DA9] mb-2">Duration (s)</label>
          <input type="number" min="15" step="15" value={duration} onChange={(e) => setDuration(e.target.value)}
            data-testid="deriv-duration-input"
            className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E5DF] bg-white text-[#1B263B] text-sm font-mono focus:outline-none focus:border-[#1B263B]" />
        </div>
      </div>
      <button type="submit" disabled={busy} data-testid="deriv-buy-submit"
        className={`w-full py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${contractType === "CALL" ? "bg-[#426B1F] hover:bg-[#355818]" : "bg-[#9E2A2B] hover:bg-[#7A2122]"} text-white`}>
        {busy ? "Placing…" : `Place ${contractType} · ${account.currency} ${amount}`}
      </button>
    </form>
  );
}

export default function RealModePage() {
  const [modal, setModal] = useState(false);
  const [status, setStatus] = useState(null);
  const [symbols, setSymbols] = useState([]);
  const [portfolio, setPortfolio] = useState({ open: [], history: [] });
  const [loading, setLoading] = useState(true);
  const { setMode } = useMode();

  const refresh = async () => {
    try {
      const s = await api.get("/deriv/status");
      setStatus(s.data);
      if (s.data.connected) {
        const [sy, pf] = await Promise.all([api.get("/deriv/symbols"), api.get("/deriv/portfolio")]);
        setSymbols(sy.data);
        setPortfolio(pf.data);
      }
    } catch (e) {
      // API down or not connected → fallback Demo banner
      setStatus({ connected: false, fallback: "Deriv API unavailable — using Demo Mode." });
    } finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);

  const disconnect = async () => {
    await api.post("/deriv/disconnect");
    setStatus({ connected: false });
    setPortfolio({ open: [], history: [] });
  };

  if (loading) {
    return <Layout><div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-[#778DA9]" /></div></Layout>;
  }

  const connected = status?.connected;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto font-manrope">
        {/* Page header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-outfit text-3xl font-medium text-[#1B263B] mb-1">Real Trading</h1>
            <p className="text-sm text-[#415A77]">
              Execute real contracts via Deriv. SimuTrade does not hold your funds.
            </p>
          </div>
          {connected ? (
            <button onClick={disconnect} data-testid="deriv-disconnect"
              className="flex items-center gap-2 bg-white border-2 border-[#E5E5DF] text-[#415A77] px-4 py-2 rounded-xl text-sm font-medium hover:border-[#9E2A2B] hover:text-[#9E2A2B] transition-colors">
              <LogOut size={14} /> Disconnect
            </button>
          ) : (
            <button onClick={() => setModal(true)} data-testid="deriv-connect-btn"
              className="flex items-center gap-2 bg-[#E07A5F] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#D36649] active:scale-[0.99] transition-all">
              <Link2 size={14} /> Connect Deriv
            </button>
          )}
        </div>

        {/* Persistent compliance banner */}
        <div className="bg-[#F9EAE6] border border-[#E07A5F]/30 text-[#1B263B] rounded-2xl p-5 mb-6 flex gap-4" data-testid="deriv-compliance-banner">
          <AlertTriangle size={20} className="text-[#E07A5F] shrink-0 mt-0.5" strokeWidth={2} />
          <div>
            <p className="font-outfit font-medium text-sm mb-1">Real trading is executed via Deriv</p>
            <p className="text-xs text-[#415A77] leading-relaxed">
              SimuTrade is not a broker. We never hold, custody, or process real funds. All contracts execute on{" "}
              <span className="font-semibold text-[#1B263B]">Deriv.com</span>, which is regulated and subject to their
              terms. Only trade what you can afford to lose. Switch to{" "}
              <button onClick={() => setMode("demo")} className="underline font-semibold text-[#1B263B] hover:text-[#E07A5F]">Practice Mode</button>
              {" "}to learn risk-free.
            </p>
          </div>
        </div>

        {/* Fallback notice */}
        {!connected && status?.fallback && (
          <div className="bg-[#FCF6DF] border border-[#E3B505]/30 rounded-xl px-4 py-3 mb-6 flex items-center gap-3" data-testid="deriv-fallback">
            <AlertTriangle size={15} className="text-[#E3B505]" />
            <p className="text-xs text-[#1B263B]">{status.fallback}</p>
          </div>
        )}

        {/* Connected state */}
        {connected ? (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Account card */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 border border-[#E5E5DF] shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={15} className="text-[#426B1F]" />
                <p className="text-xs font-semibold uppercase tracking-widest text-[#426B1F]">Connected</p>
              </div>
              <p className="text-xs text-[#778DA9] mb-1">Account</p>
              <p className="font-outfit text-lg font-medium text-[#1B263B] mb-4" data-testid="deriv-account-id">
                {status.account_id}
                <span className="ml-2 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#F5F5F0] text-[#778DA9] border border-[#E5E5DF]">
                  {status.account_type}
                </span>
              </p>
              <p className="text-xs text-[#778DA9] mb-1">Balance</p>
              <p className="font-mono text-3xl font-medium text-[#1B263B]" data-testid="deriv-balance">
                {parseFloat(status.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                <span className="text-sm text-[#778DA9] ml-2">{status.currency}</span>
              </p>
              <p className="text-xs text-[#778DA9] mt-4">{status.email}</p>
            </motion.div>

            {/* Order form */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl p-6 border border-[#E5E5DF] shadow-card lg:col-span-2">
              <h2 className="font-outfit text-base font-medium text-[#1B263B] mb-5">Place Real Contract</h2>
              {symbols.length > 0 ? (
                <BuyForm account={status} symbols={symbols} onTrade={refresh} />
              ) : (
                <p className="text-sm text-[#778DA9]">Loading symbols…</p>
              )}
            </motion.div>

            {/* Open contracts */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-[#E5E5DF] shadow-card overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E5E5DF]">
                <h2 className="font-outfit text-sm font-medium text-[#1B263B]">Open Contracts</h2>
              </div>
              {portfolio.open.length === 0 ? (
                <p className="px-6 py-8 text-sm text-[#778DA9] text-center">No open contracts.</p>
              ) : (
                <div className="divide-y divide-[#E5E5DF]">
                  {portfolio.open.map((c) => (
                    <div key={c.contract_id} className="px-6 py-3.5 flex items-center justify-between hover:bg-[#F5F5F0]">
                      <div>
                        <p className="text-sm font-medium text-[#1B263B]">{c.symbol} · {c.contract_type}</p>
                        <p className="text-xs text-[#778DA9] font-mono">ID {c.contract_id} · stake {c.buy_price}</p>
                      </div>
                      <button onClick={async () => { await api.post("/deriv/sell", { contract_id: c.contract_id, price: 0 }); refresh(); }}
                        className="text-xs border border-[#E5E5DF] px-3 py-1.5 rounded-lg hover:border-[#9E2A2B] hover:text-[#9E2A2B] transition-colors">
                        Sell
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Disconnected state */
          <div className="bg-white border border-[#E5E5DF] rounded-2xl p-10 text-center shadow-card">
            <div className="w-12 h-12 mx-auto bg-[#F9EAE6] rounded-2xl flex items-center justify-center mb-5">
              <Link2 size={22} className="text-[#E07A5F]" strokeWidth={1.8} />
            </div>
            <h2 className="font-outfit text-xl font-medium text-[#1B263B] mb-2">Connect your Deriv account</h2>
            <p className="text-sm text-[#415A77] max-w-md mx-auto mb-6 leading-relaxed">
              Use a Deriv API token (you stay in control — we never see your password). Works with demo and real Deriv accounts.
            </p>
            <button onClick={() => setModal(true)} data-testid="deriv-connect-hero"
              className="inline-flex items-center gap-2 bg-[#E07A5F] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[#D36649] active:scale-[0.99] transition-all">
              <Link2 size={15} /> Connect Deriv
            </button>

            <div className="grid md:grid-cols-3 gap-6 mt-10 text-left">
              {[
                { icon: Shield, t: "Token-only auth", d: "We never see your Deriv password. Tokens are encrypted at rest and can be revoked at deriv.com any time." },
                { icon: ExternalLink, t: "Executed on Deriv", d: "All real trades settle via Deriv's regulated infrastructure. We're only a UI layer." },
                { icon: CheckCircle, t: "Fallback to Demo", d: "If the Deriv API is unreachable, you can always switch back to Practice Mode and keep learning." },
              ].map(({ icon: Icon, t, d }) => (
                <div key={t} className="bg-[#F5F5F0] rounded-xl p-4 border border-[#E5E5DF]">
                  <Icon size={16} className="text-[#1B263B] mb-2" strokeWidth={1.8} />
                  <p className="font-outfit text-sm font-medium text-[#1B263B] mb-1">{t}</p>
                  <p className="text-xs text-[#415A77] leading-relaxed">{d}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <TokenModal open={modal} onClose={() => setModal(false)} onConnected={() => { setModal(false); refresh(); }} />
    </Layout>
  );
}
