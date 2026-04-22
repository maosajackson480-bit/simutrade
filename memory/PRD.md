# SimuTrade — Product Requirements Document

## Original Problem Statement
Build "SimuTrade", a production-ready volatility-index trading platform with two strict modes:
- **Demo Mode** — virtual $10K balance, fully simulated trading of CBOE volatility indices via yfinance (VIX, VXN, VVIX, OVX, GVZ, EVZ, RVX). Zero-signup guest entry.
- **Real Mode** — user pastes their Deriv API token; real CALL/PUT binary-option contracts execute on Deriv's infrastructure. SimuTrade never holds, custodies, or processes funds.

Premium, original Swiss/fintech UI (Bone + Navy + Coral) — distinct from any competitor, inspired by Mercury/Stripe/Linear. Compliance disclaimers on every authenticated page.

## Tech Stack
- **Frontend**: React 18, React Router 6, Tailwind, Shadcn UI, Framer Motion, Lucide, Recharts, react-fast-marquee
- **Fonts**: Outfit (display), Manrope (body), JetBrains Mono (numbers)
- **Backend**: FastAPI, Motor (async MongoDB), PyJWT, bcrypt, yfinance, websockets, cryptography (Fernet), requests
- **LLM**: Claude Sonnet 4.5 via `emergentintegrations` + Emergent LLM key
- **Real trading**: Deriv WebSocket API (`wss://ws.derivws.com/websockets/v3`)
- **Auth**: Email/password JWT + Emergent-managed Google OAuth + **Guest** (instant, JWT, 7-day TTL)

## Backend Architecture
```
/app/backend/
├── server.py                 # App wiring, CORS, /api/health, TTL indexes, idempotent admin seed
├── core/
│   ├── config.py             # Mongo client, env vars, JWT constants
│   ├── security.py           # hash_password, JWT, get_current_user dep
│   ├── market.py             # yfinance quote cache (60s TTL), VOLATILITY_INDICES
│   ├── crypto.py             # Fernet encrypt/decrypt for Deriv tokens
│   └── deriv_client.py       # Async WS client + stream_ticks
├── models/schemas.py         # Pydantic request models
└── routes/
    ├── auth.py               # register, login, me, logout, onboarding, google, GUEST
    ├── market.py             # quotes, history
    ├── trading.py            # open/close positions (accepts quantity OR contracts)
    ├── portfolio.py          # summary with live-unrealized P&L
    ├── ai.py                 # /ai/chat, /ai/sessions, /ai/explain-trade
    └── deriv.py              # /connect, /status, /symbols, /portfolio, /buy, /sell, WS /ticks
```

## Implemented Features (as of Feb 2026)

### Auth & Sessions
- [x] Email register/login (JWT 7-day)
- [x] Emergent Google OAuth
- [x] **Guest mode** — `POST /api/auth/guest` creates throwaway user with $10k balance; auto-deleted after 7 days via Mongo TTL index
- [x] Onboarding (3-step, skipped for guests)
- [x] Idempotent admin seed (upsert with `$setOnInsert` preserves balance)

### Demo Trading (simulated)
- [x] 7 CBOE volatility indices from yfinance (60s cache)
- [x] Long/Short positions, open/close, realized + unrealized P&L
- [x] Portfolio summary with live quote recalculation
- [x] 30s real-time polling on Dashboard + Trading Terminal
- [x] `POST /api/trading/open` accepts both `quantity` and `contracts`

### Real Trading (via Deriv)
- [x] Token-paste auth (no OAuth complexity, no password collection)
- [x] Fernet-encrypted token storage
- [x] Balance, symbols, portfolio, BUY (CALL/PUT), SELL all working
- [x] Live tick WebSocket proxy at `/api/deriv/ticks/{symbol}`
- [x] Graceful fallback to Demo Mode if Deriv unreachable
- [x] Compliance banner: "Real trading is executed via Deriv"

### AI Educational Assistant (Claude Sonnet 4.5)
- [x] Floating SimuBot panel (bottom-right, Demo mode only)
- [x] Multi-turn chat with market context injection (live VIX/VXN/OVX)
- [x] System prompt strictly non-advisory + mentions "simulation" disclaimer
- [x] Per-trade rationale card on TradingPage after position open
- [x] Message history persisted in MongoDB (`ai_messages`)

### Design System — Bone / Navy / Coral (premium fintech)
- [x] Background `#F5F5F0` bone, surface `#FFFFFF`
- [x] Primary text `#1B263B` deep navy
- [x] Brand accent `#E07A5F` soft coral (CTAs, highlights)
- [x] Success `#426B1F` forest (Long/gain)
- [x] Danger `#9E2A2B` deep wine (Short/loss)
- [x] Warning `#E3B505` golden sand (disclaimer banners)
- [x] Borders `#E5E5DF` soft bone
- [x] Typography: Outfit (display), Manrope (body), JetBrains Mono (numbers)
- [x] Radii: 16px cards, 12px buttons/inputs
- [x] Soft ambient shadows, 250ms transitions with hover lift

### Pages
- [x] Landing (dual hero CTA: Start Demo / Start Real + Learning Center; marquee ticker; features; steps; disclaimer)
- [x] Auth (email + Google OAuth)
- [x] Onboarding (3-step experience/risk/goals)
- [x] Dashboard (metrics cards, watchlist, Practice Account CTA, guest banner, positions, 30s polling)
- [x] Trading Terminal (index selector, chart, order panel, positions, AI rationale)
- [x] Portfolio (summary, open positions, history)
- [x] Real Mode /brokers (Deriv connect hub, modal, balance card, BUY form, open-contracts table)
- [x] Learn (8 articles, glossary, search)
- [x] Settings (profile, Deriv disconnect [pending])
- [x] Legal (/terms, /privacy, /legal alias)

### Compliance
- [x] Global "Simulation Platform Only" amber banner on all authenticated Demo pages
- [x] Coral "Real trading is executed via Deriv — SimuTrade does not hold funds" banner on /brokers
- [x] "No real financial transactions" language in Settings, Landing, disclaimers

### Testing
- [x] 31/31 pytest tests passing at `/app/backend/tests/test_simutrade.py`
- [x] 4 testing-agent iterations all passing ≥90% frontend / 100% backend

## Backlog / Roadmap

### P1
- Swap placeholder `?ref=simutrade` broker affiliate URLs when real programs are signed (RealModePage.js `BROKERS[]`)
- Settings page: password change, Deriv disconnect confirmation, account deletion
- Per-user rate limits on `/api/ai/chat` (20/min) and `/api/deriv/*` (30/min)
- Deriv: WS ticket endpoint so JWT is not in URL query (use one-time signed ticket)

### P2
- Guest → registered upgrade flow (currently fresh-start on signup)
- Watchlist persistence per user
- Historical chart enhancements (candlestick, volume, multiple indicators)
- Real-time price pulse animation on tick updates
- Leaderboard of best simulated returns

### P3
- CSV trade export
- Email notifications via Resend
- FastAPI lifespan context manager (migrate from deprecated `@on_event`)
- Pool Deriv WebSocket connections instead of opening/closing per request

## Test Credentials
See `/app/memory/test_credentials.md`.
