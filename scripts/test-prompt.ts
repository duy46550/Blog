/**
 * Test the AI prompt without writing to DB.
 * Usage: npx tsx scripts/test-prompt.ts <url> [topic]
 *
 * Example:
 *   npx tsx scripts/test-prompt.ts https://vnexpress.net/... tech
 */
import "./_load-env.js";
import { extractContent } from "../lib/crawler/jina";
import { generatePost } from "../lib/ai/anthropic";
import type { TopicVariant } from "../lib/ai/prompts";

const [, , url, topic = "general"] = process.argv;

if (!url) {
  console.error("Usage: npx tsx scripts/test-prompt.ts <url> [topic]");
  process.exit(1);
}

(async () => {
  console.log(`Extracting content from: ${url}`);
  const text = await extractContent(url);
  console.log(`Extracted ${text.length} chars\n`);

  console.log("Generating post...");
  const result = await generatePost(text, topic as TopicVariant);

  console.log("\n=== GENERATED POST ===");
  console.log("Title:", result.post.title);
  console.log("Tags:", result.post.tags.join(", "));
  console.log("Excerpt:", result.post.excerpt);
  console.log("\nContent:\n", result.post.content);
  console.log("\n=== USAGE ===");
  console.log(`Tokens: ${result.tokensUsed} (cache read: ${result.cacheReadTokens})`);
  console.log(`Cost: $${result.cost.toFixed(6)}`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
