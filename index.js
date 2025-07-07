require("dotenv").config();
const express = require("express");
const axios = require("axios");
const { verifyKey } = require("discord-interactions");

const app = express();
const PORT          = process.env.PORT || 8080;
const PUBLIC_KEY    = process.env.DISCORD_PUBLIC_KEY;
const N8N_WEBHOOK   = process.env.N8N_WEBHOOK_URL;

// Health-check dla Railway (żeby nie killowało kontenera)
app.get("/", (_req, res) => res.send("OK"));

// Ten middleware:
// 1) parsuje JSON,
// 2) przed parse’em wywołuje verifyKey(buf,...)
// 3) jeśli sygnatura niepoprawna → rzuca błąd i zatrzymuje request
app.post(
  "/interactions",
  express.json({
    verify: (req, res, buf) => {
      const signature = req.header("x-signature-ed25519");
      const timestamp = req.header("x-signature-timestamp");
      if (!verifyKey(buf, signature, timestamp, PUBLIC_KEY)) {
        res.status(401).end("Invalid request signature");
        throw new Error("Invalid request signature");
      }
    },
  }),
  (req, res) => {
    const interaction = req.body;

    // 1) PING → zwracamy PONG
    if (interaction.type === 1) {
      return res.json({ type: 1 });
    }

    // 2) Slash command → defer ACK
    if (interaction.type === 2) {
      res.json({ type: 5 });
    }
    // 3) Button/Select → ACK no-update
    else if (interaction.type === 3) {
      res.json({ type: 6 });
    }
    // 4) Inne typy → 200 OK bez body
    else {
      res.status(200).end();
    }

    // 5) Forward do n8n *asynchronicznie* (Discord już dostał ACK)
    axios
      .post(N8N_WEBHOOK, interaction, {
        headers: { "Content-Type": "application/json" },
      })
      .catch((err) => console.error("Forward to n8n failed:", err));
  }
);

app.listen(PORT, () => console.log(`✅ Proxy live on port ${PORT}`));
