import WebSocket from "ws";

const DERIV_WS_URL = "wss://ws.derivws.com/websockets/v3?app_id=1089";

export function createDerivSocket() {
  const ws = new WebSocket(DERIV_WS_URL);

  ws.on("open", () => {
    console.log("✅ Connected to Deriv WebSocket");
  });

  ws.on("close", () => {
    console.log("⚠️ Deriv WebSocket closed");
  });

  ws.on("error", (err) => {
    console.error("❌ WebSocket error:", err.message);
  });

  return ws;
}

// helper to send safe JSON
export function send(ws, data) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}