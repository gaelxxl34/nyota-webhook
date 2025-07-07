import express from "express";

const app = express();
const PORT = 3000;

// Enhanced middleware with better error handling
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Add CORS headers for cross-origin requests
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Store multiple payloads with timestamps
let payloadHistory = [];

app.get("/", (req, res) => {
  const latestPayload = payloadHistory[payloadHistory.length - 1];

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nyota Fusion AI Webhook Dashboard</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      margin: 2em; 
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 2em;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 { color: #333; }
    .status {
      padding: 1em;
      border-radius: 5px;
      margin: 1em 0;
      font-weight: bold;
    }
    .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
    .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
    pre { 
      background: #f8f9fa; 
      padding: 1.5em; 
      border-radius: 5px; 
      overflow-x: auto;
      border: 1px solid #e9ecef;
    }
    .payload-item {
      margin: 1em 0;
      padding: 1em;
      background: #f8f9fa;
      border-radius: 5px;
      border-left: 4px solid #007bff;
    }
    .timestamp {
      font-size: 0.9em;
      color: #666;
      margin-bottom: 0.5em;
    }
    button {
      background: #007bff;
      color: white;
      border: none;
      padding: 0.5em 1em;
      border-radius: 4px;
      cursor: pointer;
      margin: 0.5em;
    }
    button:hover { background: #0056b3; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Nyota Fusion AI Webhook Dashboard</h1>
    
    <div class="status ${payloadHistory.length > 0 ? "success" : "info"}">
      ${
        payloadHistory.length > 0
          ? `✅ Webhook is working! Received ${payloadHistory.length} payload(s)`
          : `⏳ Webhook is ready and waiting for data...`
      }
    </div>

    <div>
      <strong>Webhook URL:</strong> <code>http://localhost:${PORT}/webhook</code><br>
      <strong>Test URL:</strong> <code>http://localhost:${PORT}/test</code><br>
      <strong>Status:</strong> <span style="color: green;">● Online</span>
    </div>

    <h2>Latest Payload</h2>
    <pre id="payload">${
      latestPayload
        ? JSON.stringify(latestPayload.data, null, 2)
        : "No payload received yet. Make sure your Elementor form is configured correctly."
    }</pre>

    ${
      payloadHistory.length > 1
        ? `
    <h2>Recent Payloads (${payloadHistory.length} total)</h2>
    <button onclick="toggleHistory()">Toggle History</button>
    <div id="history" style="display: none;">
      ${payloadHistory
        .slice(-5)
        .reverse()
        .map(
          (payload, index) => `
        <div class="payload-item">
          <div class="timestamp">Received: ${payload.timestamp}</div>
          <pre>${JSON.stringify(payload.data, null, 2)}</pre>
        </div>
      `
        )
        .join("")}
    </div>
    `
        : ""
    }

    <script>
      function toggleHistory() {
        const history = document.getElementById('history');
        history.style.display = history.style.display === 'none' ? 'block' : 'none';
      }
      
      // Auto-refresh every 5 seconds
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    </script>
  </div>
</body>
</html>`);
});

// Main webhook endpoint
app.post("/webhook", (req, res) => {
  const timestamp = new Date().toISOString();

  console.log("=".repeat(50));
  console.log("📨 Webhook received at:", timestamp);
  console.log("📋 Headers:", JSON.stringify(req.headers, null, 2));
  console.log("📦 Body:", JSON.stringify(req.body, null, 2));
  console.log("🔍 Query params:", JSON.stringify(req.query, null, 2));
  console.log("=".repeat(50));

  // Store payload with timestamp
  payloadHistory.push({
    timestamp,
    data: req.body,
    headers: req.headers,
    query: req.query,
  });

  // Keep only last 20 payloads
  if (payloadHistory.length > 20) {
    payloadHistory = payloadHistory.slice(-20);
  }

  // Respond with success immediately - this is crucial for Elementor
  res.status(200).json({
    success: true,
    message: "Webhook received successfully",
    timestamp: timestamp,
    received_data: req.body,
  });
});

// Test endpoint to verify webhook is working
app.get("/test", (req, res) => {
  res.json({
    status: "ok",
    message: "Webhook server is running",
    timestamp: new Date().toISOString(),
    total_payloads_received: payloadHistory.length,
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Handle all other routes
app.use("*", (req, res) => {
  console.log(`❌ Unknown route accessed: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: "Route not found",
    available_routes: ["GET /", "POST /webhook", "GET /test", "GET /health"],
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("💥 Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on http://localhost:${PORT}`);
  console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
});
