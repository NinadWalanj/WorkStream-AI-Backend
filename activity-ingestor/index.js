require("dotenv").config();
const express = require("express");
const crypto = require("crypto");
const { connectRabbitMQ, publishEvent } = require("./rabbitmq");
const db = require("./db"); // pg client
const app = express();

// Use raw body for signature validation
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Validate GitHub signature
function isValidGitHubSignature(req) {
  const signature = req.headers["x-hub-signature-256"];
  if (!signature) return false;

  const hmac = crypto.createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET);
  hmac.update(req.rawBody);
  const digest = `sha256=${hmac.digest("hex")}`;

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch (err) {
    return false;
  }
}

app.post("/webhook", async (req, res) => {
  if (!isValidGitHubSignature(req)) {
    console.warn("[Ingestor] Invalid signature — blocked");
    return res.status(401).json({ error: "Invalid signature" });
  }

  const eventType = req.headers["x-github-event"];
  const payload = req.body;
  const webhookId = req.headers["x-github-hook-id"];

  if (!eventType || !payload || !webhookId) {
    return res.status(400).json({ error: "Missing event data or webhook ID" });
  }

  try {
    // 🔍 Lookup github_id from webhook_id
    const { rows } = await db.query(
      `SELECT github_id FROM user_repos WHERE webhook_id = $1`,
      [webhookId]
    );

    const githubUserId = rows[0]?.github_id;

    if (!githubUserId) {
      console.warn("[Ingestor] No user found for webhook ID:", webhookId);
      return res.status(404).json({ error: "User not found for this webhook" });
    }

    // ✅ Publish enriched event
    publishEvent(eventType, {
      user_id: githubUserId,
      event_type: eventType,
      repo_name: payload.repository.full_name,
      payload,
      timestamp: new Date().toISOString(),
    });

    console.log(
      `[Ingestor] Published ${eventType} from ${payload.repository.full_name} for user ${githubUserId}`
    );
    res.sendStatus(200);
  } catch (err) {
    console.error("[Ingestor] Error handling event:", err.message);
    res.status(500).json({ error: "Internal error" });
  }
});

const PORT = process.env.PORT || 5004;

connectRabbitMQ()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`ActivityIngestor listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to RabbitMQ:", err.message);
    process.exit(1);
  });
