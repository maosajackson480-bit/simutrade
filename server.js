import express from "express";
import cors from "cors";
import axios from "axios";

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
  sendContractUpdate,
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

const PORT = process.env.PORT || 10000;
const WS_PORT = process.env.WS_PORT || 10001;

/* ==============================
   WEBSOCKET SERVER
============================== */
createWebSocketServer(WS_PORT);
console.log(`🚀 WS running on ${WS_PORT}`);

/* ==============================
   DERIV CONNECTION
============================== */
const derivWs = createDerivConnection();

derivWs.on("open", () => {
  console.log("✅ Connected to Deriv API");
});

// 🔥 KEEP ALIVE FIX (IMPORTANT)
setInterval(() => {
  if (derivWs.readyState === 1) {
    derivWs.send(JSON.stringify({ ping: 1 }));
  }
}, 30000);

derivWs.on("message", (msg) => {
  try {
    const data = JSON.parse(msg);

    if (data.proposal_open_contract) {
      const update = data.proposal_open_contract;
      const contractId = update.contract_id;
      const userId = getUserForContract(contractId);

      if (userId) {
        sendToUser(userId, {
          type: "contract_update",
          contractId,
          data: update
        });

        sendContractUpdate(contractId, update);
      }
    }
  } catch (err) {
    console.error("WS message error:", err.message);
  }
});

/* ==============================
   CLEANUP JOB
============================== */
setInterval(() => {
  const now = Date.now();
  const maxInactive = 60 * 60 * 1000;

  getAllSessions().forEach(session => {
    if (now - session.lastActivity > maxInactive) {
      console.log(`Cleaning session ${session.userId}`);
      unregisterUserContracts(session.userId);
      unsubscribeAllContracts(session.userId);
      deleteSession(session.userId);
    }
  });
}, 30 * 60 * 1000);

/* ==============================
   ROUTES
============================== */
app.get("/", (req, res) => {
  res.json({ status: "Backend running 🚀" });
});

/* CONNECT */
app.post("/connect", async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ error: "Missing userId/token" });
    }

    if (getSession(userId)) {
      return res.status(400).json({ error: "Already connected" });
    }

    const ws = createDerivConnection();

    await new Promise((resolve, reject) => {
      ws.on("open", resolve);
      ws.on("error", reject);
    });

    const account = await authorizeUser(ws, token);
    const balance = await getBalance(ws);

    createSession(userId, token, ws, account);
    updateSessionBalance(userId, balance);

    setupContractUpdates(ws, userId);

    sendToUser(userId, {
      type: "connected",
      balance,
      accountId: account.accountId
    });

    res.json({ status: "connected", balance });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* BUY */
app.post("/buy", async (req, res) => {
  try {
    const { userId, amount } = req.body;

    const session = getSession(userId);
    if (!session) return res.status(404).json({ error: "No session" });

    const result = await buyTrade(session.ws, req.body);

    registerContract(result.contractId, userId);

    addContract(userId, {
      contractId: result.contractId,
      amount,
      status: "active"
    });

    await subscribeToContract(session.ws, result.contractId, userId);

    res.json(result);

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* SELL */
app.post("/sell", async (req, res) => {
  try {
    const { userId, contractId, price } = req.body;

    const session = getSession(userId);
    if (!session) return res.status(404).json({ error: "No session" });

    const result = await sellTrade(session.ws, contractId, price);

    unregisterContract(contractId);

    res.json(result);

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* STATS */
app.get("/stats", (req, res) => {
  res.json({
    sessions: getSessionCount(),
    clients: getClientCount(),
    subscriptions: getSubscriptionCount()
  });
});

/* START SERVER */
app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
