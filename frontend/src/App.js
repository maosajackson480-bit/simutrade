import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ModeProvider } from "./contexts/ModeContext";
import AuthCallback from "./components/AuthCallback";
import RealModePage from "./pages/RealModePage";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import TradingPage from "./pages/TradingPage";
import PortfolioPage from "./pages/PortfolioPage";
import LearnPage from "./pages/LearnPage";
import SettingsPage from "./pages/SettingsPage";
import LegalPage from "./pages/LegalPage";
import "./App.css";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0]">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[#426B1F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-manrope text-[#415A77] text-sm">Loading SimuTrade...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;
  if (!user.onboarding_complete && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}

function AppRouter() {
  const location = useLocation();
  // CRITICAL: Handle Google OAuth callback BEFORE any other routing
  // REMINDER: DO NOT HARDCODE THE URL OR ADD FALLBACKS - THIS BREAKS AUTH
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/trading" element={<ProtectedRoute><TradingPage /></ProtectedRoute>} />
      <Route path="/portfolio" element={<ProtectedRoute><PortfolioPage /></ProtectedRoute>} />
      <Route path="/learn" element={<LearnPage />} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/brokers" element={<ProtectedRoute><RealModePage /></ProtectedRoute>} />
      <Route path="/legal" element={<LegalPage page="terms" />} />
      <Route path="/terms" element={<LegalPage page="terms" />} />
      <Route path="/privacy" element={<LegalPage page="privacy" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ModeProvider>
          <AppRouter />
        </ModeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
