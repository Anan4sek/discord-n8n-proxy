require("dotenv").config();
const express = require("express");
const { verifyKeyMiddleware } = require("discord-interactions");

const app = express();
app.use(express.json());

const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

app.post("/interactions", verifyKeyMiddleware(PUBLIC_KEY), async (req, res) => {
  const interaction = req.body;

  const response = await fetch(N8N_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(interaction),
  });

  const data = await response.json();
  res.json(data);
});

app.listen(8080, () => {
  console.log("Proxy live on port 8080");
});
