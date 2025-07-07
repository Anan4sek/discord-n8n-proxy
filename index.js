const express = require("express");
const { verifyKey } = require("discord-interactions");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.post("/", (req, res) => {
  const signature = req.header("x-signature-ed25519");
  const timestamp = req.header("x-signature-timestamp");
  const rawBody = req.rawBody;

  const isValid = verifyKey(rawBody, signature, timestamp, process.env.DISCORD_PUBLIC_KEY);

  if (!isValid) {
    return res.status(401).send("Invalid request signature");
  }

  if (req.body.type === 1) {
    // PING -> PONG
    return res.json({ type: 1 });
  }

  // Forward interaction to your n8n webhook
  const axios = require("axios");
  axios.post(process.env.N8N_WEBHOOK_URL, req.body).catch(console.error);

  res.status(200).send("OK");
});

app.listen(PORT, () => {
  console.log(`Proxy live on port ${PORT}`);
});
