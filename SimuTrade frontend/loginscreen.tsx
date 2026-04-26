"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Eye, EyeOff, LogIn, Play, AlertCircle } from "lucide-react";
import { apiFetch, ENDPOINTS, saveAuth } from "@/lib/api";

interface LoginScreenProps {
  onLogin: (token: string, isDemo: boolean) => void;
  onLogoClick: () => void;
}

export function LoginScreen({ onLogin, onLogoClick }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // UPDATED: Mapping email state to userId key for the backend
      const data = await apiFetch<{ token: string; user?: { email: string } }>(
        ENDPOINTS.login,
        {
          method: "POST",
          body: JSON.stringify({ 
            userId: email, 
            password 
          }),
        }
      );

      if (data.token) {
        saveAuth(data.token, data.user || { email });
      }

      onLogin(data.token, false);
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError(
          "Cannot connect to server. The server may be starting up (takes ~30s on first request). Please try again."
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    saveAuth("demo_token_12345", { email: "demo@simutrade.com" });
    onLogin("demo_token_12345", true);
  };

  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid effect */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(45, 212, 191, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(45, 212, 191, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Glowing orb effect */}
      <motion.div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      {/* Login Card */}
      <motion.div
        className="w-full max-w-md bg-[#0d1f35]/90 backdrop-blur-xl rounded-2xl border border-teal-500/20 p-6 sm:p-8 relative z-10"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <motion.button
          onClick={onLogoClick}
          className="flex flex-col items-center mb-8 mx-auto hover:opacity-80 transition-opacity"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-teal-500/30 mb-4">
            <Image
              src="/images/simutrade-logo.png"
              alt="SimuTrade"
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
            SIMUTRADE
          </h1>
        </motion.button>

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">
            Connect Your Deriv Account
          </h2>
          <p className="text-gray-400 text-sm">
            Sign in to access trading features
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Email / Deriv Username
            </label>
            <input
              type="text"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#0a1628] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
              placeholder="Enter your email or username"
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#0a1628] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors pr-12"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors p-1"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <motion.button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            whileHover={{ scale: isLoading ? 1 : 1.01 }}
            whileTap={{ scale: isLoading ? 1 : 0.99 }}
          >
            {isLoading ? (
              <>
                <motion.div
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                Connecting...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Login with Deriv
              </>
            )}
          </motion.button>
        </form>

        {/* Create Account Link */}
        <div className="text-center mt-4">
          <p className="text-gray-400 text-sm">
            {"Don't have a Deriv account? "}
            <a
              href="https://deriv.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 hover:text-teal-300 underline transition-colors"
            >
              Create one
            </a>
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-600" />
          <span className="text-gray-500 text-sm">or</span>
          <div className="flex-1 h-px bg-gray-600" />
        </div>

        {/* Demo Mode Button */}
        <motion.button
          type="button"
          onClick={handleDemoLogin}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-transparent border-2 border-gray-600 hover:border-teal-500 text-gray-300 hover:text-white font-semibold rounded-xl transition-all"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Play className="w-5 h-5" />
          Continue with Demo Account
        </motion.button>

        {/* Footer text */}
        <p className="text-center text-gray-500 text-xs mt-6">
          Demo mode uses simulated data. For live trading, connect your Deriv
          account.
        </p>
      </motion.div>

      {/* Bottom info */}
      <motion.div
        className="mt-8 flex items-center gap-4 text-gray-500 text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <span>Advanced Algorithms</span>
        <span>-</span>
        <span>Real-time Data</span>
        <span>-</span>
        <span>Secure Connection</span>
      </motion.div>
    </div>
  );
}