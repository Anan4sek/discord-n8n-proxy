require("dotenv").config();
const express = require("express");
const axios = require("axios");
const { verifyKey } = require("discord-interactions");

const app = express();
const PUBLIC_KEY  = process.env.DISCORD_PUBLIC_KEY;
const N8N_WEBHOOK = process.env.N8N_WEBHOOK_URL;
const PORT       = process.env.PORT || 8080;

// Health-check dla Railway
app.get("/", (_req, res) => res.send("OK"));

// Ten middleware parsuje JSON, ale przed tym wykona verifyKey na raw bufferze
app.post(
  "/interactions",
  express.json({
    verify: (req, res, buf) => {
      const sig = req.header("x-signature-ed25519");
      const ts  = req.header("x-signature-timestamp");
      if (!verifyKey(buf, sig, ts, PUBLIC_KEY)) {
        // 401 jeśli zła sygnatura
        res.status(401).end("Invalid request signature");
        throw new Error("Invalid request signature");
      }
    },
  }),
  (req, res) => {
    const interaction = req.body;

    // PING? odsyłamy PONG
    if (interaction.type === 1) {
      return res.json({ type: 1 });
    }

    // ACK natychmiast dla pozostałych
    res.status(200).end();

    // Forwardujemy w tle do n8n
    axios
      .post(N8N_WEBHOOK, interaction, {
        headers: { "Content-Type": "application/json" },
      })
      .catch(err => console.error("Forward to n8n failed:", err));
  }
);

app.listen(PORT, () => console.log(`✅ Proxy live on port ${PORT}`));
