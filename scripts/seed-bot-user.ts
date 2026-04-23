/**
 * Create the bot user used as fallback author for AI-generated posts.
 * Usage: npx tsx scripts/seed-bot-user.ts
 */
import "./_load-env.js";
import { connectDB } from "../lib/db";
import { User } from "../models/User";

(async () => {
  await connectDB();
  const existing = await User.findOne({ email: "bot@blog.internal" });
  if (existing) {
    console.log("Bot user already exists:", String(existing._id));
    process.exit(0);
  }
  const bot = await User.create({
    email: "bot@blog.internal",
    displayName: "AI Bot",
    username: "ai-bot",
    role: "AUTHOR",
  });
  console.log("Created bot user:", String(bot._id));
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
