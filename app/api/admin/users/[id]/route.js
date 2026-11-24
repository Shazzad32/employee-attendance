import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { getUser } from "@/lib/auth";
import User from "@/models/User";
import Shift from "@/models/Shift";
import Payment from "@/models/Payment";

const err = (m, s) => NextResponse.json({ error: m }, { status: s });

export async function PATCH(req, { params }) {
  const admin = await getUser("admin");
  if (!admin) return err("Unauthorized", 401);
  const { id } = await params;
  const b = await req.json();
  await connectDB();
  const u = await User.findById(id);
  if (!u) return err("User not found", 404);

  if (b.name !== undefined) u.name = String(b.name).trim();
  if (b.username !== undefined) {
    const un = String(b.username).trim().toLowerCase();
    if (un !== u.username) {
      if (await User.findOne({ username: un })) return err("That username is already taken", 409);
      u.username = un;
    }
  }
  if (b.hourlyRate !== undefined) u.hourlyRate = Math.max(0, Number(b.hourlyRate) || 0);
  if (b.active !== undefined) {
    if (String(u._id) === String(admin._id) && !b.active) return err("You can't deactivate your own account", 400);
    u.active = !!b.active;
  }
  if (b.password) {
    if (String(b.password).length < 6) return err("Password must be at least 6 characters", 400);
    u.password = await bcrypt.hash(String(b.password), 10);
  }
  await u.save();
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req, { params }) {
  const admin = await getUser("admin");
  if (!admin) return err("Unauthorized", 401);
  const { id } = await params;
  if (String(admin._id) === id) return err("You can't delete your own account", 400);
  await connectDB();
  await Shift.deleteMany({ user: id });
  await Payment.deleteMany({ user: id });
  await User.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
