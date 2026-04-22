import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, Gauge, GraduationCap, ArrowRight, CheckCircle } from "@phosphor-icons/react";
import api from "../utils/api";
import { useAuth } from "../contexts/AuthContext";

const EXPERIENCE_OPTIONS = [
  { value: "beginner", label: "Complete Beginner", desc: "New to trading and financial markets" },
  { value: "intermediate", label: "Some Experience", desc: "Understand basic market concepts" },
  { value: "advanced", label: "Experienced Trader", desc: "Familiar with volatility products" },
];

const RISK_OPTIONS = [
  { value: "low", label: "Conservative", desc: "I prefer small, cautious positions" },
  { value: "medium", label: "Moderate", desc: "Balanced approach to risk and reward" },
  { value: "high", label: "Aggressive", desc: "I'm comfortable with high-risk strategies" },
];

const GOAL_OPTIONS = [
  "Understand the VIX", "Learn volatility basics", "Practice trading strategies",
  "Hedge a real portfolio", "Academic research", "Just exploring",
];

const STEPS = [
  { id: 1, title: "Your Profile", icon: User },
  { id: 2, title: "Risk Tolerance", icon: Gauge },
  { id: 3, title: "Quick Tutorial", icon: GraduationCap },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [experience, setExperience] = useState("");
  const [risk, setRisk] = useState("");
  const [goals, setGoals] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const toggleGoal = (g) =>
    setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      await api.put("/auth/onboarding", {
        experience_level: experience || "beginner",
        risk_tolerance: risk || "medium",
        trading_goals: goals,
      });
      await refreshUser();
      navigate("/dashboard");
    } catch {
      navigate("/dashboard");
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return experience !== "";
    if (step === 2) return risk !== "";
    return true;
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center px-4 py-12 font-manrope">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-9 h-9 bg-[#C05746] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold font-outfit">S</span>
            </div>
            <span className="font-outfit text-2xl font-semibold text-[#1A2421]">SimuTrade</span>
          </div>
          <p className="text-[#415A77] text-sm">Let's personalize your experience</p>
        </div>

        {/* Step progress */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                step === s.id
                  ? "bg-[#426B1F] text-white shadow-sm"
                  : step > s.id
                  ? "bg-[#426B1F]/10 text-[#426B1F]"
                  : "bg-[#EAE7E0] text-[#7A8C83]"
              }`}>
                {step > s.id ? <CheckCircle size={14} weight="fill" /> : <s.icon size={14} />}
                <span>{s.title}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-6 transition-colors ${step > s.id ? "bg-[#426B1F]" : "bg-[#D1CDC3]"}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white border border-[#D1CDC3] rounded-2xl p-8 shadow-sm"
          >
            {step === 1 && (
              <div>
                <h2 className="font-outfit text-2xl font-semibold text-[#1A2421] mb-2">
                  What's your trading experience?
                </h2>
                <p className="text-sm text-[#415A77] mb-8">
                  We'll tailor your experience and recommendations based on your background.
                </p>
                <div className="space-y-3">
                  {EXPERIENCE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setExperience(opt.value)}
                      data-testid={`experience-${opt.value}`}
                      className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                        experience === opt.value
                          ? "border-[#426B1F] bg-[#426B1F]/5"
                          : "border-[#D1CDC3] hover:border-[#415A77]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-[#1A2421] text-sm">{opt.label}</p>
                          <p className="text-xs text-[#7A8C83] mt-0.5">{opt.desc}</p>
                        </div>
                        {experience === opt.value && (
                          <CheckCircle size={20} weight="fill" className="text-[#426B1F] shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="font-outfit text-2xl font-semibold text-[#1A2421] mb-2">
                  What's your risk tolerance?
                </h2>
                <p className="text-sm text-[#415A77] mb-8">
                  This helps us guide your first simulated trades with appropriate position sizing.
                </p>
                <div className="space-y-3">
                  {RISK_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setRisk(opt.value)}
                      data-testid={`risk-${opt.value}`}
                      className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                        risk === opt.value
                          ? "border-[#C05746] bg-[#C05746]/5"
                          : "border-[#D1CDC3] hover:border-[#7A8C83]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-[#1A2421] text-sm">{opt.label}</p>
                          <p className="text-xs text-[#7A8C83] mt-0.5">{opt.desc}</p>
                        </div>
                        {risk === opt.value && (
                          <CheckCircle size={20} weight="fill" className="text-[#C05746] shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="font-outfit text-2xl font-semibold text-[#1A2421] mb-2">
                  Quick orientation
                </h2>
                <p className="text-sm text-[#415A77] mb-6">
                  Select your goals (optional), then start exploring the simulator.
                </p>
                <div className="flex flex-wrap gap-2 mb-8">
                  {GOAL_OPTIONS.map((g) => (
                    <button
                      key={g}
                      onClick={() => toggleGoal(g)}
                      data-testid={`goal-${g.replace(/\s+/g, "-").toLowerCase()}`}
                      className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                        goals.includes(g)
                          ? "bg-[#426B1F] text-white border-[#426B1F]"
                          : "bg-white text-[#415A77] border-[#D1CDC3] hover:border-[#426B1F]"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>

                {/* Key concepts */}
                <div className="bg-[#F5F5F0] rounded-xl p-5 space-y-3">
                  <h4 className="font-outfit font-semibold text-sm text-[#1A2421]">Key concepts to know:</h4>
                  {[
                    ["VIX", "CBOE's \"fear gauge\" — measures expected S&P 500 volatility over 30 days"],
                    ["LONG", "You profit when the index RISES — e.g., market fear increases"],
                    ["SHORT", "You profit when the index FALLS — e.g., market calm returns"],
                    ["Contracts", "Number of units you're trading (1 contract = 1 unit of the index value)"],
                  ].map(([term, def]) => (
                    <div key={term} className="flex gap-3">
                      <span className="font-mono text-xs font-semibold text-[#426B1F] bg-[#426B1F]/10 rounded px-2 py-0.5 h-fit mt-0.5">{term}</span>
                      <span className="text-xs text-[#415A77] leading-relaxed">{def}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
            className="px-6 py-3 text-sm text-[#7A8C83] hover:text-[#1A2421] transition-colors disabled:opacity-0"
          >
            Back
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              data-testid="onboarding-next"
              className="flex items-center gap-2 bg-[#426B1F] text-white px-8 py-3 rounded-xl text-sm font-medium hover:bg-[#1E362A] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={submitting}
              data-testid="onboarding-finish"
              className="flex items-center gap-2 bg-[#C05746] text-white px-8 py-3 rounded-xl text-sm font-medium hover:bg-[#A64B3C] transition-all disabled:opacity-60"
            >
              {submitting ? "Setting up..." : "Start Simulating"} <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
