"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, getEnv } from "@/lib/db";
import { users } from "@/lib/schema";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { createSession } from "@/lib/session";
import { isValidPhone, normalizePhone } from "@/lib/phone";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

// 코드 비교용 정규화(공백/하이픈 제거). "000 1111 0000" == "00011110000".
function normalizeCode(s: string): string {
  return (s ?? "").replace(/[\s-]/g, "");
}

export async function login(formData: FormData): Promise<void> {
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!phone || !password) fail("/login", "전화번호와 비밀번호를 입력하세요.");

  const db = getDb();
  const user = await db.select().from(users).where(eq(users.phone, phone)).get();
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    fail("/login", "전화번호 또는 비밀번호가 올바르지 않습니다.");
  }

  await createSession(user.id);
  redirect("/");
}

export async function register(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");
  const code = normalizeCode(String(formData.get("code") ?? ""));

  if (name.length < 1 || name.length > 20) {
    fail("/register", "이름은 1~20자로 입력하세요.");
  }
  if (!isValidPhone(phone)) {
    fail("/register", "전화번호 형식이 올바르지 않습니다. (예: 010-0000-0000)");
  }
  if (password.length < 4) {
    fail("/register", "비밀번호는 4자 이상으로 설정하세요.");
  }

  const db = getDb();

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.phone, phone))
    .get();
  if (existing) {
    fail("/register", "이미 가입된 전화번호입니다. 로그인해 주세요.");
  }

  // 관리자 코드가 입력된 경우에만 관리자 권한 부여. 코드 값은 secret(env)에서 읽는다.
  let role: "user" | "admin" = "user";
  if (code) {
    const expected = normalizeCode(getEnv().ADMIN_SIGNUP_CODE ?? "");
    if (!expected || code !== expected) {
      fail("/register", "관리자 코드가 올바르지 않습니다.");
    }
    // 관리자는 단 하나만 존재할 수 있다.
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.role, "admin"))
      .get();
    if (existingAdmin) {
      fail("/register", "관리자 계정이 이미 존재합니다.");
    }
    role = "admin";
  }

  const passwordHash = await hashPassword(password);
  const inserted = await db
    .insert(users)
    .values({ name, phone, passwordHash, role })
    .returning({ id: users.id })
    .get();

  await createSession(inserted.id);
  redirect("/");
}
