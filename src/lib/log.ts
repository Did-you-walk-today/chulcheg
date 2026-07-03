import "server-only";
import { cookies, headers } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "./db";
import { eventLog } from "./schema";
import { SESSION_COOKIE } from "./session";
import { parseUA } from "./ua";

// 진단용 이벤트 로그 기록. 절대 예외를 던지지 않는다(로깅 실패가 요청을 막으면 안 됨).
// 기기 정보(브라우저/OS/버전, 모바일)와 IP·국가·통신사, sid 쿠키 유무를 함께 저장.

interface LogInput {
  level?: "info" | "warn" | "error";
  event: string;
  message?: string | null;
  path?: string | null;
  status?: number | null;
  userId?: number | null;
}

export async function logEvent(input: LogInput): Promise<void> {
  try {
    const h = await headers();
    const store = await cookies();
    const ua = h.get("user-agent") ?? "";
    const parsed = parseUA(ua);

    let cf: Record<string, unknown> = {};
    try {
      cf = (getCloudflareContext().cf ?? {}) as Record<string, unknown>;
    } catch {
      cf = {};
    }

    const ip = h.get("cf-connecting-ip") ?? null;
    const country =
      h.get("cf-ipcountry") ?? (cf.country as string | undefined) ?? null;
    const isp = (cf.asOrganization as string | undefined) ?? null;
    const host = h.get("host") ?? null;

    const db = getDb();
    await db.insert(eventLog).values({
      level: input.level ?? "info",
      event: input.event,
      message: input.message ?? null,
      path: input.path ?? null,
      status: input.status ?? null,
      host,
      ip,
      country,
      isp,
      browser: parsed.browser,
      browserVer: parsed.browserVer,
      os: parsed.os,
      osVer: parsed.osVer,
      isMobile: parsed.isMobile,
      hadSid: Boolean(store.get(SESSION_COOKIE)?.value),
      userId: input.userId ?? null,
    });
  } catch {
    // 무시: 진단 로그 실패가 실제 요청을 방해하지 않도록.
  }
}
