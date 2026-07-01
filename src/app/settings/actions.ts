"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/schema";
import { getCurrentUser } from "@/lib/queries";
import { hashPassword, verifyPassword } from "@/lib/auth";

export async function changePassword(formData: FormData): Promise<void> {
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const back = (msg: string) =>
    redirect(`/settings?error=${encodeURIComponent(msg)}`);

  if (!current || !next) back("모든 항목을 입력하세요.");
  if (next.length < 4) back("새 비밀번호는 4자 이상으로 설정하세요.");
  if (next !== confirm) back("새 비밀번호 확인이 일치하지 않습니다.");

  if (!(await verifyPassword(current, user.passwordHash))) {
    back("현재 비밀번호가 올바르지 않습니다.");
  }
  if (await verifyPassword(next, user.passwordHash)) {
    back("현재 비밀번호와 다른 비밀번호로 설정하세요.");
  }

  const db = getDb();
  const passwordHash = await hashPassword(next);
  await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));

  redirect("/settings?ok=1");
}
