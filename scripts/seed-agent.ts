/**
 * Seed a sample AIAgent for testing.
 * Usage: npx tsx scripts/seed-agent.ts
 */
import "./_load-env.js";
import { connectDB } from "../lib/db";
import { AIAgent } from "../models/AIAgent";
import { seedKeyFromEnv } from "../lib/apikey";

(async () => {
  await connectDB();
  await seedKeyFromEnv("anthropic", "ANTHROPIC_API_KEY");

  const existing = await AIAgent.findOne({ name: "Tech News Agent" });
  if (existing) {
    console.log("Agent already exists:", String(existing._id));
    process.exit(0);
  }

  const agent = await AIAgent.create({
    name: "Tech News Agent",
    topic: "tech",
    sources: [
      "https://feeds.feedburner.com/TechCrunch/",
      "https://www.theverge.com/rss/index.xml",
    ],
    schedule: "0 8 * * *",
    model: "claude-sonnet-4-6",
    autoPublish: false,
    active: true,
    dailyTokenLimit: 200_000,
  });

  console.log("Created agent:", String(agent._id));
  console.log("Run: npx tsx scripts/test-agent.ts", String(agent._id));
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
