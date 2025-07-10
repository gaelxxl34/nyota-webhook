import express from "express";
import axios from "axios";

const app = express();
const PORT = 3000;

// Your Nyota AI Fusion backend URL
// This points to your Mac where the Nyota backend is running via Cloudflare tunnel
const BACKEND_URL =
  "https://knights-favors-revolution-atlas.trycloudflare.com/api/webhook/receive";
// For local testing: "http://localhost:3000/api/webhook/receive"
// For private network: "http://172.16.117.123:3000/api/webhook/receive"
// For public IP: "http://45.221.74.234:3000/api/webhook/receive"

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

// Store multiple payloads with timestamps and processing status
let payloadHistory = [];

app.get("/", (req, res) => {
  const latestPayload = payloadHistory[payloadHistory.length - 1];
  const successfulForwards = payloadHistory.filter(
    (p) => p.forwardSuccess
  ).length;
  const failedForwards = payloadHistory.filter((p) => p.forwardError).length;

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
    .warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
    .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
    .stats { display: flex; gap: 1em; margin: 1em 0; }
    .stat-card {
      background: #f8f9fa;
      padding: 1em;
      border-radius: 5px;
      text-align: center;
      flex: 1;
    }
    .stat-number { font-size: 2em; font-weight: bold; margin-bottom: 0.5em; }
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
    .payload-item.success { border-left-color: #28a745; }
    .payload-item.error { border-left-color: #dc3545; }
    .timestamp {
      font-size: 0.9em;
      color: #666;
      margin-bottom: 0.5em;
    }
    .status-indicator {
      font-size: 0.9em;
      padding: 0.2em 0.5em;
      border-radius: 3px;
      margin-left: 0.5em;
    }
    .status-success { background: #d4edda; color: #155724; }
    .status-error { background: #f8d7da; color: #721c24; }
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

    <div class="stats">
      <div class="stat-card">
        <div class="stat-number">${payloadHistory.length}</div>
        <div>Total Received</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" style="color: #28a745">${successfulForwards}</div>
        <div>Successfully Forwarded</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" style="color: #dc3545">${failedForwards}</div>
        <div>Failed to Forward</div>
      </div>
    </div>

    <div>
      <strong>Webhook URL:</strong> <code>http://localhost:${PORT}/webhook</code><br>
      <strong>Forwarding to:</strong> <code>${BACKEND_URL}</code><br>
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
        <div class="payload-item ${
          payload.forwardSuccess
            ? "success"
            : payload.forwardError
            ? "error"
            : ""
        }">
          <div class="timestamp">
            Received: ${payload.timestamp}
            ${
              payload.forwardSuccess
                ? '<span class="status-indicator status-success">✅ Forwarded</span>'
                : payload.forwardError
                ? '<span class="status-indicator status-error">❌ Forward Failed</span>'
                : '<span class="status-indicator">⏳ Processing</span>'
            }
          </div>
          <pre>${JSON.stringify(payload.data, null, 2)}</pre>
          ${
            payload.forwardError
              ? `<div style="color: #dc3545; margin-top: 0.5em;">Error: ${payload.forwardError}</div>`
              : ""
          }
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
      
      // Auto-refresh every 10 seconds
      setTimeout(() => {
        window.location.reload();
      }, 10000);
    </script>
  </div>
</body>
</html>`);
});

// Main webhook endpoint - now with forwarding to backend
app.post("/webhook", async (req, res) => {
  const timestamp = new Date().toISOString();

  console.log("=".repeat(50));
  console.log("📨 Webhook received at:", timestamp);
  console.log("📋 Headers:", JSON.stringify(req.headers, null, 2));
  console.log("📦 Body:", JSON.stringify(req.body, null, 2));
  console.log("🔍 Query params:", JSON.stringify(req.query, null, 2));
  console.log("=".repeat(50));

  // Create payload entry
  const payloadEntry = {
    timestamp,
    data: req.body,
    headers: req.headers,
    query: req.query,
    forwardSuccess: false,
    forwardError: null,
  };

  // Store payload with timestamp
  payloadHistory.push(payloadEntry);

  // Keep only last 20 payloads
  if (payloadHistory.length > 20) {
    payloadHistory = payloadHistory.slice(-20);
  }

  // Respond to the original webhook immediately (important for Elementor)
  res.status(200).json({
    success: true,
    message: "Webhook received successfully",
    timestamp: timestamp,
    received_data: req.body,
  });

  // Forward to Nyota AI Fusion backend (async, so it doesn't block the response)
  try {
    console.log("🔄 Forwarding to Nyota AI Fusion backend...");

    const forwardResponse = await axios.post(BACKEND_URL, req.body, {
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-From": "External-Webhook",
        "X-Original-Timestamp": timestamp,
        "X-Original-Source": req.headers["user-agent"] || "Unknown",
      },
      timeout: 30000, // 30 second timeout
    });

    console.log("✅ Successfully forwarded to backend");
    console.log(
      "📋 Backend response:",
      JSON.stringify(forwardResponse.data, null, 2)
    );

    // Update payload history with success
    payloadEntry.forwardSuccess = true;
    payloadEntry.backendResponse = forwardResponse.data;
  } catch (error) {
    console.error("❌ Failed to forward to backend:", error.message);

    // Update payload history with error
    payloadEntry.forwardError = error.message;

    if (error.response) {
      console.error("📋 Backend error response:", error.response.data);
      payloadEntry.backendErrorResponse = error.response.data;
    }
  }
});

// Test endpoint to verify webhook is working
app.get("/test", (req, res) => {
  res.json({
    status: "ok",
    message: "Webhook server is running",
    timestamp: new Date().toISOString(),
    total_payloads_received: payloadHistory.length,
    backend_url: BACKEND_URL,
    successful_forwards: payloadHistory.filter((p) => p.forwardSuccess).length,
    failed_forwards: payloadHistory.filter((p) => p.forwardError).length,
  });
});

// Test forwarding endpoint
app.post("/test-forward", async (req, res) => {
  try {
    const testData = {
      "First Name": "Test",
      "Second Name": "Forward",
      Email: "test-forward@example.com",
      "WhatsApp Number": "+256123456789",
      Messege: "Test forwarding to backend",
      form_id: "test-forward",
      form_name: "Test_Forward_Form",
    };

    console.log("🧪 Testing forward to backend...");

    const response = await axios.post(BACKEND_URL, testData, {
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-From": "Test-Forward",
      },
      timeout: 30000,
    });

    res.json({
      success: true,
      message: "Test forward successful",
      testData: testData,
      backendResponse: response.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Test forward failed",
      error: error.message,
      details: error.response?.data || "No additional details",
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    backend_url: BACKEND_URL,
    total_webhooks: payloadHistory.length,
  });
});

// Handle all other routes
app.use("*", (req, res) => {
  console.log(`❌ Unknown route accessed: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: "Route not found",
    available_routes: [
      "GET /",
      "POST /webhook",
      "GET /test",
      "POST /test-forward",
      "GET /health",
    ],
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
  console.log(`🔄 Forwarding to: ${BACKEND_URL}`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`🧪 Test forward: http://localhost:${PORT}/test-forward`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
});
