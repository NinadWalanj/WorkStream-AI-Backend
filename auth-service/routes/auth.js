const express = require("express");
const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;
const router = express.Router();
const redisClient = require("../redis");
const db = require("../db");

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      await db.query(
        `
        INSERT INTO users (github_id, github_username, github_token, avatar_url)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (github_id)
        DO UPDATE SET
          github_token = EXCLUDED.github_token,
          github_username = EXCLUDED.github_username,
          avatar_url = EXCLUDED.avatar_url
      `,
        [profile.id, profile.username, accessToken, profile._json.avatar_url]
      );

      // 1 session per user: remove old session manually
      const userId = `github:${profile.id}`;
      const oldSessionId = await redisClient.get(`user:${userId}`);
      if (oldSessionId) {
        await redisClient.del(`sess:${oldSessionId}`);
      }
      done(null, {
        id: userId,
        username: profile.username,
        avatar: profile._json.avatar_url,
      });
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email", "repo"] })
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: "https://workstreamai.netlify.app/register",
  }),
  async (req, res) => {
    await redisClient.set(`user:${req.user.id}`, req.sessionID);

    res.status(200).json({
      success: true,
      user: req.user,
      message: "Login successful",
    });
  }
);

router.get("/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy(() =>
      res.redirect("https://workstreamai.netlify.app/register")
    );
  });
});

router.get("/me", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  res.json({ user: req.user });
});

module.exports = router;
