const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

const API_TOKEN = process.env.API_TOKEN;

const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=1089');

let balanceData = null;

ws.onopen = () => {
    console.log("Connected to Deriv");

    ws.send(JSON.stringify({
        authorize: API_TOKEN
    }));
};

ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);

    if (data.msg_type === 'authorize') {
        ws.send(JSON.stringify({ balance: 1 }));
    }

    if (data.msg_type === 'balance') {
        balanceData = data.balance;
    }
};

app.get('/', (req, res) => {
    res.send("Backend is running ✅");
});

app.get('/balance', (req, res) => {
    res.json(balanceData);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
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
  getAllSubscriptions,
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

const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 3001;

// Initialize WebSocket server
createWebSocketServer(WS_PORT);
console.log(`🚀 WebSocket server running on port ${WS_PORT}`);

// Main Deriv connection
const derivWs = createDerivConnection();

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
          data: update,
          timestamp: Date.now()
        });
        
        sendContractUpdate(contractId, update);
      }
    }
  } catch (error) {
    console.error("Error processing Deriv message:", error);
  }
});

// Cleanup inactive sessions
setInterval(() => {
  const sessions = getAllSessions();
  const now = Date.now();
  const maxInactiveTime = 1 * 60 * 60 * 1000;

  sessions.forEach(session => {
    if (now - session.lastActivity > maxInactiveTime) {
      unregisterUserContracts(session.userId);
      unsubscribeAllContracts(session.userId);
      deleteSession(session.userId);
    }
  });
}, 30 * 60 * 1000);

// Routes
app.get("/", (req, res) => {
  res.json({ status: "✅ Backend running" });
});

app.post("/connect", async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ error: "userId and token required" });
    }

    const existingSession = getSession(userId);
    if (existingSession) {
      return res.status(400).json({ error: "User already has active session" });
    }

    const ws = createDerivConnection();

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Connection timeout")), 5000);
      ws.on("open", () => {
        clearTimeout(timeout);
        resolve();
      });
      ws.on("error", reject);
    });

    const accountInfo = await authorizeUser(ws, token);
    const balance = await getBalance(ws);
    
    const session = createSession(userId, token, ws, accountInfo);
    updateSessionBalance(userId, balance);

    setupContractUpdates(ws, userId);

    ws.on("message", (msg) => {
      try {
        const data = JSON.parse(msg);
        if (data.msg_type === "balance") {
          updateSessionBalance(userId, data.balance);
          sendToUser(userId, {
            type: "balance_update",
            balance: data.balance,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error("Error processing message:", error);
      }
    });

    sendToUser(userId, {
      type: "connected",
      accountId: accountInfo.accountId,
      email: accountInfo.email,
      currency: accountInfo.currency,
      balance
    });

    res.json({
      status: "connected",
      accountId: accountInfo.accountId,
      email: accountInfo.email,
      currency: accountInfo.currency,
      balance,
      wsPort: WS_PORT
    });
  } catch (error) {
    console.error("Connection error:", error);
    res.status(401).json({ error: error.message || "Authorization failed" });
  }
});

app.post("/buy", async (req, res) => {
  try {
    const { userId, amount, contractType = "CALL", duration = 5, symbol = "R_100" } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid parameters" });
    }

    const session = getSession(userId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (!session.ws || session.ws.readyState !== 1) {
      return res.status(500).json({ error: "Connection lost" });
    }

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

    const contractId = result.contractId;
    registerContract(contractId, userId);

    addContract(userId, {
      contractId,
      type: "buy",
      amount,
      payout: result.payout,
      askPrice: result.askPrice,
      createdAt: Date.now(),
      status: "active",
      profit: 0,
      profitPercentage: 0
    });

    await subscribeToContract(session.ws, contractId, userId);
    updateSessionBalance(userId, session.balance - amount);

    sendToUser(userId, {
      type: "trade_executed",
      contractId,
      tradeType: "buy",
      amount,
      payout: result.payout,
      askPrice: result.askPrice,
      newBalance: session.balance - amount,
      timestamp: Date.now()
    });

    res.json({
      status: "success",
      contractId,
      payout: result.payout,
      askPrice: result.askPrice,
      newBalance: session.balance - amount
    });
  } catch (error) {
    console.error("Buy trade error:", error);
    res.status(400).json({ error: error.message || "Trade failed" });
  }
});

app.post("/sell", async (req, res) => {
  try {
    const { userId, contractId, price } = req.body;

    if (!userId || !contractId || price === undefined) {
      return res.status(400).json({ error: "Invalid parameters" });
    }

    const session = getSession(userId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const contract = session.contracts.find(c => c.contractId === contractId);
    if (!contract) {
      return res.status(404).json({ error: "Contract not found" });
    }

    const result = await sellTrade(session.ws, contractId, price);

    contract.status = "sold";
    contract.sellPrice = price;
    contract.soldAt = Date.now();

    const profit = price - contract.amount;
    updateSessionBalance(userId, session.balance + profit);

    unregisterContract(contractId);

    sendToUser(userId, {
      type: "trade_sold",
      contractId,
      sellPrice: price,
      profit,
      newBalance: session.balance + profit,
      timestamp: Date.now()
    });

    res.json({
      status: "success",
      contractId,
      price,
      profit,
      newBalance: session.balance + profit
    });
  } catch (error) {
    console.error("Sell trade error:", error);
    res.status(400).json({ error: error.message || "Sell failed" });
  }
});

app.get("/contracts/:userId", (req, res) => {
  const contracts = getContracts(req.params.userId);
  res.json({ contracts });
});

app.get("/session/:userId", (req, res) => {
  const session = getSession(req.params.userId);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  res.json({
    userId: session.userId,
    accountId: session.accountId,
    email: session.email,
    currency: session.currency,
    balance: session.balance,
    contractCount: session.contracts.length,
    createdAt: session.createdAt,
    lastActivity: session.lastActivity
  });
});

app.delete("/disconnect/:userId", (req, res) => {
  unregisterUserContracts(req.params.userId);
  unsubscribeAllContracts(req.params.userId);
  deleteSession(req.params.userId);

  sendToUser(req.params.userId, {
    type: "disconnected",
    message: "Session ended",
    timestamp: Date.now()
  });

  res.json({ status: "disconnected" });
});

app.get("/stats", (req, res) => {
  res.json({
    server: {
      expressPort: PORT,
      wsPort: WS_PORT
    },
    stats: {
      activeSessions: getSessionCount(),
      connectedClients: getClientCount(),
      activeSubscriptions: getSubscriptionCount()
    },
    sessions: getAllSessions().map(s => ({
      userId: s.userId,
      balance: s.balance,
      contracts: s.contracts.length
    }))
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Express server running on port ${PORT}`);
});
