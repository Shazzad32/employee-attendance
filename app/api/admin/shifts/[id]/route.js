import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getUser } from "@/lib/auth";
import Shift from "@/models/Shift";

const err = (m, s) => NextResponse.json({ error: m }, { status: s });

export async function PATCH(req, { params }) {
  if (!(await getUser("admin"))) return err("Unauthorized", 401);
  const { id } = await params;
  const b = await req.json();
  await connectDB();
  const s = await Shift.findById(id);
  if (!s) return err("Shift not found", 404);
  if (s.payment) return err("This shift is already paid. Undo that payment first.", 400);
  if (b.startTime) s.startTime = new Date(b.startTime);
  if (b.endTime !== undefined) s.endTime = b.endTime ? new Date(b.endTime) : null;
  if (b.rateAtTime !== undefined && b.rateAtTime !== "") s.rateAtTime = Math.max(0, Number(b.rateAtTime) || 0);
  if (isNaN(s.startTime) || (s.endTime && (isNaN(s.endTime) || s.endTime <= s.startTime)))
    return err("End time must be after start time", 400);
  await s.save();
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req, { params }) {
  if (!(await getUser("admin"))) return err("Unauthorized", 401);
  const { id } = await params;
  await connectDB();
  const s = await Shift.findById(id);
  if (s?.payment) return err("This shift is already paid. Undo that payment first.", 400);
  await Shift.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
