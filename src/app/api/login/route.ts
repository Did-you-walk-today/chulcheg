import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";
import { verifyPassword } from "@/lib/auth";
import { createSessionRecord } from "@/lib/session";
import { loginLandingResponse } from "@/lib/authResponse";
import { normalizePhone } from "@/lib/phone";
import { logEvent } from "@/lib/log";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const phone = normalizePhone(String(form.get("phone") ?? ""));
  const password = String(form.get("password") ?? "");

  const fail = async (msg: string) => {
    await logEvent({ level: "warn", event: "login_fail", message: msg, path: "/api/login", status: 303 });
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(msg)}`, req.url),
      303,
    );
  };

  if (!phone || !password) return fail("전화번호와 비밀번호를 입력하세요.");

  const db = getDb();
  const user = await db.select().from(users).where(eq(users.phone, phone)).get();
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return fail("전화번호 또는 비밀번호가 올바르지 않습니다.");
  }

  const sid = await createSessionRecord(user.id);
  await logEvent({ level: "info", event: "login_ok", path: "/api/login", userId: user.id });
  // 인앱 브라우저(카카오톡 등)가 303 redirect 의 Set-Cookie 를 무시하는 문제 회피:
  // 200 HTML 로 쿠키를 확정 저장한 뒤 즉시 이동.
  return loginLandingResponse(sid, "/");
}
