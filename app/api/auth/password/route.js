import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { getUser } from "@/lib/auth";
import User from "@/models/User";

export async function POST(req) {
  const me = await getUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { current, next } = await req.json();
  if (String(next || "").length < 6)
    return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
  await connectDB();
  const user = await User.findById(me._id);
  if (!(await bcrypt.compare(String(current || ""), user.password)))
    return NextResponse.json({ error: "Current password is wrong" }, { status: 400 });
  user.password = await bcrypt.hash(String(next), 10);
  await user.save();
  return NextResponse.json({ ok: true });
}
