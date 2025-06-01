const { OpenAI } = require("openai");
require("dotenv").config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function extractDetails(event) {
  const { event_type, repo_name, payload } = event;

  if (!payload || typeof payload !== "object") {
    return `⚠️ Skipped malformed payload for event type: ${event_type} in ${repo_name}`;
  }

  if (event_type === "push") {
    const commits = (payload.commits || [])
      .map((c) => `• ${c.message} by ${c.author?.name || "unknown"}`)
      .join("\n");
    const branch = payload.ref?.split("/").pop() || "unknown";
    return `Push to ${repo_name} on branch ${branch} with ${
      payload.commits?.length || 0
    } commits:\n${commits}`;
  }

  if (event_type === "ping") {
    return `Ping received from ${repo_name}. Webhook setup seems successful.`;
  }

  if (event_type === "issues") {
    return `Issue "${payload.issue?.title}" was ${payload.action} in ${repo_name}.`;
  }

  if (event_type === "pull_request") {
    return `Pull Request "${payload.pull_request?.title}" was ${payload.action} in ${repo_name}.`;
  }

  return `Unrecognized event type: ${event_type} in ${repo_name}`;
}

async function summarizeEvents(events) {
  const activityLines = events.map(extractDetails).filter(Boolean).join("\n\n");

  const prompt = `
You are a concise and informative GitHub activity summarizer.

Here is today's developer activity:
${activityLines}

Summarize this in 2–3 clear, engaging sentences as if reporting progress to a project manager.
Mention specific repos, authors, and any meaningful work done (commits, PRs, issues, pings).
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-nano-2025-04-14",
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content.trim();
}

module.exports = summarizeEvents;
