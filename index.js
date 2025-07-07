require("dotenv").config();
const express = require("express");
const axios = require("axios");
const { verifyKeyMiddleware } = require("discord-interactions");

const app = express();

// Health check dla Railway
app.get("/", (_req, res) => {
  res.send("OK");
});

// Tylko RAW dla Discord Interactions
app.post(
  "/interactions",
  express.raw({ type: "application/json" }),
  verifyKeyMiddleware(process.env.DISCORD_PUBLIC_KEY),
  async (req, res) => {
    // 1. Uruchamianie parsowania RAW lub przyjmowanie już obiektu
    let interaction;
    if (Buffer.isBuffer(req.body)) {
      interaction = JSON.parse(req.body.toString());
    } else {
      interaction = req.body;
    }

    // 2. Forward do n8n
    try {
      await axios.post(process.env.N8N_WEBHOOK_URL, interaction, {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Forward to n8n failed:", err);
    }

    // 3. Odpowiedz 200 OK (middleware już odesłał PONG jeśli to ping)
    return res.status(200).end();
  }
);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Proxy live on port ${PORT}`));
