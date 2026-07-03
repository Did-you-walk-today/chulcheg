import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";
import { verifyPassword } from "@/lib/auth";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";
import { normalizePhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const phone = normalizePhone(String(form.get("phone") ?? ""));
  const password = String(form.get("password") ?? "");

  const fail = (msg: string) =>
    NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(msg)}`, req.url),
      303,
    );

  if (!phone || !password) return fail("전화번호와 비밀번호를 입력하세요.");

  const db = getDb();
  const user = await db.select().from(users).where(eq(users.phone, phone)).get();
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return fail("전화번호 또는 비밀번호가 올바르지 않습니다.");
  }

  const token = await createSessionToken(user.id);
  const res = NextResponse.redirect(new URL("/", req.url), 303);
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
