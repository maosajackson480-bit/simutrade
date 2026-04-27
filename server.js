import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { connectDB } from "./database.js";

import {
  createDerivConnection,
  authorizeUser,
  getBalance
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
 * ⚙️ MIDDLEWARE
 * ===================================
 */
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://v0-simutrade.vercel.app"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 50
  })
);

const PORT = process.env.PORT || 10000;

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
 * 📊 ASSETS
 * ===================================
 */
app.get("/assets", (req, res) => {
  res.json({
    derived: {
      baskets: [
        "AUD Basket",
        "EUR Basket",
        "GBP Basket",
        "USD Basket"
      ],
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
    forex: [
      "EURUSD",
      "GBPUSD",
      "USDJPY",
      "AUDUSD",
      "USDCHF"
    ],
    stockIndices: [
      "US500",
      "USTECH",
      "Wall Street",
      "UK100",
      "Germany30"
    ]
  });
});

/**
 * ===================================
 * 📈 LIVE CHART DATA
 * ===================================
 */
app.get("/chart/:symbol", (req, res) => {
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
app.post("/register", asyncHandler(async (req, res) => {
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

  res.json({
    message: "User created"
  });
}));

app.post("/login", asyncHandler(async (req, res) => {
  const { userId, password } = req.body;

  const user = await User.findOne({ userId });

  if (!user)
    throw new Error("User not found");

  const ok = await comparePassword(
    password,
    user.password
  );

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
 * 🎮 DEMO / REAL MODE
 * ===================================
 */
app.post("/mode", authMiddleware, (req, res) => {
  const { mode } = req.body;

  res.json({
    success: true,
    mode: mode || "demo"
  });
});

/**
 * ===================================
 * 💰 WALLET
 * ===================================
 */
app.get("/wallet/:userId", asyncHandler(async (req, res) => {
  const wallet = await getOrCreateWallet(
    req.params.userId
  );

  res.json(wallet);
}));

/**
 * ===================================
 * 🤖 BOT BUILDER
 * ===================================
 */
app.post("/bot/create", authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: "Bot created",
    config: req.body
  });
});

/**
 * ===================================
 * 📚 FREE BOTS
 * ===================================
 */
app.get("/bots/free", (req, res) => {
  res.json([
    {
      name: "Over 2 Bot",
      strategy: "Martingale"
    },
    {
      name: "Rise/Fall Bot",
      strategy: "Trend"
    },
    {
      name: "Digit Differs",
      strategy: "Sniper"
    }
  ]);
});

/**
 * ===================================
 * 📉 ANALYSIS TOOL
 * ===================================
 */
app.get("/analysis/:symbol", (req, res) => {
  res.json({
    symbol: req.params.symbol,
    trend: "Bullish",
    support: 948.2,
    resistance: 955.7
  });
});

/**
 * ===================================
 * 🧠 STRATEGY
 * ===================================
 */
app.get("/strategy", (req, res) => {
  res.json([
    "Trend Following",
    "Breakout Strategy",
    "Scalping",
    "Martingale",
    "Anti-Martingale"
  ]);
});

/**
 * ===================================
 * 👥 COPY TRADING
 * ===================================
 */
app.get("/copy-trading", (req, res) => {
  res.json([
    {
      trader: "Alpha Trader",
      roi: "+34%"
    },
    {
      trader: "Smart FX",
      roi: "+21%"
    }
  ]);
});

/**
 * ===================================
 * 🛡️ RISK MANAGEMENT
 * ===================================
 */
app.get("/risk-management", (req, res) => {
  res.json({
    maxDailyLoss: "10%",
    stopLoss: true,
    takeProfit: true,
    recommendedStake: "2%"
  });
});

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
      console.log(
        `🚀 Running on port ${PORT}`
      );
    });

  } catch (err) {
    console.error(
      "❌ Startup failed:",
      err.message
    );
  }
};

start();
