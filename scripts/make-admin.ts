/**
 * Promote a user to ADMIN role.
 * Usage: npx tsx scripts/make-admin.ts <email>
 */
import "./_load-env.js";
import { connectDB } from "../lib/db";
import { User } from "../models/User";

const [, , email] = process.argv;

if (!email) {
  console.error("Usage: npx tsx scripts/make-admin.ts <email>");
  process.exit(1);
}

(async () => {
  await connectDB();
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      $set: { role: "ADMIN" },
      $setOnInsert: { displayName: email.split("@")[0], email: email.toLowerCase() },
    },
    { new: true, upsert: true },
  ).select("email displayName role");

  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  console.log(`✓ ${user.displayName} (${user.email}) → role: ${user.role}`);
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
