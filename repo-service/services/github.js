const axios = require("axios");
const db = require("../db");

const getGithubToken = async (userId) => {
  const githubId = userId.replace("github:", "");

  const res = await db.query(
    "SELECT github_token FROM users WHERE github_id = $1",
    [githubId]
  );

  if (res.rows.length === 0) {
    throw new Error("GitHub token not found for this user");
  }

  return res.rows[0].github_token;
};

const fetchUserRepos = async (accessToken) => {
  const response = await axios.get(`${process.env.GITHUB_API_URL}/user/repos`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });
  return response.data;
};

module.exports = { fetchUserRepos, getGithubToken };
