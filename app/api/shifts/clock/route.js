import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getUser } from "@/lib/auth";
import Shift from "@/models/Shift";

export async function POST(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { action } = await req.json();
  await connectDB();
  const open = await Shift.findOne({ user: user._id, endTime: null });

  if (action === "start") {
    if (open) return NextResponse.json({ error: "You are already clocked in" }, { status: 400 });
    await Shift.create({ user: user._id, startTime: new Date(), rateAtTime: user.hourlyRate });
    return NextResponse.json({ ok: true });
  }
  if (action === "end") {
    if (!open) return NextResponse.json({ error: "You are not clocked in" }, { status: 400 });
    open.endTime = new Date();
    await open.save();
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
