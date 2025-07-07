require("dotenv").config();
const express = require("express");
const axios = require("axios");
const { verifyKeyMiddleware } = require("discord-interactions");

const app = express();
const PUBLIC_KEY  = process.env.DISCORD_PUBLIC_KEY;
const N8N_WEBHOOK = process.env.N8N_WEBHOOK_URL;
const PORT       = process.env.PORT || 8080;

app.get("/", (_req, res) => res.send("OK"));

app.post(
  "/interactions",
  express.raw({ type: "application/json" }),
  verifyKeyMiddleware(PUBLIC_KEY),
  async (req, res) => {
    const interaction = JSON.parse(req.body.toString());

    if (interaction.type === 1) {
      return res.json({ type: 1 });
    }
    if (interaction.type === 2) {
      res.json({ type: 5 });
    } else if (interaction.type === 3) {
      res.json({ type: 6 });
    } else {
      res.status(200).end();
    }

    axios
      .post(N8N_WEBHOOK, interaction, {
        headers: { "Content-Type": "application/json" },
      })
      .catch(console.error);
  }
);

app.listen(PORT, () => console.log(`✅ Proxy live on port ${PORT}`));
