import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

// Cloudflare D1 + Drizzle.
// getCloudflareContext() 는 요청 처리 컨텍스트(서버 컴포넌트/액션/라우트 핸들러)에서
// 동기적으로 D1 바인딩(env.DB)을 준다. `next dev` 에서는 open-next 가 로컬 D1(miniflare)로 연결.
export function getDb() {
  const { env } = getCloudflareContext();
  return drizzle(env.DB, { schema });
}

// 환경 변수도 Cloudflare env 에서 우선 읽되, 로컬(process.env) 로 폴백.
export function getEnv(): CloudflareEnv | Record<string, string | undefined> {
  try {
    return getCloudflareContext().env;
  } catch {
    return process.env as Record<string, string | undefined>;
  }
}
