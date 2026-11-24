import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getUser } from "@/lib/auth";
import User from "@/models/User";
import Shift from "@/models/Shift";

const err = (m, s) => NextResponse.json({ error: m }, { status: s });

export async function GET(req) {
  if (!(await getUser("admin"))) return err("Unauthorized", 401);
  await connectDB();
  const sp = req.nextUrl.searchParams;
  const q = {};
  if (sp.get("userId")) q.user = sp.get("userId");
  if (sp.get("from") || sp.get("to")) {
    q.startTime = {};
    if (sp.get("from")) q.startTime.$gte = new Date(sp.get("from"));
    if (sp.get("to")) q.startTime.$lte = new Date(sp.get("to"));
  }
  const shifts = await Shift.find(q).populate("user", "name username").sort({ startTime: -1 }).lean();
  return NextResponse.json(shifts);
}

// Manual entry (e.g. someone forgot to clock in)
export async function POST(req) {
  if (!(await getUser("admin"))) return err("Unauthorized", 401);
  const b = await req.json();
  await connectDB();
  const user = await User.findById(b.userId);
  if (!user) return err("Choose an employee", 400);
  const start = new Date(b.startTime);
  const end = new Date(b.endTime);
  if (isNaN(start) || isNaN(end) || end <= start) return err("End time must be after start time", 400);
  const rate = b.rateAtTime === undefined || b.rateAtTime === "" ? user.hourlyRate : Math.max(0, Number(b.rateAtTime) || 0);
  await Shift.create({ user: user._id, startTime: start, endTime: end, rateAtTime: rate });
  return NextResponse.json({ ok: true }, { status: 201 });
}
