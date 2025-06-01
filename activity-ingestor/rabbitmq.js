const amqplib = require("amqplib");

let channel;

async function connectRabbitMQ() {
  const conn = await amqplib.connect(process.env.RABBITMQ_URL);
  channel = await conn.createChannel();
  await channel.assertExchange(process.env.EXCHANGE_NAME, "fanout", {
    durable: true,
  });
}

function publishEvent(routingKey, message) {
  if (!channel) throw new Error("RabbitMQ channel not initialized");
  channel.publish(
    process.env.EXCHANGE_NAME,
    routingKey,
    Buffer.from(JSON.stringify(message))
  );
}

module.exports = { connectRabbitMQ, publishEvent };
