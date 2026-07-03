import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// 기획서 6장 데이터 모델.

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(), // 로그인 ID 겸 고유키
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("user"), // user | admin
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// 이벤트 로그. 현재 상태는 "당일 마지막 type" 으로 도출한다 (단일 진실 원천).
export const attendanceLogs = sqliteTable("attendance_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  type: text("type").notNull(), // CLOCK_IN | CLOCK_OUT | STEP_OUT | RETURN | ABSENCE
  reason: text("reason"), // 예외 사유 (외출 사유 / 미출근·결석 사유). 없으면 null.
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// 서버 세션. 쿠키엔 랜덤 id 만 담고, 실제 세션은 이 테이블로 관리(위조 불가 + 서버 폐기 가능).
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(), // 랜덤 불투명 토큰
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type User = typeof users.$inferSelect;
export type AttendanceLog = typeof attendanceLogs.$inferSelect;
export type Session = typeof sessions.$inferSelect;
