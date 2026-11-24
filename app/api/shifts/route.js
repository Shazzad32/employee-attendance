import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { shiftMs, shiftPay } from "@/lib/utils";
import Shift from "@/models/Shift";
import Payment from "@/models/Payment";

// An employee's own shifts, dues and payment history. Server time is returned so the clock can't be faked.
export async function GET(req) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const sp = req.nextUrl.searchParams;
  const q = { user: user._id };
  if (sp.get("from") || sp.get("to")) {
    q.startTime = {};
    if (sp.get("from")) q.startTime.$gte = new Date(sp.get("from"));
    if (sp.get("to")) q.startTime.$lte = new Date(sp.get("to"));
  }
  const [shifts, active, unpaid, payments] = await Promise.all([
    Shift.find(q).sort({ startTime: -1 }).lean(),
    Shift.findOne({ user: user._id, endTime: null }).lean(),
    Shift.find({ user: user._id, payment: null, endTime: { $ne: null } }).lean(),
    Payment.find({ user: user._id }).sort({ paidAt: -1 }).limit(20).lean(),
  ]);
  return NextResponse.json({
    shifts,
    active,
    payments,
    dueMs: unpaid.reduce((a, s) => a + shiftMs(s), 0),
    dueAmount: Math.round(unpaid.reduce((a, s) => a + shiftPay(s), 0)),
    serverNow: Date.now(),
    user: { name: user.name, hourlyRate: user.hourlyRate },
  });
}
