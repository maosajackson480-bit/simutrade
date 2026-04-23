import express from "express";
import cors from "cors";

import { createDerivConnection, authorizeUser, getBalance } from "./derivSocket.js";
import {
  createSession,
  getSession,
  deleteSession,
  updateSessionBalance,
  addContract,
  getContracts,
  getAllSessions,
  getSessionCount
} from "./userSessions.js";
import { buyTrade, sellTrade } from "./trading.js";
import {
  subscribeToContract,
  setupContractUpdates,
  unsubscribeAllContracts
} from "./tradeManager.js";
import {
  createWebSocketServer,
  sendToUser,
  getClientCount,
  getSubscriptionCount
} from "./websocketServer.js";
import {
  registerContract,
  getUserForContract,
  unregisterContract,
  unregisterUserContracts
} from "./contractManager.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 3001;

// ✅ Health check (VERY IMPORTANT for Render)
app.get("/", (req, res) => {
  res.json({ status: "✅ Backend running" });
});

// ✅ Start WebSocket server
createWebSocketServer(WS_PORT);
console.log(`🚀 WS server running on ${WS_PORT}`);

// ✅ Main Deriv connection (global stream)
let derivWs;

function startMainConnection() {
  try {
    derivWs = createDerivConnection();

    derivWs.on("open", () => {
      console.log("✅ Main Deriv connection established");
    });

    derivWs.on("message", (msg) => {
      try {
        const data = JSON.parse(msg);

        // Handle contract updates globally
        if (data.proposal_open_contract) {
          const update = data.proposal_open_contract;
          const contractId = update.contract_id;
          const userId = getUserForContract(contractId);

          if (userId) {
            sendToUser(userId, {
              type: "contract_update",
              contractId,
              data: update,
              timestamp: Date.now()
            });
          }
        }
      } catch (err) {
        console.error("❌ Error parsing Deriv message:", err);
      }
    });

    derivWs.on("error", (err) => {
      console.error("❌ Main WS error:", err.message);
    });

    derivWs.on("close", () => {
      console.log("⚠️ Main WS closed. Reconnecting...");
      setTimeout(startMainConnection, 5000);
    });

  } catch (error) {
    console.error("❌ Failed to start main connection:", error);
  }
}

startMainConnection();


// 🧹 Cleanup inactive users
setInterval(() => {
  const sessions = getAllSessions();
  const now = Date.now();

  sessions.forEach(session => {
    if (now - session.lastActivity > 60 * 60 * 1000) {
      console.log(`🧹 Cleaning user: ${session.userId}`);

      unregisterUserContracts(session.userId);
      unsubscribeAllContracts(session.userId);
      deleteSession(session.userId);
    }
  });
}, 30 * 60 * 1000);


// ================= ROUTES =================

// 🔌 CONNECT USER
app.post("/connect", async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ error: "userId & token required" });
    }

    if (getSession(userId)) {
      return res.status(400).json({ error: "User already connected" });
    }

    const ws = createDerivConnection();

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Timeout")), 5000);

      ws.on("open", () => {
        clearTimeout(timeout);
        resolve();
      });

      ws.on("error", reject);
    });

    const account = await authorizeUser(ws, token);
    const balance = await getBalance(ws);

    createSession(userId, token, ws, account);
    updateSessionBalance(userId, balance);

    setupContractUpdates(ws, userId);

    sendToUser(userId, {
      type: "connected",
      accountId: account.accountId,
      balance
    });

    res.json({
      status: "connected",
      balance,
      wsPort: WS_PORT
    });

  } catch (err) {
    console.error("❌ Connect error:", err);
    res.status(500).json({ error: err.message });
  }
});


// 💰 BUY
app.post("/buy", async (req, res) => {
  try {
    const { userId, amount, contractType = "CALL", duration = 5, symbol = "R_100" } = req.body;

    const session = getSession(userId);
    if (!session) return res.status(404).json({ error: "No session" });

    if (session.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const result = await buyTrade(session.ws, {
      amount,
      contractType,
      duration,
      symbol,
      currency: session.currency
    });

    registerContract(result.contractId, userId);

    addContract(userId, {
      contractId: result.contractId,
      amount,
      status: "active"
    });

    await subscribeToContract(session.ws, result.contractId, userId);

    res.json({
      status: "success",
      contractId: result.contractId
    });

  } catch (err) {
    console.error("❌ Buy error:", err);
    res.status(400).json({ error: err.message });
  }
});


// 💸 SELL
app.post("/sell", async (req, res) => {
  try {
    const { userId, contractId, price } = req.body;

    const session = getSession(userId);
    if (!session) return res.status(404).json({ error: "No session" });

    const result = await sellTrade(session.ws, contractId, price);

    unregisterContract(contractId);

    res.json({
      status: "sold",
      result
    });

  } catch (err) {
    console.error("❌ Sell error:", err);
    res.status(400).json({ error: err.message });
  }
});


// 📊 STATS
app.get("/stats", (req, res) => {
  res.json({
    sessions: getSessionCount(),
    clients: getClientCount(),
    subscriptions: getSubscriptionCount()
  });
});


// 🚀 START SERVER
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
