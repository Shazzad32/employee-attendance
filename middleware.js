import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;
  let payload = null;
  if (token) {
    try {
      payload = (await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET))).payload;
    } catch {}
  }
  if (!payload) return NextResponse.redirect(new URL("/login", req.url));
  if (pathname.startsWith("/admin") && payload.role !== "admin")
    return NextResponse.redirect(new URL("/employee", req.url));
  if (pathname.startsWith("/employee") && payload.role === "admin")
    return NextResponse.redirect(new URL("/admin", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/employee/:path*"] };
