const express = require("express");
const router = express.Router();
const requireUser = require("../middleware/requireUser");
const { getGithubToken, fetchUserRepos } = require("../services/github");
const db = require("../db");
const axios = require("axios");
const verifyGithubToken = require("../middleware/verifyGithubToken");

router.get("/", requireUser, verifyGithubToken, async (req, res) => {
  try {
    const userId = req.user_id;
    const token = await getGithubToken(userId);

    const repos = await fetchUserRepos(token);

    res.json({ repos });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch GitHub repositories" });
  }
});

router.post("/select", requireUser, verifyGithubToken, async (req, res) => {
  const { repoName, owner } = req.body;
  if (!repoName || !owner) {
    return res.status(400).json({ error: "Missing repoName or owner" });
  }

  const githubId = req.user_id.replace("github:", "");

  try {
    // 1. Store selected repo
    await db.query(
      `
      INSERT INTO user_repos (github_id, repo_name, owner)
      VALUES ($1, $2, $3)
      ON CONFLICT (github_id)
      DO UPDATE SET repo_name = EXCLUDED.repo_name, owner = EXCLUDED.owner
    `,
      [githubId, repoName, owner]
    );

    // 2. Register webhook
    const accessToken = await getGithubToken(req.user_id);

    const webhookResponse = await axios.post(
      `https://api.github.com/repos/${owner}/${repoName}/hooks`,
      {
        config: {
          url: `${process.env.WEBHOOK_RECEIVER_URL}/webhook`,
          content_type: "json",
          secret: process.env.GITHUB_WEBHOOK_SECRET,
        },
        events: ["*"],
        active: true,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    // 3. Save webhook ID
    await db.query(
      `UPDATE user_repos SET webhook_id = $1 WHERE github_id = $2`,
      [webhookResponse.data.id, githubId]
    );

    res.json({
      success: true,
      message: "Repo selected and webhook registered",
    });
  } catch (err) {
    console.error(
      "Webhook registration failed:",
      err.response?.data || err.message
    );
    res.status(500).json({ error: "Failed to register webhook" });
  }
});

module.exports = router;
