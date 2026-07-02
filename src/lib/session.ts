import "server-only";
import { cookies } from "next/headers";

// 가벼운 자체 세션: 서명된 쿠키. 외부 서비스 없이 HMAC-SHA256 으로 위조 방지.
// 토큰 포맷: base64url(payloadJson).base64url(hmac)

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30일
const COOKIE_NAME = SESSION_COOKIE;
const MAX_AGE_SEC = SESSION_MAX_AGE;

type SessionPayload = { uid: number; exp: number };

/** 로그인 세션 토큰 문자열 생성. (Route Handler 에서 NextResponse 쿠키에 실을 때 사용) */
export async function createSessionToken(userId: number): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  return sign({ uid: userId, exp });
}

/**
 * 세션 쿠키 옵션. COOKIE_DOMAIN(env) 이 설정돼 있고 현재 호스트가 그 도메인(또는
 * 하위 도메인)이면 Domain 을 명시해서 apex/www/서브도메인 전체에서 세션을 공유한다.
 * localhost / *.workers.dev 등에서는 Domain 을 붙이지 않아 host-only 로 동작(호환).
 */
export function sessionCookieOptions(hostname: string, maxAge: number = MAX_AGE_SEC) {
  const configured = process.env.COOKIE_DOMAIN?.trim();
  const useDomain =
    configured &&
    (hostname === configured || hostname.endsWith("." + configured));
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
    ...(useDomain ? { domain: configured } : {}),
  };
}

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(data: string): Promise<Uint8Array> {
  const secret = process.env.SESSION_SECRET ?? "dev-insecure-secret";
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret) as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data) as BufferSource);
  return new Uint8Array(sig);
}

async function sign(payload: SessionPayload): Promise<string> {
  const body = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = b64urlEncode(await hmac(body));
  return `${body}.${sig}`;
}

async function verify(token: string): Promise<SessionPayload | null> {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = b64urlEncode(await hmac(body));
  if (!timingSafeEqual(sig, expected)) return null;
  try {
    const payload = JSON.parse(
      new TextDecoder().decode(b64urlDecode(body)),
    ) as SessionPayload;
    if (typeof payload.uid !== "number" || typeof payload.exp !== "number") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSession(userId: number): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const token = await sign({ uid: userId, exp });
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function getSessionUserId(): Promise<number | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verify(token);
  return payload?.uid ?? null;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
