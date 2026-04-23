import express from "express";
import cors from "cors";
import WebSocket from "ws";

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

createWebSocketServer(WS_PORT);
console.log(`🚀 WS Server running on ${WS_PORT}`);

//////////////////////////////////////////////////
// 🔌 SINGLE DERIV CONNECTION (GLOBAL)
//////////////////////////////////////////////////

let derivWs;
let reconnectAttempts = 0;

function connectDeriv() {
  derivWs = new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=1089");

  derivWs.on("open", () => {
    console.log("✅ Connected to Deriv API");
    reconnectAttempts = 0;

    // 🔁 Keepalive ping
    setInterval(() => {
      if (derivWs.readyState === WebSocket.OPEN) {
        derivWs.send(JSON.stringify({ ping: 1 }));
      }
    }, 30000);
  });

  derivWs.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      // 📊 Balance updates
      if (data.msg_type === "balance") {
        const session = [...getAllSessions()].find(
          (s) => s.accountId === data.balance.loginid
        );

        if (session) {
          updateSessionBalance(session.userId, data.balance.balance);
          sendToUser(session.userId, {
            type: "balance_update",
            balance: data.balance.balance
          });
        }
      }

      // 📈 Contract updates
      if (data.proposal_open_contract) {
        const contractId = data.proposal_open_contract.contract_id;
        const userId = getUserForContract(contractId);

        if (userId) {
          sendToUser(userId, {
            type: "contract_update",
            contractId,
            data: data.proposal_open_contract
          });
        }
      }
    } catch (err) {
      console.error("❌ Message error:", err);
    }
  });

  derivWs.on("close", () => {
    console.log("⚠️ Deriv disconnected");

    const delay = Math.min(10000, 1000 * 2 ** reconnectAttempts++);
    setTimeout(connectDeriv, delay);
  });

  derivWs.on("error", (err) => {
    console.error("❌ WS Error:", err.message);
    derivWs.close();
  });
}

// Start connection
connectDeriv();

//////////////////////////////////////////////////
// 🧹 SESSION CLEANUP
//////////////////////////////////////////////////

setInterval(() => {
  const now = Date.now();

  getAllSessions().forEach((session) => {
    if (now - session.lastActivity > 60 * 60 * 1000) {
      unregisterUserContracts(session.userId);
      unsubscribeAllContracts(session.userId);
      deleteSession(session.userId);
    }
  });
}, 30 * 60 * 1000);

//////////////////////////////////////////////////
// 🚀 ROUTES
//////////////////////////////////////////////////

app.get("/", (_, res) => {
  res.json({ status: "✅ Running" });
});

//////////////////////////////////////////////////
// 🔐 CONNECT USER
//////////////////////////////////////////////////

app.post("/connect", (req, res) => {
  const { userId, token } = req.body;

  if (!userId || !token) {
    return res.status(400).json({ error: "Missing params" });
  }

  if (getSession(userId)) {
    return res.status(400).json({ error: "Already connected" });
  }

  derivWs.send(JSON.stringify({ authorize: token }));

  derivWs.once("message", (msg) => {
    const data = JSON.parse(msg);

    if (!data.authorize) {
      return res.status(401).json({ error: "Auth failed" });
    }

    const account = data.authorize;

    createSession(userId, token, account);

    // Request balance
    derivWs.send(JSON.stringify({ balance: 1 }));

    res.json({
      status: "connected",
      accountId: account.loginid,
      email: account.email,
      currency: account.currency,
      wsPort: WS_PORT
    });
  });
});

//////////////////////////////////////////////////
// 💰 BUY
//////////////////////////////////////////////////

app.post("/buy", async (req, res) => {
  try {
    const { userId, amount, symbol = "R_100" } = req.body;

    const session = getSession(userId);
    if (!session) throw new Error("No session");

    if (session.balance < amount) {
      throw new Error("Insufficient balance");
    }

    const result = await buyTrade(derivWs, {
      amount,
      symbol,
      currency: session.currency
    });

    registerContract(result.contractId, userId);

    addContract(userId, {
      contractId: result.contractId,
      amount
    });

    await subscribeToContract(derivWs, result.contractId, userId);

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

//////////////////////////////////////////////////
// 💸 SELL
//////////////////////////////////////////////////

app.post("/sell", async (req, res) => {
  try {
    const { userId, contractId, price } = req.body;

    const session = getSession(userId);
    if (!session) throw new Error("No session");

    const result = await sellTrade(derivWs, contractId, price);

    unregisterContract(contractId);

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

//////////////////////////////////////////////////
// 📊 STATS
//////////////////////////////////////////////////

app.get("/stats", (_, res) => {
  res.json({
    sessions: getSessionCount(),
    clients: getClientCount(),
    subscriptions: getSubscriptionCount()
  });
});

//////////////////////////////////////////////////
// 🚀 START SERVER
//////////////////////////////////////////////////

app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
