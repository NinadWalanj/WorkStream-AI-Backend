const start = require("./rabbitmq");

start().catch((err) => {
  console.error("[EventStore] Error starting service:", err);
});
