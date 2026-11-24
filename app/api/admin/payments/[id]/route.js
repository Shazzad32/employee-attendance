import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getUser } from "@/lib/auth";
import Shift from "@/models/Shift";
import Payment from "@/models/Payment";

// Undo a payment: its shifts go back to "Due".
export async function DELETE(_req, { params }) {
  if (!(await getUser("admin"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await connectDB();
  await Shift.updateMany({ payment: id }, { payment: null });
  await Payment.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
