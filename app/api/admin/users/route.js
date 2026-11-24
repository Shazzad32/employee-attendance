import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { getUser } from "@/lib/auth";
import User from "@/models/User";
import Shift from "@/models/Shift";
import { shiftMs, shiftPay } from "@/lib/utils";

const deny = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET() {
  if (!(await getUser("admin"))) return deny();
  await connectDB();
  const [users, open, unpaid] = await Promise.all([
    User.find().select("-password").sort({ role: 1, name: 1 }).lean(),
    Shift.find({ endTime: null }).lean(),
    Shift.find({ endTime: { $ne: null }, payment: null }).lean(),
  ]);
  const due = {};
  for (const s of unpaid) {
    const d = (due[String(s.user)] ||= { ms: 0, amt: 0 });
    d.ms += shiftMs(s);
    d.amt += shiftPay(s);
  }
  const since = Object.fromEntries(open.map((s) => [String(s.user), s.startTime]));
  return NextResponse.json(
    users.map((u) => ({ ...u, working: !!since[String(u._id)], workingSince: since[String(u._id)] || null,
      dueMs: due[String(u._id)]?.ms || 0, dueAmount: Math.round(due[String(u._id)]?.amt || 0) }))
  );
}

export async function POST(req) {
  if (!(await getUser("admin"))) return deny();
  const b = await req.json();
  const name = String(b.name || "").trim();
  const username = String(b.username || "").trim().toLowerCase();
  const password = String(b.password || "");
  if (!name || !username || password.length < 6)
    return NextResponse.json({ error: "Name, username and a password of at least 6 characters are required" }, { status: 400 });
  await connectDB();
  if (await User.findOne({ username }))
    return NextResponse.json({ error: "That username is already taken" }, { status: 409 });
  const u = await User.create({
    name,
    username,
    password: await bcrypt.hash(password, 10),
    role: b.role === "admin" ? "admin" : "user",
    hourlyRate: Math.max(0, Number(b.hourlyRate) || 0),
  });
  return NextResponse.json({ id: u._id }, { status: 201 });
}
