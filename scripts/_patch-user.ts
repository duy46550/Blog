import "./_load-env.js";
import { connectDB } from "../lib/db";
import { User } from "../models/User";

const [, , email, field, value] = process.argv;
(async () => {
  await connectDB();
  const r = await User.updateOne({ email }, { $set: { [field]: value } });
  console.log(r.modifiedCount ? `✓ Updated ${field}` : "No document matched");
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
