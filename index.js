require("dotenv").config();
const express = require("express");
const axios = require("axios");
const { verifyKeyMiddleware } = require("discord-interactions");

const app = express();
const PUBLIC_KEY  = process.env.DISCORD_PUBLIC_KEY;
const N8N_WEBHOOK = process.env.N8N_WEBHOOK_URL;
const PORT       = process.env.PORT || 8080;

// health-check dla Railway
app.get("/", (_req, res) => res.send("OK"));

app.post(
  "/interactions",
  // 1) złap surowe JSON body
  express.raw({ type: "application/json" }),
  // 2) weryfikuj podpis
  verifyKeyMiddleware(PUBLIC_KEY),
  async (req, res) => {
    let interaction;
    try {
      interaction = JSON.parse(req.body.toString());
    } catch (e) {
      console.error("❌ JSON parse error", e);
      return res.status(400).end();
    }

    // 3) Jeśli to PING (type = 1), odsyłamy PONG
    if (interaction.type === 1) {
      return res.json({ type: 1 });
    }

    // 4) ACK dla pozostałych interakcji
    res.status(200).end();

    // 5) Forward w tle do n8n
    axios
      .post(N8N_WEBHOOK, interaction, {
        headers: { "Content-Type": "application/json" },
      })
      .catch(err => console.error("❌ Forward to n8n failed:", err));
  }
);

app.listen(PORT, () => console.log(`✅ Proxy live on port ${PORT}`));
