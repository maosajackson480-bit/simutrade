import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { connectDB } from "./database.js";

import {
  createDerivConnection,
  authorizeUser,
  getBalance,
  streamTicks
} from "./derivSocket.js";

import {
  createSession,
  getSession,
  updateSessionBalance
} from "./core/sessionManager.js";

import { buyTrade, sellTrade } from "./trading.js";

import Trade from "./models/Trade.js";
import User from "./models/User.js";

import {
  getOrCreateWallet,
  addBalance
} from "./core/walletManager.js";

import {
  generateToken,
  hashPassword,
  comparePassword
} from "./auth/auth.js";

import {
  authMiddleware,
  adminMiddleware
} from "./middleware/authMiddleware.js";

const app = express();

/**
 * ===================================
 * ⚙️ SETTINGS
 * ===================================
 */
app.set("trust proxy", 1);

const PORT = process.env.PORT || 10000;

const allowedOrigins = [
  "http://localhost:3000",
  "https://v0-simutrade-platform-build.vercel.app",
  process.env.FRONTEND_URL
];

/**
 * ===================================
 * 🌐 CORS
 * ===================================
 */
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("CORS not allowed"));
      }
    },
    credentials: true
  })
);

app.use(express.json());

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 50
  })
);

/**
 * ===================================
 * 🔥 CRASH PROTECTION
 * ===================================
 */
process.on("uncaughtException", (err) =>
  console.error("🔥 UNCAUGHT:", err)
);

process.on("unhandledRejection", (err) =>
  console.error("🔥 UNHANDLED:", err)
);

/**
 * ===================================
 * 🧠 HELPER
 * ===================================
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * ===================================
 * ✅ ROOT
 * ===================================
 */
app.get("/", (req, res) => {
  res.send("🚀 SimuTrade Backend Live");
});

/**
 * ===================================
 * ❤️ HEALTH CHECK
 * ===================================
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

/**
 * ===================================
 * 🔥 DERIV CONNECT
 * ===================================
 */
app.post("/api/deriv/connect", asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new Error("Token is required");
  }

  let ws;

  try {
    ws = await createDerivConnection();
    const user = await authorizeUser(ws, token);
    const balance = await getBalance(ws);

    res.json({
      success: true,
      user: {
        loginid: user.loginid,
        balance
      }
    });

  } catch (err) {
    console.error("Deriv Error:", err.message);

    res.status(400).json({
      error: err.message
    });

  } finally {
    if (ws) ws.close();
  }
}));

/**
 * ===================================
 * 📡 LIVE TICKS STREAM (SSE)
 * ===================================
 */
app.get("/api/deriv/ticks/:symbol", asyncHandler(async (req, res) => {
  const { symbol } = req.params;
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: "Token required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let ws;

  try {
    ws = await createDerivConnection();
    await authorizeUser(ws, token);

    streamTicks(ws, symbol, (tick) => {
      res.write(`data: ${JSON.stringify(tick)}\n\n`);
    });

    req.on("close", () => {
      console.log("Client disconnected");
      if (ws) ws.close();
    });

  } catch (err) {
    console.error("Tick Stream Error:", err.message);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
  }
}));

/**
 * ===================================
 * 📊 ASSETS
 * ===================================
 */
app.get("/api/assets", (req, res) => {
  res.json({
    derived: {
      baskets: ["AUD Basket", "EUR Basket", "GBP Basket", "USD Basket"],
      synthetics: [
        "Volatility 10",
        "Volatility 25",
        "Volatility 50",
        "Volatility 75",
        "Volatility 100",
        "Jump 10",
        "Jump 25",
        "Boom 500",
        "Crash 500"
      ]
    },
    forex: ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCHF"],
    stockIndices: ["US500", "USTECH", "Wall Street", "UK100", "Germany30"]
  });
});

/**
 * ===================================
 * 📈 CHART (TEMP)
 * ===================================
 */
app.get("/api/chart/:symbol", (req, res) => {
  const candles = [];
  let price = 950;

  for (let i = 0; i < 60; i++) {
    price += (Math.random() - 0.5) * 3;

    candles.push({
      time: Date.now() - (60 - i) * 60000,
      price: Number(price.toFixed(3))
    });
  }

  res.json({
    symbol: req.params.symbol,
    candles
  });
});

/**
 * ===================================
 * 🔐 AUTH
 * ===================================
 */
app.post("/api/register", asyncHandler(async (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password)
    throw new Error("Missing fields");

  const exists = await User.findOne({ userId });

  if (exists)
    throw new Error("User exists");

  const hashed = await hashPassword(password);

  await User.create({
    userId,
    password: hashed,
    role: "user"
  });

  res.json({ message: "User created" });
}));

app.post("/api/login", asyncHandler(async (req, res) => {
  const { userId, password } = req.body;

  const user = await User.findOne({ userId });

  if (!user)
    throw new Error("User not found");

  const ok = await comparePassword(password, user.password);

  if (!ok)
    throw new Error("Invalid credentials");

  const token = generateToken(user);

  res.json({
    token,
    userId: user.userId,
    role: user.role
  });
}));

/**
 * ===================================
 * 💰 WALLET
 * ===================================
 */
app.get("/api/wallet", authMiddleware, asyncHandler(async (req, res) => {
  const wallet = await getOrCreateWallet(req.user.userId);
  res.json(wallet);
}));

/**
 * ===================================
 * ❌ ERROR
 * ===================================
 */
app.use((err, req, res, next) => {
  console.error(err.message);

  res.status(500).json({
    error: err.message
  });
});

/**
 * ===================================
 * 🚀 START
 * ===================================
 */
const start = async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`🚀 Running on port ${PORT}`);
    });

  } catch (err) {
    console.error("❌ Startup failed:", err.message);
  }
};

start();
