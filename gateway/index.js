require("dotenv").config();
const express = require("express");
const session = require("./sessionStore");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");

const app = express();

app.set("trust proxy", true);

app.use(
  cors({
    origin: [
      "https://workstreamai.netlify.app", // ✅ your frontend (Netlify)
      "https://workstream-ai.online", // ✅ your production domain (if later moved)
      "https://www.workstream-ai.online", // ✅ if www. version is ever used
    ],
    credentials: true, // ✅ allow cookies/sessions
  })
);
app.use(session);

app.use((req, res, next) => {
  console.log(`[Gateway] ${req.method} ${req.originalUrl}`);
  res.on("finish", () => {
    console.log(`[Gateway] Response status: ${res.statusCode}`);
  });
  next();
});

// Middleware to protect private routes
function sessionGuard(req, res, next) {
  if (!req.session || !req.session.id) {
    return res.status(401).json({ error: "Unauthorized: No active session" });
  }
  console.log("req.session: ", req.session);
  console.log("passport: ", req.session.passport.user.id);
  console.log("session: ", req.session.id);
  req.headers["x-user-id"] = req.session.passport.user.id;
  next();
}

// Public (unprotected) route: /auth/*
app.use(
  "/auth",
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/auth": "" },
  })
);

// Protected: /repos/*
app.use(
  "/repos",
  sessionGuard,
  createProxyMiddleware({
    target: process.env.REPO_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/repos": "" },
  })
);

// Protected: /summary/*
app.use(
  "/summary",
  sessionGuard,
  createProxyMiddleware({
    target: process.env.SUMMARY_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/summary": "" },
  })
);

app.listen(process.env.PORT, () => {
  console.log(`API Gateway running on port ${process.env.PORT}`);
});
