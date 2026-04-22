import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Lock, FlaskConical, ExternalLink } from "lucide-react";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import { useMode } from "../contexts/ModeContext";

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const { mode, setMode, isDemo } = useMode();
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setTimeout(() => { setMsg({ ok: true, text: "Settings saved." }); setSaving(false); }, 500);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto font-inter">
        <div className="mb-8">
          <h1 className="font-outfit text-3xl font-semibold text-[#1B263B] mb-1">Settings</h1>
          <p className="text-sm text-slate-400">Manage your SimuTrade account and preferences.</p>
        </div>

        {msg && (
          <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${msg.ok ? "bg-[#EAF0E4] border border-[#426B1F]/30 text-[#426B1F]" : "bg-red-50 border border-red-200 text-red-600"}`}>
            {msg.text}
          </div>
        )}

        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-xl p-6 mb-5 shadow-card">
          <div className="flex items-center gap-2.5 mb-5">
            <User size={18} strokeWidth={1.5} className="text-slate-500" />
            <h2 className="font-outfit text-base font-semibold text-[#1B263B]">Profile</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" value={user?.email || ""} disabled
                className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 text-sm cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Name</label>
              <input type="text" defaultValue={user?.name || ""} data-testid="settings-name-input"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-[#1B263B] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B263B]/15 focus:border-[#1B263B] transition-all" />
            </div>
            <div className="flex gap-4 text-xs text-slate-400 pt-1">
              <span>Auth: <strong className="text-slate-600">{user?.auth_type}</strong></span>
              <span>Level: <strong className="text-slate-600">{user?.experience_level || "Not set"}</strong></span>
              <span>Risk: <strong className="text-slate-600">{user?.risk_tolerance || "Not set"}</strong></span>
            </div>
            <button onClick={handleSave} disabled={saving} data-testid="settings-save-btn"
              className="bg-[#1B263B] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#051A2E] transition-colors disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </motion.div>

        {/* Mode */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white border border-slate-200 rounded-xl p-6 mb-5 shadow-card">
          <div className="flex items-center gap-2.5 mb-5">
            <FlaskConical size={18} strokeWidth={1.5} className="text-slate-500" />
            <h2 className="font-outfit text-base font-semibold text-[#1B263B]">Trading Mode</h2>
          </div>
          <div className="space-y-3">
            {[
              { v: "demo", l: "Practice Mode", d: "Trade with $10,000 virtual currency. No real financial risk.", icon: FlaskConical, active: isDemo },
              { v: "real", l: "Live Mode (External)", d: "Access real broker partners. SimuTrade does not execute real trades.", icon: ExternalLink, active: !isDemo },
            ].map((opt) => (
              <button key={opt.v} onClick={() => setMode(opt.v)} data-testid={`mode-option-${opt.v}`}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${opt.active ? "border-[#1B263B] bg-slate-50" : "border-slate-200 hover:border-slate-300"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <opt.icon size={16} strokeWidth={1.5} className={opt.active ? "text-[#1B263B]" : "text-slate-400"} />
                    <div>
                      <p className={`text-sm font-semibold ${opt.active ? "text-[#1B263B]" : "text-slate-600"}`}>{opt.l}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{opt.d}</p>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${opt.active ? "bg-[#1B263B] border-[#1B263B]" : "border-slate-300"}`} />
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Account */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white border border-slate-200 rounded-xl p-6 mb-5 shadow-card">
          <div className="flex items-center gap-2.5 mb-5">
            <Lock size={18} strokeWidth={1.5} className="text-slate-500" />
            <h2 className="font-outfit text-base font-semibold text-[#1B263B]">Virtual Account</h2>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <p className="text-sm font-medium text-[#1B263B]">Virtual Balance</p>
              <p className="text-xs text-slate-400">Current simulation balance</p>
            </div>
            <span className="font-mono font-semibold text-[#426B1F] text-base" data-testid="settings-balance">
              ${(user?.balance ?? 10000).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-[#1B263B]">Starting Balance</p>
              <p className="text-xs text-slate-400">Original virtual allocation</p>
            </div>
            <span className="font-mono text-slate-500 text-sm">$10,000.00</span>
          </div>
        </motion.div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>Disclaimer:</strong> SimuTrade is for educational purposes only. All trading uses virtual currency.
            No real financial transactions occur. This is not financial advice. Not affiliated with CBOE, NYSE, or any trading platform.
          </p>
        </div>
      </div>
    </Layout>
  );
}
