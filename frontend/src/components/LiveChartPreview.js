import React, { useEffect, useRef, useState } from "react";

/**
 * LiveChartPreview — a lightweight, pure-SVG animated line chart.
 * - No external chart library (no recharts bundle impact)
 * - No network calls
 * - Seeded random-walk data, smooth sliding-window animation
 * - Mobile responsive via viewBox + 100% width
 */
const W = 520;          // SVG viewBox width
const H = 300;          // SVG viewBox height
const PAD_X = 18;
const PAD_Y = 24;
const POINTS = 48;
const TICK_MS = 1200;

// deterministic seed for first paint (SSR-safe)
const seedPoints = () => {
  let v = 19.6;
  const out = [];
  for (let i = 0; i < POINTS; i++) {
    v += (Math.sin(i * 0.35) * 0.22) + (Math.cos(i * 0.11) * 0.18);
    out.push(v);
  }
  return out;
};

export default function LiveChartPreview() {
  const [data, setData] = useState(seedPoints);
  const [hover, setHover] = useState(false);
  const ref = useRef(null);

  // Advance the random walk once per TICK_MS, but pause when tab is hidden.
  useEffect(() => {
    let t;
    const tick = () => {
      setData((prev) => {
        const last = prev[prev.length - 1];
        // small mean-reverting random walk around 19.5
        const drift = (19.5 - last) * 0.08;
        const noise = (Math.random() - 0.5) * 0.9;
        const next = Math.max(10, Math.min(32, last + drift + noise));
        return [...prev.slice(1), next];
      });
    };
    const schedule = () => { t = setTimeout(() => { tick(); schedule(); }, TICK_MS); };
    schedule();
    const onVis = () => { if (document.hidden) clearTimeout(t); else schedule(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearTimeout(t); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  // Map data → SVG coordinates
  const min = Math.min(...data) - 0.5;
  const max = Math.max(...data) + 0.5;
  const xStep = (W - PAD_X * 2) / (POINTS - 1);
  const yOf = (v) => PAD_Y + (1 - (v - min) / (max - min)) * (H - PAD_Y * 2);

  const pts = data.map((v, i) => [PAD_X + i * xStep, yOf(v)]);
  const linePath = pts.map(([x, y], i) => (i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : `L ${x.toFixed(2)} ${y.toFixed(2)}`)).join(" ");
  const areaPath = `${linePath} L ${pts[pts.length - 1][0].toFixed(2)} ${H - PAD_Y} L ${PAD_X} ${H - PAD_Y} Z`;

  const last = data[data.length - 1];
  const prev = data[data.length - 2] || last;
  const changePct = ((last - prev) / prev) * 100;
  const rising = changePct >= 0;

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative w-full h-full rounded-2xl bg-white border border-[#E5E5DF] shadow-card transition-all duration-300 overflow-hidden"
      style={{ transform: hover ? "translateY(-2px)" : "translateY(0)", boxShadow: hover ? "0 20px 40px rgba(27,38,59,0.08)" : undefined }}
      data-testid="hero-chart-preview"
      aria-label="Live volatility chart preview"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E5DF]">
        <div className="flex items-center gap-3">
          <span className="font-outfit text-sm font-medium text-[#1B263B]">VIX</span>
          <span className="font-mono text-base font-medium text-[#1B263B]">{last.toFixed(2)}</span>
          <span className={`font-mono text-xs font-medium ${rising ? "text-[#426B1F]" : "text-[#9E2A2B]"}`}>
            {rising ? "▲" : "▼"} {Math.abs(changePct).toFixed(2)}%
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#778DA9]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E07A5F] live-dot" />
          LIVE
        </div>
      </div>

      {/* Chart */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="block w-full"
        style={{ height: "calc(100% - 48px)" }}
        role="img"
      >
        <defs>
          <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#E07A5F" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#E07A5F" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Subtle grid */}
        {[0.25, 0.5, 0.75].map((r) => (
          <line
            key={r}
            x1={PAD_X}
            x2={W - PAD_X}
            y1={PAD_Y + (H - PAD_Y * 2) * r}
            y2={PAD_Y + (H - PAD_Y * 2) * r}
            stroke="#E5E5DF"
            strokeDasharray="3 6"
            strokeWidth="1"
          />
        ))}

        {/* Area */}
        <path
          d={areaPath}
          fill="url(#areaFill)"
          style={{ transition: "d 1s ease-in-out" }}
        />
        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#E07A5F"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: "d 1s ease-in-out" }}
        />
        {/* Last-point dot */}
        <circle
          cx={pts[pts.length - 1][0]}
          cy={pts[pts.length - 1][1]}
          r="4.5"
          fill="#E07A5F"
          style={{ transition: "cx 1s ease-in-out, cy 1s ease-in-out" }}
        />
        <circle
          cx={pts[pts.length - 1][0]}
          cy={pts[pts.length - 1][1]}
          r="9"
          fill="#E07A5F"
          opacity="0.25"
          style={{ transition: "cx 1s ease-in-out, cy 1s ease-in-out" }}
        />
      </svg>

      {/* Footer mini-stats */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none">
        <span className="text-[10px] font-mono text-[#778DA9]">Last {POINTS * TICK_MS / 1000 | 0}s</span>
        <span className="text-[10px] text-[#778DA9]">Simulated preview</span>
      </div>
    </div>
  );
}
