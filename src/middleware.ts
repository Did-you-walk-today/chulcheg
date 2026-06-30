import { NextRequest, NextResponse } from "next/server";
import { isAllowedIp, parseAllowList } from "@/lib/ip";

// 미들웨어는 Edge 런타임에서 동작한다. DB 접근 없이 IP 검사만 수행.

/** 신뢰 가능한 클라이언트 IP 추출. Cloudflare 배포 시 cf-connecting-ip 우선. */
function getClientIp(req: NextRequest): string | null {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;

  const real = req.headers.get("x-real-ip");
  if (real) return real;

  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();

  return null;
}

export function middleware(req: NextRequest) {
  const allowList = parseAllowList(process.env.ALLOWED_IPS);
  const disabled = process.env.IP_CHECK_DISABLED === "true";

  // 검사를 끈 경우, 또는 허용 목록이 아직 비어있는 경우(=학교 IP 미입력 개발 단계)
  // 는 통과시킨다. 내일 ALLOWED_IPS 를 채우면 자동으로 enforce 된다.
  if (disabled || allowList.length === 0) {
    return NextResponse.next();
  }

  const ip = getClientIp(req);
  if (isAllowedIp(ip, allowList)) {
    return NextResponse.next();
  }

  // 허용되지 않은 IP → 차단 안내 페이지로 rewrite (URL 은 그대로, 내용만 교체)
  const url = req.nextUrl.clone();
  url.pathname = "/blocked";
  return NextResponse.rewrite(url, { status: 403 });
}

export const config = {
  // 정적 파일, 이미지 최적화, 차단 페이지 자체는 검사에서 제외.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|blocked).*)"],
};
