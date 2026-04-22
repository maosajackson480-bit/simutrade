import React from "react";
import { Link } from "react-router-dom";

const LEGAL = {
  terms: {
    title: "Terms of Service",
    lastUpdated: "January 2025",
    sections: [
      {
        heading: "1. Nature of Service",
        body: `SimuTrade is an educational trading simulation platform. All trading activity on this platform uses virtual currency and has absolutely no real-world financial impact. No real money, securities, or financial instruments are traded, bought, or sold through SimuTrade.

By using SimuTrade, you acknowledge and agree that:
• This is a simulation platform for educational purposes only
• All account balances and trades are virtual/simulated
• No real financial gain or loss will occur
• SimuTrade is not a licensed financial institution or broker`,
      },
      {
        heading: "2. Not Financial Advice",
        body: `Nothing on SimuTrade constitutes financial advice, investment advice, trading advice, or any other advice. SimuTrade is an educational tool only. You should not make real investment decisions based on your experience with this platform.

Always consult a qualified financial advisor before making real investment decisions. Past simulated performance does not predict future real-world results.`,
      },
      {
        heading: "3. No Affiliation",
        body: `SimuTrade is NOT affiliated with, endorsed by, or connected to:
• CBOE Global Markets
• NYSE or NASDAQ
• Any real brokerage or trading platform
• Any financial institution

All volatility index data is sourced from public APIs for educational purposes only.`,
      },
      {
        heading: "4. Account Rules",
        body: `You must be 18 years or older to use SimuTrade. You are responsible for maintaining the security of your account credentials. SimuTrade reserves the right to terminate accounts that violate these terms.

Your virtual balance starts at $10,000 and is entirely fictional. It has no monetary value and cannot be withdrawn or exchanged.`,
      },
      {
        heading: "5. Data & Privacy",
        body: `We collect minimal data necessary to provide the service: your email address, name, and simulated trading activity. We do not sell personal data to third parties. Please see our Privacy Policy for full details.`,
      },
      {
        heading: "6. Limitation of Liability",
        body: `SimuTrade is provided "as is" without warranties of any kind. We are not liable for any losses, damages, or decisions made based on the use of this platform. The platform may experience downtime or data inaccuracies.`,
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    lastUpdated: "January 2025",
    sections: [
      {
        heading: "1. Information We Collect",
        body: `When you create a SimuTrade account, we collect:
• Email address (for authentication)
• Display name (for personalization)
• Simulated trading activity (positions, trades, P&L)
• Account preferences (experience level, risk tolerance)

We do NOT collect: payment information, ID documents, real financial data, or sensitive personal information.`,
      },
      {
        heading: "2. How We Use Your Information",
        body: `Your information is used solely to:
• Authenticate your account
• Display your simulated trading history
• Personalize your learning experience
• Improve the SimuTrade platform

We do not use your data for advertising, profiling, or any commercial purpose beyond providing the service.`,
      },
      {
        heading: "3. Data Storage & Security",
        body: `Your data is stored securely in MongoDB databases with appropriate access controls. Passwords are hashed using bcrypt and are never stored in plain text. Authentication tokens are time-limited for security.

We implement industry-standard security measures, but no system is 100% secure. Please use a unique password for your SimuTrade account.`,
      },
      {
        heading: "4. Third-Party Services",
        body: `SimuTrade uses the following third-party services:
• Google OAuth (optional login method) — subject to Google's Privacy Policy
• Yahoo Finance API (market data) — public market data only
• CBOE public data feeds

We do not share your personal data with these services beyond what's required for authentication.`,
      },
      {
        heading: "5. Your Rights",
        body: `You have the right to:
• Access your personal data
• Delete your account and all associated data
• Opt out of any optional communications

To exercise these rights, contact us or simply delete your account from the Settings page.`,
      },
      {
        heading: "6. Contact",
        body: `For any privacy concerns or data requests, please reach out through the platform. As an educational simulation tool, we are committed to transparency and minimal data collection.`,
      },
    ],
  },
};

export default function LegalPage({ page = "terms" }) {
  const doc = LEGAL[page] || LEGAL.terms;

  return (
    <div className="min-h-screen bg-[#F5F5F0] font-manrope">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#F5F5F0]/90 backdrop-blur-xl border-b border-[#D1CDC3]/50 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#C05746] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm font-outfit">S</span>
          </div>
          <span className="font-outfit text-xl font-semibold text-[#1A2421]">SimuTrade</span>
        </Link>
        <div className="flex gap-4">
          <Link to="/terms" className={`text-sm transition-colors ${page === "terms" ? "text-[#1A2421] font-medium" : "text-[#415A77] hover:text-[#1A2421]"}`}>
            Terms
          </Link>
          <Link to="/privacy" className={`text-sm transition-colors ${page === "privacy" ? "text-[#1A2421] font-medium" : "text-[#415A77] hover:text-[#1A2421]"}`}>
            Privacy
          </Link>
        </div>
      </nav>

      {/* Disclaimer banner */}
      <div className="bg-[#C05746]/10 border-b border-[#C05746]/20 text-center py-2 px-4">
        <p className="text-xs text-[#C05746] font-medium">
          SimuTrade is a simulation platform only. Not affiliated with CBOE, NYSE, or any real trading platform.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-outfit text-4xl font-semibold text-[#1A2421] mb-3">{doc.title}</h1>
        <p className="text-sm text-[#7A8C83] mb-12">Last updated: {doc.lastUpdated}</p>

        <div className="space-y-10">
          {doc.sections.map((section) => (
            <div key={section.heading}>
              <h2 className="font-outfit text-xl font-semibold text-[#1A2421] mb-4">{section.heading}</h2>
              {section.body.split("\n\n").map((para, i) => (
                <p key={i} className="text-[#415A77] leading-loose mb-4 whitespace-pre-line text-sm">{para}</p>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-12 bg-[#C05746]/5 border border-[#C05746]/20 rounded-2xl p-6">
          <p className="text-sm text-[#C05746] font-medium mb-2">Important Reminder</p>
          <p className="text-xs text-[#7A8C83] leading-relaxed">
            SimuTrade is an <strong className="text-[#415A77]">educational simulation platform only</strong>. All trading uses virtual currency with no real financial impact.
            Not financial advice. Not affiliated with any real trading platform.
          </p>
        </div>

        <div className="mt-8 flex gap-4">
          <Link to="/" className="text-sm text-[#415A77] hover:text-[#1A2421] transition-colors">← Back to Home</Link>
          <Link to="/auth" className="text-sm text-[#426B1F] hover:text-[#1A2421] transition-colors font-medium">
            Create Free Account →
          </Link>
        </div>
      </div>
    </div>
  );
}
