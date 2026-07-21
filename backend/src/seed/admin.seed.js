import { connectDatabase } from "../config/database.js";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

if (!env.adminEmail)
  throw new Error("Set ADMIN_EMAIL before running the admin seed");
await connectDatabase();
const admin = await User.findOneAndUpdate(
  { email: env.adminEmail },
  {
    $set: { role: "ADMIN", isEmailVerified: true },
    $setOnInsert: { email: env.adminEmail, name: "Administrator" },
  },
  { upsert: true, new: true },
);
console.log(`Admin ready: ${admin.email}`);
process.exit(0);
