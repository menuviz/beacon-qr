import { timingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "beacon_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASS;
  if (!secret) {
    throw new Error("Missing ADMIN_SESSION_SECRET or ADMIN_PASS.");
  }
  return secret;
}

function safeEqual(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createAdminToken() {
  return getSecret();
}

export function verifyAdminToken(token) {
  return Boolean(token) && safeEqual(token, getSecret());
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
