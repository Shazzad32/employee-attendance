// Creates the first admin account.  Run:  npm run seed
import fs from "node:fs";

// Load .env.local (or .env) manually; quotes around values are stripped.
for (const file of [".env.local", ".env"]) {
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!m || line.trim().startsWith("#")) continue;
    let v = (m[2] || "").trim();
    if (/^(['"]).*\1$/.test(v)) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
  console.log(`Loaded env from ${file}`);
  break;
}
if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set. Create .env.local with your MongoDB connection string.");
  process.exit(1);
}

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const name = process.env.ADMIN_NAME || "Office Admin";
const username = (process.env.ADMIN_USERNAME || "admin").toLowerCase();
const password = process.env.ADMIN_PASSWORD || "change-me-123";

await mongoose.connect(process.env.MONGODB_URI);
const User = mongoose.model(
  "User",
  new mongoose.Schema(
    {
      name: String,
      username: { type: String, unique: true },
      password: String,
      role: String,
      hourlyRate: { type: Number, default: 0 },
      active: { type: Boolean, default: true },
    },
    { timestamps: true }
  )
);

const existing = await User.findOne({ username });
const hash = await bcrypt.hash(password, 10);
if (existing) {
  // Reset password/role/active so you can always recover admin access by re-running the seed.
  existing.password = hash;
  existing.role = "admin";
  existing.active = true;
  await existing.save();
  console.log(`Admin "${username}" already existed - password reset to the value in your env file.`);
} else {
  await User.create({ name, username, password: hash, role: "admin", active: true });
  console.log(`Admin created. Login with username "${username}".`);
}
console.log(`Database: ${mongoose.connection.name}`);
await mongoose.disconnect();
