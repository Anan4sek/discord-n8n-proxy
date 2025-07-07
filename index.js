require("dotenv").config();
const express = require("express");
const axios = require("axios");
const { verifyKeyMiddleware } = require("discord-interactions");

const app = express();
const PUBLIC_KEY  = process.env.DISCORD_PUBLIC_KEY;
const N8N_WEBHOOK = process.env.N8N_WEBHOOK_URL;
const PORT       = process.env.PORT || 8080;

// Health‐check dla Railway
app.get("/", (_req, res) => {
  res.send("OK");
});

app.post(
  "/interactions",
  express.raw({ type: "application/json" }),
  verifyKeyMiddleware(PUBLIC_KEY),
  (req, res) => {
    // ACK natychmiast
    res.status(200).end();

    // Parsujemy body tylko gdy to Buffer
    let interaction;
    if (Buffer.isBuffer(req.body)) {
      try {
        interaction = JSON.parse(req.body.toString());
      } catch (e) {
        console.error("Failed to parse interaction:", e);
        return;
      }
    } else {
      interaction = req.body;
    }

    // Forward do n8n w tle
    axios
      .post(N8N_WEBHOOK, interaction, {
        headers: { "Content-Type": "application/json" },
      })
      .catch(err => console.error("Forward to n8n failed:", err));
  }
);

app.listen(PORT, () => console.log(`✅ Proxy live on port ${PORT}`));
