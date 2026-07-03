"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminCookieOptions, ADMIN_COOKIE, createAdminToken } from "./session";

function getSafeNext(value) {
  const next = String(value || "/");
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/r/")) {
    return "/";
  }
  return next;
}

export async function loginAdmin(_previousState, formData) {
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");

  if (
    !process.env.ADMIN_USER ||
    !process.env.ADMIN_PASS ||
    username !== process.env.ADMIN_USER ||
    password !== process.env.ADMIN_PASS
  ) {
    return {
      ok: false,
      message: "That login did not work. Check the username and password.",
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, createAdminToken(), adminCookieOptions());

  redirect(getSafeNext(formData.get("next")));
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, "", {
    ...adminCookieOptions(),
    maxAge: 0,
  });

  redirect("/login");
}
