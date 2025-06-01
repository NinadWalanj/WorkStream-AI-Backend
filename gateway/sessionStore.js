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
  cookie: { secure: false }, // set to true in production with HTTPS
});
