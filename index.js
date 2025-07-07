const express = require("express");
const bodyParser = require("body-parser");
const nacl = require("tweetnacl");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.post("/discord", async (req, res) => {
  const signature = req.get("x-signature-ed25519");
  const timestamp = req.get("x-signature-timestamp");

  const isValid = nacl.sign.detached.verify(
    Buffer.from(timestamp + req.rawBody),
    Buffer.from(signature, "hex"),
    Buffer.from(DISCORD_PUBLIC_KEY, "hex")
  );

  if (!isValid) {
    console.log("❌ Invalid signature");
    return res.status(401).send("invalid request signature");
  }

  if (req.body.type === 1) {
    console.log("✅ PING received, responding...");
    return res.json({ type: 1 });
  }

  try {
    await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });
  } catch (err) {
    console.error("❌ Failed to forward to n8n:", err);
  }

  res.status(200).end();
});

app.listen(PORT, () => console.log(`✅ Proxy live on port ${PORT}`));