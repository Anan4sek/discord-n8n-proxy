require("dotenv").config();
const express = require("express");
const axios   = require("axios");
const { verifyKey } = require("discord-interactions");

const app         = express();
const PORT        = +process.env.PORT || 8080;
const PUBLIC_KEY  = process.env.DISCORD_PUBLIC_KEY;
const N8N_WEBHOOK = process.env.N8N_WEBHOOK_URL;

// health-check
app.get("/", (_q, r) => r.send("OK"));

app.post(
  "/interactions",
  express.json({
    verify: (req, res, buf) => {
      const sig = req.header("x-signature-ed25519");
      const ts  = req.header("x-signature-timestamp");
      if (!verifyKey(buf, sig, ts, PUBLIC_KEY)) {
        res.status(401).end("Invalid signature");
        throw new Error("Invalid signature");
      }
    },
  }),
  async (req, res) => {
    const interaction = req.body;

    // PING  
    if (interaction.type === 1) {
      return res.json({ type: 1 });
    }

    // BUTTON (component) → modal
    if (interaction.type === 3) {
      try {
        // Czekamy na modal JSON z n8n
        const { data } = await axios.post(N8N_WEBHOOK, interaction, {
          headers: { "Content-Type": "application/json" },
        });
        // Odsyłamy go bezpośrednio do Discorda
        return res.json(data);
      } catch (err) {
        console.error("n8n modal error:", err);
        return res.status(500).end();
      }
    }

    // SLASH COMMAND → defer ACK
    if (interaction.type === 2) {
      res.json({ type: 5 });
      // opcjonalnie forward do n8n w tle
      axios.post(N8N_WEBHOOK, interaction).catch(console.error);
      return;
    }

    // inne przypadki  
    res.status(200).end();
  }
);

app.listen(PORT, () => console.log(`✅ Proxy live on port ${PORT}`));
