import "server-only";
import { cookies } from "next/headers";
import { and, desc, eq, gte } from "drizzle-orm";
import { getDb } from "./db";
import {
  announcements,
  attendanceLogs,
  users,
  type AttendanceLog,
  type Announcement,
  type User,
} from "./schema";
import { getSessionUserId, SESSION_COOKIE } from "./session";
import { logEvent } from "./log";

/** 현재 로그인 사용자 (없으면 null). */
export async function getCurrentUser(): Promise<User | null> {
  const uid = await getSessionUserId();
  if (uid == null) {
    // sid 쿠키는 있는데 세션이 없다 = 세션 이상(로그인 튕김의 핵심 신호). 진단용 기록.
    const store = await cookies();
    if (store.get(SESSION_COOKIE)?.value) {
      await logEvent({ level: "warn", event: "session_invalid" });
    }
    return null;
  }
  const db = getDb();
  const row = await db.select().from(users).where(eq(users.id, uid)).get();
  return row ?? null;
}

/** 특정 사용자의 최근 로그 (기본 7일치, 시간 내림차순). */
export async function getRecentLogs(
  userId: number,
  days = 7,
): Promise<AttendanceLog[]> {
  const db = getDb();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return db
    .select()
    .from(attendanceLogs)
    .where(and(eq(attendanceLogs.userId, userId), gte(attendanceLogs.createdAt, since)))
    .orderBy(desc(attendanceLogs.createdAt))
    .all();
}

/** 가장 최근 공지 1건 (없으면 null). */
export async function getLatestAnnouncement(): Promise<Announcement | null> {
  const db = getDb();
  const row = await db
    .select()
    .from(announcements)
    .orderBy(desc(announcements.id))
    .limit(1)
    .get();
  return row ?? null;
}

/** 전체 사용자 (이름 오름차순). 관리자 명단 화면용. */
export async function getAllUsers(): Promise<User[]> {
  const db = getDb();
  return db.select().from(users).orderBy(users.name).all();
}

/** 전체 사용자 + 오늘 로그 (관리자 화면용). */
export async function getAllUsersWithTodayLogs(): Promise<
  { user: User; logs: AttendanceLog[] }[]
> {
  const db = getDb();
  const allUsers = await db.select().from(users).orderBy(users.name).all();
  const startOfToday = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 넉넉히 2일
  const logs = await db
    .select()
    .from(attendanceLogs)
    .where(gte(attendanceLogs.createdAt, startOfToday))
    .all();

  return allUsers.map((user) => ({
    user,
    logs: logs.filter((l) => l.userId === user.id),
  }));
}
