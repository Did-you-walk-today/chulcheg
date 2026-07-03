import "server-only";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { sessions } from "./schema";

// 서버 세션. 쿠키엔 랜덤 id(sid)만 담고, 세션 진위는 D1 의 sessions 테이블로 판단.
// 서명 secret 의존이 없어서 secret 변경/옛 쿠키로 인한 무효화·충돌 문제가 없다.

export const SESSION_COOKIE = "sid";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30일

function newSessionId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let s = "";
  for (const b of bytes) s += b.toString(16).padStart(2, "0");
  return s;
}

/** 세션 쿠키 옵션. host-only(도메인 미지정) — 새 로그인이 항상 옛 쿠키를 덮어씀. */
export function sessionCookieOptions(maxAge: number = SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/** DB 에 세션 레코드를 만들고 sid 를 반환. (Route Handler 에서 쿠키에 실음) */
export async function createSessionRecord(userId: number): Promise<string> {
  const db = getDb();
  const id = newSessionId();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);
  await db.insert(sessions).values({ id, userId, expiresAt });
  return id;
}

/** 현재 쿠키의 sid 로 세션을 조회해 userId 반환. 만료되면 삭제하고 null. */
export async function getSessionUserId(): Promise<number | null> {
  const store = await cookies();
  const sid = store.get(SESSION_COOKIE)?.value;
  if (!sid) return null;

  const db = getDb();
  const row = await db.select().from(sessions).where(eq(sessions.id, sid)).get();
  if (!row) return null;

  if (row.expiresAt.getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, sid));
    return null;
  }
  return row.userId;
}

/** 세션 폐기(로그아웃). DB 레코드 삭제. */
export async function destroySessionById(sid: string | undefined | null): Promise<void> {
  if (!sid) return;
  const db = getDb();
  await db.delete(sessions).where(eq(sessions.id, sid));
}
