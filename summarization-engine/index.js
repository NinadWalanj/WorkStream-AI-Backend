require("dotenv").config();
const express = require("express");
const db = require("./db");
const summarizeEvents = require("./summarize");
const redisClient = require("./redis");

const app = express();
app.use(express.json());

app.get("/", async (req, res) => {
  const userId = req.headers["x-user-id"];
  const githubId = userId.replace("github:", "");
  const rateLimitKey = `summary:rate-limit:${githubId}`;

  if (!userId) return res.status(400).json({ error: "Missing user ID" });

  try {
    const isLimited = await redisClient.get(rateLimitKey);
    if (isLimited) {
      return res.status(429).json({
        error: "Rate limit exceeded. Please wait before requesting again.",
      });
    }

    // Set rate limit for 60 seconds
    await redisClient.set(rateLimitKey, "1", "EX", 60);

    const { rows } = await db.query(
      `SELECT * FROM events
         WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 20`,
      [githubId]
    );
    console.log(rows);

    if (rows.length === 0) {
      return res.status(404).json({ message: "No recent activity found." });
    }

    const summary = await summarizeEvents(rows);
    res.json({ summary });
  } catch (err) {
    console.error("[Summarizer] Error:", err.message);
    res.status(500).json({ error: "Failed to generate summary" });
  }
});

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
  console.log(`SummarizationEngine running on port ${PORT}`);
});
