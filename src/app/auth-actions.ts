"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { createSession } from "@/lib/session";
import { isValidPhone, normalizePhone } from "@/lib/phone";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function login(formData: FormData): Promise<void> {
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!phone || !password) fail("/login", "전화번호와 비밀번호를 입력하세요.");

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

  if (name.length < 1 || name.length > 20) {
    fail("/register", "이름은 1~20자로 입력하세요.");
  }
  if (!isValidPhone(phone)) {
    fail("/register", "전화번호 형식이 올바르지 않습니다. (예: 010-0000-0000)");
  }
  if (password.length < 4) {
    fail("/register", "비밀번호는 4자 이상으로 설정하세요.");
  }

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.phone, phone))
    .get();
  if (existing) {
    fail("/register", "이미 가입된 전화번호입니다. 로그인해 주세요.");
  }

  const passwordHash = await hashPassword(password);
  const inserted = await db
    .insert(users)
    .values({ name, phone, passwordHash })
    .returning({ id: users.id })
    .get();

  await createSession(inserted.id);
  redirect("/");
}
