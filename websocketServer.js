import { WebSocketServer } from "ws";

const clients = new Map(); // userId -> ws

let wss;

export function createWebSocketServer(port) {
  wss = new WebSocketServer({ port });

  wss.on("connection", (ws, req) => {
    const userId = req.url?.replace("/", "");

    if (!userId) return ws.close();

    clients.set(userId, ws);

    console.log(`👤 User connected: ${userId}`);

    ws.on("close", () => {
      clients.delete(userId);
      console.log(`❌ User disconnected: ${userId}`);
    });
  });
}

/* =========================
   SEND TO USER
========================= */
export function sendToUser(userId, data) {
  const client = clients.get(userId);

  if (client && client.readyState === 1) {
    client.send(JSON.stringify(data));
  }
}

/* =========================
   CONTRACT BROADCAST
========================= */
export function sendContractUpdate(contractId, data) {
  clients.forEach((ws) => {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({
        type: "contract_update",
        contractId,
        data
      }));
    }
  });
}

/* =========================
   STATS
========================= */
export function getClientCount() {
  return clients.size;
}

export function getSubscriptionCount() {
  return 0; // handled elsewhere
}