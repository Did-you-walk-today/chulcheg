import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, getEnv } from "@/lib/db";
import { users } from "@/lib/schema";
import { hashPassword } from "@/lib/auth";
import { createSessionRecord } from "@/lib/session";
import { loginLandingResponse } from "@/lib/authResponse";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { logEvent } from "@/lib/log";

export const dynamic = "force-dynamic";

function normalizeCode(s: string): string {
  return (s ?? "").replace(/[\s-]/g, "");
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const name = String(form.get("name") ?? "").trim();
  const phone = normalizePhone(String(form.get("phone") ?? ""));
  const password = String(form.get("password") ?? "");
  const code = normalizeCode(String(form.get("code") ?? ""));

  const fail = async (msg: string) => {
    await logEvent({ level: "warn", event: "register_fail", message: msg, path: "/api/register", status: 303 });
    return NextResponse.redirect(
      new URL(`/register?error=${encodeURIComponent(msg)}`, req.url),
      303,
    );
  };

  if (name.length < 1 || name.length > 20) return fail("이름은 1~20자로 입력하세요.");
  if (!isValidPhone(phone)) {
    return fail("전화번호 형식이 올바르지 않습니다. (예: 010-0000-0000)");
  }
  if (password.length < 4) return fail("비밀번호는 4자 이상으로 설정하세요.");

  const db = getDb();
  const existing = await db.select().from(users).where(eq(users.phone, phone)).get();
  if (existing) return fail("이미 가입된 전화번호입니다. 로그인해 주세요.");

  // 관리자 코드가 입력된 경우에만 관리자 권한 부여. 코드 값은 secret(env)에서 읽는다.
  let role: "user" | "admin" = "user";
  if (code) {
    const expected = normalizeCode(getEnv().ADMIN_SIGNUP_CODE ?? "");
    if (!expected || code !== expected) return fail("관리자 코드가 올바르지 않습니다.");
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"))
      .get();
    if (existingAdmin) return fail("관리자 계정이 이미 존재합니다.");
    role = "admin";
  }

  const passwordHash = await hashPassword(password);
  const inserted = await db
    .insert(users)
    .values({ name, phone, passwordHash, role })
    .returning({ id: users.id })
    .get();

  const sid = await createSessionRecord(inserted.id);
  await logEvent({ level: "info", event: "register_ok", path: "/api/register", userId: inserted.id });
  return loginLandingResponse(sid);
}
