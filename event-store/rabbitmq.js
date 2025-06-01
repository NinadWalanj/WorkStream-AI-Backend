const amqplib = require("amqplib");
const handleEvent = require("./events/handleEvent");
require("dotenv").config();

async function start() {
  const conn = await amqplib.connect(process.env.RABBITMQ_URL);
  const ch = await conn.createChannel();
  await ch.assertExchange(process.env.EXCHANGE_NAME, "fanout", {
    durable: true,
  });

  const q = await ch.assertQueue("", { exclusive: true });
  await ch.bindQueue(q.queue, process.env.EXCHANGE_NAME, "");

  console.log("[EventStore] Waiting for events...");

  ch.consume(q.queue, async (msg) => {
    if (msg !== null) {
      const event = JSON.parse(msg.content.toString());
      console.log("[EventStore] Event received:", event);
      await handleEvent(event);
      ch.ack(msg);
    }
  });
}

module.exports = start;
