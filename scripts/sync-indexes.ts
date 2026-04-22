/**
 * Buộc Mongoose sync indexes cho tất cả models — chạy 1 lần sau khi đổi schema.
 * pnpm db:sync-indexes
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const envLocalPath = resolve(process.cwd(), ".env.local");
if (existsSync(envLocalPath)) {
  for (const line of readFileSync(envLocalPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const { connectDB, mongoose } = await import("../lib/db");
const models = await import("../models/index");

async function main() {
  await connectDB();
  for (const [name, Model] of Object.entries(models)) {
    // skip non-model exports (enums, types)
    const anyModel = Model as unknown as { syncIndexes?: () => Promise<unknown> };
    if (typeof anyModel.syncIndexes === "function") {
      await anyModel.syncIndexes();
      console.log(`✓ ${name} indexes synced`);
    }
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("✗ Sync indexes failed:", err);
  process.exit(1);
});
