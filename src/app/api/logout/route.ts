import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/login", req.url), 303);
  // maxAge 0 으로 즉시 만료. Domain 도 로그인 때와 동일하게 맞춰 확실히 삭제.
  res.cookies.set(SESSION_COOKIE, "", sessionCookieOptions(req.nextUrl.hostname, 0));
  return res;
}
