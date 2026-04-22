import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/api";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash;
    const params = new URLSearchParams(hash.slice(1));
    const sessionId = params.get("session_id");

    if (!sessionId) { navigate("/auth"); return; }

    api.post("/auth/google/session", { session_id: sessionId })
      .then((res) => {
        const { user, token } = res.data;
        login(user, token);
        window.history.replaceState(null, "", window.location.pathname);
        navigate(user.onboarding_complete ? "/dashboard" : "/onboarding");
      })
      .catch(() => navigate("/auth"));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0]">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[#426B1F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-manrope text-[#415A77]">Completing sign in...</p>
      </div>
    </div>
  );
}
