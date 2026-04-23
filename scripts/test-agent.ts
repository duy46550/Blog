/**
 * Run a single AI agent by ID (reads from DB, writes posts).
 * Usage: npx tsx scripts/test-agent.ts <agentId>
 */
import "./_load-env.js";
import { runAgent } from "../lib/ai/pipeline";

const [, , agentId] = process.argv;

if (!agentId) {
  console.error("Usage: npx tsx scripts/test-agent.ts <agentId>");
  process.exit(1);
}

(async () => {
  console.log(`Running agent: ${agentId}`);
  const result = await runAgent(agentId);

  console.log("\n=== RESULT ===");
  console.log(`Agent: ${result.agentName}`);
  console.log(`Posts created: ${result.postsCreated}`);
  console.log(`Skipped (already seen): ${result.skipped}`);
  if (result.errors.length) {
    console.log("Errors:");
    result.errors.forEach((e) => console.log(" -", e));
  }
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
