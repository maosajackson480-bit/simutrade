import WebSocket from "ws";

const DERIV_URL = "wss://ws.derivws.com/websockets/v3?app_id=1089";

export function createDerivConnection() {
  const ws = new WebSocket(DERIV_URL);

  ws.on("open", () => {
    console.log("✅ Connected to Deriv API");
  });

  ws.on("close", () => {
    console.log("⚠️ WebSocket closed. Reconnecting...");
    setTimeout(createDerivConnection, 5000);
  });

  ws.on("error", (err) => {
    console.error("❌ WS Error:", err.message);
  });

  return ws;
}

/* =========================
   AUTHORIZE USER
========================= */
export function authorizeUser(ws, token) {
  return new Promise((resolve, reject) => {
    ws.send(JSON.stringify({ authorize: token }));

    ws.once("message", (msg) => {
      const data = JSON.parse(msg);

      if (data.error) return reject(new Error(data.error.message));

      resolve({
        accountId: data.authorize.loginid,
        email: data.authorize.email,
        currency: data.authorize.currency
      });
    });
  });
}

/* =========================
   GET BALANCE
========================= */
export function getBalance(ws) {
  return new Promise((resolve, reject) => {
    ws.send(JSON.stringify({ balance: 1 }));

    ws.once("message", (msg) => {
      const data = JSON.parse(msg);

      if (data.error) return reject(new Error(data.error.message));

      resolve(data.balance.balance);
    });
  });
}