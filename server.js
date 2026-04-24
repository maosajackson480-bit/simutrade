import express from "express";
import cors from "cors";
import { createDerivConnection, authorizeUser, getBalance } from "./derivSocket.js";

import {
  createSession,
  getSession,
  deleteSession,
  updateSessionBalance
} from "./core/sessionManager.js";

import { buyTrade, sellTrade } from "./trading.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

/**
 * HEALTH CHECK
 */
app.get("/", (req, res) => {
  res.json({ status: "SimuTrade backend running ✅" });
});

/**
 * CONNECT USER
 */
app.post("/connect", async (req, res) => {
  try {
    const { userId, token } = req.body;

    const ws = createDerivConnection();

    await new Promise((resolve, reject) => {
      ws.on("open", resolve);
      ws.on("error", reject);
    });

    const account = await authorizeUser(ws, token);
    const balance = await getBalance(ws);

    createSession(userId, ws, account);
    updateSessionBalance(userId, balance);

    res.json({
      status: "connected",
      userId,
      account,
      balance
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

/**
 * BUY
 */
app.post("/buy", async (req, res) => {
  try {
    const { userId, amount, contractType, duration, symbol } = req.body;

    const session = getSession(userId);
    if (!session) return res.status(404).json({ error: "No session" });

    const result = await buyTrade(session.ws, {
      amount,
      contractType,
      duration,
      symbol
    });

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * SELL
 */
app.post("/sell", async (req, res) => {
  try {
    const { userId, contractId } = req.body;

    const session = getSession(userId);
    if (!session) return res.status(404).json({ error: "No session" });

    const result = await sellTrade(session.ws, contractId);

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});