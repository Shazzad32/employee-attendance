import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { connectDB } from "./db";
import User from "@/models/User";

export const COOKIE = "token";
const key = () => new TextEncoder().encode(process.env.JWT_SECRET);

export const signToken = (payload) =>
  new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(key());

export async function verifyToken(token) {
  try {
    return (await jwtVerify(token, key())).payload;
  } catch {
    return null;
  }
}

// Returns the logged-in, active user (optionally only if they have `role`), else null.
export async function getUser(role) {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  const payload = token && (await verifyToken(token));
  if (!payload) return null;
  await connectDB();
  const user = await User.findById(payload.id).select("-password");
  if (!user || !user.active) return null;
  if (role && user.role !== role) return null;
  return user;
}
