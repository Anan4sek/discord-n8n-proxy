require("dotenv").config();

const express = require("express");
const axios = require("axios");
const { verifyKeyMiddleware } = require("discord-interactions");

const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

const app = express();

// ❌ Uwaga: USUWAMY globalne express.json()
// app.use(express.json());

app.post(
  "/interactions",
  // 1) Najpierw pobieramy RAW body (żeby middleware miał dostęp do dokładnego buf)
  express.raw({ type: "application/json" }),
  // 2) Weryfikujemy nagłówki x-signature-*
  verifyKeyMiddleware(PUBLIC_KEY),
  // 3) Nasz handler po pomyślnej weryfikacji
  async (req, res) => {
    // Parsujemy rawBuffer na JSON
    const interaction = JSON.parse(req.body.toString());

    // Forward do n8n
    try {
      await axios.post(N8N_WEBHOOK_URL, interaction, {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("❌ Forward to n8n failed:", err);
    }

    // Zwracamy 200 OK (Discord już dostał PONG od middleware)
    return res.status(200).end();
  }
);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Proxy live on port ${PORT}`);
});
