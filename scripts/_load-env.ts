import { config } from "dotenv";
import { resolve } from "path";

// Next.js loads .env.local automatically; tsx scripts must do it manually.
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") }); // fallback
