const session = require("express-session");
const { RedisStore } = require("connect-redis");
const redisClient = require("./redis");

const store = new RedisStore({
  client: redisClient,
  prefix: "session:",
});

module.exports = session({
  store: store,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // ✅ Set to true if you're using HTTPS
    sameSite: "lax", // 🔒 Ensures cookies sent with frontend requests
  },
});
