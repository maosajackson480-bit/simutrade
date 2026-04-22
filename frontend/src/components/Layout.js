import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useMode } from "../contexts/ModeContext";
import {
  LayoutDashboard, TrendingUp, Briefcase, BookOpen, Settings,
  LogOut, Menu, X, ExternalLink, FlaskConical
} from "lucide-react";
import AiAssistant from "./AiAssistant";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { mode, setMode, isDemo } = useMode();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { path: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { path: isDemo ? "/trading" : "/brokers", label: "Trade", icon: TrendingUp },
    { path: "/portfolio", label: "Portfolio", icon: Briefcase },
    { path: "/learn", label: "Learn", icon: BookOpen },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  const handleLogout = async () => { await logout(); navigate("/"); };

  const isActive = (path) => {
    if (path === "/trading" || path === "/brokers") {
      return location.pathname === "/trading" || location.pathname === "/brokers";
    }
    return location.pathname === path;
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#1B263B] rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-outfit font-bold text-sm">S</span>
          </div>
          <span className="font-outfit text-lg font-semibold text-[#1B263B]">SimuTrade</span>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="px-4 py-3 border-b border-slate-200">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-400 mb-2 px-1">Mode</p>
        <div className="flex bg-slate-100 rounded-lg p-0.5" data-testid="mode-toggle">
          <button
            onClick={() => setMode("demo")}
            data-testid="mode-demo-btn"
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
              isDemo ? "bg-white text-[#1B263B] shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <FlaskConical size={12} strokeWidth={2} />
            Practice
          </button>
          <button
            onClick={() => setMode("real")}
            data-testid="mode-live-btn"
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
              !isDemo ? "bg-white text-[#426B1F] shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <ExternalLink size={12} strokeWidth={2} />
            Live
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = isActive(path);
          return (
            <Link
              key={label}
              to={path}
              onClick={() => setMobileOpen(false)}
              data-testid={`nav-${label.toLowerCase()}`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-[#1B263B] text-white"
                  : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              <Icon size={17} strokeWidth={active ? 2 : 1.5} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-200">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#1B263B] flex items-center justify-center text-white text-xs font-semibold font-outfit shrink-0">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0">
            <p className="text-[#0F172A] text-sm font-medium truncate">{user?.name}</p>
            <p className="text-slate-400 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          data-testid="logout-button"
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-xs font-medium w-full px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <LogOut size={14} strokeWidth={1.5} /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F5F5F0]">
      {/* Desktop sidebar */}
      <aside className="w-60 bg-[#FFFFFF] border-r border-slate-200 fixed h-full z-30 hidden md:flex flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-60 bg-[#FFFFFF] border-r border-slate-200 flex flex-col h-full z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="md:ml-60 flex-1 min-h-screen flex flex-col">
        {/* Global simulation disclaimer (Demo mode only) */}
        {isDemo && (
          <div
            data-testid="sim-disclaimer-banner"
            className="bg-amber-50 border-b border-amber-200 text-amber-800 text-[11px] md:text-xs font-medium text-center py-1.5 px-4"
          >
            Simulation Platform Only — All trades use virtual currency. No real financial transactions.
          </div>
        )}
        {/* Header */}
        <header className="h-14 sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-slate-500 hover:text-slate-900" onClick={() => setMobileOpen(true)}>
              <Menu size={20} strokeWidth={1.5} />
            </button>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                isDemo
                  ? "bg-slate-50 text-slate-600 border-slate-200"
                  : "bg-[#EAF0E4] text-[#426B1F] border-[#426B1F]/30"
              }`}
            >
              {isDemo ? <FlaskConical size={11} /> : <ExternalLink size={11} />}
              {isDemo ? "Practice Mode" : "Live (External)"}
            </span>
            {!isDemo && (
              <span className="hidden sm:inline text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                Real trading via partners
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isDemo && (
              <div className="hidden sm:block text-sm text-slate-500 font-inter">
                Virtual:{" "}
                <span className="font-semibold text-[#1B263B] font-outfit" data-testid="header-balance">
                  ${(user?.balance ?? 10000).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-4 md:p-8">{children}</div>
      </main>

      {/* Floating AI assistant (Demo mode only — educational) */}
      {isDemo && <AiAssistant />}
    </div>
  );
}
