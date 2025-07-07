require("dotenv").config();
const express = require("express");
const axios   = require("axios");
const { verifyKey } = require("discord-interactions");

const app         = express();
const PORT        = +process.env.PORT || 8080;
const PUBLIC_KEY  = process.env.DISCORD_PUBLIC_KEY;
const N8N_WEBHOOK = process.env.N8N_WEBHOOK_URL;

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

    // BUTTON → modal
    if (interaction.type === 3) {
      try {
        const { data } = await axios.post(N8N_WEBHOOK, interaction, {
          headers: { "Content-Type": "application/json" },
        });
        return res.json(data);
      } catch (err) {
        console.error("n8n modal error:", err);
        return res.status(500).end();
      }
    }

    // SLASH → defer
    if (interaction.type === 2) {
      res.json({ type: 5 });
      axios.post(N8N_WEBHOOK, interaction).catch(console.error);
      return;
    }

    // **NEW** MODAL SUBMIT → defer update + forward do n8n
    if (interaction.type === 5) {
      res.json({ type: 6 });
      axios
        .post(N8N_WEBHOOK, interaction, {
          headers: { "Content-Type": "application/json" },
        })
        .catch(console.error);
      return;
    }

    // inne
    res.status(200).end();
  }
);

app.listen(PORT, () => console.log(`✅ Proxy live on port ${PORT}`));
