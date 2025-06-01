// middleware/verifyGithubToken.js
const axios = require("axios");
const db = require("../db");

async function verifyGithubToken(req, res, next) {
  const userId = req.user_id;

  try {
    const result = await db.query(
      `SELECT github_token FROM users WHERE github_id = $1`,
      [userId.replace("github:", "")]
    );

    const token = result.rows[0]?.github_token;
    console.log("token", token);
    if (!token) {
      return res.status(401).json({ error: "GitHub token not found." });
    }

    // Validate token by making a lightweight call to GitHub API
    await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}` },
    });

    next(); // ✅ Token is valid
  } catch (err) {
    console.warn("[RepoService] Invalid GitHub token for user", userId);
    return res.status(401).json({
      error: "GitHub token is invalid or expired. Please re-authenticate.",
    });
  }
}

module.exports = verifyGithubToken;
