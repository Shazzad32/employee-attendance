import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { shiftMs, shiftPay } from "@/lib/utils";
import User from "@/models/User";
import Shift from "@/models/Shift";
import Payment from "@/models/Payment";

const err = (m, s) => NextResponse.json({ error: m }, { status: s });

export async function GET(req) {
  if (!(await getUser("admin"))) return err("Unauthorized", 401);
  await connectDB();
  const q = {};
  const userId = req.nextUrl.searchParams.get("userId");
  if (userId) q.user = userId;
  const list = await Payment.find(q).populate("user", "name username").sort({ paidAt: -1 }).limit(300).lean();
  return NextResponse.json(list);
}

// Pay every completed, unpaid shift of one employee that started inside [from, to].
export async function POST(req) {
  if (!(await getUser("admin"))) return err("Unauthorized", 401);
  const b = await req.json();
  if (!["cash", "bkash", "nagad"].includes(b.method)) return err("Choose a payment method", 400);
  const from = new Date(b.from), to = new Date(b.to);
  if (isNaN(from) || isNaN(to)) return err("Invalid date range", 400);
  await connectDB();
  const user = await User.findById(b.userId);
  if (!user) return err("Employee not found", 404);

  const shifts = await Shift.find({ user: user._id, payment: null, endTime: { $ne: null }, startTime: { $gte: from, $lte: to } });
  if (!shifts.length) return err("Nothing is due for this employee in this period", 400);

  const amount = Math.round(shifts.reduce((a, s) => a + shiftPay(s), 0));
  const ms = shifts.reduce((a, s) => a + shiftMs(s), 0);
  const adjustment = Math.round(Number(b.adjustment) || 0);
  if (amount + adjustment < 0) return err("Deduction is bigger than the amount due", 400);

  const p = await Payment.create({
    user: user._id, from, to, shiftCount: shifts.length, ms, amount, adjustment, total: amount + adjustment,
    method: b.method, trxId: String(b.trxId || "").trim(), note: String(b.note || "").trim(),
  });
  await Shift.updateMany({ _id: { $in: shifts.map((s) => s._id) } }, { payment: p._id });
  return NextResponse.json({ id: p._id, total: p.total }, { status: 201 });
}
