import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { connectDB } from "./database.js";

import { createDerivConnection, authorizeUser, getBalance } from "./derivSocket.js";
import { createSession, getSession, updateSessionBalance } from "./core/sessionManager.js";
import { buyTrade, sellTrade } from "./trading.js";

import Trade from "./models/Trade.js";
import User from "./models/User.js";

import { getOrCreateWallet, addBalance } from "./core/walletManager.js";

import { generateToken, hashPassword, comparePassword } from "./auth/auth.js";
import { authMiddleware, adminMiddleware } from "./middleware/authMiddleware.js";

const app = express();

/**
 * ⚙️ MIDDLEWARE
 */
app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: 60 * 1000, max: 30 }));

const PORT = process.env.PORT || 10000;

/**
 * 🔥 CRASH PROTECTION
 */
process.on("uncaughtException", (err) => console.error("🔥 UNCAUGHT:", err));
process.on("unhandledRejection", (err) => console.error("🔥 UNHANDLED:", err));

/**
 * 🧠 HELPER
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * =========================
 * ✅ ROOT FIX (IMPORTANT)
 * =========================
 */
app.get("/", (req, res) => {
  res.send("🚀 SimuTrade backend is live");
});

/**
 * =========================
 * 🔐 AUTH SYSTEM
 * =========================
 */

// REGISTER
app.post("/register", asyncHandler(async (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password) throw new Error("Missing fields");

  const exists = await User.findOne({ userId });
  if (exists) throw new Error("User exists");

  const hashed = await hashPassword(password);

  await User.create({
    userId,
    password: hashed,
    role: "user"
  });

  res.json({ message: "User created" });
}));

// LOGIN
app.post("/login", asyncHandler(async (req, res) => {
  const { userId, password } = req.body;

  const user = await User.findOne({ userId });
  if (!user) throw new Error("User not found");

  const ok = await comparePassword(password, user.password);
  if (!ok) throw new Error("Invalid credentials");

  const token = generateToken(user);

  res.json({
    token,
    userId: user.userId,
    role: user.role
  });
}));

/**
 * =========================
 * 💰 WALLET
 * =========================
 */

app.get("/wallet/:userId", asyncHandler(async (req, res) => {
  const wallet = await getOrCreateWallet(req.params.userId);
  res.json(wallet);
}));

app.post("/wallet/deposit", adminMiddleware, asyncHandler(async (req, res) => {
  const { userId, amount } = req.body;

  const wallet = await addBalance(userId, amount, "ADMIN_DEPOSIT");
  res.json(wallet);
}));

/**
 * =========================
 * 🔗 CONNECT
 * =========================
 */
app.post("/connect", authMiddleware, asyncHandler(async (req, res) => {

  const { userId, token } = req.body;

  const ws = createDerivConnection();

  await new Promise((resolve, reject) => {
    ws.on("open", resolve);
    ws.on("error", reject);
  });

  const account = await authorizeUser(ws, token);
  const balance = await getBalance(ws);

  const session = await createSession(userId, ws, account);
  await updateSessionBalance(userId, balance);

  session.ws = ws;

  res.json({ status: "connected", balance });
}));

/**
 * =========================
 * 📈 BUY
 * =========================
 */
const activeTrades = new Set();

app.post("/buy", authMiddleware, asyncHandler(async (req, res) => {

  const { userId, amount, contractType, duration, symbol } = req.body;

  const session = await getSession(userId);
  if (!session) throw new Error("No session");

  if (activeTrades.has(userId)) throw new Error("Trade locked");

  activeTrades.add(userId);

  try {
    const result = await buyTrade(session.ws, {
      amount,
      contractType,
      duration,
      symbol
    });

    await Trade.create({
      userId,
      amount,
      contractType,
      symbol,
      contractId: result.contractId,
      result: "pending"
    });

    res.json(result);

  } finally {
    activeTrades.delete(userId);
  }
}));

/**
 * =========================
 * 📉 SELL + WALLET UPDATE
 * =========================
 */
app.post("/sell", authMiddleware, asyncHandler(async (req, res) => {

  const { userId, contractId } = req.body;

  const session = await getSession(userId);
  if (!session) throw new Error("No session");

  const result = await sellTrade(session.ws, contractId);

  await Trade.findOneAndUpdate(
    { contractId },
    {
      result: result.profit > 0 ? "win" : "loss",
      profit: result.profit
    }
  );

  if (result.profit) {
    await addBalance(userId, result.profit, "TRADE_RESULT");
  }

  res.json(result);
}));

/**
 * =========================
 * 👑 ADMIN ROUTES
 * =========================
 */

app.get("/admin/users", adminMiddleware, asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
}));

app.get("/admin/trades", adminMiddleware, asyncHandler(async (req, res) => {
  const trades = await Trade.find().sort({ createdAt: -1 });
  res.json(trades);
}));

/**
 * ❌ ERROR HANDLER
 */
app.use((err, req, res, next) => {
  console.error("❌ ERROR:", err.message);
  res.status(500).json({ error: err.message });
});

/**
 * 🚀 START SERVER
 */
const start = async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("❌ Startup failed:", err.message);
  }
};

start();