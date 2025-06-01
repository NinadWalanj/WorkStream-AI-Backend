const db = require("../db");

module.exports = async function handleEvent(event) {
  try {
    const {
      user_id, // from x-user-id header (forwarded by ingestor later)
      repo_name, // from webhook payload or repo field
      event_type, // "push", "pull_request", etc.
      payload, // raw payload
      timestamp = new Date(), // fallback
    } = event;

    await db.query(
      `
      INSERT INTO events (user_id, repo_name, event_type, payload, timestamp)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [user_id, repo_name, event_type, JSON.stringify(payload), timestamp]
    );

    console.log("[EventStore] Event stored for repo:", repo_name);
  } catch (err) {
    console.error(
      "[EventStore] Failed to store event:",
      err.message,
      err.stack
    );
  }
};
