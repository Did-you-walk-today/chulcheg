import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, destroySessionById, sessionCookieOptions } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sid = req.cookies.get(SESSION_COOKIE)?.value;
  await destroySessionById(sid); // DB 세션 레코드 삭제
  const res = NextResponse.redirect(new URL("/login", req.url), 303);
  res.cookies.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  return res;
}
