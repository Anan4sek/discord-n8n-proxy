require("dotenv").config();
const express = require("express");
const axios = require("axios");
const { verifyKeyMiddleware } = require("discord-interactions");

const PUBLIC_KEY   = process.env.DISCORD_PUBLIC_KEY;
const N8N_WEBHOOK  = process.env.N8N_WEBHOOK_URL;
const PORT        = process.env.PORT || 8080;

const app = express();

// Health check dla Railway
app.get("/", (_req, res) => {
  res.send("OK");
});

// Discord interaction endpoint (+raw & signature)
app.post(
  "/interactions",
  express.raw({ type: "application/json" }),
  verifyKeyMiddleware(PUBLIC_KEY),
  async (req, res) => {
    const interaction = JSON.parse(req.body.toString());

    try {
      await axios.post(N8N_WEBHOOK, interaction, {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Forward to n8n failed:", err);
    }

    // Discord już dostał PONG od middleware
    return res.status(200).end();
  }
);

app.listen(PORT, () => console.log(`✅ Proxy live on port ${PORT}`));
