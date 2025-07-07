require("dotenv").config();
const express = require("express");
const { verifyKeyMiddleware } = require("discord-interactions");
const axios = require("axios");

const app = express();
const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

// 1) Używamy express.raw, żeby złapać surowy buffer JSONa
app.post(
  "/interactions",
  express.raw({ type: "application/json" }),
  verifyKeyMiddleware(PUBLIC_KEY), // 2) weryfikujemy podpis
  async (req, res) => {
    // 3) Parsujemy JSON z raw body
    const interaction = JSON.parse(req.body.toString());

    // 4) Jeśli to PING (type 1), middleware już odpowiedział {type:1}, więc dalej to już normalnie.
    //    Ale SDK automatycznie wysłało odpowiedź PONG, więc tu robimy forward tylko dla innych typów.

    try {
      // 5) Przekazujemy interakcję do Twojego n8n
      await axios.post(N8N_WEBHOOK_URL, interaction, {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Forward to n8n failed:", err);
    }

    // 6) Zwracamy 200 OK (Discord już dostał PONG od middleware)
    res.status(200).end();
  }
);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Proxy live on port ${PORT}`));
