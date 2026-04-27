import WebSocket from "ws";

const DERIV_URL =
  "wss://ws.derivws.com/websockets/v3?app_id=1089";

/**
 * CONNECT TO DERIV
 */
export function createDerivConnection() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(DERIV_URL);

    ws.on("open", () => {
      console.log("✅ Connected to Deriv");
      resolve(ws);
    });

    ws.on("error", (err) => {
      console.error("❌ Deriv Error:", err.message);
      reject(err);
    });

    ws.on("close", () => {
      console.log("⚠️ Deriv socket closed");
    });
  });
}

/**
 * AUTHORIZE USER TOKEN
 */
export function authorizeUser(ws, token) {
  return new Promise((resolve, reject) => {
    ws.send(JSON.stringify({ authorize: token }));

    ws.once("message", (msg) => {
      const data = JSON.parse(msg);

      if (data.error) {
        return reject(new Error(data.error.message));
      }

      resolve(data.authorize);
    });
  });
}

/**
 * GET BALANCE
 */
export function getBalance(ws) {
  return new Promise((resolve, reject) => {
    ws.send(JSON.stringify({ balance: 1 }));

    ws.once("message", (msg) => {
      const data = JSON.parse(msg);

      if (data.error) {
        return reject(new Error(data.error.message));
      }

      resolve(data.balance.balance);
    });
  });
}

/**
 * ⚠️ ONE-TIME TICK (NOT STREAM)
 */
export function getTicks(ws, symbol) {
  return new Promise((resolve, reject) => {
    ws.send(JSON.stringify({
      ticks: symbol,
      subscribe: 1
    }));

    ws.once("message", (msg) => {
      const data = JSON.parse(msg);

      if (data.error) {
        return reject(new Error(data.error.message));
      }

      resolve(data.tick);
    });
  });
}

/**
 * 🔥 REAL-TIME STREAM (THIS IS THE IMPORTANT ONE)
 */
export function streamTicks(ws, symbol, onTick) {
  ws.send(JSON.stringify({
    ticks: symbol,
    subscribe: 1
  }));

  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    if (data.error) {
      console.error("❌ Tick error:", data.error.message);
      return;
    }

    if (data.tick) {
      onTick(data.tick);
    }
  });
}
