import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { signToken, COOKIE } from "@/lib/auth";
import User from "@/models/User";

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    await connectDB();
    const user = await User.findOne({ username: String(username || "").trim().toLowerCase() });
    const ok = user && user.active && (await bcrypt.compare(String(password || ""), user.password));
    if (!ok) return NextResponse.json({ error: "Wrong username or password" }, { status: 401 });

    const token = await signToken({ id: user._id.toString(), role: user.role });
    const res = NextResponse.json({ role: user.role });
    res.cookies.set(COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json({ error: "Server error: " + (e.message || "unknown") }, { status: 500 });
  }
}
