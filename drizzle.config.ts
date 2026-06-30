import type { Config } from "drizzle-kit";

// 로컬 개발용 (better-sqlite3). Cloudflare D1 로 옮길 땐 dialect/driver 만 교체.
export default {
  schema: "./src/lib/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.LOCAL_DB_PATH ?? "./local.db",
  },
} satisfies Config;
