// const { createClient } = require("redis");
// const redisClient = createClient({
//   url: "rediss://default:AaCiAAIjcDE4NzM3ZjhmNjhlMGQ0ODk0YWUzZTdkZmIzYTlmNjkyN3AxMA@tops-dolphin-41122.upstash.io:6379",
// });

// redisClient.connect().catch(console.error);
// module.exports = redisClient;

const Redis = require("ioredis");

const redisClient = new Redis(process.env.REDIS_URL);

redisClient.on("connect", () => console.log("Connected to Upstash Redis"));
redisClient.on("error", (err) => console.error("Redis error:", err));

module.exports = redisClient;
