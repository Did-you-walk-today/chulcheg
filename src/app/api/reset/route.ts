import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { sessions, users } from "@/lib/schema";
import { hashPassword } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";
import { logEvent } from "@/lib/log";

export const dynamic = "force-dynamic";

// 비밀번호 재설정: 이름 + 전화번호가 정확히 일치하면 새 비밀번호로 교체.
// (학교 내부 소규모 서비스 전제. 성공 시 해당 계정의 기존 세션을 전부 폐기한다.)
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const name = String(form.get("name") ?? "").trim();
  const phone = normalizePhone(String(form.get("phone") ?? ""));
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");

  const fail = async (msg: string) => {
    await logEvent({ level: "warn", event: "reset_fail", message: msg, path: "/api/reset" });
    return NextResponse.redirect(
      new URL(`/reset?error=${encodeURIComponent(msg)}`, req.url),
      303,
    );
  };

  if (!name || !phone) return fail("이름과 전화번호를 입력하세요.");
  if (password.length < 4) return fail("새 비밀번호는 4자 이상으로 설정하세요.");
  if (password !== confirm) return fail("새 비밀번호 확인이 일치하지 않습니다.");

  const db = getDb();
  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.phone, phone), eq(users.name, name)))
    .get();
  if (!user) return fail("이름과 전화번호가 일치하는 계정이 없습니다.");

  const passwordHash = await hashPassword(password);
  await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));
  // 보안: 비밀번호가 바뀌면 기존 로그인 세션은 모두 무효화.
  await db.delete(sessions).where(eq(sessions.userId, user.id));

  await logEvent({ level: "info", event: "reset_ok", path: "/api/reset", userId: user.id });
  return NextResponse.redirect(new URL("/login?reset=1", req.url), 303);
}
