import express from "express";

const app = express();
const PORT = 3000;

app.use(express.json());

let latestPayload = null;

app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Nyota Fusion AI webhook</title>
  <style>
    body { font-family: sans-serif; margin: 2em; }
    pre { background: #f4f4f4; padding: 1em; border-radius: 5px; }
  </style>
</head>
<body>
  <h1>Welcome to Nyota Fusion AI webhook</h1>
  <pre id="payload">${
    latestPayload
      ? JSON.stringify(latestPayload, null, 2)
      : "No payload received yet."
  }</pre>
</body>
</html>`);
});

app.post("/webhook", (req, res) => {
  console.log(
    "Webhook accessed at",
    new Date().toISOString(),
    "with body:",
    req.body
  );
  latestPayload = req.body;
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
