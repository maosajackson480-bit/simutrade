import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Search, ArrowRight } from "lucide-react";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";

const ARTICLES = [
  {
    id: "what-is-vix", category: "Fundamentals", title: "What is the VIX?",
    desc: "The CBOE Volatility Index explained for beginners.", readTime: "5 min",
    content: [
      { heading: "The VIX: Market's Fear Gauge", body: `The VIX (CBOE Volatility Index) was introduced in 1993 and measures the S&P 500's expected volatility over the next 30 days. It's derived from the prices of S&P 500 options.\n\nWhen investors are fearful, they rush to buy put options. This demand drives up option prices, which in turn pushes the VIX higher. When markets are calm, the VIX stays low.\n\nA VIX below 20 generally indicates calm markets. Above 30 suggests significant stress. During the COVID crash in March 2020, the VIX hit an all-time high of 82.69.` },
      { heading: "Key VIX Levels", body: `• Below 15: Very calm — complacency may be building\n• 15–25: Normal range — typical market conditions\n• 25–35: Elevated — some fear in markets\n• Above 35: High fear — potential market dislocation\n• Above 50: Extreme panic — rare, major crisis territory` },
      { heading: "Mean Reversion", body: `Unlike stocks, volatility tends to mean-revert. When the VIX spikes to extreme levels, it almost always comes back down. This is why many traders look for opportunities to go SHORT after a major spike — but this strategy requires careful risk management.` },
    ],
  },
  {
    id: "long-vs-short", category: "Strategy", title: "Long vs. Short Volatility",
    desc: "When to bet that fear will rise — and when to bet it will fall.", readTime: "6 min",
    content: [
      { heading: "Going LONG on Volatility", body: `When you go LONG, you profit if volatility INCREASES. This means you expect markets to become more uncertain or fearful.\n\nScenarios where going long makes sense:\n• Before major economic announcements\n• Ahead of geopolitical events\n• When markets seem overly complacent (VIX unusually low)\n• As a hedge against a stock portfolio` },
      { heading: "Going SHORT on Volatility", body: `When you go SHORT, you profit if volatility DECREASES. After a spike in the VIX, selling volatility is a common institutional strategy.\n\nScenarios for short volatility:\n• After a major market panic where VIX has spiked\n• In low-volatility trending bull markets\n• When you expect central bank intervention to calm markets\n\nNote: Short volatility carries unlimited risk — the VIX can spike far beyond your entry price.` },
    ],
  },
  {
    id: "all-indices", category: "Indices", title: "All 7 Volatility Indices",
    desc: "VIX, VXN, OVX, GVZ, RVX, EVZ, and VVIX — explained.", readTime: "8 min",
    content: [
      { heading: "The Volatility Universe", body: `CBOE offers a suite of volatility indices covering different asset classes:\n\nVIX — S&P 500 (the classic "fear gauge")\nVXN — NASDAQ-100 (tech sector focus)\nOVX — Crude oil volatility (energy markets)\nGVZ — Gold volatility (safe-haven assets)\nRVX — Russell 2000 (small-cap stocks)\nEVZ — EUR/USD (forex markets)\nVVIX — Volatility of VIX itself (meta-volatility)` },
      { heading: "Cross-Index Correlations", body: `These indices often — but not always — move together. During broad market crises, VIX, VXN, and RVX tend to spike simultaneously.\n\nHowever, oil-specific events (OPEC, supply shocks) will primarily move OVX without necessarily moving equity volatility. This creates relative value opportunities for experienced traders.` },
    ],
  },
  {
    id: "risk-management", category: "Risk", title: "Risk Management Basics",
    desc: "Position sizing, risk limits, and protecting your portfolio.", readTime: "5 min",
    content: [
      { heading: "Position Sizing", body: `Never risk too much on a single trade. A common rule: risk no more than 1–2% of your total portfolio per position.\n\nWith a $10,000 portfolio:\n• 1% risk = $100 per trade\n• 2% risk = $200 per trade\n\nIn volatility trading, positions can move very quickly — a VIX spike from 20 to 40 (100% increase) is not uncommon.` },
      { heading: "Diversification", body: `Don't concentrate all capital in one index. Spreading positions across VIX (equity), OVX (oil), and GVZ (gold) provides diversification since these don't always correlate.\n\nUse SimuTrade's Practice Mode to experiment with different allocation strategies before risking real money.` },
    ],
  },
  {
    id: "term-structure", category: "Advanced", title: "VIX Term Structure & Contango",
    desc: "Why long-VIX ETFs bleed value in calm markets.", readTime: "7 min",
    content: [
      { heading: "What Is Term Structure?", body: `The VIX itself is a spot index — you cannot directly buy it. Instead, traders use VIX futures, which have different prices for different expiration months. The curve of these prices is the term structure.\n\nIn normal, calm markets, further-dated futures are more expensive than near-dated ones. This upward-sloping curve is called CONTANGO.` },
      { heading: "Contango: The Silent Killer", body: `When VIX futures are in contango, a long position loses value even if the spot VIX stays flat. Why? As each contract approaches expiry, it converges to the lower spot price — a process called "roll decay".\n\nThis is why products like VXX (a long-VIX ETN) are generally poor long-term holdings: they continuously lose ~5–10% per month to contango.\n\nFor short-term tactical long-vol trades (days, not months), contango is less punishing.` },
      { heading: "Backwardation: A Warning", body: `When near-dated futures trade ABOVE later ones, the curve inverts into backwardation. This is rare and almost always signals acute market stress — Feb 2018, Mar 2020, and brief 2022 periods are examples.\n\nTraders often watch for the VIX curve flipping into backwardation as a "risk off" confirmation signal.` },
    ],
  },
  {
    id: "reading-charts", category: "Practice", title: "Reading a Volatility Chart",
    desc: "Patterns, spikes, and what to ignore.", readTime: "5 min",
    content: [
      { heading: "Unique Chart Behaviour", body: `Volatility indices don't move like stocks. They exhibit:\n\n• Sharp, short spikes followed by slower decay\n• A floor around 9–12 (volatility never goes to zero)\n• Rapid mean reversion from extremes\n• Clustering: high-vol regimes persist before resolving\n\nThis is why classic trend-following techniques often fail on VIX — you're usually better off fading extremes than chasing them.` },
      { heading: "Key Reference Levels", body: `When you look at a VIX chart, always note:\n• The 52-week high and low\n• The 200-day moving average\n• The area around 20 (regime transition level)\n\nOn SimuTrade's /trading page, use the 1M / 3M / 1Y buttons to identify where the current price sits within its recent range before opening a position.` },
    ],
  },
  {
    id: "when-to-close", category: "Strategy", title: "When to Close a Position",
    desc: "Entry is easy. Exiting well is the hard part.", readTime: "4 min",
    content: [
      { heading: "Pre-Define Your Exit", body: `Before opening any simulated position, write down (or mentally commit to) three numbers:\n1) Profit target — price/P&L at which you close for a win\n2) Stop loss — price/P&L at which you cut losses\n3) Time stop — maximum days you'll hold\n\nHaving these decided in advance removes emotion from the exit decision.` },
      { heading: "Common Exit Triggers", body: `• Profit target hit (often 1.5–3× your risk)\n• Stop-loss breached\n• Thesis invalidated by news or data\n• Volatility regime has shifted (e.g. VIX moved from 30+ back under 20)\n• Time decay / roll costs eating into gains\n\nIn SimuTrade, use the Close button on Open Positions and review the realized P&L on your Portfolio page to learn from each round-trip.` },
    ],
  },
  {
    id: "vix-vs-peers", category: "Indices", title: "VIX vs VXN vs OVX — Which to Trade?",
    desc: "Choosing the right index for your macro view.", readTime: "4 min",
    content: [
      { heading: "Pick the Right Weapon", body: `Your choice of index should reflect your directional view:\n\n• Broad-market panic (earnings, Fed) → VIX\n• Tech-specific risk (AI bubble, NASDAQ downgrade) → VXN\n• Oil supply/demand shock (OPEC, Middle East) → OVX\n• Flight-to-safety / USD instability → GVZ\n• Small-cap recession risk → RVX\n• Euro-specific FX stress → EVZ\n• Meta-trade on VIX itself → VVIX\n\nMost beginners should start with VIX — it's the most liquid, most-studied, and has the richest educational context.` },
    ],
  },
];

const GLOSSARY = [
  { term: "VIX", def: "CBOE Volatility Index. Measures S&P 500's expected 30-day volatility." },
  { term: "Implied Volatility (IV)", def: "The market's forecast of a security's future movement, derived from option prices." },
  { term: "Mean Reversion", def: "The tendency of volatility to return to its long-term average after extremes." },
  { term: "Contango", def: "When futures prices are higher than spot. Common in VIX futures — a headwind for long positions." },
  { term: "Backwardation", def: "When futures prices are lower than spot. Rare in VIX — signals extreme market stress." },
  { term: "Vega", def: "An option's sensitivity to changes in implied volatility." },
  { term: "Long Position", def: "Buying a contract expecting its price to RISE." },
  { term: "Short Position", def: "Selling a contract expecting its price to FALL." },
  { term: "Contracts", def: "The unit of trading. In SimuTrade, 1 contract = 1 unit of the index value." },
  { term: "P&L", def: "Profit and Loss — the financial result of a closed trade." },
];

export default function LearnPage() {
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
  const [section, setSection] = useState("articles");
  const [search, setSearch] = useState("");

  const filtered = GLOSSARY.filter((g) =>
    g.term.toLowerCase().includes(search.toLowerCase()) || g.def.toLowerCase().includes(search.toLowerCase())
  );

  const Wrapper = user
    ? Layout
    : ({ children }) => (
      <div className="min-h-screen bg-white font-inter">
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#1B263B] rounded-lg flex items-center justify-center">
              <span className="text-white font-outfit font-bold text-sm">S</span>
            </div>
            <span className="font-outfit text-lg font-semibold text-[#1B263B]">SimuTrade</span>
          </Link>
          <Link to="/auth" className="bg-[#1B263B] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#051A2E] transition-colors">
            Start Free
          </Link>
        </nav>
        <div className="max-w-5xl mx-auto px-6 py-10">{children}</div>
      </div>
    );

  return (
    <Wrapper>
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <span className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-3 block">Learning Center</span>
          <h1 className="font-outfit text-4xl font-semibold text-[#1B263B] mb-3">Master Volatility Trading</h1>
          <p className="text-slate-500 max-w-2xl text-base leading-relaxed">
            Beginner-friendly guides on volatility indices, trading strategies, and risk management.
          </p>
        </div>

        <div className="flex gap-2 mb-8">
          {[{ k: "articles", l: "Articles", i: BookOpen }, { k: "glossary", l: "Glossary", i: Search }].map(({ k, l, i: Icon }) => (
            <button key={k} onClick={() => { setSection(k); setArticle(null); }} data-testid={`learn-tab-${k}`}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                section === k ? "bg-[#1B263B] text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
              }`}>
              <Icon size={15} strokeWidth={1.5} />{l}
            </button>
          ))}
        </div>

        {article && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-card">
            <button onClick={() => setArticle(null)} className="text-sm text-slate-400 hover:text-slate-700 mb-6 flex items-center gap-1 transition-colors">
              ← Back to articles
            </button>
            <span className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-2 block">{article.category}</span>
            <h2 className="font-outfit text-3xl font-semibold text-[#1B263B] mb-2">{article.title}</h2>
            <p className="text-sm text-slate-400 mb-8">{article.readTime} read</p>
            <div className="space-y-8">
              {article.content.map((s) => (
                <div key={s.heading}>
                  <h3 className="font-outfit text-xl font-semibold text-[#1B263B] mb-3">{s.heading}</h3>
                  {s.body.split("\n\n").map((para, i) => (
                    <p key={i} className="text-slate-500 leading-loose mb-4 whitespace-pre-line text-sm">{para}</p>
                  ))}
                </div>
              ))}
            </div>
            {!user && (
              <div className="mt-10 bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
                <p className="font-outfit text-lg font-semibold text-[#1B263B] mb-2">Ready to practice?</p>
                <p className="text-sm text-slate-500 mb-4">Apply what you've learned with $10,000 virtual currency.</p>
                <Link to="/auth" className="inline-flex items-center gap-2 bg-[#426B1F] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#D36649] transition-colors">
                  Start Simulating Free <ArrowRight size={15} />
                </Link>
              </div>
            )}
          </motion.div>
        )}

        {!article && section === "articles" && (
          <div className="grid md:grid-cols-2 gap-5">
            {ARTICLES.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                onClick={() => setArticle(a)} data-testid={`article-card-${a.id}`}
                className="bg-white border border-slate-200 rounded-xl p-6 cursor-pointer card-hover hover:border-slate-300 transition-all">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 block">{a.category}</span>
                <h3 className="font-outfit text-lg font-semibold text-[#1B263B] mb-2">{a.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">{a.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{a.readTime} read</span>
                  <span className="text-sm text-[#1B263B] font-semibold flex items-center gap-1">Read <ArrowRight size={13} /></span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {section === "glossary" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="relative mb-5">
              <Search size={15} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search terms..." value={search} onChange={(e) => setSearch(e.target.value)}
                data-testid="glossary-search"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B263B]/15 focus:border-[#1B263B] transition-all" />
            </div>
            <div className="space-y-2">
              {filtered.map((g) => (
                <div key={g.term} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors">
                  <span className="font-mono text-xs font-semibold text-[#1B263B] bg-slate-100 rounded-md px-2 py-0.5 mr-3">{g.term}</span>
                  <span className="text-sm text-slate-500">{g.def}</span>
                </div>
              ))}
              {filtered.length === 0 && <p className="text-center py-8 text-sm text-slate-400">No terms found for "{search}"</p>}
            </div>
          </motion.div>
        )}
      </div>
    </Wrapper>
  );
}
