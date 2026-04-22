import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, FlaskConical, Link2, Trash2, AlertTriangle, CheckCircle, X } from "lucide-react";
import Layout from "../components/Layout";
import api from "../utils/api";
import { useAuth } from "../contexts/AuthContext";

function Toast({ msg, onClose }) {
  if (!msg) return null;
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between gap-3 ${
        msg.ok
          ? "bg-[#EAF0E4] border border-[#426B1F]/30 text-[#426B1F]"
          : "bg-[#F5E6E6] border border-[#9E2A2B]/30 text-[#9E2A2B]"
      }`}
      data-testid="settings-toast">
      <span className="flex items-center gap-2">
        {msg.ok ? <CheckCircle size={15} /> : <AlertTriangle size={15} />} {msg.text}
      </span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100"><X size={14} /></button>
    </motion.div>
  );
}

function Section({ icon: Icon, title, delay = 0, children, testid }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      data-testid={testid}
      className="bg-white border border-[#E5E5DF] rounded-2xl p-6 mb-5 shadow-card">
      <div className="flex items-center gap-2.5 mb-5">
        <Icon size={18} strokeWidth={1.6} className="text-[#415A77]" />
        <h2 className="font-outfit text-base font-medium text-[#1B263B]">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

function ConfirmModal({ open, title, body, danger, confirmLabel, onConfirm, onClose, busy }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1B263B]/40 backdrop-blur-sm p-4"
          onClick={onClose}>
          <motion.div initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 18, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-dropdown w-full max-w-md border border-[#E5E5DF] overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E5E5DF]">
              <p className="font-outfit text-lg font-medium text-[#1B263B]">{title}</p>
            </div>
            <div className="px-6 py-5 text-sm text-[#415A77] leading-relaxed">{body}</div>
            <div className="px-6 py-4 bg-[#F5F5F0] border-t border-[#E5E5DF] flex justify-end gap-2">
              <button onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-[#415A77] hover:bg-[#E5E5DF] transition-colors"
                data-testid="confirm-cancel">
                Cancel
              </button>
              <button onClick={onConfirm} disabled={busy}
                className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50 ${
                  danger ? "bg-[#9E2A2B] hover:bg-[#7A2122]" : "bg-[#1B263B] hover:bg-[#2B3A55]"
                }`}
                data-testid="confirm-submit">
                {busy ? "Working…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [msg, setMsg] = useState(null);
  const [name, setName] = useState(user?.name || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [changingPwd, setChangingPwd] = useState(false);
  const [derivStatus, setDerivStatus] = useState(null);
  const [showDisconnect, setShowDisconnect] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => setName(user?.name || ""), [user]);

  useEffect(() => {
    api.get("/deriv/status").then((r) => setDerivStatus(r.data)).catch(() => setDerivStatus({ connected: false }));
  }, []);

  const showMsg = (ok, text) => { setMsg({ ok, text }); setTimeout(() => setMsg(null), 4000); };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await api.put("/auth/profile", { name });
      await refreshUser();
      showMsg(true, "Profile updated.");
    } catch (e) {
      showMsg(false, e.response?.data?.detail || "Couldn't save profile.");
    } finally { setSavingProfile(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (next !== confirm) return showMsg(false, "New passwords don't match.");
    if (next.length < 8) return showMsg(false, "Password must be at least 8 characters.");
    setChangingPwd(true);
    try {
      await api.post("/auth/password", { current_password: cur, new_password: next });
      setCur(""); setNext(""); setConfirm("");
      showMsg(true, "Password updated.");
    } catch (e) {
      showMsg(false, e.response?.data?.detail || "Couldn't change password.");
    } finally { setChangingPwd(false); }
  };

  const disconnectDeriv = async () => {
    setBusy(true);
    try {
      await api.post("/deriv/disconnect");
      setDerivStatus({ connected: false });
      showMsg(true, "Deriv account disconnected.");
    } catch (e) {
      showMsg(false, e.response?.data?.detail || "Couldn't disconnect.");
    } finally { setBusy(false); setShowDisconnect(false); }
  };

  const deleteAccount = async () => {
    setBusy(true);
    try {
      await api.delete("/auth/account");
      await logout();
      navigate("/");
    } catch (e) {
      showMsg(false, e.response?.data?.detail || "Couldn't delete account.");
      setBusy(false);
    }
  };

  const isEmail = user?.auth_type === "email";
  const isGuest = user?.role === "guest";

  return (
    <Layout>
      <div className="max-w-2xl mx-auto font-manrope">
        <div className="mb-8">
          <h1 className="font-outfit text-3xl font-medium text-[#1B263B] mb-1 tracking-tight">Settings</h1>
          <p className="text-sm text-[#778DA9]">Manage your SimuTrade account, connections, and data.</p>
        </div>

        <AnimatePresence>{msg && <Toast msg={msg} onClose={() => setMsg(null)} />}</AnimatePresence>

        {/* Profile */}
        <Section icon={User} title="Profile" testid="section-profile">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#778DA9] mb-1.5">Email</label>
              <input type="email" value={user?.email || ""} disabled
                className="w-full px-4 py-3 rounded-xl border border-[#E5E5DF] bg-[#F5F5F0] text-[#778DA9] text-sm font-mono cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#778DA9] mb-1.5">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} data-testid="settings-name-input"
                className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E5DF] bg-white text-[#1B263B] text-sm focus:outline-none focus:border-[#1B263B] transition-colors" />
            </div>
            <div className="flex gap-4 text-xs text-[#778DA9]">
              <span>Auth: <strong className="text-[#1B263B]">{user?.auth_type}</strong></span>
              <span>Role: <strong className="text-[#1B263B]">{user?.role}</strong></span>
            </div>
            <button onClick={saveProfile} disabled={savingProfile || name === user?.name || !name.trim()}
              data-testid="settings-save-profile"
              className="bg-[#1B263B] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#2B3A55] transition-colors disabled:opacity-40">
              {savingProfile ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </Section>

        {/* Password */}
        {isEmail && (
          <Section icon={Lock} title="Password" delay={0.05} testid="section-password">
            <form onSubmit={changePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#778DA9] mb-1.5">Current Password</label>
                <input type="password" value={cur} onChange={(e) => setCur(e.target.value)} required
                  data-testid="settings-current-password"
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E5DF] bg-white text-[#1B263B] text-sm focus:outline-none focus:border-[#1B263B]" />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-[#778DA9] mb-1.5">New Password</label>
                  <input type="password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={8}
                    data-testid="settings-new-password"
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E5DF] bg-white text-[#1B263B] text-sm focus:outline-none focus:border-[#1B263B]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-[#778DA9] mb-1.5">Confirm New</label>
                  <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required
                    data-testid="settings-confirm-password"
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E5DF] bg-white text-[#1B263B] text-sm focus:outline-none focus:border-[#1B263B]" />
                </div>
              </div>
              <p className="text-xs text-[#778DA9]">Minimum 8 characters. Use a mix of letters, numbers, and symbols.</p>
              <button type="submit" disabled={changingPwd || !cur || !next || !confirm}
                data-testid="settings-change-password-btn"
                className="bg-[#1B263B] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#2B3A55] transition-colors disabled:opacity-40">
                {changingPwd ? "Updating…" : "Update Password"}
              </button>
            </form>
          </Section>
        )}

        {/* Deriv connection */}
        <Section icon={Link2} title="Deriv Account" delay={0.1} testid="section-deriv">
          {derivStatus === null ? (
            <p className="text-sm text-[#778DA9]">Checking status…</p>
          ) : derivStatus.connected ? (
            <div className="space-y-4">
              <div className="bg-[#EAF0E4] border border-[#426B1F]/30 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle size={16} className="text-[#426B1F] mt-0.5" />
                <div className="text-sm flex-1">
                  <p className="text-[#1B263B] font-medium">Connected · {derivStatus.account_id}</p>
                  <p className="text-xs text-[#415A77] mt-0.5">
                    {derivStatus.account_type} · balance {parseFloat(derivStatus.balance || 0).toFixed(2)} {derivStatus.currency}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowDisconnect(true)} data-testid="settings-disconnect-deriv"
                className="text-sm font-medium text-[#9E2A2B] border border-[#9E2A2B]/30 bg-white px-4 py-2 rounded-xl hover:bg-[#F5E6E6] transition-colors">
                Disconnect Deriv
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-[#415A77] mb-3">
                Not connected. Real trading requires a Deriv account and API token.
              </p>
              <button onClick={() => navigate("/brokers")} data-testid="settings-connect-deriv"
                className="bg-[#E07A5F] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#D36649] transition-colors">
                Connect Deriv
              </button>
            </div>
          )}
        </Section>

        {/* Guest notice */}
        {isGuest && (
          <div className="bg-[#F9EAE6] border border-[#E07A5F]/30 rounded-2xl p-5 mb-5" data-testid="guest-notice">
            <p className="text-sm font-medium text-[#1B263B] mb-1">You're in Guest Mode</p>
            <p className="text-xs text-[#415A77] leading-relaxed mb-3">
              Guest accounts are automatically deleted after 7 days. Create a free account to keep your progress.
            </p>
            <button onClick={() => navigate("/auth?upgrade=1")}
              className="text-sm font-medium text-white bg-[#E07A5F] px-4 py-2 rounded-xl hover:bg-[#D36649] transition-colors">
              Create Free Account
            </button>
          </div>
        )}

        {/* Danger zone */}
        <Section icon={Trash2} title="Danger Zone" delay={0.15} testid="section-danger">
          <div className="bg-[#F5E6E6]/40 border border-[#9E2A2B]/20 rounded-xl p-4">
            <p className="text-sm font-medium text-[#1B263B] mb-1">Delete account</p>
            <p className="text-xs text-[#415A77] leading-relaxed mb-4">
              Permanently remove your SimuTrade account, virtual balance, simulated trades, and AI chat history.
              Your Deriv account on deriv.com is <strong>not</strong> affected — only the encrypted link we store is removed.
              This action is irreversible.
            </p>
            <button onClick={() => setShowDelete(true)} data-testid="settings-delete-account"
              className="bg-[#9E2A2B] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#7A2122] transition-colors">
              Delete My Account
            </button>
          </div>
        </Section>

        {/* Disclaimer */}
        <div className="bg-[#FCF6DF] border border-[#E3B505]/30 rounded-2xl p-5">
          <p className="text-xs text-[#1B263B] leading-relaxed">
            <strong>Disclaimer:</strong> Demo trading uses virtual currency only. Real trading is executed
            via Deriv — SimuTrade never holds or custodies your funds. This platform is for educational
            purposes; nothing here constitutes financial advice.
          </p>
        </div>
      </div>

      <ConfirmModal
        open={showDisconnect}
        title="Disconnect Deriv account?"
        body={<>We'll delete the encrypted token we have for your Deriv account. Your account on deriv.com is untouched — you can reconnect any time with a new token.</>}
        confirmLabel="Disconnect"
        onConfirm={disconnectDeriv} onClose={() => setShowDisconnect(false)}
        busy={busy}
      />
      <ConfirmModal
        open={showDelete}
        title="Delete SimuTrade account?"
        body={
          <>
            <p className="mb-2">This will permanently remove:</p>
            <ul className="text-xs list-disc pl-4 space-y-1 text-[#415A77]">
              <li>Your profile, virtual balance, and simulated trades</li>
              <li>AI chat history</li>
              <li>Any linked Deriv API token we stored</li>
            </ul>
            <p className="mt-3 text-xs text-[#9E2A2B]"><strong>This cannot be undone.</strong></p>
          </>
        }
        confirmLabel="Delete forever"
        onConfirm={deleteAccount} onClose={() => setShowDelete(false)}
        busy={busy}
        danger
      />
    </Layout>
  );
}
