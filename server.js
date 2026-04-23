// ... (keep your imports as they are)

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 1. Create the HTTP server first
import { createServer } from "http";
const httpServer = createServer(app);

// 2. Pass the HTTP server to your WebSocket initializer 
// Instead of a port number, pass the actual server object
createWebSocketServer(httpServer); 

// 3. Main Deriv connection (Add an error listener!)
const derivWs = createDerivConnection();
derivWs.on("error", (err) => console.error("Deriv Global WS Error:", err));
derivWs.on("close", () => console.log("Deriv Global WS Closed. Reconnecting..."));

// ... (keep your logic for derivWs.on("message") and intervals)

// 4. Update the /connect route 
app.post("/connect", async (req, res) => {
  try {
    const { userId, token } = req.body;
    // ... (keep validation logic)

    const ws = createDerivConnection();

    // Add a specific error handler for this attempt
    ws.on("error", (e) => console.log(`WS Error for user ${userId}:`, e));

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Deriv connection timeout")), 8000);
      ws.on("open", () => {
        clearTimeout(timeout);
        resolve();
      });
      ws.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    // ... (rest of your logic remains the same)

  } catch (error) {
    console.error("Connection error:", error);
    res.status(401).json({ error: error.message || "Authorization failed" });
  }
});

// ... (rest of your routes)

// 5. IMPORTANT: Change app.listen to httpServer.listen
httpServer.listen(PORT, () => {
  console.log(`🚀 Server & WebSockets running on port ${PORT}`);
});
