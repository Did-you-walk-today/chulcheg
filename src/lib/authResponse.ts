import "server-only";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "./session";

// 로그인/가입 성공 후 세션 쿠키를 심고 이동시키는 응답.
// 303 redirect 에 실린 Set-Cookie 를 일부 인앱 브라우저(카카오톡 등 WebView)가
// 저장하지 않는 문제가 있어, 200 HTML + JS/meta 즉시 이동 방식으로 쿠키를 확정 저장한다.
// li=1: "방금 로그인함" 마커. 대시보드가 이 마커+세션없음 조합을 post_login_bounce 로 기록한다.
export function loginLandingResponse(sid: string, to: string = "/?li=1"): NextResponse {
  const href = JSON.stringify(to);
  const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="0;url=${to}">
<script>location.replace(${href});</script>
<style>body{font-family:sans-serif;background:#0b1220;color:#e8edf6;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}</style>
</head><body><p>로그인 중… <a href="${to}" style="color:#7ea6ff">이동하기</a></p></body></html>`;

  const res = new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
  res.cookies.set(SESSION_COOKIE, sid, sessionCookieOptions());
  return res;
}
